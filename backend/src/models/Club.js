import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: [
        'Faculty Coordinator',
        'President',
        'Vice President',
        'Secretary',
        'Treasurer',
        'Core Team',
        'Member',
      ],
      default: 'Member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const pendingMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    statement: {
      type: String,
      trim: true,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Club name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Club name cannot exceed 100 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Short summary is required'],
      trim: true,
      maxlength: [250, 'Short summary cannot exceed 250 characters'],
    },
    description: {
      type: String,
      required: [true, 'Full description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Technical',
        'Cultural',
        'Sports',
        'Literary',
        'Music',
        'Dance',
        'Photography',
        'Entrepreneurship',
        'Social Service',
        'Academic',
        'Other',
      ],
      default: 'Technical',
    },
    logo: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
    },
    coverImage: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    },
    department: {
      type: String,
      trim: true,
      default: 'College-Wide',
    },
    branch: {
      type: String,
      trim: true,
      default: 'ALL', // 'ALL', 'CSE', 'ECE', 'ME', etc.
    },
    facultyCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    studentPresident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    studentSecretary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    socialLinks: {
      website: { type: String, trim: true, default: '' },
      instagram: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' },
    },
    members: [memberSchema],
    pendingMembers: [pendingMemberSchema],
    status: {
      type: String,
      enum: ['active', 'pending', 'rejected', 'inactive'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
clubSchema.index({ category: 1, status: 1 });
clubSchema.index({ department: 1 });
clubSchema.index({ branch: 1 });
clubSchema.index({ status: 1 });
clubSchema.index({ createdBy: 1 });

export const Club = mongoose.model('Club', clubSchema);
export default Club;
