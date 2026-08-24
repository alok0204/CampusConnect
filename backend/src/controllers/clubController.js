import Club from '../models/Club.js';
import Event from '../models/Event.js';
import Announcement from '../models/Announcement.js';
import User from '../models/User.js';
import { createNotification } from '../services/notificationService.js';

// Helper: Check if user has management privileges on a club
export const isClubManager = (club, user) => {
  if (!club || !user) return false;
  if (user.role === 'ADMIN') return true;

  const userIdStr = user._id.toString();
  if (club.createdBy && club.createdBy.toString() === userIdStr) return true;
  if (club.facultyCoordinator && club.facultyCoordinator.toString() === userIdStr) return true;
  if (club.studentPresident && club.studentPresident.toString() === userIdStr) return true;
  if (club.studentSecretary && club.studentSecretary.toString() === userIdStr) return true;

  // Check if member with Leader/President/Secretary role in members array
  const memberEntry = club.members?.find((m) => m.user?.toString() === userIdStr);
  if (memberEntry && ['Faculty Coordinator', 'President', 'Vice President', 'Secretary'].includes(memberEntry.role)) {
    return true;
  }

  return false;
};

// @desc    Get active clubs with filters (category, branch, search, sort)
// @route   GET /api/clubs
// @access  Private (Authenticated users)
export const getClubs = async (req, res, next) => {
  try {
    const { category, branch, department, search, sort } = req.query;

    const query = { status: 'active' };

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (branch && branch !== 'ALL') {
      query.branch = { $in: ['ALL', branch.toUpperCase()] };
    }

    if (department && department !== 'ALL') {
      query.department = new RegExp(department.trim(), 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { shortDescription: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    let sortOptions = { name: 1 };
    if (sort === 'newest') sortOptions = { createdAt: -1 };
    if (sort === 'members') sortOptions = { 'members.length': -1 };

    const clubs = await Club.find(query)
      .populate('facultyCoordinator', 'name email role department profileImage')
      .populate('studentPresident', 'name email role branch profileImage')
      .populate('studentSecretary', 'name email role branch profileImage')
      .sort(sortOptions);

    const userIdStr = req.user._id.toString();

    // Sanitize club cards: return member count and user's membership status
    const formattedClubs = clubs.map((club) => {
      const clubObj = club.toObject();
      clubObj.memberCount = club.members?.length || 0;
      clubObj.isMember = club.members?.some((m) => m.user?.toString() === userIdStr);
      clubObj.isPending = club.pendingMembers?.some((p) => p.user?.toString() === userIdStr);
      clubObj.isManager = isClubManager(club, req.user);

      // Strip full member arrays on list endpoint
      delete clubObj.members;
      delete clubObj.pendingMembers;
      return clubObj;
    });

    res.status(200).json({
      success: true,
      count: formattedClubs.length,
      clubs: formattedClubs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single club details with leadership, linked events & announcements
// @route   GET /api/clubs/:id
// @access  Private
export const getClubById = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('facultyCoordinator', 'name email role department profileImage')
      .populate('studentPresident', 'name email role branch rollNumber profileImage')
      .populate('studentSecretary', 'name email role branch rollNumber profileImage')
      .populate('createdBy', 'name email role department branch profileImage');

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const userIdStr = req.user._id.toString();
    const isManager = isClubManager(club, req.user);
    const isAdmin = req.user.role === 'ADMIN';

    // If club is not active (pending or rejected), only managers or admin can view
    if (club.status !== 'active' && !isManager && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This club proposal is currently pending administrative approval.',
      });
    }

    const memberEntry = club.members?.find((m) => m.user?.toString() === userIdStr);
    const pendingEntry = club.pendingMembers?.find((p) => p.user?.toString() === userIdStr);

    // Fetch linked events for this club
    const linkedEvents = await Event.find({
      $or: [{ club: club._id }, { organizer: club.name }],
      status: 'approved',
    })
      .sort({ date: 1 })
      .limit(6);

    // Fetch linked announcements for this club
    const linkedAnnouncements = await Announcement.find({
      club: club._id,
      status: 'published',
    })
      .sort({ publishAt: -1 })
      .limit(6);

    const clubObj = club.toObject();
    clubObj.memberCount = club.members?.length || 0;
    clubObj.pendingCount = isManager ? club.pendingMembers?.length || 0 : 0;
    clubObj.membershipStatus = memberEntry ? 'member' : pendingEntry ? 'pending' : 'none';
    clubObj.myRole = memberEntry ? memberEntry.role : null;
    clubObj.isManager = isManager;
    clubObj.events = linkedEvents;
    clubObj.announcements = linkedAnnouncements;

    // Privacy: non-managers do not receive full raw pending arrays
    if (!isManager && !isAdmin) {
      delete clubObj.pendingMembers;
      delete clubObj.members;
    }

    res.status(200).json({
      success: true,
      club: clubObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Propose / Create a Club (Faculty, Admin, or Student)
// @route   POST /api/clubs
// @access  Private
export const createClub = async (req, res, next) => {
  try {
    const {
      name,
      shortDescription,
      description,
      category,
      department,
      branch,
      facultyCoordinatorEmail,
      studentPresidentEmail,
      studentSecretaryEmail,
      contactEmail,
      contactPhone,
      socialLinks,
      logo,
      coverImage,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Club name is required.',
      });
    }

    if (!shortDescription || !shortDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Short summary is required.',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full club description is required.',
      });
    }

    // Check for duplicate club name
    const existing = await Club.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A club with name '${name.trim()}' already exists.`,
      });
    }

    // Look up leadership references if provided
    let facultyCoordId = null;
    if (facultyCoordinatorEmail) {
      const coord = await User.findOne({ email: facultyCoordinatorEmail.toLowerCase().trim() });
      if (coord) facultyCoordId = coord._id;
    } else if (req.user.role === 'FACULTY') {
      facultyCoordId = req.user._id;
    }

    let presidentId = null;
    if (studentPresidentEmail) {
      const pres = await User.findOne({ email: studentPresidentEmail.toLowerCase().trim() });
      if (pres) presidentId = pres._id;
    } else if (req.user.role === 'STUDENT') {
      presidentId = req.user._id;
    }

    let secretaryId = null;
    if (studentSecretaryEmail) {
      const sec = await User.findOne({ email: studentSecretaryEmail.toLowerCase().trim() });
      if (sec) secretaryId = sec._id;
    }

    // Admins create active clubs directly; Faculty & Students create pending clubs
    const initialStatus = req.user.role === 'ADMIN' ? 'active' : 'pending';

    const membersList = [
      {
        user: req.user._id,
        role: req.user.role === 'FACULTY' ? 'Faculty Coordinator' : 'President',
        joinedAt: new Date(),
      },
    ];

    const club = await Club.create({
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      category: category || 'Technical',
      department: department || 'College-Wide',
      branch: (branch || 'ALL').trim().toUpperCase(),
      facultyCoordinator: facultyCoordId,
      studentPresident: presidentId,
      studentSecretary: secretaryId,
      contactEmail: contactEmail ? contactEmail.toLowerCase().trim() : req.user.email,
      contactPhone: contactPhone ? contactPhone.trim() : '',
      socialLinks: socialLinks || { website: '', instagram: '', linkedin: '', github: '' },
      logo: logo && logo.trim() ? logo.trim() : undefined,
      coverImage: coverImage && coverImage.trim() ? coverImage.trim() : undefined,
      members: membersList,
      pendingMembers: [],
      status: initialStatus,
      createdBy: req.user._id,
    });

    const populatedClub = await Club.findById(club._id)
      .populate('facultyCoordinator', 'name email role department profileImage')
      .populate('studentPresident', 'name email role branch profileImage')
      .populate('createdBy', 'name email role profileImage');

    res.status(201).json({
      success: true,
      message:
        initialStatus === 'active'
          ? 'Club established and activated successfully!'
          : 'Club proposal submitted for administrative review & approval.',
      club: populatedClub,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Club Info (Manager or Admin)
// @route   PUT /api/clubs/:id
// @access  Private (Manager or Admin)
export const updateClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (!isClubManager(club, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this club.',
      });
    }

    const {
      name,
      shortDescription,
      description,
      category,
      department,
      branch,
      contactEmail,
      contactPhone,
      socialLinks,
      logo,
      coverImage,
    } = req.body;

    if (name && name.trim() !== club.name) {
      const duplicate = await Club.findOne({
        name: new RegExp(`^${name.trim()}$`, 'i'),
        _id: { $ne: club._id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `A club with name '${name.trim()}' already exists.`,
        });
      }
      club.name = name.trim();
    }

    if (shortDescription) club.shortDescription = shortDescription.trim();
    if (description) club.description = description.trim();
    if (category) club.category = category;
    if (department) club.department = department.trim();
    if (branch) club.branch = branch.trim().toUpperCase();
    if (contactEmail !== undefined) club.contactEmail = contactEmail.trim().toLowerCase();
    if (contactPhone !== undefined) club.contactPhone = contactPhone.trim();
    if (socialLinks) club.socialLinks = { ...club.socialLinks, ...socialLinks };
    if (logo) club.logo = logo.trim();
    if (coverImage) club.coverImage = coverImage.trim();

    await club.save();

    const updated = await Club.findById(club._id)
      .populate('facultyCoordinator', 'name email role department profileImage')
      .populate('studentPresident', 'name email role branch profileImage');

    res.status(200).json({
      success: true,
      message: 'Club updated successfully.',
      club: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Club (Admin or Creator)
// @route   DELETE /api/clubs/:id
// @access  Private (Admin or Creator)
export const deleteClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const isCreator = club.createdBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only college administration or the club creator can delete this charter.',
      });
    }

    await club.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Club charter removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MEMBERSHIP WORKFLOW CONTROLLERS
// ==========================================

// @desc    Submit membership request to join club
// @route   POST /api/clubs/:id/join
// @access  Private
export const joinClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (club.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot join an inactive or pending club.',
      });
    }

    const userIdStr = req.user._id.toString();

    // Check if already a member
    const alreadyMember = club.members.some((m) => m.user.toString() === userIdStr);
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already an active member of this club.',
      });
    }

    // Check if pending request exists
    const alreadyPending = club.pendingMembers.some((p) => p.user.toString() === userIdStr);
    if (alreadyPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending membership request for this club.',
      });
    }

    club.pendingMembers.push({
      user: req.user._id,
      statement: req.body.statement ? req.body.statement.trim() : 'Interested in participating in club activities.',
      requestedAt: new Date(),
    });

    await club.save();

    // Trigger notification to club managers (President or Coordinator)
    const managerRecipients = [
      club.studentPresident,
      club.facultyCoordinator,
      club.createdBy,
    ].filter(Boolean);

    for (const managerId of managerRecipients) {
      if (managerId.toString() !== req.user._id.toString()) {
        createNotification({
          recipient: managerId,
          type: 'club',
          title: `New Membership Application: ${club.name}`,
          message: `${req.user.name} (${req.user.branch || 'Student'}) applied to join ${club.name}.`,
          entityType: 'Club',
          entityId: club._id,
          priority: 'normal',
          metadata: {
            actionUrl: `/clubs/${club._id}`,
            status: 'pending_member',
          },
        }).catch((e) => console.error('Error notifying club manager:', e));
      }
    }

    res.status(200).json({
      success: true,
      message: 'Membership request submitted! The club leadership will review your application.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a club or withdraw pending request
// @route   POST /api/clubs/:id/leave
// @access  Private
export const leaveClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const userIdStr = req.user._id.toString();

    club.members = club.members.filter((m) => m.user.toString() !== userIdStr);
    club.pendingMembers = club.pendingMembers.filter((p) => p.user.toString() !== userIdStr);

    await club.save();

    res.status(200).json({
      success: true,
      message: 'You have left the club / withdrawn your membership request.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending membership requests (Manager / Admin)
// @route   GET /api/clubs/:id/pending-members
// @access  Private (Manager / Admin)
export const getPendingMembers = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id).populate({
      path: 'pendingMembers.user',
      select: 'name email branch year section rollNumber collegeId profileImage',
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (!isClubManager(club, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only club managers or administrators can review membership requests.',
      });
    }

    res.status(200).json({
      success: true,
      count: club.pendingMembers.length,
      pendingMembers: club.pendingMembers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full members roster (Manager / Admin)
// @route   GET /api/clubs/:id/members
// @access  Private (Manager / Admin)
export const getClubMembers = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id).populate({
      path: 'members.user',
      select: 'name email role branch year section rollNumber collegeId profileImage',
    });

    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (!isClubManager(club, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only club managers or administrators can view the full members management roster.',
      });
    }

    res.status(200).json({
      success: true,
      count: club.members.length,
      members: club.members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a pending membership request (Manager / Admin)
// @route   PUT /api/clubs/:id/approve-member/:userId
// @access  Private (Manager / Admin)
export const approveMember = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (!isClubManager(club, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve members for this club.',
      });
    }

    const { userId } = req.params;

    // Check if in pending
    const pendingIndex = club.pendingMembers.findIndex(
      (p) => p.user.toString() === userId.toString()
    );

    if (pendingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'No pending membership request found for this student.',
      });
    }

    // Remove from pending
    club.pendingMembers.splice(pendingIndex, 1);

    // Add to active members if not already
    const alreadyMember = club.members.some((m) => m.user.toString() === userId.toString());
    if (!alreadyMember) {
      club.members.push({
        user: userId,
        role: req.body.role || 'Member',
        joinedAt: new Date(),
      });
    }

    await club.save();

    // Trigger notification to the student
    await createNotification({
      recipient: userId,
      type: 'club',
      title: `Membership Approved: Welcome to ${club.name}!`,
      message: `Your application to join ${club.name} has been approved by the club leadership. You are now an active member.`,
      entityType: 'Club',
      entityId: club._id,
      priority: 'important',
      metadata: {
        actionUrl: `/clubs/${club._id}`,
        status: 'approved',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Student approved as active club member.',
      memberCount: club.members.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a pending membership request (Manager / Admin)
// @route   PUT /api/clubs/:id/reject-member/:userId
// @access  Private (Manager / Admin)
export const rejectMember = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (!isClubManager(club, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject members for this club.',
      });
    }

    const { userId } = req.params;
    club.pendingMembers = club.pendingMembers.filter((p) => p.user.toString() !== userId.toString());
    await club.save();

    // Trigger notification to the student
    await createNotification({
      recipient: userId,
      type: 'club',
      title: `Membership Update: ${club.name}`,
      message: `Your application to join ${club.name} was not accepted at this time.`,
      entityType: 'Club',
      entityId: club._id,
      priority: 'normal',
      metadata: {
        actionUrl: `/clubs/${club._id}`,
        status: 'rejected',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Membership request rejected.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove an active member from club (Manager / Admin)
// @route   DELETE /api/clubs/:id/members/:userId
// @access  Private (Manager / Admin)
export const removeMember = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    if (!isClubManager(club, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove members from this club.',
      });
    }

    const { userId } = req.params;
    club.members = club.members.filter((m) => m.user.toString() !== userId.toString());
    await club.save();

    res.status(200).json({
      success: true,
      message: 'Member removed from club roster.',
      memberCount: club.members.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's joined clubs, pending requests, and managed clubs
// @route   GET /api/clubs/my-clubs
// @access  Private
export const getMyClubs = async (req, res, next) => {
  try {
    const userIdStr = req.user._id.toString();

    // 1. Joined clubs
    const joinedClubs = await Club.find({
      'members.user': req.user._id,
      status: 'active',
    })
      .populate('facultyCoordinator', 'name email profileImage')
      .populate('studentPresident', 'name email profileImage');

    const formattedJoined = joinedClubs.map((club) => {
      const clubObj = club.toObject();
      const myEntry = club.members.find((m) => m.user.toString() === userIdStr);
      clubObj.myRole = myEntry ? myEntry.role : 'Member';
      clubObj.joinedAt = myEntry ? myEntry.joinedAt : club.createdAt;
      clubObj.memberCount = club.members.length;
      clubObj.isManager = isClubManager(club, req.user);
      delete clubObj.members;
      delete clubObj.pendingMembers;
      return clubObj;
    });

    // 2. Pending requests
    const pendingClubs = await Club.find({
      'pendingMembers.user': req.user._id,
    });

    const formattedPending = pendingClubs.map((club) => {
      const clubObj = club.toObject();
      const pEntry = club.pendingMembers.find((p) => p.user.toString() === userIdStr);
      clubObj.requestedAt = pEntry ? pEntry.requestedAt : club.createdAt;
      clubObj.statement = pEntry ? pEntry.statement : '';
      clubObj.memberCount = club.members.length;
      delete clubObj.members;
      delete clubObj.pendingMembers;
      return clubObj;
    });

    // 3. Clubs managed by user
    const managedClubs = await Club.find({
      $or: [
        { createdBy: req.user._id },
        { facultyCoordinator: req.user._id },
        { studentPresident: req.user._id },
        { studentSecretary: req.user._id },
      ],
    });

    const formattedManaged = managedClubs.map((club) => {
      const clubObj = club.toObject();
      clubObj.memberCount = club.members.length;
      clubObj.pendingCount = club.pendingMembers.length;
      delete clubObj.members;
      delete clubObj.pendingMembers;
      return clubObj;
    });

    res.status(200).json({
      success: true,
      joinedClubs: formattedJoined,
      pendingClubs: formattedPending,
      managedClubs: formattedManaged,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN MODERATION CONTROLLERS
// ==========================================

// @desc    Get all clubs for admin dashboard (all statuses)
// @route   GET /api/clubs/admin/all
// @access  Private/Admin
export const getAdminAllClubs = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { shortDescription: searchRegex }, { department: searchRegex }];
    }

    const clubs = await Club.find(query)
      .populate('facultyCoordinator', 'name email role department profileImage')
      .populate('studentPresident', 'name email role branch profileImage')
      .populate('createdBy', 'name email role department branch profileImage')
      .sort({ createdAt: -1 });

    const allClubs = await Club.find();
    let totalMemberships = 0;
    allClubs.forEach((c) => {
      totalMemberships += c.members?.length || 0;
    });

    const counts = {
      all: await Club.countDocuments(),
      active: await Club.countDocuments({ status: 'active' }),
      pending: await Club.countDocuments({ status: 'pending' }),
      rejected: await Club.countDocuments({ status: 'rejected' }),
      inactive: await Club.countDocuments({ status: 'inactive' }),
      totalMemberships,
    };

    const formatted = clubs.map((c) => {
      const cObj = c.toObject();
      cObj.memberCount = c.members?.length || 0;
      cObj.pendingCount = c.pendingMembers?.length || 0;
      return cObj;
    });

    res.status(200).json({
      success: true,
      counts,
      count: formatted.length,
      clubs: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve Club proposal (Admin only)
// @route   PUT /api/clubs/:id/approve
// @access  Private/Admin
export const approveClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    club.status = 'active';
    club.rejectionReason = '';
    await club.save();

    // Trigger notification to club creator
    if (club.createdBy) {
      await createNotification({
        recipient: club.createdBy,
        type: 'club',
        title: `Club Charter Approved: ${club.name}`,
        message: `College administration has approved the charter for "${club.name}". The club is now officially active in the directory.`,
        entityType: 'Club',
        entityId: club._id,
        priority: 'urgent',
        metadata: {
          actionUrl: `/clubs/${club._id}`,
          status: 'active',
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Club '${club.name}' approved and activated!`,
      club,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject Club proposal (Admin only)
// @route   PUT /api/clubs/:id/reject
// @access  Private/Admin
export const rejectClub = async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found',
      });
    }

    const reason =
      req.body.rejectionReason ||
      'Club charter proposal was not approved by college administration.';

    club.status = 'rejected';
    club.rejectionReason = reason;
    await club.save();

    // Trigger notification to club creator
    if (club.createdBy) {
      await createNotification({
        recipient: club.createdBy,
        type: 'club',
        title: `Club Charter Proposal Update: ${club.name}`,
        message: `Your charter proposal for "${club.name}" was not approved. Reason: ${reason}`,
        entityType: 'Club',
        entityId: club._id,
        priority: 'normal',
        metadata: {
          actionUrl: `/clubs/my-clubs`,
          status: 'rejected',
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Club '${club.name}' marked as rejected.`,
      club,
    });
  } catch (error) {
    next(error);
  }
};
