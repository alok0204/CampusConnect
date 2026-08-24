import {
  getUserNotifications,
  getUnreadCount as getUnreadServiceCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationService,
} from '../services/notificationService.js';
import Event from '../models/Event.js';
import LostFound from '../models/LostFound.js';
import Claim from '../models/Claim.js';
import Announcement from '../models/Announcement.js';
import Club from '../models/Club.js';

// @desc    Get user's notifications with filters (type, isRead, pagination)
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    const { type, isRead, limit, page } = req.query;

    const result = await getUserNotifications(req.user._id, {
      type,
      isRead,
      limit,
      page,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lightweight unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await getUnreadServiceCount(req.user._id);

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.',
      });
    }

    const unreadCount = await getUnreadServiceCount(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      unreadCount,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all active notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    await markAllNotificationsAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / dismiss a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
  try {
    const deleted = await deleteNotificationService(req.params.id, req.user._id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied.',
      });
    }

    const unreadCount = await getUnreadServiceCount(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Notification removed.',
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's consolidated recent activity timeline
// @route   GET /api/notifications/activity
// @access  Private
export const getActivityStream = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user's recent interactions across all modules
    const [myEvents, myLostFound, myClaims, myAnnouncements, myClubs] = await Promise.all([
      // Events created by user
      Event.find({ creator: userId }).sort({ createdAt: -1 }).limit(10),

      // Lost & Found items reported by user
      LostFound.find({ creator: userId }).sort({ createdAt: -1 }).limit(10),

      // Claims submitted by user
      Claim.find({ claimant: userId })
        .populate('itemId', 'title type location')
        .sort({ createdAt: -1 })
        .limit(10),

      // Announcements created by user (for faculty/admin)
      Announcement.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(10),

      // Clubs where user is a member or manager
      Club.find({
        $or: [
          { 'members.user': userId },
          { 'pendingMembers.user': userId },
          { createdBy: userId },
        ],
      })
        .sort({ updatedAt: -1 })
        .limit(10),
    ]);

    const activityList = [];

    // Format events activity
    myEvents.forEach((evt) => {
      activityList.push({
        id: `evt-${evt._id}`,
        module: 'Events',
        title: evt.title,
        action:
          evt.status === 'approved'
            ? 'Event Approved'
            : evt.status === 'rejected'
            ? 'Event Rejected'
            : 'Event Submitted',
        status: evt.status,
        timestamp: evt.createdAt,
        actionUrl: `/events/${evt._id}`,
      });
    });

    // Format lost & found activity
    myLostFound.forEach((lf) => {
      activityList.push({
        id: `lf-${lf._id}`,
        module: 'Lost & Found',
        title: lf.title,
        action: lf.type === 'lost' ? 'Lost Item Reported' : 'Found Item Reported',
        status: lf.status,
        timestamp: lf.createdAt,
        actionUrl: `/lost-found/${lf._id}`,
      });
    });

    // Format claims activity
    myClaims.forEach((cl) => {
      activityList.push({
        id: `cl-${cl._id}`,
        module: 'Lost & Found',
        title: cl.itemId?.title || 'Claim Application',
        action:
          cl.status === 'approved'
            ? 'Claim Approved (Ownership Verified)'
            : cl.status === 'rejected'
            ? 'Claim Rejected'
            : 'Ownership Claim Submitted',
        status: cl.status,
        timestamp: cl.createdAt,
        actionUrl: cl.itemId ? `/lost-found/${cl.itemId._id}` : '/lost-found/my-reports',
      });
    });

    // Format announcements activity
    myAnnouncements.forEach((ann) => {
      activityList.push({
        id: `ann-${ann._id}`,
        module: 'Announcements',
        title: ann.title,
        action:
          ann.status === 'published'
            ? 'Circular Published'
            : ann.status === 'scheduled'
            ? 'Circular Scheduled'
            : 'Draft Saved',
        status: ann.status,
        timestamp: ann.createdAt,
        actionUrl: `/announcements/${ann._id}`,
      });
    });

    // Format clubs activity
    myClubs.forEach((club) => {
      const isPending = club.pendingMembers?.some((p) => p.user.toString() === userId.toString());
      const isMember = club.members?.some((m) => m.user.toString() === userId.toString());

      activityList.push({
        id: `club-${club._id}`,
        module: 'Clubs',
        title: club.name,
        action: isPending
          ? 'Membership Application Submitted'
          : isMember
          ? 'Active Member'
          : 'Club Charter Created',
        status: club.status,
        timestamp: club.updatedAt || club.createdAt,
        actionUrl: `/clubs/${club._id}`,
      });
    });

    // Sort combined activities newest first
    activityList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      count: activityList.length,
      activities: activityList.slice(0, 30),
    });
  } catch (error) {
    next(error);
  }
};
