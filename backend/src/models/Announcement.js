import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    summary: {
      type: String,
      trim: true,
      maxlength: [400, 'Summary cannot exceed 400 characters'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Announcement full content is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'academic',
        'exam',
        'placement',
        'event',
        'administrative',
        'scholarship',
        'general',
        'emergency',
      ],
      default: 'general',
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
    },
    audience: {
      type: String,
      required: [true, 'Target audience is required'],
      enum: ['all', 'students', 'faculty', 'branch', 'department', 'year', 'section'],
      default: 'all',
    },
    branch: {
      type: String,
      trim: true,
      default: 'ALL',
    },
    department: {
      type: String,
      trim: true,
      default: 'ALL',
    },
    year: {
      type: String,
      trim: true,
      default: 'ALL',
    },
    section: {
      type: String,
      trim: true,
      default: 'ALL',
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null,
    },
    attachment: {
      name: { type: String, default: '' },
      url: { type: String, default: '' },
      fileType: { type: String, default: 'pdf' },
      fileSize: { type: String, default: '' },
    },
    image: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'expired', 'archived'],
      default: 'published',
    },
    publishAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
announcementSchema.index({ status: 1, publishAt: -1 });
announcementSchema.index({ priority: 1, createdAt: -1 });
announcementSchema.index({ category: 1 });
announcementSchema.index({ audience: 1, branch: 1, year: 1, section: 1 });
announcementSchema.index({ createdBy: 1 });
announcementSchema.index({ expiresAt: 1 });
announcementSchema.index({ club: 1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
