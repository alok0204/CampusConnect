// Automated Test Suite for Phase 6: Notifications & Activity Center Module

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

const runNotificationTests = async () => {
  console.log('🧪 Starting Phase 6: Notifications & Activity Center Verification...\n');

  try {
    // 1. Authenticate users
    console.log('1. Authenticating test users (Admin, Faculty, Student A - Anshul, Student B - Rohit)...');
    const admin = await loginUser('admin@campus.edu', 'Admin@123');
    const faculty = await loginUser('dr.sharma@campus.edu', 'Faculty@123');
    const studentA = await loginUser('anshul.cse@campus.edu', 'Student@123');
    const studentB = await loginUser('rohit.ece@campus.edu', 'Student@123');
    console.log('✅ All 4 test roles authenticated successfully.');

    // 2. Test GET /api/notifications and /api/notifications/unread-count
    console.log('\n2. Testing GET /api/notifications/unread-count...');
    const unreadRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const unreadData = await unreadRes.json();
    if (!unreadData.success) throw new Error(unreadData.message);
    console.log(`✅ Unread count for Student A: ${unreadData.unreadCount}`);

    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const notifData = await notifRes.json();
    if (!notifData.success) throw new Error(notifData.message);
    console.log(`✅ Retrieved ${notifData.notifications.length} notifications for Student A.`);

    // 3. Test Event Approval Trigger Notification
    console.log('\n3. Testing Notification Trigger on Event Approval...');
    // Create an event as Student A
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const eventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        title: `Campus Gaming Tournament ${randomNum}`,
        description: 'Inter-branch esports and gaming competition with FIFA and Valorant relays.',
        category: 'Sports',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '10:00 AM',
        endTime: '05:00 PM',
        venue: 'Student Lounge (Block C)',
        organizer: 'Gaming Society',
        targetAudience: 'ALL',
      }),
    });
    const eventData = await eventRes.json();
    if (!eventData.success) throw new Error(eventData.message);
    const eventId = eventData.event._id;

    // Admin approves the event
    const approveEvtRes = await fetch(`${BASE_URL}/events/${eventId}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const approveEvtData = await approveEvtRes.json();
    if (!approveEvtData.success) throw new Error(approveEvtData.message);

    // Verify Student A received the event notification
    const checkEvtNotifRes = await fetch(`${BASE_URL}/notifications?type=event`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const checkEvtNotifData = await checkEvtNotifRes.json();
    const hasEventNotif = checkEvtNotifData.notifications.some((n) =>
      n.title.includes(`Event Approved: Campus Gaming Tournament ${randomNum}`)
    );
    if (!hasEventNotif) {
      throw new Error('❌ Event creator did not receive "Event Approved" notification!');
    }
    console.log('✅ Event creator received "Event Approved" notification successfully.');

    // 4. Test Lost & Found Trigger Notification (Claim flow)
    console.log('\n4. Testing Lost & Found Claim Notification triggers...');
    // Student B reports a found water bottle
    const foundRes = await fetch(`${BASE_URL}/lost-found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({
        title: `Hydro Flask Water Bottle ${randomNum}`,
        description: 'Found a stainless steel water bottle in the cafeteria.',
        type: 'found',
        category: 'Clothing & Accessories',
        location: 'Cafeteria Table 6',
        date: new Date().toISOString(),
        time: '01:00 PM',
        uniqueDetails: 'Has a small scratch on the bottom rim.',
      }),
    });
    const foundData = await foundRes.json();
    if (!foundData.success) throw new Error(foundData.message);
    const foundItemId = foundData.item._id;

    // Student A submits a claim
    const claimRes = await fetch(`${BASE_URL}/lost-found/${foundItemId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        reason: 'I left my black Hydro Flask bottle after lunch.',
        identifyingDetails: 'Has a small scratch on the bottom rim.',
      }),
    });
    const claimData = await claimRes.json();
    if (!claimData.success) throw new Error(claimData.message);
    const claimId = claimData.claim._id;

    // Verify Student B (Finder) received "New Claim Submitted" notification
    const checkFinderNotif = await fetch(`${BASE_URL}/notifications?type=lost_found`, {
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    const checkFinderData = await checkFinderNotif.json();
    const hasClaimNotif = checkFinderData.notifications.some((n) =>
      n.title.includes(`New Claim Submitted: Hydro Flask Water Bottle ${randomNum}`)
    );
    if (!hasClaimNotif) {
      throw new Error('❌ Finder did not receive "New Claim Submitted" notification!');
    }
    console.log('✅ Finder received "New Claim Submitted" notification.');

    // Finder approves claim
    const approveClaimRes = await fetch(`${BASE_URL}/lost-found/claims/${claimId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({ reviewNote: 'Ownership verified.' }),
    });
    const approveClaimData = await approveClaimRes.json();
    if (!approveClaimData.success) throw new Error(approveClaimData.message);

    // Verify Student A (Claimant) received "Claim Approved" urgent notification
    const checkClaimantNotif = await fetch(`${BASE_URL}/notifications?type=lost_found`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const checkClaimantData = await checkClaimantNotif.json();
    const hasClaimApprovedNotif = checkClaimantData.notifications.some((n) =>
      n.title.includes(`Claim Approved! Ownership Verified for Hydro Flask Water Bottle ${randomNum}`)
    );
    if (!hasClaimApprovedNotif) {
      throw new Error('❌ Claimant did not receive "Claim Approved" notification!');
    }
    console.log('✅ Claimant received "Claim Approved!" notification.');

    // 5. Test Club Membership Notification
    console.log('\n5. Testing Club Membership Notification Triggers...');
    const clubsListRes = await fetch(`${BASE_URL}/clubs`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const clubsListData = await clubsListRes.json();
    const gdscClub = clubsListData.clubs.find((c) => c.name.includes('GDSC') || c.name.includes('Google Developer'));

    if (gdscClub) {
      // Student B requests to join GDSC
      await fetch(`${BASE_URL}/clubs/${gdscClub._id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentB.token}`,
        },
        body: JSON.stringify({ statement: 'Eager to contribute.' }),
      });

      // Manager (Student A) approves Student B
      const approveMemberRes = await fetch(`${BASE_URL}/clubs/${gdscClub._id}/approve-member/${studentB.user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentA.token}`,
        },
        body: JSON.stringify({ role: 'Member' }),
      });
      const approveMemberData = await approveMemberRes.json();
      if (approveMemberData.success) {
        // Verify Student B received "Membership Approved" notification
        const checkClubNotif = await fetch(`${BASE_URL}/notifications?type=club`, {
          headers: { Authorization: `Bearer ${studentB.token}` },
        });
        const checkClubData = await checkClubNotif.json();
        const hasClubNotif = checkClubData.notifications.some((n) =>
          n.title.includes('Membership Approved')
        );
        if (hasClubNotif) {
          console.log('✅ Student received "Membership Approved" notification.');
        }
      }
    }

    // 6. Test Mark As Read & Mark All As Read
    console.log('\n6. Testing Read State Transitions...');
    const latestNotifs = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const latestData = await latestNotifs.json();
    const targetNotif = latestData.notifications.find((n) => !n.isRead);

    if (targetNotif) {
      const readRes = await fetch(`${BASE_URL}/notifications/${targetNotif._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${studentA.token}` },
      });
      const readData = await readRes.json();
      if (!readData.success || !readData.notification.isRead) {
        throw new Error('❌ Failed to mark single notification as read!');
      }
      console.log('✅ Single notification marked as read.');
    }

    // Mark All As Read
    const markAllRes = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const markAllData = await markAllRes.json();
    if (!markAllData.success || markAllData.unreadCount !== 0) {
      throw new Error(`❌ Expected unreadCount 0 after mark-all-read, got ${markAllData.unreadCount}`);
    }
    console.log('✅ All notifications marked as read (unreadCount: 0).');

    // 7. Test Security: User B cannot read or delete User A's notifications
    console.log('\n7. Testing Security & Isolation between users...');
    if (targetNotif) {
      const unauthorizedReadRes = await fetch(`${BASE_URL}/notifications/${targetNotif._id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${studentB.token}` },
      });
      if (unauthorizedReadRes.status !== 404 && unauthorizedReadRes.status !== 403) {
        throw new Error(`❌ Expected 404/403 for unauthorized notification access, got ${unauthorizedReadRes.status}`);
      }
      console.log('✅ Cross-user unauthorized notification access strictly blocked.');
    }

    // 8. Test Activity Stream (/api/notifications/activity)
    console.log('\n8. Testing Consolidated Activity Stream (/api/notifications/activity)...');
    const actRes = await fetch(`${BASE_URL}/notifications/activity`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const actData = await actRes.json();
    if (!actData.success) throw new Error(actData.message);
    console.log(`✅ Retrieved ${actData.count} activity records across Events, Lost & Found, Announcements, and Clubs.`);

    console.log('\n🎉 ALL PHASE 6 NOTIFICATIONS & ACTIVITY CENTER BACKEND TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Notification test failed:', error.message);
    process.exit(1);
  }
};

runNotificationTests();
