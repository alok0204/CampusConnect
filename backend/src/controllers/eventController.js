import Event from '../models/Event.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

// Helper to convert time strings (like "10:00 AM" or "14:30") into comparable minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const is12Hour = cleaned.includes('AM') || cleaned.includes('PM');

  if (is12Hour) {
    const [time, modifier] = cleaned.split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours)) hours = 0;
    if (isNaN(minutes)) minutes = 0;
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } else {
    let [hours, minutes] = cleaned.split(':').map(Number);
    if (isNaN(hours)) hours = 0;
    if (isNaN(minutes)) minutes = 0;
    return hours * 60 + minutes;
  }
};

// @desc    Get all approved events (accessible to all verified users with branch-wise filtering)
// @route   GET /api/events
// @access  Private (Authenticated users)
export const getApprovedEvents = async (req, res, next) => {
  try {
    const { category, branch, search, startDate, endDate, sort } = req.query;

    const query = {
      status: 'approved',
    };

    // Branch-wise backend access control:
    // Students/Faculty only see events where branch is 'ALL' OR matches their own branch
    // Admin can view all branches
    if (req.user && req.user.role !== 'ADMIN') {
      const userBranch = (req.user.branch || '').toUpperCase();
      if (branch && branch !== 'ALL') {
        // If user requested a specific branch, ensure it is their branch or ALL
        if (branch.toUpperCase() === userBranch || branch.toUpperCase() === 'ALL') {
          query.branch = branch.toUpperCase();
        } else {
          // If student asks for another branch they do NOT belong to, return empty list
          query.branch = branch.toUpperCase(); // Mongo will filter and return 0 matches or we restrict to user branch
        }
      } else {
        query.$or = [
          { branch: 'ALL' },
          { branch: { $exists: false } },
          ...(userBranch ? [{ branch: userBranch }] : []),
        ];
      }
    } else if (branch && branch !== 'ALL') {
      // Admin filter by branch
      query.branch = branch.toUpperCase();
    }

    // Category filter
    if (category && category !== 'ALL') {
      query.category = category;
    }

    // Search query across title, description, organizer, and venue
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchCondition = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { organizer: searchRegex },
          { venue: searchRegex },
        ],
      };

      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchCondition];
        delete query.$or;
      } else {
        query.$or = searchCondition.$or;
      }
    }

    // Date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // End of the selected end date day
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        query.date.$lte = endD;
      }
    }

    // Sorting: default upcoming events first (date ascending) or newest created
    let sortOptions = { date: 1 };
    if (sort === 'created_desc') {
      sortOptions = { createdAt: -1 };
    } else if (sort === 'date_desc') {
      sortOptions = { date: -1 };
    } else if (sort === 'date_asc') {
      sortOptions = { date: 1 };
    }

    const events = await Event.find(query)
      .populate('creator', 'name email role branch department profileImage')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event by ID (with authorization check for unapproved events)
// @route   GET /api/events/:id
// @access  Private
export const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      'creator',
      'name email role branch department profileImage collegeId'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Backend access control for unapproved events:
    // If event is not approved, only the Creator or an Admin can view it
    if (event.status !== 'approved') {
      const isCreator =
        req.user &&
        (event.creator._id.toString() === req.user._id.toString() ||
          event.creator.toString() === req.user._id.toString());
      const isAdmin = req.user && req.user.role === 'ADMIN';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This event has not been approved by campus administration.',
        });
      }
    }

    // If event is branch-restricted, verify user's branch
    if (
      event.branch &&
      event.branch !== 'ALL' &&
      req.user.role !== 'ADMIN'
    ) {
      const userBranch = (req.user.branch || '').toUpperCase();
      if (event.branch.toUpperCase() !== userBranch) {
        const isCreator =
          event.creator._id.toString() === req.user._id.toString() ||
          event.creator.toString() === req.user._id.toString();
        if (!isCreator) {
          return res.status(403).json({
            success: false,
            message: `This event is restricted to ${event.branch} branch students only.`,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Event (Student -> Pending, Admin Review)
// @route   POST /api/events
// @access  Private
export const createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      organizer,
      targetAudience,
      branch,
      image,
    } = req.body;

    // Server-side validation
    if (!title || !description || !category || !date || !startTime || !endTime || !venue || !organizer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, date, startTime, endTime, venue, organizer.',
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Event title must be at least 3 characters long.',
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Event description must be at least 10 characters long.',
      });
    }

    // Validate date format
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid event date.',
      });
    }

    // Validate start time & end time comparison
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins > 0 && endMins > 0 && endMins <= startMins) {
      return res.status(400).json({
        success: false,
        message: 'Event end time must be after start time.',
      });
    }

    // Determine initial status: Admin submissions can be directly approved if chosen, otherwise 'pending'
    const initialStatus = req.user.role === 'ADMIN' ? 'approved' : 'pending';

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category,
      date: parsedDate,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      organizer: organizer.trim(),
      creator: req.user._id,
      targetAudience: targetAudience || 'ALL',
      branch: (branch || (targetAudience === 'BRANCH_ONLY' ? req.user.branch : 'ALL')).trim().toUpperCase(),
      image:
        image && image.trim()
          ? image.trim()
          : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      status: initialStatus,
      rejectionReason: '',
    });

    const populatedEvent = await Event.findById(event._id).populate(
      'creator',
      'name email role branch department profileImage'
    );

    res.status(201).json({
      success: true,
      message:
        initialStatus === 'pending'
          ? 'Event submitted successfully! It is now pending administrative approval.'
          : 'Event published successfully.',
      event: populatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events created by the current user
// @route   GET /api/events/my-events
// @access  Private
export const getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ creator: req.user._id })
      .populate('creator', 'name email role branch department profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event (Creator or Admin)
// @route   PUT /api/events/:id
// @access  Private
export const updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const isCreator = event.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this event.',
      });
    }

    const {
      title,
      description,
      category,
      date,
      startTime,
      endTime,
      venue,
      organizer,
      targetAudience,
      branch,
      image,
    } = req.body;

    if (title) event.title = title.trim();
    if (description) event.description = description.trim();
    if (category) event.category = category;
    if (date) event.date = new Date(date);
    if (startTime) event.startTime = startTime.trim();
    if (endTime) event.endTime = endTime.trim();
    if (venue) event.venue = venue.trim();
    if (organizer) event.organizer = organizer.trim();
    if (targetAudience) event.targetAudience = targetAudience;
    if (branch) event.branch = branch.trim().toUpperCase();
    if (image !== undefined) event.image = image;

    // Validate times if both available
    const startMins = timeToMinutes(event.startTime);
    const endMins = timeToMinutes(event.endTime);
    if (startMins > 0 && endMins > 0 && endMins <= startMins) {
      return res.status(400).json({
        success: false,
        message: 'Event end time must be after start time.',
      });
    }

    // If a rejected event is updated by creator, set back to pending for re-review
    if (!isAdmin && event.status === 'rejected') {
      event.status = 'pending';
      event.rejectionReason = '';
    }

    await event.save();

    const updatedEvent = await Event.findById(event._id).populate(
      'creator',
      'name email role branch department profileImage'
    );

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an event (Creator or Admin)
// @route   DELETE /api/events/:id
// @access  Private
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const isCreator = event.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this event.',
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an event (Creator or Admin)
// @route   PUT /api/events/:id/cancel
// @access  Private
export const cancelEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const isCreator = event.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this event.',
      });
    }

    event.status = 'cancelled';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event marked as cancelled',
      event,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN-ONLY CONTROLLERS
