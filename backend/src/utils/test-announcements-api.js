// Automated Test Suite for Phase 4: Announcements & Official Circulars Module

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

const runAnnouncementTests = async () => {
  console.log('🧪 Starting Phase 4: Announcements Module API Verification...\n');

  try {
    // 1. Authenticate users
    console.log('1. Authenticating test users (Admin, Faculty, CSE Student, ECE Student)...');
    const admin = await loginUser('admin@campus.edu', 'Admin@123');
    const faculty = await loginUser('dr.sharma@campus.edu', 'Faculty@123');
    const cseStudent = await loginUser('anshul.cse@campus.edu', 'Student@123');
    const eceStudent = await loginUser('rohit.ece@campus.edu', 'Student@123');
    console.log('✅ All 4 test roles authenticated successfully.');

    // 2. Test Audience Isolation: CSE Student Feed vs ECE Student Feed
    console.log('\n2. Testing Backend Audience Filtering for CSE Student...');
    const cseRes = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${cseStudent.token}` },
    });
    const cseData = await cseRes.json();
    if (!cseData.success) throw new Error(cseData.message);

    // Ensure NO ECE-exclusive announcements leaked to CSE student
    const hasEceLeak = cseData.announcements.some(
      (a) => a.audience === 'branch' && a.branch === 'ECE'
    );
    if (hasEceLeak) {
      throw new Error('❌ SECURITY LEAK: ECE department circular leaked into CSE student feed!');
    }
    console.log(`✅ CSE student feed correctly isolated (${cseData.count} visible circulars, 0 ECE leaks).`);

    console.log('\n3. Testing Backend Audience Filtering for ECE Student...');
    const eceRes = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${eceStudent.token}` },
    });
    const eceData = await eceRes.json();
    if (!eceData.success) throw new Error(eceData.message);

    // Ensure NO CSE-exclusive announcements leaked to ECE student
    const hasCseLeak = eceData.announcements.some(
      (a) =>
        (a.audience === 'branch' && a.branch === 'CSE') ||
        (a.audience === 'section' && a.branch === 'CSE' && a.section === cseStudent.user.section)
    );
    if (hasCseLeak) {
      throw new Error('❌ SECURITY LEAK: CSE circular leaked into ECE student feed!');
    }
    console.log(`✅ ECE student feed correctly isolated (${eceData.count} visible circulars, 0 CSE leaks).`);

    // 4. Test RBAC Security: Student attempting to publish announcement
    console.log('\n4. Testing RBAC Security: Student attempting POST /api/announcements...');
    const studentCreateRes = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cseStudent.token}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Student Notice',
        content: 'This should be blocked.',
      }),
    });
    if (studentCreateRes.status !== 403) {
      throw new Error(`❌ Expected 403 Forbidden for student creation, got ${studentCreateRes.status}`);
    }
    console.log('✅ Student publishing correctly blocked (403 Forbidden).');

    // 5. Faculty creates targeted circular (Targeted specifically to CSE student's section)
    const targetSection = cseStudent.user.section || 'A';
    console.log(`\n5. Testing Faculty Announcement Creation (Targeted to CSE 2nd Year Sec ${targetSection})...`);
    const facultyCreateRes = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${faculty.token}`,
      },
      body: JSON.stringify({
        title: `CSE 2nd Year Sec ${targetSection}: Operating Systems Lab Assignment 3`,
        content: 'Submit OS multi-threading source code and performance benchmarks by Friday 5 PM.',
        category: 'academic',
        priority: 'important',
        audience: 'section',
        branch: 'CSE',
        year: '2nd Year',
        section: targetSection,
      }),
    });
    const facultyCreateData = await facultyCreateRes.json();
    if (!facultyCreateData.success) throw new Error(facultyCreateData.message);
    const newAnnId = facultyCreateData.announcement._id;
    console.log(`✅ Faculty created targeted announcement with ID: ${newAnnId}`);

    // Verify Section student can see it, but ECE Student cannot
    const verifyCseFeed = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${cseStudent.token}` },
    });
    const verifyCseData = await verifyCseFeed.json();
    const cseSeesIt = verifyCseData.announcements.some((a) => a._id === newAnnId);
    if (!cseSeesIt) throw new Error('❌ Targeted student could not see section-specific circular!');
    console.log(`✅ Targeted Section ${targetSection} student confirmed seeing the announcement.`);

    const verifyEceFeed = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${eceStudent.token}` },
    });
    const verifyEceData = await verifyEceFeed.json();
    const eceSeesIt = verifyEceData.announcements.some((a) => a._id === newAnnId);
    if (eceSeesIt) throw new Error('❌ ECE student was able to see CSE section announcement!');
    console.log('✅ Verified: Non-targeted students cannot see section-specific circulars.');

    // 6. Test Scheduling
    console.log('\n6. Testing Announcement Scheduling (Future publishAt)...');
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days in future
    const schedRes = await fetch(`${BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({
        title: 'Scheduled Next Week Campus Blood Donation Drive',
        content: 'Registration will open next week.',
        category: 'event',
        priority: 'normal',
        audience: 'all',
        publishAt: futureDate.toISOString(),
      }),
    });
    const schedData = await schedRes.json();
    if (!schedData.success) throw new Error(schedData.message);
    const schedId = schedData.announcement._id;
    if (schedData.announcement.status !== 'scheduled') {
      throw new Error(`❌ Expected status 'scheduled', got '${schedData.announcement.status}'`);
    }
    console.log(`✅ Announcement successfully created with status: 'scheduled'.`);

    // Verify scheduled announcement is hidden from student feed
    const checkSchedInFeed = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${cseStudent.token}` },
    });
    const checkSchedData = await checkSchedInFeed.json();
    const schedVisibleToStudent = checkSchedData.announcements.some((a) => a._id === schedId);
    if (schedVisibleToStudent) {
      throw new Error('❌ Scheduled announcement leaked to student before publication date!');
    }
    console.log('✅ Scheduled announcement is strictly hidden from active feeds.');

    // 7. Test Read / Unread Tracking
    console.log('\n7. Testing Read/Unread Tracking...');
    // Single read
    const markReadRes = await fetch(`${BASE_URL}/announcements/${newAnnId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${cseStudent.token}` },
    });
    const markReadData = await markReadRes.json();
    if (!markReadData.success) throw new Error(markReadData.message);
    console.log('✅ Single circular marked as read.');

    // Bulk Mark All Read
    const markAllRes = await fetch(`${BASE_URL}/announcements/mark-all-read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${cseStudent.token}` },
    });
    const markAllData = await markAllRes.json();
    if (!markAllData.success) throw new Error(markAllData.message);

    const recheckCseFeed = await fetch(`${BASE_URL}/announcements`, {
      headers: { Authorization: `Bearer ${cseStudent.token}` },
    });
    const recheckCseData = await recheckCseFeed.json();
    if (recheckCseData.unreadCount !== 0) {
      throw new Error(`❌ Expected unreadCount 0 after mark-all-read, got ${recheckCseData.unreadCount}`);
    }
    console.log('✅ Mark all as read verified: unreadCount is 0.');

    // 8. Test Admin Management Overview
    console.log('\n8. Testing Admin Announcement Overview (/api/announcements/admin/all)...');
    const adminOverviewRes = await fetch(`${BASE_URL}/announcements/admin/all`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const adminOverviewData = await adminOverviewRes.json();
    if (!adminOverviewData.success) throw new Error(adminOverviewData.message);
    console.log(
      `✅ Admin retrieved ${adminOverviewData.count} circulars (Published: ${adminOverviewData.counts.published}, Scheduled: ${adminOverviewData.counts.scheduled}).`
    );

    console.log('\n🎉 ALL PHASE 4 ANNOUNCEMENTS BACKEND TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Announcement test failed:', error.message);
    process.exit(1);
  }
};

runAnnouncementTests();
