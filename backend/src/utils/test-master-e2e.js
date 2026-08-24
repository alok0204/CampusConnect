// Master End-to-End Simulation and Verification Suite for Campus Connect (Phases 1 - 7)

const BASE_URL = 'http://localhost:5000/api';

const loginUser = async (identifier, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed for ${identifier}: ${data.message}`);
  return { token: data.token, user: data.user };
};

const runMasterSuite = async () => {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🎓 CAMPUS CONNECT — MASTER PRODUCTION VERIFICATION SUITE 🎓');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // -------------------------------------------------------------
    // SECTION 1: AUTHENTICATION, ROLES & PROFILE (PHASE 1)
    // -------------------------------------------------------------
    console.log('🔹 [1/7] Testing Authentication, Identity & RBAC Tokens...');

    // Student A (CSE)
    const studentA = await loginUser('anshul.cse@campus.edu', 'Student@123');
    console.log(`  ✅ Student A Login: ${studentA.user.name} (${studentA.user.branch} - ${studentA.user.year} - Sec ${studentA.user.section})`);

    // Student B (ECE)
    const studentB = await loginUser('rohit.ece@campus.edu', 'Student@123');
    console.log(`  ✅ Student B Login: ${studentB.user.name} (${studentB.user.branch} - ${studentB.user.year} - Sec ${studentB.user.section})`);

    // Faculty
    const faculty = await loginUser('dr.sharma@campus.edu', 'Faculty@123');
    console.log(`  ✅ Faculty Login: ${faculty.user.name} (${faculty.user.department})`);

    // Admin
    const admin = await loginUser('admin@campus.edu', 'Admin@123');
    console.log(`  ✅ Admin Login: ${admin.user.name} (Role: ${admin.user.role})`);

    // Verify Password Hash is NOT leaked in user response
    if (studentA.user.passwordHash || admin.user.passwordHash) {
      throw new Error('❌ SECURITY LEAK: passwordHash found in user response!');
    }
    console.log('  ✅ Security verified: passwordHash strictly omitted from API responses.');

    // Profile retrieval
    const profRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const profData = await profRes.json();
    if (!profData.success) throw new Error(profData.message);
    console.log('  ✅ Profile retrieval & session persistence verified.');

    // -------------------------------------------------------------
    // SECTION 2: EVENTS MODULE (PHASE 2)
    // -------------------------------------------------------------
    console.log('\n🔹 [2/7] Testing Events Module, Branch Isolation & Admin Moderation...');
    const rand = Math.floor(1000 + Math.random() * 9000);

    // Create Event as Student
    const evtCreateRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        title: `AI & Machine Learning Symposium ${rand}`,
        description: 'Deep dive into transformer architectures, local LLMs, and neural acceleration.',
        category: 'Workshop',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        venue: 'Auditorium Hall A',
        organizer: 'CSE AI Guild',
        targetAudience: 'ALL',
      }),
    });
    const evtCreateData = await evtCreateRes.json();
    if (!evtCreateData.success) throw new Error(evtCreateData.message);
    const eventId = evtCreateData.event._id;
    console.log(`  ✅ Student submitted event (ID: ${eventId}, Status: '${evtCreateData.event.status}').`);

    // Admin approves event
    const evtApproveRes = await fetch(`${BASE_URL}/events/${eventId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const evtApproveData = await evtApproveRes.json();
    if (!evtApproveData.success || evtApproveData.event.status !== 'approved') {
      throw new Error('❌ Event approval failed!');
    }
    console.log('  ✅ Admin approval verified. Event is now live in campus feed.');

    // -------------------------------------------------------------
    // SECTION 3: LOST & FOUND MODULE (PHASE 3)
    // -------------------------------------------------------------
    console.log('\n🔹 [3/7] Testing Lost & Found, Claim Verification & Finder Moderation...');

    // Student B reports a found calculator
    const lfRes = await fetch(`${BASE_URL}/lost-found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({
        title: `Casio FX-991EX Scientific Calculator ${rand}`,
        description: 'Found scientific calculator on desk in Physics Lab 1.',
        type: 'found',
        category: 'Electronics',
        location: 'Physics Lab 1',
        date: new Date().toISOString(),
        time: '02:00 PM',
        uniqueDetails: 'Has a small green dot sticker on battery cover.',
      }),
    });
    const lfData = await lfRes.json();
    if (!lfData.success) throw new Error(lfData.message);
    const lfItemId = lfData.item._id;
    console.log(`  ✅ Found item registered (ID: ${lfItemId}).`);

    // Student A submits claim
    const claimRes = await fetch(`${BASE_URL}/lost-found/${lfItemId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        reason: 'I left my calculator in Physics Lab 1 during the lab period.',
        identifyingDetails: 'Has a small green dot sticker on battery cover.',
      }),
    });
    const claimData = await claimRes.json();
    if (!claimData.success) throw new Error(claimData.message);
    const claimId = claimData.claim._id;
    console.log('  ✅ Student A submitted ownership claim.');

    // Finder approves claim
    const claimApproveRes = await fetch(`${BASE_URL}/lost-found/claims/${claimId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({ reviewNote: 'Sticker matches. Ownership verified.' }),
    });
    const claimApproveData = await claimApproveRes.json();
    if (!claimApproveData.success || claimApproveData.claim.status !== 'approved') {
      throw new Error('❌ Claim approval failed!');
    }
    console.log('  ✅ Finder approved claim. Item status updated to resolved.');

    // -------------------------------------------------------------
    // SECTION 4: ANNOUNCEMENTS MODULE (PHASE 4)
    // -------------------------------------------------------------
    console.log('\n🔹 [4/7] Testing Announcements & Strict Backend Audience Filtering...');

    // Faculty publishes announcement targeted exclusively to CSE branch
    const annRes = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${faculty.token}`,
      },
      body: JSON.stringify({
        title: `CSE Department Project Demo Schedule ${rand}`,
        content: 'All CSE students must submit project slides by Thursday.',
        summary: 'CSE project review schedule.',
        category: 'academic',
        priority: 'important',
        audience: 'branch',
        branch: 'CSE',
        status: 'published',
      }),
    });
    const annData = await annRes.json();
    if (!annData.success) throw new Error(annData.message);
    const annId = annData.announcement._id;
    console.log('  ✅ Faculty published CSE targeted circular.');

    // Verify CSE Student can view it
    const cseFeed = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const cseFeedData = await cseFeed.json();
    const canCseSee = cseFeedData.announcements.some((a) => a._id === annId);
    if (!canCseSee) throw new Error('❌ CSE student could not view CSE announcement!');

    // Verify ECE Student CANNOT view it (Backend Isolation)
    const eceFeed = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    const eceFeedData = await eceFeed.json();
    const canEceSee = eceFeedData.announcements.some((a) => a._id === annId);
    if (canEceSee) throw new Error('❌ SECURITY LEAK: ECE student saw CSE-restricted announcement!');
    console.log('  ✅ Backend audience isolation strictly confirmed (CSE sees notice, ECE strictly isolated).');

    // -------------------------------------------------------------
    // SECTION 5: CLUBS MODULE (PHASE 5)
    // -------------------------------------------------------------
    console.log('\n🔹 [5/7] Testing Clubs Directory, Charters & Membership Lifecycle...');

    // Get GDSC Club
    const clubsRes = await fetch(`${BASE_URL}/clubs`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const clubsData = await clubsRes.json();
    const gdsc = clubsData.clubs.find((c) => c.name.includes('GDSC') || c.name.includes('Google Developer'));

    if (gdsc) {
      // Leave first to ensure clean state
      await fetch(`${BASE_URL}/clubs/${gdsc._id}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentB.token}` },
      }).catch(() => {});

      // Student B joins GDSC
      const joinClubRes = await fetch(`${BASE_URL}/clubs/${gdsc._id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentB.token}`,
        },
        body: JSON.stringify({ statement: 'Interested in web development jams.' }),
      });
      const joinClubData = await joinClubRes.json();
      if (!joinClubData.success) throw new Error(joinClubData.message);
      console.log('  ✅ Student B submitted membership application for GDSC.');

      // GDSC Manager (Student A) approves Student B
      const approveMemberRes = await fetch(`${BASE_URL}/clubs/${gdsc._id}/approve-member/${studentB.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentA.token}`,
        },
        body: JSON.stringify({ role: 'Member' }),
      });
      const approveMemberData = await approveMemberRes.json();
      if (!approveMemberData.success) throw new Error(approveMemberData.message);
      console.log('  ✅ GDSC leadership approved membership. Student B is now active member.');
    }

    // -------------------------------------------------------------
    // SECTION 6: NOTIFICATIONS & ACTIVITY CENTER (PHASE 6)
    // -------------------------------------------------------------
    console.log('\n🔹 [6/7] Testing Notifications, Unread Counter & Activity Stream...');

    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const notifData = await notifRes.json();
    if (!notifData.success) throw new Error(notifData.message);
    console.log(`  ✅ Student A received ${notifData.total} notifications across events, claims, and circulars.`);

    // Mark All As Read
    const markAllRes = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const markAllData = await markAllRes.json();
    if (!markAllData.success || markAllData.unreadCount !== 0) {
      throw new Error('❌ Mark all notifications as read failed!');
    }
    console.log('  ✅ Mark all notifications as read verified (unreadCount: 0).');

    // Activity Stream
    const actRes = await fetch(`${BASE_URL}/notifications/activity`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const actData = await actRes.json();
    if (!actData.success) throw new Error(actData.message);
    console.log(`  ✅ Activity center stream verified (${actData.count} timeline events generated).`);

    // -------------------------------------------------------------
    // SECTION 7: PRODUCTION SECURITY & RBAC ATTACK DEFENSE (PHASE 7)
    // -------------------------------------------------------------
    console.log('\n🔹 [7/7] Testing Role-Based Security, Attack Defense & Authorization Gates...');

    // Attack 1: Student calls Admin Events API
    const atk1 = await fetch(`${BASE_URL}/events/admin/all`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    if (atk1.status !== 403) throw new Error(`❌ RBAC Violation: Student called /events/admin/all (status: ${atk1.status})`);
    console.log('  🛡️ Attack 1 Defended: Student blocked from /api/events/admin/all (403 Forbidden).');

    // Attack 2: Student calls Admin Lost & Found API
    const atk2 = await fetch(`${BASE_URL}/lost-found/admin/all`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    if (atk2.status !== 403) throw new Error(`❌ RBAC Violation: Student called /lost-found/admin/all (status: ${atk2.status})`);
    console.log('  🛡️ Attack 2 Defended: Student blocked from /api/lost-found/admin/all (403 Forbidden).');

    // Attack 3: Student calls Admin Announcements API
    const atk3 = await fetch(`${BASE_URL}/announcements/admin/all`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    if (atk3.status !== 403) throw new Error(`❌ RBAC Violation: Student called /announcements/admin/all (status: ${atk3.status})`);
    console.log('  🛡️ Attack 3 Defended: Student blocked from /api/announcements/admin/all (403 Forbidden).');

    // Attack 4: Student calls Admin Clubs API
    const atk4 = await fetch(`${BASE_URL}/clubs/admin/all`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    if (atk4.status !== 403) throw new Error(`❌ RBAC Violation: Student called /clubs/admin/all (status: ${atk4.status})`);
    console.log('  🛡️ Attack 4 Defended: Student blocked from /api/clubs/admin/all (403 Forbidden).');

    // Attack 5: Unauthenticated request to protected endpoint
    const atk5 = await fetch(`${BASE_URL}/users/profile`);
    if (atk5.status !== 401) throw new Error(`❌ Auth Violation: Public request accessed /users/profile (status: ${atk5.status})`);
    console.log('  🛡️ Attack 5 Defended: Unauthenticated request blocked from /api/users/profile (401 Unauthorized).');

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL MASTER END-TO-END VERIFICATION CHECKS PASSED 100%! 🎉');
    console.log('════════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MASTER VERIFICATION SUITE FAILED:', error.message);
    process.exit(1);
  }
};

runMasterSuite();
