import express from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  markAllAsRead,
  getMyAnnouncements,
  getAdminAllAnnouncements,
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public Authenticated Feed & Bulk Actions
router.get('/', protect, getAnnouncements);
router.put('/mark-all-read', protect, markAllAsRead);

// Management routes
router.get(
  '/my-announcements',
  protect,
  authorize('ADMIN', 'FACULTY'),
  getMyAnnouncements
);
router.get(
  '/admin/all',
  protect,
  authorize('ADMIN'),
  getAdminAllAnnouncements
);

// Single Announcement Operations
router.get('/:id', protect, getAnnouncementById);
router.post(
  '/',
  protect,
  authorize('ADMIN', 'FACULTY'),
  createAnnouncement
);
router.put(
  '/:id',
  protect,
  authorize('ADMIN', 'FACULTY'),
  updateAnnouncement
);
router.put('/:id/read', protect, markAsRead);
router.delete(
  '/:id',
  protect,
  authorize('ADMIN', 'FACULTY'),
  deleteAnnouncement
);

export default router;
