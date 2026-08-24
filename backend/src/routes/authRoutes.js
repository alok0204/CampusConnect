import express from 'express';
import {
  registerStudent,
  registerFaculty,
  login,
  getMe,
  forgotPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register-student', registerStudent);
router.post('/register-faculty', registerFaculty);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);

export default router;
