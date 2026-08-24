import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    collegeId: {
      type: String,
      required: [true, 'College ID is required'],
      unique: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      uppercase: true,
      default: '', // CSE, ECE, ME, CE, IT, EE, etc.
    },
    year: {
      type: String,
      trim: true,
      default: '', // 1st Year, 2nd Year, 3rd Year, 4th Year
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: '', // A, B, C
    },
    department: {
      type: String,
      trim: true,
      default: '', // For faculty: Computer Science, Electronics, etc.
    },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'ADMIN'],
      default: 'STUDENT',
    },
    profileImage: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to compare entered password with passwordHash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const User = mongoose.model('User', userSchema);
export default User;
