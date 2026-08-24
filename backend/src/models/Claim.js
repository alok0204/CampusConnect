import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostFound',
      required: true,
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    finder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Please explain why you believe this item belongs to you'],
      trim: true,
    },
    identifyingDetails: {
      type: String,
      required: [true, 'Please provide specific identifying marks, serial numbers, wallpapers, contents, or distinguishing features'],
      trim: true,
    },
    previousLocation: {
      type: String,
      trim: true,
      default: '',
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewNote: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
claimSchema.index({ itemId: 1, claimant: 1 });
claimSchema.index({ claimant: 1 });
claimSchema.index({ finder: 1 });
claimSchema.index({ status: 1 });

export const Claim = mongoose.model('Claim', claimSchema);
export default Claim;
