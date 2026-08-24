import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// User profile endpoints
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Admin-only user management
router.get('/', protect, authorize('ADMIN'), getAllUsers);

export default router;
