import express from 'express';
import {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
  getPendingMembers,
  getClubMembers,
  approveMember,
  rejectMember,
  removeMember,
  getMyClubs,
  getAdminAllClubs,
  approveClub,
  rejectClub,
} from '../controllers/clubController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public Authenticated Feed & User Dashboards
router.get('/', protect, getClubs);
router.get('/my-clubs', protect, getMyClubs);

// Admin Specific Endpoints
router.get('/admin/all', protect, authorize('ADMIN'), getAdminAllClubs);
router.put('/:id/approve', protect, authorize('ADMIN'), approveClub);
router.put('/:id/reject', protect, authorize('ADMIN'), rejectClub);

// Membership Actions
router.post('/:id/join', protect, joinClub);
router.post('/:id/leave', protect, leaveClub);
router.get('/:id/pending-members', protect, getPendingMembers);
router.get('/:id/members', protect, getClubMembers);
router.put('/:id/approve-member/:userId', protect, approveMember);
router.put('/:id/reject-member/:userId', protect, rejectMember);
router.delete('/:id/members/:userId', protect, removeMember);

// Single Club CRUD
router.get('/:id', protect, getClubById);
router.post('/', protect, createClub);
router.put('/:id', protect, updateClub);
router.delete('/:id', protect, deleteClub);

export default router;
