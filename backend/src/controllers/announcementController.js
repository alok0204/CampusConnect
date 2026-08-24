import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { createAudienceNotifications } from '../services/notificationService.js';

// Helper: refresh scheduled & expired announcements
const syncAnnouncementStatuses = async () => {
  try {
    const now = new Date();

    // Move scheduled -> published
    await Announcement.updateMany(
      {
        status: 'scheduled',
        publishAt: { $lte: now },
      },
      {
        $set: { status: 'published' },
      }
    );

    // Move published -> expired
    await Announcement.updateMany(
      {
        status: 'published',
        expiresAt: { $ne: null, $lte: now },
      },
      {
        $set: { status: 'expired' },
      }
    );
  } catch (error) {
    console.error('Error syncing announcement statuses:', error.message);
  }
};

// Helper: Build MongoDB query filter based on user role & identity
const buildAudienceQuery = (user) => {
  const now = new Date();

  // Common visibility conditions for normal feed
  const baseCondition = {
    status: 'published',
    publishAt: { $lte: now },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  // Admins see everything
  if (user.role === 'ADMIN') {
    return baseCondition;
  }

  // Faculty audience filtering
  if (user.role === 'FACULTY') {
    const facultyAudienceOr = [
      { audience: 'all' },
      { audience: 'faculty' },
      { audience: 'department', department: { $in: ['ALL', user.department] } },
      { audience: 'branch', branch: { $in: ['ALL', user.department] } },
    ];
    return {
      ...baseCondition,
      $and: [{ $or: facultyAudienceOr }],
    };
  }

  // Student audience filtering (CSE vs ECE, Year, Section)
  const studentBranch = user.branch || 'CSE';
  const studentYear = user.year || '1st Year';
  const studentSection = user.section || 'A';

  const studentAudienceOr = [
    // 1. College-wide announcements
    { audience: 'all' },

    // 2. All students or branch-level students
    {
      audience: 'students',
      branch: { $in: ['ALL', studentBranch] },
    },
    {
      audience: 'branch',
      branch: { $in: ['ALL', studentBranch] },
    },

    // 3. Year-specific announcements
    {
      audience: 'year',
      branch: { $in: ['ALL', studentBranch] },
      year: { $in: ['ALL', studentYear] },
    },

    // 4. Section-specific announcements
    {
      audience: 'section',
      branch: { $in: ['ALL', studentBranch] },
      year: { $in: ['ALL', studentYear] },
      section: { $in: ['ALL', studentSection] },
    },
  ];

  return {
    ...baseCondition,
    $and: [{ $or: studentAudienceOr }],
  };
};

// @desc    Get announcements relevant to logged-in user with filters and read status
// @route   GET /api/announcements
// @access  Private (Authenticated users)
export const getAnnouncements = async (req, res, next) => {
  try {
    await syncAnnouncementStatuses();

    const { category, priority, search, unreadOnly, sort, branch } = req.query;

    const baseQuery = buildAudienceQuery(req.user);
    const filterConditions = [];

    // Category filter
    if (category && category !== 'ALL') {
      filterConditions.push({ category: category.toLowerCase() });
    }

    // Priority filter
    if (priority && priority !== 'ALL') {
      filterConditions.push({ priority: priority.toLowerCase() });
    }

    // Branch filter (if requested in query)
    if (branch && branch !== 'ALL') {
      filterConditions.push({ branch: { $in: ['ALL', branch.toUpperCase()] } });
    }

    // Keyword search across title, content, summary
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filterConditions.push({
        $or: [{ title: searchRegex }, { content: searchRegex }, { summary: searchRegex }],
      });
    }

    // Unread filter
    if (unreadOnly === 'true') {
      filterConditions.push({ readBy: { $ne: req.user._id } });
    }

    const finalQuery = { ...baseQuery };
    if (filterConditions.length > 0) {
      finalQuery.$and = [...(finalQuery.$and || []), ...filterConditions];
    }

    // Sort order: Pinned first -> Urgent/Important -> Newest Publish date
    let sortConfig = { isPinned: -1, priority: -1, publishAt: -1 };
    if (sort === 'oldest') {
      sortConfig = { publishAt: 1 };
    }

    const announcements = await Announcement.find(finalQuery)
      .populate('createdBy', 'name email role department branch profileImage')
      .sort(sortConfig);

    // Annotate isRead flag and readCount
    const userIdStr = req.user._id.toString();
    const formattedAnnouncements = announcements.map((item) => {
      const itemObj = item.toObject();
      itemObj.isRead = item.readBy.some((id) => id.toString() === userIdStr);
      itemObj.readCount = item.readBy.length;
      return itemObj;
    });

    const unreadCount = formattedAnnouncements.filter((a) => !a.isRead).length;

    res.status(200).json({
      success: true,
      count: formattedAnnouncements.length,
      unreadCount,
      announcements: formattedAnnouncements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Announcement details with backend audience access check
// @route   GET /api/announcements/:id
// @access  Private
export const getAnnouncementById = async (req, res, next) => {
  try {
    await syncAnnouncementStatuses();

    const announcement = await Announcement.findById(req.params.id).populate(
      'createdBy',
      'name email role department branch profileImage collegeId'
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const user = req.user;
    const isCreator = announcement.createdBy?._id?.toString() === user._id.toString();
    const isAdmin = user.role === 'ADMIN';

    // If announcement is draft or scheduled or expired, only creator or Admin can view
    if (['draft', 'scheduled', 'expired', 'archived'].includes(announcement.status)) {
      if (!isCreator && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'This circular is not currently published or available.',
        });
      }
    }

    // Backend Audience Access Check for Students & Faculty
    if (!isCreator && !isAdmin) {
      if (announcement.audience === 'faculty' && user.role !== 'FACULTY') {
        return res.status(403).json({
          success: false,
          message: 'This circular is restricted to college faculty members.',
        });
      }

      if (user.role === 'STUDENT') {
        const studentBranch = user.branch || 'CSE';
        const studentYear = user.year || '1st Year';
        const studentSection = user.section || 'A';

        if (announcement.audience === 'branch' && announcement.branch !== 'ALL' && announcement.branch !== studentBranch) {
          return res.status(403).json({
            success: false,
            message: `This circular is restricted to ${announcement.branch} department students.`,
          });
        }

        if (announcement.audience === 'year') {
          if (announcement.branch !== 'ALL' && announcement.branch !== studentBranch) {
            return res.status(403).json({
              success: false,
              message: `This circular is restricted to ${announcement.branch} students.`,
            });
          }
          if (announcement.year !== 'ALL' && announcement.year !== studentYear) {
            return res.status(403).json({
              success: false,
              message: `This circular is restricted to ${announcement.year} students.`,
            });
          }
        }

        if (announcement.audience === 'section') {
          if (announcement.branch !== 'ALL' && announcement.branch !== studentBranch) {
            return res.status(403).json({
              success: false,
              message: `This circular is restricted to ${announcement.branch} students.`,
            });
          }
          if (announcement.year !== 'ALL' && announcement.year !== studentYear) {
            return res.status(403).json({
              success: false,
              message: `This circular is restricted to ${announcement.year} students.`,
            });
          }
          if (announcement.section !== 'ALL' && announcement.section !== studentSection) {
            return res.status(403).json({
              success: false,
              message: `This circular is restricted to Section ${announcement.section} students.`,
            });
          }
        }
      }
    }

    // Automatically mark as read for user
    if (!announcement.readBy.includes(user._id)) {
      announcement.readBy.push(user._id);
      await announcement.save();
    }

    const itemObj = announcement.toObject();
    itemObj.isRead = true;
    itemObj.readCount = announcement.readBy.length;

    res.status(200).json({
      success: true,
      announcement: itemObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Announcement (Faculty & Admin only)
// @route   POST /api/announcements
// @access  Private (Faculty or Admin)
export const createAnnouncement = async (req, res, next) => {
  try {
    // Only Admin or Faculty can publish announcements
    if (req.user.role !== 'ADMIN' && req.user.role !== 'FACULTY') {
      return res.status(403).json({
        success: false,
        message: 'Only college faculty and administrators are authorized to publish official announcements.',
      });
    }

    const {
      title,
      content,
      summary,
      category,
      priority,
      audience,
      branch,
      department,
      year,
      section,
      attachment,
      image,
      status,
      publishAt,
      expiresAt,
      isPinned,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement title is required.',
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Announcement content is required.',
      });
    }

    // Dates & Scheduling logic
    const now = new Date();
    const pubDate = publishAt ? new Date(publishAt) : now;
    let expDate = expiresAt ? new Date(expiresAt) : null;

    if (expDate && expDate <= pubDate) {
      return res.status(400).json({
        success: false,
        message: 'Expiration date must be set after publication date.',
      });
    }

    // Determine initial status
    let finalStatus = 'published';
    if (status === 'draft') {
      finalStatus = 'draft';
    } else if (pubDate > now) {
      finalStatus = 'scheduled';
    } else if (expDate && expDate <= now) {
      finalStatus = 'expired';
    }

    // Auto summary if empty
    const autoSummary =
      summary && summary.trim()
        ? summary.trim()
        : content.trim().substring(0, 180) + (content.length > 180 ? '...' : '');

    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      summary: autoSummary,
      category: category || 'general',
      priority: priority || 'normal',
      audience: audience || 'all',
      branch: (branch || 'ALL').trim().toUpperCase(),
      department: department ? department.trim() : 'ALL',
      year: year || 'ALL',
      section: (section || 'ALL').trim().toUpperCase(),
      attachment: attachment || { name: '', url: '', fileType: 'pdf', fileSize: '' },
      image: image ? image.trim() : '',
      status: finalStatus,
      publishAt: pubDate,
      expiresAt: expDate,
      isPinned: !!isPinned,
      createdBy: req.user._id,
      readBy: [req.user._id], // Creator has read it
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id).populate(
      'createdBy',
      'name email role department branch profileImage'
    );

    // If published live immediately, trigger notifications to the target audience
    if (finalStatus === 'published') {
      createAudienceNotifications({
        audience: announcement.audience,
        branch: announcement.branch,
        department: announcement.department,
        year: announcement.year,
        section: announcement.section,
        excludeUserId: req.user._id,
        type: 'announcement',
        title: `${announcement.priority === 'urgent' ? '🚨 URGENT: ' : ''}${announcement.title}`,
        message: announcement.summary || announcement.content.substring(0, 140),
        entityType: 'Announcement',
        entityId: announcement._id,
        priority: announcement.priority,
        metadata: {
          actionUrl: `/announcements/${announcement._id}`,
          status: 'published',
        },
      }).catch((err) => console.error('Error in background audience notification:', err));
    }

    res.status(201).json({
      success: true,
      message:
        finalStatus === 'draft'
          ? 'Announcement saved as draft.'
          : finalStatus === 'scheduled'
          ? `Announcement scheduled for publication on ${pubDate.toLocaleString()}.`
          : 'Announcement published successfully!',
      announcement: populatedAnnouncement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an Announcement (Creator or Admin)
// @route   PUT /api/announcements/:id
// @access  Private (Creator or Admin)
export const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const isCreator = announcement.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this announcement.',
      });
    }

    const {
      title,
      content,
      summary,
      category,
      priority,
      audience,
      branch,
      department,
      year,
      section,
      attachment,
      image,
      status,
      publishAt,
      expiresAt,
      isPinned,
    } = req.body;

    if (title) announcement.title = title.trim();
    if (content) announcement.content = content.trim();
    if (summary !== undefined) announcement.summary = summary.trim();
    if (category) announcement.category = category;
    if (priority) announcement.priority = priority;
    if (audience) announcement.audience = audience;
    if (branch !== undefined) announcement.branch = branch.trim().toUpperCase();
    if (department !== undefined) announcement.department = department.trim();
    if (year !== undefined) announcement.year = year;
    if (section !== undefined) announcement.section = section.trim().toUpperCase();
    if (attachment !== undefined) announcement.attachment = attachment;
    if (image !== undefined) announcement.image = image.trim();
    if (isPinned !== undefined) announcement.isPinned = isPinned;

    if (publishAt) announcement.publishAt = new Date(publishAt);
    if (expiresAt !== undefined) {
      announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    // Status handling
    const now = new Date();
    if (status) {
      if (status === 'draft') {
        announcement.status = 'draft';
      } else if (status === 'archived') {
        announcement.status = 'archived';
      } else if (announcement.publishAt > now) {
        announcement.status = 'scheduled';
      } else if (announcement.expiresAt && announcement.expiresAt <= now) {
        announcement.status = 'expired';
      } else {
        announcement.status = 'published';
      }
    }

    await announcement.save();

    const updated = await Announcement.findById(announcement._id).populate(
      'createdBy',
      'name email role department branch profileImage'
    );

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Announcement (Creator or Admin)
// @route   DELETE /api/announcements/:id
// @access  Private (Creator or Admin)
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const isCreator = announcement.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this announcement.',
      });
    }

    await announcement.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single announcement as read
// @route   PUT /api/announcements/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    await Announcement.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id },
    });

    res.status(200).json({
      success: true,
      message: 'Announcement marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all relevant announcements as read for current user
// @route   PUT /api/announcements/mark-all-read
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    const query = buildAudienceQuery(req.user);
    await Announcement.updateMany(query, {
      $addToSet: { readBy: req.user._id },
    });

    res.status(200).json({
      success: true,
      message: 'All announcements marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get announcements created by current user (Faculty / Admin management)
// @route   GET /api/announcements/my-announcements
// @access  Private (Faculty or Admin)
export const getMyAnnouncements = async (req, res, next) => {
  try {
    await syncAnnouncementStatuses();

    const announcements = await Announcement.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email role department branch profileImage')
      .sort({ createdAt: -1 });

    const formatted = announcements.map((item) => {
      const itemObj = item.toObject();
      itemObj.readCount = item.readBy.length;
      return itemObj;
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      announcements: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin overview of all announcements with KPI metrics
// @route   GET /api/announcements/admin/all
// @access  Private/Admin
export const getAdminAllAnnouncements = async (req, res, next) => {
  try {
    await syncAnnouncementStatuses();

    const { status, category, priority, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }
    if (category && category !== 'ALL') {
      query.category = category.toLowerCase();
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority.toLowerCase();
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: searchRegex }, { content: searchRegex }, { summary: searchRegex }];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email role department branch collegeId profileImage')
      .sort({ createdAt: -1 });

    const counts = {
      all: await Announcement.countDocuments(),
      published: await Announcement.countDocuments({ status: 'published' }),
      scheduled: await Announcement.countDocuments({ status: 'scheduled' }),
      draft: await Announcement.countDocuments({ status: 'draft' }),
      expired: await Announcement.countDocuments({ status: 'expired' }),
      archived: await Announcement.countDocuments({ status: 'archived' }),
    };

    const formatted = announcements.map((item) => {
      const itemObj = item.toObject();
      itemObj.readCount = item.readBy.length;
      return itemObj;
    });

    res.status(200).json({
      success: true,
      counts,
      count: formatted.length,
      announcements: formatted,
    });
  } catch (error) {
    next(error);
  }
};
