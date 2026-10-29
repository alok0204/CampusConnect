import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// @desc    Register a new Student
// @route   POST /api/auth/register-student
// @access  Public
export const registerStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      collegeId,
      rollNumber,
      branch,
      year,
      section,
      password,
      confirmPassword,
    } = req.body;

    // Validation
    if (!name || !email || !collegeId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, collegeId, password',
      });
    }

    // Security: Reject any attempt to self-assign administrative or unauthorized roles
    if (req.body.role && req.body.role.trim().toUpperCase() !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized role assignment. Public registration cannot assign administrative roles.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { collegeId: collegeId.trim() },
        ...(rollNumber ? [{ rollNumber: rollNumber.trim() }] : []),
      ],
    });

    if (existingUser) {
      let duplicateField = 'email or college ID';
      if (existingUser.email === email.toLowerCase().trim()) duplicateField = 'Email';
      else if (existingUser.collegeId === collegeId.trim()) duplicateField = 'College ID';
      else if (rollNumber && existingUser.rollNumber === rollNumber.trim()) duplicateField = 'Roll Number';

      return res.status(400).json({
        success: false,
        message: `An account with this ${duplicateField} already exists`,
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      collegeId: collegeId.trim(),
      rollNumber: rollNumber ? rollNumber.trim() : collegeId.trim(),
      branch: (branch || 'CSE').trim().toUpperCase(),
      year: year || '1st Year',
      section: (section || 'A').trim().toUpperCase(),
      role: 'STUDENT',
      isVerified: true,
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId,
        rollNumber: user.rollNumber,
        branch: user.branch,
        year: user.year,
        section: user.section,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new Faculty member
// @route   POST /api/auth/register-faculty
// @access  Public
export const registerFaculty = async (req, res, next) => {
  try {
    const {
      name,
      email,
      collegeId,
      department,
      password,
      confirmPassword,
    } = req.body;

    if (!name || !email || !collegeId || !department || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, official email, faculty ID, department, password',
      });
    }

    // Security: Reject any attempt to self-assign administrative or unauthorized roles
    if (req.body.role && req.body.role.trim().toUpperCase() !== 'FACULTY') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized role assignment. Public registration cannot assign administrative roles.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { collegeId: collegeId.trim() },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or faculty ID already exists',
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      collegeId: collegeId.trim(),
      department: department.trim(),
      role: 'FACULTY',
      isVerified: true,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Faculty account registered successfully',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeId: user.collegeId,
        department: user.department,
        role: user.role,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Universal Login for all roles (Student, Faculty, Admin)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your College Email / College ID and Password',
      });
    }

    const cleanIdentifier = identifier.trim();
    const escaped = cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const caseInsensitiveRegex = new RegExp(`^${escaped}$`, 'i');

    // Query user by email (case-insensitive) OR collegeId OR rollNumber
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { email: caseInsensitiveRegex },
        { collegeId: cleanIdentifier },
        { collegeId: caseInsensitiveRegex },
        { rollNumber: cleanIdentifier },
        { rollNumber: caseInsensitiveRegex },
      ],
    }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. No account found for '${cleanIdentifier}'.`,
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password handler (placeholder structure)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered college email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 to prevent user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, reset instructions have been dispatched.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your college email (Demo mode: contact campus admin if needed).',
    });
  } catch (error) {
    next(error);
  }
};
