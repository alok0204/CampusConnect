// Automated Test Suite for Phase 5: Clubs & Student Organizations Module

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

const runClubTests = async () => {
  console.log('🧪 Starting Phase 5: Clubs & Student Organizations API Verification...\n');

  try {
    // 1. Authenticate users
    console.log('1. Authenticating test users (Admin, Faculty, Student A - Anshul, Student B - Rohit)...');
    const admin = await loginUser('admin@campus.edu', 'Admin@123');
    const faculty = await loginUser('dr.sharma@campus.edu', 'Faculty@123');
    const studentA = await loginUser('anshul.cse@campus.edu', 'Student@123');
    const studentB = await loginUser('rohit.ece@campus.edu', 'Student@123');
    console.log('✅ All 4 test roles authenticated successfully.');

    // 2. Test GET /api/clubs (Public active clubs feed)
    console.log('\n2. Testing GET /api/clubs (Active clubs listing)...');
    const clubsRes = await fetch(`${BASE_URL}/clubs`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const clubsData = await clubsRes.json();
    if (!clubsData.success) throw new Error(clubsData.message);
    console.log(`✅ Retrieved ${clubsData.count} active clubs.`);

    const gdscClub = clubsData.clubs.find((c) => c.name.includes('GDSC') || c.name.includes('Google Developer'));
    if (!gdscClub) throw new Error('❌ Default GDSC club not found in active listings!');
    console.log(`✅ Found GDSC Club (ID: ${gdscClub._id}, Members: ${gdscClub.memberCount}).`);

    // 3. Test Filters (Category, Branch, Search)
    console.log('\n3. Testing Club Filters & Keyword Search...');
    const catRes = await fetch(`${BASE_URL}/clubs?category=Technical`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const catData = await catRes.json();
    if (!catData.success || catData.clubs.some((c) => c.category !== 'Technical')) {
      throw new Error('❌ Category filter failed!');
    }
    console.log(`✅ Category filter 'Technical' passed (${catData.count} clubs).`);

    const searchRes = await fetch(`${BASE_URL}/clubs?search=Robotics`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const searchData = await searchRes.json();
    if (!searchData.success || searchData.count === 0) {
      throw new Error('❌ Keyword search for "Robotics" failed!');
    }
    console.log(`✅ Search for "Robotics" passed (${searchData.count} match found).`);

    // 4. Test Student Club Proposal (Creation with status: 'pending')
    console.log('\n4. Testing Student Club Creation (Should be pending admin approval)...');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newClubName = `Cyber Security & Ethical Hacking Guild ${randomSuffix}`;
    const createClubRes = await fetch(`${BASE_URL}/clubs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        name: newClubName,
        shortDescription: 'Student security researchers practicing CTFs, penetration testing, and defensive engineering.',
        description: 'A student-led organization focusing on information security fundamentals, vulnerability analysis, capture the flag challenges, and cybersecurity awareness across campus.',
        category: 'Technical',
        department: 'Computer Science & Engineering',
        branch: 'CSE',
        contactEmail: `cyber${randomSuffix}@campus.edu`,
      }),
    });
    const createClubData = await createClubRes.json();
    if (!createClubData.success) throw new Error(createClubData.message);
    const createdClubId = createClubData.club._id;
    if (createClubData.club.status !== 'pending') {
      throw new Error(`❌ Expected initial status 'pending', got '${createClubData.club.status}'`);
    }
    console.log(`✅ Student submitted club proposal (ID: ${createdClubId}, Status: 'pending').`);

    // 5. Verify Pending Club is hidden from public feed
    const verifyPublicFeed = await fetch(`${BASE_URL}/clubs`, {
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    const verifyPublicData = await verifyPublicFeed.json();
    const isLeaked = verifyPublicData.clubs.some((c) => c._id === createdClubId);
    if (isLeaked) {
      throw new Error('❌ Pending club proposal leaked into active public clubs feed!');
    }
    console.log('✅ Pending club proposal is strictly hidden from general public feed.');

    // 6. Admin Approves Club
    console.log('\n6. Testing Admin Club Approval (PUT /api/clubs/:id/approve)...');
    const approveRes = await fetch(`${BASE_URL}/clubs/${createdClubId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const approveData = await approveRes.json();
    if (!approveData.success) throw new Error(approveData.message);
    if (approveData.club.status !== 'active') {
      throw new Error(`❌ Expected status 'active' after approval, got '${approveData.club.status}'`);
    }
    console.log(`✅ Admin approved club '${newClubName}'.`);

    // 7. Verify Club is now visible in public feed
    const recheckPublicFeed = await fetch(`${BASE_URL}/clubs`, {
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    const recheckPublicData = await recheckPublicFeed.json();
    const isNowVisible = recheckPublicData.clubs.some((c) => c._id === createdClubId);
    if (!isNowVisible) {
      throw new Error('❌ Approved club not appearing in public active feed!');
    }
    console.log('✅ Approved club is now publicly discoverable.');

    // 8. Test Membership Join Flow (Student B requests to join GDSC)
    console.log('\n8. Testing Membership Join Request (Student B requests to join GDSC)...');
    // Ensure clean state: leave if already joined in previous run
    await fetch(`${BASE_URL}/clubs/${gdscClub._id}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentB.token}` },
    }).catch(() => {});

    const joinRes = await fetch(`${BASE_URL}/clubs/${gdscClub._id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({
        statement: 'I want to contribute to the GDSC frontend workshops and mobile development study jams.',
      }),
    });
    const joinData = await joinRes.json();
    if (!joinData.success) throw new Error(joinData.message);
    console.log('✅ Membership join request submitted successfully.');

    // Test Duplicate Join Prevention
    const duplicateJoinRes = await fetch(`${BASE_URL}/clubs/${gdscClub._id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({ statement: 'Duplicate attempt' }),
    });
    if (duplicateJoinRes.status !== 400) {
      throw new Error(`❌ Expected 400 Bad Request for duplicate join, got ${duplicateJoinRes.status}`);
    }
    console.log('✅ Duplicate join request blocked correctly (400 Bad Request).');

    // 9. Club Manager Reviews Pending Members (Student A is President of GDSC)
    console.log('\n9. Testing Club Manager Reviewing Pending Requests (/clubs/:id/pending-members)...');
    const pendingRes = await fetch(`${BASE_URL}/clubs/${gdscClub._id}/pending-members`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const pendingData = await pendingRes.json();
    if (!pendingData.success) throw new Error(pendingData.message);
    const hasStudentBReq = pendingData.pendingMembers.some(
      (p) => p.user._id === studentB.user._id || p.user.email === studentB.user.email
    );
    if (!hasStudentBReq) {
      throw new Error('❌ Pending join request from Student B not found in manager review!');
    }
    console.log(`✅ GDSC President retrieved ${pendingData.count} pending join requests.`);

    // Test Security: Non-manager student trying to access pending-members
    const unauthorizedPendingRes = await fetch(`${BASE_URL}/clubs/${gdscClub._id}/pending-members`, {
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    if (unauthorizedPendingRes.status !== 403) {
      throw new Error(`❌ Expected 403 Forbidden for non-manager member list, got ${unauthorizedPendingRes.status}`);
    }
    console.log('✅ Unauthorized student access to pending members correctly blocked (403 Forbidden).');

    // 10. Club Manager Approves Member (Student A approves Student B)
    console.log('\n10. Testing Member Approval (PUT /api/clubs/:id/approve-member/:userId)...');
    const approveMemberRes = await fetch(`${BASE_URL}/clubs/${gdscClub._id}/approve-member/${studentB.user._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({ role: 'Member' }),
    });
    const approveMemberData = await approveMemberRes.json();
    if (!approveMemberData.success) throw new Error(approveMemberData.message);
    console.log(`✅ Student B approved as active member! New member count: ${approveMemberData.memberCount}`);

    // 11. Test /api/clubs/my-clubs for Student B
    console.log('\n11. Testing GET /api/clubs/my-clubs for Student B...');
    const myClubsRes = await fetch(`${BASE_URL}/clubs/my-clubs`, {
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    const myClubsData = await myClubsRes.json();
    if (!myClubsData.success) throw new Error(myClubsData.message);
    const isMemberOfGdsc = myClubsData.joinedClubs.some((c) => c._id === gdscClub._id);
    if (!isMemberOfGdsc) {
      throw new Error('❌ Student B did not see GDSC in joined clubs!');
    }
    console.log(`✅ Student B verified as active member in My Clubs (${myClubsData.joinedClubs.length} joined).`);

    // 12. Test Leaving Club (Student B leaves GDSC)
    console.log('\n12. Testing Member Leaving Club (POST /api/clubs/:id/leave)...');
    const leaveRes = await fetch(`${BASE_URL}/clubs/${gdscClub._id}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    const leaveData = await leaveRes.json();
    if (!leaveData.success) throw new Error(leaveData.message);
    console.log('✅ Student B successfully left the club.');

    // 13. Test Admin Overview (/api/clubs/admin/all)
    console.log('\n13. Testing Admin Clubs Overview (/api/clubs/admin/all)...');
    const adminClubsRes = await fetch(`${BASE_URL}/clubs/admin/all`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const adminClubsData = await adminClubsRes.json();
    if (!adminClubsData.success) throw new Error(adminClubsData.message);
    console.log(
      `✅ Admin retrieved ${adminClubsData.count} clubs (Active: ${adminClubsData.counts.active}, Total Memberships: ${adminClubsData.counts.totalMemberships}).`
    );

    console.log('\n🎉 ALL PHASE 5 CLUBS & STUDENT ORGANIZATIONS TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Clubs test failed:', error.message);
    process.exit(1);
  }
};

runClubTests();
