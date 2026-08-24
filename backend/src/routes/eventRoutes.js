import express from 'express';
import {
  getApprovedEvents,
  getEventById,
  createEvent,
  getMyEvents,
  updateEvent,
  deleteEvent,
  cancelEvent,
  getAdminAllEvents,
  approveEvent,
  rejectEvent,
  updateEventStatus,
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// General authenticated event endpoints
router.get('/', protect, getApprovedEvents);
router.get('/my-events', protect, getMyEvents);

// Admin-specific endpoints (placed before :id route so 'admin' is not parsed as ObjectId)
router.get('/admin/all', protect, authorize('ADMIN'), getAdminAllEvents);
router.put('/:id/approve', protect, authorize('ADMIN'), approveEvent);
router.put('/:id/reject', protect, authorize('ADMIN'), rejectEvent);
router.put('/:id/status', protect, authorize('ADMIN'), updateEventStatus);

// Specific event CRUD endpoints
router.get('/:id', protect, getEventById);
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.put('/:id/cancel', protect, cancelEvent);

export default router;
