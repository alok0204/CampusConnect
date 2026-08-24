// Comprehensive automated test suite for Phase 2: Events Module

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

const runEventTests = async () => {
  console.log('🧪 Starting Phase 2: Events Module API Verification...\n');

  try {
    // 1. Authenticate test users
    console.log('1. Authenticating test users (Admin, CSE Student, ECE Student)...');
    const admin = await loginUser('admin@campus.edu', 'Admin@123');
    const studentCSE = await loginUser('anshul.cse@campus.edu', 'Student@123');
    const studentECE = await loginUser('rohit.ece@campus.edu', 'Student@123');
    console.log('✅ Users authenticated successfully.');

    // 2. Branch Access Control: CSE Student feed
    console.log('\n2. Testing Branch Access Control for CSE Student...');
    const cseEventsRes = await fetch(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${studentCSE.token}` },
    });
    const cseEventsData = await cseEventsRes.json();
    if (!cseEventsData.success) throw new Error(cseEventsData.message);

    const cseHasEceEvent = cseEventsData.events.some((e) => e.branch === 'ECE');
    const cseHasCseEvent = cseEventsData.events.some((e) => e.branch === 'CSE');
    const cseHasAllEvent = cseEventsData.events.some((e) => e.branch === 'ALL');

    if (cseHasEceEvent) throw new Error('❌ SECURITY LEAK: CSE student received ECE-restricted event!');
    if (!cseHasCseEvent) throw new Error('❌ CSE student did not receive CSE event.');
    if (!cseHasAllEvent) throw new Error('❌ CSE student did not receive ALL/Common event.');
    console.log(`✅ CSE student feed correctly filtered (${cseEventsData.events.length} visible events, no ECE events leaked).`);

    // 3. Branch Access Control: ECE Student feed
    console.log('\n3. Testing Branch Access Control for ECE Student...');
    const eceEventsRes = await fetch(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${studentECE.token}` },
    });
    const eceEventsData = await eceEventsRes.json();
    const eceHasCseEvent = eceEventsData.events.some((e) => e.branch === 'CSE');
    const eceHasEceEvent = eceEventsData.events.some((e) => e.branch === 'ECE');

    if (eceHasCseEvent) throw new Error('❌ SECURITY LEAK: ECE student received CSE-restricted event!');
    if (!eceHasEceEvent) throw new Error('❌ ECE student did not receive ECE event.');
    console.log(`✅ ECE student feed correctly filtered (${eceEventsData.events.length} visible events, no CSE events leaked).`);

    // 4. Student creates Event (Status must be PENDING)
    console.log('\n4. Testing Student Event Creation...');
    const newEventPayload = {
      title: 'Automated Test Hackathon 2026',
      description: 'A 24-hour sprint testing automated submissions and approvals.',
      category: 'Hackathon',
      date: new Date(Date.now() + 86400000 * 10).toISOString(),
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      venue: 'Innovation Center Lab 1',
      organizer: 'CSE Student Body',
      targetAudience: 'ALL',
      branch: 'ALL',
    };

    const createRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentCSE.token}`,
      },
      body: JSON.stringify(newEventPayload),
    });
    const createData = await createRes.json();
    if (!createData.success) throw new Error(`Event creation failed: ${createData.message}`);
    if (createData.event.status !== 'pending') {
      throw new Error(`❌ Expected status 'pending', got '${createData.event.status}'`);
    }
    const createdEventId = createData.event._id;
    console.log(`✅ Student event created with ID: ${createdEventId} and status: 'pending'.`);

    // 5. Verify unapproved event is NOT in public feed
    console.log('\n5. Verifying unapproved event is hidden from normal events feed...');
    const verifyFeedRes = await fetch(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${studentECE.token}` },
    });
    const verifyFeedData = await verifyFeedRes.json();
    const isVisibleInFeed = verifyFeedData.events.some((e) => e._id === createdEventId);
    if (isVisibleInFeed) throw new Error('❌ Unapproved pending event is visible in normal feed!');
    console.log('✅ Pending event is strictly hidden from general event feeds.');

    // 6. Verify Creator can see their pending event in My Events
    console.log('\n6. Testing My Events for Creator...');
    const myEventsRes = await fetch(`${BASE_URL}/events/my-events`, {
      headers: { Authorization: `Bearer ${studentCSE.token}` },
    });
    const myEventsData = await myEventsRes.json();
    const foundInMyEvents = myEventsData.events.some((e) => e._id === createdEventId);
    if (!foundInMyEvents) throw new Error('❌ Creator cannot see their pending event in My Events.');
    console.log(`✅ Creator sees their pending event in My Events (Total: ${myEventsData.events.length}).`);

    // 7. Security: Student attempting Admin API should fail with 403 Forbidden
    console.log('\n7. Testing RBAC Security: Student calling Admin endpoint...');
    const studentAdminRes = await fetch(`${BASE_URL}/events/admin/all`, {
      headers: { Authorization: `Bearer ${studentCSE.token}` },
    });
    if (studentAdminRes.status !== 403) {
      throw new Error(`❌ Expected 403 Forbidden, got ${studentAdminRes.status}`);
    }
    console.log('✅ RBAC enforced: Student access to /api/events/admin/all was blocked (403 Forbidden).');

    // 8. Admin reviews pending events
    console.log('\n8. Testing Admin Event Approvals Dashboard...');
    const adminEventsRes = await fetch(`${BASE_URL}/events/admin/all?status=pending`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const adminEventsData = await adminEventsRes.json();
    if (!adminEventsData.success) throw new Error(adminEventsData.message);
    console.log(`✅ Admin retrieved ${adminEventsData.events.length} pending events for review.`);

    // 9. Admin Approves Event
    console.log('\n9. Testing Admin Event Approval...');
    const approveRes = await fetch(`${BASE_URL}/events/${createdEventId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const approveData = await approveRes.json();
    if (!approveData.success) throw new Error(`Approval failed: ${approveData.message}`);
    if (approveData.event.status !== 'approved') throw new Error('❌ Event status did not update to approved.');
    console.log('✅ Event approved successfully by Admin.');

    // 10. Verify Approved Event is now visible in the normal feed
    console.log('\n10. Verifying event is now visible in normal feed...');
    const feedAfterApproveRes = await fetch(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${studentECE.token}` },
    });
    const feedAfterApproveData = await feedAfterApproveRes.json();
    const nowVisible = feedAfterApproveData.events.some((e) => e._id === createdEventId);
    if (!nowVisible) throw new Error('❌ Newly approved event is not appearing in public feed.');
    console.log('✅ Newly approved event is now publicly discoverable in feed.');

    // 11. Testing Event Rejection flow
    console.log('\n11. Testing Event Rejection flow with rejection reason...');
    // ECE student creates an event
    const eceEventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentECE.token}`,
      },
      body: JSON.stringify({
        title: 'Event To Be Rejected',
        description: 'Testing administrative rejection reason pipeline.',
        category: 'Cultural',
        date: new Date(Date.now() + 86400000 * 5).toISOString(),
        startTime: '01:00 PM',
        endTime: '03:00 PM',
        venue: 'Room 101',
        organizer: 'ECE Society',
        targetAudience: 'ALL',
        branch: 'ALL',
      }),
    });
    const eceEventData = await eceEventRes.json();
    const rejectEventId = eceEventData.event._id;

    // Admin rejects with custom reason
    const reasonText = 'Venue conflict: Room 101 is booked for semester examinations.';
    const rejectRes = await fetch(`${BASE_URL}/events/${rejectEventId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${admin.token}`,
      },
      body: JSON.stringify({ rejectionReason: reasonText }),
    });
    const rejectData = await rejectRes.json();
    if (!rejectData.success) throw new Error(`Rejection failed: ${rejectData.message}`);
    if (rejectData.event.status !== 'rejected') throw new Error('❌ Event status did not update to rejected.');
    console.log('✅ Event rejected by Admin with reason recorded.');

    // Creator checks My Events to see rejection reason
    const eceMyEventsRes = await fetch(`${BASE_URL}/events/my-events`, {
      headers: { Authorization: `Bearer ${studentECE.token}` },
    });
    const eceMyEventsData = await eceMyEventsRes.json();
    const rejectedEvent = eceMyEventsData.events.find((e) => e._id === rejectEventId);
    if (!rejectedEvent || rejectedEvent.rejectionReason !== reasonText) {
      throw new Error('❌ Rejection reason not properly received by event creator.');
    }
    console.log(`✅ Creator confirmed seeing rejection reason: "${rejectedEvent.rejectionReason}".`);

    // 12. Ownership Security check: Student A cannot edit or delete Student B's event
    console.log('\n12. Testing Ownership Security: Cross-user modification forbidden...');
    const crossEditRes = await fetch(`${BASE_URL}/events/${rejectEventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentCSE.token}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    if (crossEditRes.status !== 403) {
      throw new Error(`❌ Expected 403 Forbidden for cross-user edit, got ${crossEditRes.status}`);
    }
    console.log('✅ Cross-user unauthorized modification blocked (403 Forbidden).');

    console.log('\n🎉 ALL PHASE 2 EVENTS BACKEND VERIFICATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

runEventTests();
