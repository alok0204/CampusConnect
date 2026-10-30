import User from '../models/User.js';

// @desc    Get user profile (current user)
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId,
        rollNumber: user.rollNumber,
        branch: user.branch,
        year: user.year,
        section: user.section,
        department: user.department,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        // Joined clubs will be dynamically populated in Phase 3
        joinedClubs: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(req.body.newPassword ? '+passwordHash' : '');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Editable fields
    if (req.body.name) user.name = req.body.name.trim();
    if (req.body.section) user.section = req.body.section.trim().toUpperCase();
    if (req.body.year) user.year = req.body.year.trim();
    if (req.body.department && user.role === 'FACULTY') user.department = req.body.department.trim();
    if (req.body.profileImage !== undefined) user.profileImage = req.body.profileImage;

    // Optional legacy password update with current password security verification
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password.',
        });
      }
      const isCurrentValid = await user.matchPassword(req.body.currentPassword);
      if (!isCurrentValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
      if (req.body.newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long.',
        });
      }
      user.passwordHash = await User.hashPassword(req.body.newPassword);
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        collegeId: updatedUser.collegeId,
        rollNumber: updatedUser.rollNumber,
        branch: updatedUser.branch,
        year: updatedUser.year,
        section: updatedUser.section,
        department: updatedUser.department,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password for authenticated user
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 1. Validation: Require both current and new passwords
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    // 2. Validate confirmation match if supplied
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    // 3. Password length requirement (min 8 characters)
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    // 4. Always use authenticated user's ID from req.user (strictly prevents changing another user's password)
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid authentication token.',
      });
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // 5. Verify current password against stored password hash
    const isCurrentValid = await user.matchPassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // 6. Prevent setting the exact same password
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password.',
      });
    }

    // 7. Hash the new password using existing User.hashPassword method (bcryptjs 10 salt rounds)
    user.passwordHash = await User.hashPassword(newPassword);
    await user.save();

    // 8. Return success response (never expose password hash or plaintext password)
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};
