import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a single notification for a specific recipient
 */
export const createNotification = async ({
  recipient,
  type = 'system',
  title,
  message,
  entityType = 'System',
  entityId = null,
  priority = 'normal',
  expiresAt = null,
  metadata = {},
}) => {
  try {
    if (!recipient || !title || !message) return null;

    const notification = await Notification.create({
      recipient,
      type,
      title: title.trim(),
      message: message.trim(),
      entityType,
      entityId,
      priority,
      expiresAt,
      metadata: {
        actionUrl: metadata.actionUrl || '',
        icon: metadata.icon || '',
        status: metadata.status || '',
        extra: metadata.extra || {},
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

/**
 * Create notifications for multiple specific recipients
 */
export const createBulkNotifications = async (notificationsArray) => {
  try {
    if (!notificationsArray || notificationsArray.length === 0) return [];
    return await Notification.insertMany(notificationsArray);
  } catch (error) {
    console.error('Error creating bulk notifications:', error.message);
    return [];
  }
};

/**
 * Broadcast notifications to matching users based on audience parameters
 * (Used by Announcement publishing to notify matching branch/year/section/role students)
 */
export const createAudienceNotifications = async ({
  audience = 'all',
  branch = 'ALL',
  department = 'ALL',
  year = 'ALL',
  section = 'ALL',
  excludeUserId = null,
  type = 'announcement',
  title,
  message,
  entityType = 'Announcement',
  entityId = null,
  priority = 'normal',
  expiresAt = null,
  metadata = {},
}) => {
  try {
    const userQuery = { isVerified: true };

    if (excludeUserId) {
      userQuery._id = { $ne: excludeUserId };
    }

    if (audience === 'faculty') {
      userQuery.role = 'FACULTY';
      if (department !== 'ALL') {
        userQuery.department = department;
      }
    } else if (audience === 'students') {
      userQuery.role = 'STUDENT';
      if (branch !== 'ALL') {
        userQuery.branch = branch;
      }
    } else if (audience === 'branch') {
      if (branch !== 'ALL') {
        userQuery.$or = [{ branch }, { department }];
      }
    } else if (audience === 'year') {
      userQuery.role = 'STUDENT';
      if (branch !== 'ALL') userQuery.branch = branch;
      if (year !== 'ALL') userQuery.year = year;
    } else if (audience === 'section') {
      userQuery.role = 'STUDENT';
      if (branch !== 'ALL') userQuery.branch = branch;
      if (year !== 'ALL') userQuery.year = year;
      if (section !== 'ALL') userQuery.section = section;
    }

    const matchingUsers = await User.find(userQuery).select('_id');
    if (!matchingUsers || matchingUsers.length === 0) return [];

    const notificationsToInsert = matchingUsers.map((u) => ({
      recipient: u._id,
      type,
      title: title.trim(),
      message: message.trim(),
      entityType,
      entityId,
      priority,
      expiresAt,
      metadata: {
        actionUrl: metadata.actionUrl || '',
        icon: metadata.icon || '',
        status: metadata.status || '',
        extra: metadata.extra || {},
      },
    }));

    return await Notification.insertMany(notificationsToInsert);
  } catch (error) {
    console.error('Error broadcasting audience notifications:', error.message);
    return [];
  }
};

/**
 * Get user's notifications with optional filters and pagination
 */
export const getUserNotifications = async (
  userId,
  { type = 'all', isRead = 'all', limit = 30, page = 1 } = {}
) => {
  try {
    const now = new Date();
    const query = {
      recipient: userId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (isRead === 'true' || isRead === true) {
      query.isRead = true;
    } else if (isRead === 'false' || isRead === false) {
      query.isRead = false;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10) || 30;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take),
      Notification.countDocuments(query),
      Notification.countDocuments({
        recipient: userId,
        isRead: false,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take) || 1,
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error.message);
    return { notifications: [], total: 0, unreadCount: 0, page: 1, totalPages: 1 };
  }
};

/**
 * Get unread notifications count for badge
 */
export const getUnreadCount = async (userId) => {
  try {
    const now = new Date();
    return await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });
  } catch (error) {
    console.error('Error getting unread count:', error.message);
    return 0;
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { $set: { isRead: true } },
      { new: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    return null;
  }
};

/**
 * Mark all active notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const now = new Date();
    return await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
      { $set: { isRead: true } }
    );
  } catch (error) {
    console.error('Error marking all notifications as read:', error.message);
    return null;
  }
};

/**
 * Delete / dismiss a notification
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    return null;
  }
};
