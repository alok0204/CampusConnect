import LostFound from '../models/LostFound.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get all active lost & found items with search, category, type, and date filters
// @route   GET /api/lost-found
// @access  Private (Authenticated users)
export const getLostFoundItems = async (req, res, next) => {
  try {
    const { type, category, location, search, status, startDate, endDate, sort } = req.query;

    const query = {};

    // Filter by type: 'lost', 'found', or default all
    if (type && ['lost', 'found'].includes(type.toLowerCase())) {
      query.type = type.toLowerCase();
    }

    // Filter by category
    if (category && category !== 'ALL') {
      query.category = category;
    }

    // Filter by status (default shows public active items, hides rejected/closed unless requested)
    if (status && status !== 'ALL') {
      query.status = status.toLowerCase();
    } else {
      query.status = { $in: ['active', 'claim_pending', 'claimed', 'resolved'] };
    }

    // Filter by location
    if (location && location.trim()) {
      query.location = new RegExp(location.trim(), 'i');
    }

    // Search query across title, description, location, brand, color
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { brand: searchRegex },
        { color: searchRegex },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        query.date.$lte = endD;
      }
    }

    // Sorting: default newest first
    let sortOptions = { createdAt: -1 };
    if (sort === 'date_desc') {
      sortOptions = { date: -1 };
    } else if (sort === 'date_asc') {
      sortOptions = { date: 1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const items = await LostFound.find(query)
      .populate('creator', 'name email role branch department profileImage')
      .populate('claimedBy', 'name email role branch profileImage')
      .sort(sortOptions);

    // Security / Privacy: strip private `uniqueDetails` unless user is creator or admin
    const sanitizedItems = items.map((item) => {
      const itemObj = item.toObject();
      const isCreator = req.user && item.creator && item.creator._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'ADMIN';

      if (!isCreator && !isAdmin) {
        delete itemObj.uniqueDetails;
      }
      return itemObj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedItems.length,
      items: sanitizedItems,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Lost & Found item details
// @route   GET /api/lost-found/:id
// @access  Private
export const getLostFoundById = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id)
      .populate('creator', 'name email role branch department profileImage collegeId')
      .populate('claimedBy', 'name email role branch department profileImage');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost/Found listing not found',
      });
    }

    const isCreator = req.user && item.creator && item.creator._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'ADMIN';

    // If item is rejected or closed, only creator or admin can view
    if (['rejected', 'closed'].includes(item.status) && !isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This report has been closed or removed by administration.',
      });
    }

    const itemObj = item.toObject();

    // Privacy: Only creator or admin can see private identifying details
    if (!isCreator && !isAdmin) {
      delete itemObj.uniqueDetails;
    }

    // Check if the current user has submitted a claim for this item
    let userClaim = null;
    if (req.user && item.type === 'found') {
      const existingClaim = await Claim.findOne({
        itemId: item._id,
        claimant: req.user._id,
      });
      if (existingClaim) {
        userClaim = {
          id: existingClaim._id,
          status: existingClaim.status,
          reason: existingClaim.reason,
          identifyingDetails: existingClaim.identifyingDetails,
          createdAt: existingClaim.createdAt,
          reviewNote: existingClaim.reviewNote,
        };
      }
    }

    // If caller is the finder or admin, count total claims
    let claimCounts = null;
    if (isCreator || isAdmin) {
      claimCounts = {
        total: await Claim.countDocuments({ itemId: item._id }),
        pending: await Claim.countDocuments({ itemId: item._id, status: 'pending' }),
        approved: await Claim.countDocuments({ itemId: item._id, status: 'approved' }),
      };
    }

    res.status(200).json({
      success: true,
      item: itemObj,
      userClaim,
      claimCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a Lost or Found item
// @route   POST /api/lost-found
// @access  Private
export const createLostFound = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      category,
      location,
      date,
      time,
      image,
      color,
      brand,
      uniqueDetails,
      contactPreference,
      contactNumber,
    } = req.body;

    // Server-side validations
    if (!title || !description || !type || !category || !location || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, type (lost/found), category, location, date.',
      });
    }

    if (!['lost', 'found'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Item type must be either "lost" or "found".',
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters.',
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description must be at least 10 characters.',
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid date.',
      });
    }

    const defaultImage =
      type.toLowerCase() === 'lost'
        ? 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80';

    const item = await LostFound.create({
      title: title.trim(),
      description: description.trim(),
      type: type.toLowerCase(),
      category,
      location: location.trim(),
      date: parsedDate,
      time: time ? time.trim() : '',
      image: image && image.trim() ? image.trim() : defaultImage,
      color: color ? color.trim() : '',
      brand: brand ? brand.trim() : '',
      uniqueDetails: uniqueDetails ? uniqueDetails.trim() : '',
      contactPreference: contactPreference || 'portal',
      contactNumber: contactNumber ? contactNumber.trim() : '',
      creator: req.user._id,
      status: 'active',
      claimStatus: 'none',
    });

    const populatedItem = await LostFound.findById(item._id).populate(
      'creator',
      'name email role branch department profileImage'
    );

    res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} item report published successfully!`,
      item: populatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's submitted reports
// @route   GET /api/lost-found/my-reports
// @access  Private
export const getMyReports = async (req, res, next) => {
  try {
    const items = await LostFound.find({ creator: req.user._id })
      .populate('creator', 'name email role branch department profileImage')
      .populate('claimedBy', 'name email role branch profileImage')
      .sort({ createdAt: -1 });

    // Attach pending claim counts for each item
    const itemsWithClaimCounts = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        if (item.type === 'found') {
          itemObj.pendingClaimsCount = await Claim.countDocuments({
            itemId: item._id,
            status: 'pending',
          });
          itemObj.totalClaimsCount = await Claim.countDocuments({
            itemId: item._id,
          });
        } else {
          itemObj.pendingClaimsCount = 0;
          itemObj.totalClaimsCount = 0;
        }
        return itemObj;
      })
    );

    res.status(200).json({
      success: true,
      count: itemsWithClaimCounts.length,
      items: itemsWithClaimCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a Lost & Found report (Owner or Admin)
// @route   PUT /api/lost-found/:id
// @access  Private
export const updateLostFound = async (req, res, next) => {
  try {
    let item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    const isCreator = item.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this report.',
      });
    }

    const {
      title,
      description,
      category,
      location,
      date,
      time,
      image,
      color,
      brand,
      uniqueDetails,
      contactPreference,
      contactNumber,
      status,
    } = req.body;

    if (title) item.title = title.trim();
    if (description) item.description = description.trim();
    if (category) item.category = category;
    if (location) item.location = location.trim();
    if (date) item.date = new Date(date);
    if (time !== undefined) item.time = time.trim();
    if (image !== undefined) item.image = image.trim();
    if (color !== undefined) item.color = color.trim();
    if (brand !== undefined) item.brand = brand.trim();
    if (uniqueDetails !== undefined) item.uniqueDetails = uniqueDetails.trim();
    if (contactPreference) item.contactPreference = contactPreference;
    if (contactNumber !== undefined) item.contactNumber = contactNumber.trim();
    if (status && ['active', 'resolved', 'closed'].includes(status)) {
      item.status = status;
      if (status === 'resolved') {
        item.resolvedAt = new Date();
      }
    }

    await item.save();

    const updatedItem = await LostFound.findById(item._id)
      .populate('creator', 'name email role branch department profileImage')
      .populate('claimedBy', 'name email role branch profileImage');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close / Resolve a Lost or Found report (Owner or Admin)
// @route   PUT /api/lost-found/:id/close
// @access  Private
export const closeLostFound = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    const isCreator = item.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to close this report.',
      });
    }

    const { action } = req.body; // 'resolved' or 'closed'
    const newStatus = action === 'resolved' ? 'resolved' : 'closed';

    item.status = newStatus;
    item.resolvedAt = new Date();
    await item.save();

    res.status(200).json({
      success: true,
      message: `Report marked as ${newStatus}.`,
      item,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a Lost & Found report (Owner or Admin)
// @route   DELETE /api/lost-found/:id
// @access  Private
export const deleteLostFound = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    const isCreator = item.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this report.',
      });
    }

    // Delete associated claims
    await Claim.deleteMany({ itemId: item._id });
    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report and associated records deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CLAIMS MANAGEMENT CONTROLLERS
// ==========================================

// @desc    Submit a claim for a found item
// @route   POST /api/lost-found/:id/claim
// @access  Private
export const submitClaim = async (req, res, next) => {
  try {
    const { reason, identifyingDetails, previousLocation, contactNumber } = req.body;

    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Found item not found',
      });
    }

    // Can only claim 'found' items
    if (item.type !== 'found') {
      return res.status(400).json({
        success: false,
        message: 'Claims can only be submitted for Found items.',
      });
    }

    // Cannot claim already resolved or closed item
    if (['claimed', 'resolved', 'closed', 'rejected'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `This item has already been marked as ${item.status}. Claims are closed.`,
      });
    }

    // Cannot claim your own found item
    if (item.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a claim for an item you reported yourself.',
      });
    }

    // Required fields
    if (!reason || !identifyingDetails) {
      return res.status(400).json({
        success: false,
        message: 'Please provide why you believe this is your item and specific identifying details/marks.',
      });
    }

    // Check for existing pending/approved claim from this user
    const existingClaim = await Claim.findOne({
      itemId: item._id,
      claimant: req.user._id,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: `You already have an active claim for this item with status '${existingClaim.status}'.`,
      });
    }

    const claim = await Claim.create({
      itemId: item._id,
      claimant: req.user._id,
      finder: item.creator,
      reason: reason.trim(),
      identifyingDetails: identifyingDetails.trim(),
      previousLocation: previousLocation ? previousLocation.trim() : '',
      contactNumber: contactNumber ? contactNumber.trim() : '',
      status: 'pending',
    });

    // Update item status to claim_pending
    item.status = 'claim_pending';
    item.claimStatus = 'pending';
    await item.save();

    // Trigger notification to the Finder (item.creator)
    await createNotification({
      recipient: item.creator,
      type: 'lost_found',
      title: `New Claim Submitted: ${item.title}`,
      message: `${req.user.name} submitted an ownership verification claim for the ${item.category} item you reported finding at ${item.location}.`,
      entityType: 'LostFound',
      entityId: item._id,
      priority: 'important',
      metadata: {
        actionUrl: `/lost-found/${item._id}`,
        status: 'claim_pending',
      },
    });

    const populatedClaim = await Claim.findById(claim._id)
      .populate('claimant', 'name email role branch rollNumber collegeId profileImage')
      .populate('finder', 'name email role branch department profileImage')
      .populate('itemId', 'title image type category location status');

    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully! The finder will review your verification details.',
      claim: populatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all claims for a specific found item (Finder or Admin only)
// @route   GET /api/lost-found/:id/claims
// @access  Private
export const getItemClaims = async (req, res, next) => {
  try {
    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const isFinder = item.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isFinder && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the person who found this item or an administrator can review submitted claims.',
      });
    }

    const claims = await Claim.find({ itemId: item._id })
      .populate('claimant', 'name email role branch rollNumber collegeId profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      item: {
        id: item._id,
        title: item.title,
        status: item.status,
        type: item.type,
      },
      claims,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's submitted claims
// @route   GET /api/lost-found/my-claims
// @access  Private
export const getMyClaims = async (req, res, next) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .populate('itemId', 'title image type category location status resolvedAt')
      .populate('finder', 'name email role branch department profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a claim for a found item (Finder or Admin only)
// @route   PUT /api/lost-found/claims/:claimId/approve
// @access  Private
export const approveClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim record not found',
      });
    }

    const item = await LostFound.findById(claim.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Associated item not found',
      });
    }

    const isFinder = item.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isFinder && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve claims for this item.',
      });
    }

    // Approve the claim
    claim.status = 'approved';
    claim.resolvedAt = new Date();
    claim.reviewNote = req.body.reviewNote || 'Claim approved by finder. Item ownership verified.';
    await claim.save();

    // Mark item as resolved/claimed
    item.status = 'resolved';
    item.claimedBy = claim.claimant;
    item.claimStatus = 'approved';
    item.resolvedAt = new Date();
    await item.save();

    // Automatically reject any other pending claims on this item
    await Claim.updateMany(
      {
        itemId: item._id,
        _id: { $ne: claim._id },
        status: 'pending',
      },
      {
        $set: {
          status: 'rejected',
          resolvedAt: new Date(),
          reviewNote: 'Item ownership was verified and resolved with another claimant.',
        },
      }
    );

    // Trigger notification to the claimant
    await createNotification({
      recipient: claim.claimant,
      type: 'lost_found',
      title: `Claim Approved! Ownership Verified for ${item.title}`,
      message: `Your ownership claim for "${item.title}" was approved by the finder. You can now coordinate handover on campus.`,
      entityType: 'LostFound',
      entityId: item._id,
      priority: 'urgent',
      metadata: {
        actionUrl: `/lost-found/${item._id}`,
        status: 'approved',
      },
    });

    const populatedClaim = await Claim.findById(claim._id)
      .populate('claimant', 'name email role branch profileImage')
      .populate('finder', 'name email role branch profileImage')
      .populate('itemId');

    res.status(200).json({
      success: true,
      message: 'Claim approved! Item has been marked as resolved.',
      claim: populatedClaim,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a claim for a found item (Finder or Admin only)
// @route   PUT /api/lost-found/claims/:claimId/reject
// @access  Private
export const rejectClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim record not found',
      });
    }

    const item = await LostFound.findById(claim.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Associated item not found',
      });
    }

    const isFinder = item.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isFinder && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject claims for this item.',
      });
    }

    const reviewReason =
      req.body.reviewNote ||
      'Provided identifying details did not match the recovered item specifications.';

    claim.status = 'rejected';
    claim.resolvedAt = new Date();
    claim.reviewNote = reviewReason;
    await claim.save();

    // Check if there are other pending claims on this item
    const remainingPendingCount = await Claim.countDocuments({
      itemId: item._id,
      status: 'pending',
    });

    if (remainingPendingCount === 0 && item.status === 'claim_pending') {
      item.status = 'active';
      item.claimStatus = 'none';
      await item.save();
    }

    // Trigger notification to the claimant
    await createNotification({
      recipient: claim.claimant,
      type: 'lost_found',
      title: `Claim Not Verified: ${item.title}`,
      message: `Your ownership claim for "${item.title}" could not be verified by the finder. Note: ${reviewReason}`,
      entityType: 'LostFound',
      entityId: item._id,
      priority: 'normal',
      metadata: {
        actionUrl: '/lost-found/my-reports',
        status: 'rejected',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Claim rejected. The item remains available for legitimate claims.',
      claim,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN MODERATION CONTROLLERS
// ==========================================

// @desc    Get all Lost & Found reports for Admin dashboard
// @route   GET /api/lost-found/admin/all
// @access  Private/Admin
export const getAdminAllLostFound = async (req, res, next) => {
  try {
    const { status, type, category, search } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }

    if (type && type !== 'all') {
      query.type = type.toLowerCase();
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { brand: searchRegex },
      ];
    }

    const items = await LostFound.find(query)
      .populate('creator', 'name email role branch department profileImage collegeId rollNumber')
      .populate('claimedBy', 'name email role branch profileImage')
      .sort({ createdAt: -1 });

    const counts = {
      all: await LostFound.countDocuments(),
      lost: await LostFound.countDocuments({ type: 'lost', status: 'active' }),
      found: await LostFound.countDocuments({ type: 'found', status: { $in: ['active', 'claim_pending'] } }),
      claim_pending: await LostFound.countDocuments({ status: 'claim_pending' }),
      resolved: await LostFound.countDocuments({ status: 'resolved' }),
      rejected: await LostFound.countDocuments({ status: 'rejected' }),
      totalClaims: await Claim.countDocuments(),
      pendingClaims: await Claim.countDocuments({ status: 'pending' }),
    };

    res.status(200).json({
      success: true,
      counts,
      items,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate / Reject / Remove Lost & Found report (Admin only)
// @route   PUT /api/lost-found/admin/:id/moderate
// @access  Private/Admin
export const moderateLostFound = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['active', 'rejected', 'closed', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for moderation.',
      });
    }

    const item = await LostFound.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    item.status = status;
    if (status === 'rejected') {
      item.rejectionReason =
        rejectionReason || 'This report was flagged and rejected for violating campus guidelines.';
    } else {
      item.rejectionReason = '';
    }

    if (status === 'resolved') {
      item.resolvedAt = new Date();
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: `Report status updated to ${status}.`,
      item,
    });
  } catch (error) {
    next(error);
  }
};
