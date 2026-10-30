import express from 'express';
import {
  registerStudent,
  registerFaculty,
  login,
  getMe,
  forgotPassword,
} from '../controllers/authController.js';
import { changePassword } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
