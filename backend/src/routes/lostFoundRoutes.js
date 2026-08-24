import express from 'express';
import {
  getLostFoundItems,
  getLostFoundById,
  createLostFound,
  getMyReports,
  updateLostFound,
  closeLostFound,
  deleteLostFound,
  submitClaim,
  getItemClaims,
  getMyClaims,
  approveClaim,
  rejectClaim,
  getAdminAllLostFound,
  moderateLostFound,
} from '../controllers/lostFoundController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// General item search & user reports
router.get('/', protect, getLostFoundItems);
router.get('/my-reports', protect, getMyReports);
router.get('/my-claims', protect, getMyClaims);

// Admin-specific routes (placed before /:id)
router.get('/admin/all', protect, authorize('ADMIN'), getAdminAllLostFound);
router.put('/admin/:id/moderate', protect, authorize('ADMIN'), moderateLostFound);

// Claims actions
router.put('/claims/:claimId/approve', protect, approveClaim);
router.put('/claims/:claimId/reject', protect, rejectClaim);

// Single item CRUD & item claims
router.get('/:id', protect, getLostFoundById);
router.post('/', protect, createLostFound);
router.put('/:id', protect, updateLostFound);
router.put('/:id/close', protect, closeLostFound);
router.delete('/:id', protect, deleteLostFound);
router.post('/:id/claim', protect, submitClaim);
router.get('/:id/claims', protect, getItemClaims);

export default router;