// ==========================================

// @desc    Get all events for Admin approval dashboard
// @route   GET /api/events/admin/all
// @access  Private/Admin
export const getAdminAllEvents = async (req, res, next) => {
  try {
    const { status, category, branch, search } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (branch && branch !== 'ALL') {
      query.branch = branch.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { organizer: searchRegex },
        { venue: searchRegex },
      ];
    }

    const events = await Event.find(query)
      .populate('creator', 'name email role branch department profileImage collegeId rollNumber')
      .sort({ createdAt: -1 });

    // Aggregate counts for quick admin tabs
    const counts = {
      all: await Event.countDocuments(),
      pending: await Event.countDocuments({ status: 'pending' }),
      approved: await Event.countDocuments({ status: 'approved' }),
      rejected: await Event.countDocuments({ status: 'rejected' }),
      cancelled: await Event.countDocuments({ status: 'cancelled' }),
    };

    res.status(200).json({
      success: true,
      counts,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve an event (Admin only)
// @route   PUT /api/events/:id/approve
// @access  Private/Admin
export const approveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    event.status = 'approved';
    event.rejectionReason = '';
    await event.save();

    // Trigger notification to event creator
    await createNotification({
      recipient: event.creator,
      type: 'event',
      title: `Event Approved: ${event.title}`,
      message: `Your proposed event "${event.title}" has been approved by campus administration and is now live on the events board.`,
      entityType: 'Event',
      entityId: event._id,
      priority: 'important',
      metadata: {
        actionUrl: `/events/${event._id}`,
        status: 'approved',
      },
    });

    const populatedEvent = await Event.findById(event._id).populate(
      'creator',
      'name email role branch department profileImage'
    );

    res.status(200).json({
      success: true,
      message: 'Event approved successfully! It is now visible in the campus events feed.',
      event: populatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject an event (Admin only)
// @route   PUT /api/events/:id/reject
// @access  Private/Admin
export const rejectEvent = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    const finalReason =
      (rejectionReason && rejectionReason.trim()) ||
      'This event submission does not comply with college event guidelines.';

    event.status = 'rejected';
    event.rejectionReason = finalReason;
    await event.save();

    // Trigger notification to event creator
    await createNotification({
      recipient: event.creator,
      type: 'event',
      title: `Event Proposal Update: ${event.title}`,
      message: `Your event proposal "${event.title}" was not approved. Reason: ${finalReason}`,
      entityType: 'Event',
      entityId: event._id,
      priority: 'normal',
      metadata: {
        actionUrl: '/events/my-events',
        status: 'rejected',
      },
    });

    const populatedEvent = await Event.findById(event._id).populate(
      'creator',
      'name email role branch department profileImage'
    );

    res.status(200).json({
      success: true,
      message: 'Event rejected. Rejection reason recorded and visible to creator.',
      event: populatedEvent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event status (Admin general)
// @route   PUT /api/events/:id/status
// @access  Private/Admin
export const updateEventStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, rejected, or cancelled.',
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    event.status = status;
    if (status === 'rejected') {
      event.rejectionReason = rejectionReason || 'Event rejected by administration';
    } else if (status === 'approved') {
      event.rejectionReason = '';
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: `Event status changed to ${status}`,
      event,
    });
  } catch (error) {
    next(error);
  }
};
