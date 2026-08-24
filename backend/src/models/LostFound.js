import mongoose from 'mongoose';

const lostFoundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Item title/name is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Item type is required (lost or found)'],
      enum: ['lost', 'found'],
    },
    category: {
      type: String,
      required: [true, 'Item category is required'],
      enum: [
        'Electronics',
        'ID Cards & Documents',
        'Keys & Wallets',
        'Books & Stationery',
        'Clothing & Accessories',
        'Bags & Backpacks',
        'Bottles & Lunchboxes',
        'Jewelry & Watches',
        'Sports Equipment',
        'Other',
      ],
      default: 'Other',
    },
    location: {
      type: String,
      required: [true, 'Location where item was lost or found is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      trim: true,
      default: '', // e.g. "11:30 AM" or "Afternoon"
    },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    uniqueDetails: {
      type: String,
      trim: true,
      default: '', // Specific private markings/scratch/stickers for verification
    },
    contactPreference: {
      type: String,
      enum: ['email', 'phone', 'in_person', 'portal'],
      default: 'portal',
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'claim_pending', 'claimed', 'resolved', 'rejected', 'closed'],
      default: 'active',
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    claimStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    resolvedAt: {
      type: Date,
      default: null,
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

// Optimize query performance for search, filtering, and user reports
lostFoundSchema.index({ type: 1, status: 1 });
lostFoundSchema.index({ category: 1 });
lostFoundSchema.index({ location: 1 });
lostFoundSchema.index({ date: -1 });
lostFoundSchema.index({ creator: 1 });

export const LostFound = mongoose.model('LostFound', lostFoundSchema);
export default LostFound;
