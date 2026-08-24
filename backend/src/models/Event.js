import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [120, 'Event title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Event category is required'],
      enum: [
        'Technical',
        'Cultural',
        'Academic',
        'Sports',
        'Workshop',
        'Seminar',
        'Hackathon',
        'Fest',
        'Other',
      ],
      default: 'Technical',
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Event start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'Event end time is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Event venue/location is required'],
      trim: true,
    },
    organizer: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      default: null,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'FACULTY', 'BRANCH_ONLY'],
      default: 'ALL',
    },
    branch: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'ALL', // 'ALL', 'CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', etc.
    },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Optimize search and filter queries
eventSchema.index({ date: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ branch: 1 });
eventSchema.index({ creator: 1 });
eventSchema.index({ club: 1 });

export const Event = mongoose.model('Event', eventSchema);
export default Event;
