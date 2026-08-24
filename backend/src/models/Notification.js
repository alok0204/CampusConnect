import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['event', 'lost_found', 'announcement', 'club', 'system', 'admin'],
      default: 'system',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    entityType: {
      type: String,
      enum: ['Event', 'LostFound', 'Claim', 'Announcement', 'Club', 'User', 'System'],
      default: 'System',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    metadata: {
      actionUrl: { type: String, default: '' },
      icon: { type: String, default: '' },
      status: { type: String, default: '' },
      extra: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal query performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, expiresAt: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
