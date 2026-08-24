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
    const user = await User.findById(req.user.id);
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

    // Optional password update
    if (req.body.newPassword) {
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters',
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
