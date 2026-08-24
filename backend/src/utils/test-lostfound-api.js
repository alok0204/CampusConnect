// Automated Test Suite for Phase 3: Lost & Found Module

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

const runLostFoundTests = async () => {
  console.log('🧪 Starting Phase 3: Lost & Found Module API Verification...\n');

  try {
    // 1. Authenticate users
    console.log('1. Authenticating test users (Admin, Student A, Student B)...');
    const admin = await loginUser('admin@campus.edu', 'Admin@123');
    const studentA = await loginUser('anshul.cse@campus.edu', 'Student@123');
    const studentB = await loginUser('rohit.ece@campus.edu', 'Student@123');
    console.log('✅ Authenticated successfully.');

    // 2. Fetch public Lost & Found listings
    console.log('\n2. Testing GET /api/lost-found...');
    const listRes = await fetch(`${BASE_URL}/lost-found`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const listData = await listRes.json();
    if (!listData.success) throw new Error(listData.message);
    console.log(`✅ Retrieved ${listData.items.length} active listings.`);

    // 3. Filter by type: Lost vs Found
    console.log('\n3. Testing filters: type=lost & type=found...');
    const lostRes = await fetch(`${BASE_URL}/lost-found?type=lost`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const lostData = await lostRes.json();
    const allAreLost = lostData.items.every((i) => i.type === 'lost');
    if (!allAreLost) throw new Error('❌ Non-lost item found in type=lost query!');
    console.log(`✅ Filter type=lost passed (${lostData.items.length} lost items).`);

    const foundRes = await fetch(`${BASE_URL}/lost-found?type=found`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const foundData = await foundRes.json();
    const allAreFound = foundData.items.every((i) => i.type === 'found');
    if (!allAreFound) throw new Error('❌ Non-found item in type=found query!');
    console.log(`✅ Filter type=found passed (${foundData.items.length} found items).`);

    // 4. Report a Lost Item (Student A)
    console.log('\n4. Testing POST /api/lost-found (Report Lost Item by Student A)...');
    const reportLostRes = await fetch(`${BASE_URL}/lost-found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        title: 'Sony WH-1000XM4 Headphones (Silver)',
        description: 'Left my noise cancelling headphones in Audio Visual Lab Room 204.',
        type: 'lost',
        category: 'Electronics',
        location: 'AV Lab (Room 204)',
        date: new Date().toISOString(),
        time: '02:00 PM',
        color: 'Silver',
        brand: 'Sony',
        uniqueDetails: 'Custom engraved initials AS on left ear cup.',
        contactPreference: 'portal',
      }),
    });
    const reportLostData = await reportLostRes.json();
    if (!reportLostData.success) throw new Error(reportLostData.message);
    const lostItemId = reportLostData.item._id;
    console.log(`✅ Lost item reported with ID: ${lostItemId}, status: ${reportLostData.item.status}`);

    // 5. Report a Found Item (Student B - Rohit)
    console.log('\n5. Testing POST /api/lost-found (Report Found Item by Student B)...');
    const reportFoundRes = await fetch(`${BASE_URL}/lost-found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({
        title: 'Apple iPad Air (Space Gray with Black Folio Case)',
        description: 'Found an iPad on the study table in the Library reading area.',
        type: 'found',
        category: 'Electronics',
        location: 'Central Library 2nd Floor (Table 14)',
        date: new Date().toISOString(),
        time: '04:30 PM',
        color: 'Space Gray',
        brand: 'Apple',
        uniqueDetails: 'Lock screen wallpaper is an anime character with a cat sticker on the back of the case.',
        contactPreference: 'portal',
      }),
    });
    const reportFoundData = await reportFoundRes.json();
    if (!reportFoundData.success) throw new Error(reportFoundData.message);
    const foundItemId = reportFoundData.item._id;
    console.log(`✅ Found item reported with ID: ${foundItemId}, status: ${reportFoundData.item.status}`);

    // 6. Security Check: Privacy of uniqueDetails
    console.log('\n6. Testing Privacy Security: non-creator cannot view finder uniqueDetails...');
    const itemDetailsRes = await fetch(`${BASE_URL}/lost-found/${foundItemId}`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const itemDetailsData = await itemDetailsRes.json();
    if (itemDetailsData.item.uniqueDetails) {
      throw new Error('❌ SECURITY LEAK: Non-creator student was able to view private uniqueDetails!');
    }
    console.log('✅ Privacy verified: Private verification details stripped for public viewers.');

    // 7. Security: User attempting to claim their own found item
    console.log('\n7. Testing Self-Claim Prevention (Student B claiming their own found item)...');
    const selfClaimRes = await fetch(`${BASE_URL}/lost-found/${foundItemId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({
        reason: 'This is my item',
        identifyingDetails: 'I found it',
      }),
    });
    if (selfClaimRes.status !== 400) {
      throw new Error(`❌ Expected 400 Bad Request, got ${selfClaimRes.status}`);
    }
    console.log('✅ Self-claim blocked correctly with 400 Bad Request.');

    // 8. Submit Legitimate Claim (Student A claims the iPad found by Student B)
    console.log('\n8. Testing Claim Submission (Student A claims iPad from Student B)...');
    const claimRes = await fetch(`${BASE_URL}/lost-found/${foundItemId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        reason: 'I left my iPad on Table 14 while studying for my database exam before leaving for lab.',
        identifyingDetails: 'Space Gray 64GB iPad Air. The lock screen wallpaper has a blue anime background and there is a holographic cat sticker on the top right back corner.',
        previousLocation: 'Library 2nd Floor Table 14 between 3 PM and 4:30 PM',
        contactNumber: '+91 9876543210',
      }),
    });
    const claimData = await claimRes.json();
    if (!claimData.success) throw new Error(claimData.message);
    const createdClaimId = claimData.claim._id;
    console.log(`✅ Claim submitted with ID: ${createdClaimId}, status: 'pending'.`);

    // 9. Verify Duplicate Claim Prevention
    console.log('\n9. Testing Duplicate Claim Prevention (Student A claiming again)...');
    const dupClaimRes = await fetch(`${BASE_URL}/lost-found/${foundItemId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentA.token}`,
      },
      body: JSON.stringify({
        reason: 'Duplicate claim attempt',
        identifyingDetails: 'Details',
      }),
    });
    if (dupClaimRes.status !== 400) {
      throw new Error(`❌ Expected 400 Bad Request for duplicate claim, got ${dupClaimRes.status}`);
    }
    console.log('✅ Duplicate claim blocked correctly (400 Bad Request).');

    // 10. Finder Reviews Claims
    console.log('\n10. Testing Finder Claim Review (/lost-found/:id/claims by Finder Student B)...');
    const getClaimsRes = await fetch(`${BASE_URL}/lost-found/${foundItemId}/claims`, {
      headers: { Authorization: `Bearer ${studentB.token}` },
    });
    const getClaimsData = await getClaimsRes.json();
    if (!getClaimsData.success) throw new Error(getClaimsData.message);
    console.log(`✅ Finder retrieved ${getClaimsData.claims.length} pending claims to review.`);

    // 11. Finder Approves Claim
    console.log('\n11. Testing Claim Approval by Finder...');
    const approveClaimRes = await fetch(`${BASE_URL}/lost-found/claims/${createdClaimId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentB.token}`,
      },
      body: JSON.stringify({
        reviewNote: 'Verified details match the cat sticker and wallpaper. Handed over to student.',
      }),
    });
    const approveClaimData = await approveClaimRes.json();
    if (!approveClaimData.success) throw new Error(approveClaimData.message);
    console.log('✅ Claim approved! Item status updated to resolved.');

    // 12. Verify Item is now Marked as Resolved
    const checkItemRes = await fetch(`${BASE_URL}/lost-found/${foundItemId}`, {
      headers: { Authorization: `Bearer ${studentA.token}` },
    });
    const checkItemData = await checkItemRes.json();
    if (checkItemData.item.status !== 'resolved') {
      throw new Error(`❌ Expected status 'resolved', got '${checkItemData.item.status}'`);
    }
    console.log(`✅ Item verified as resolved/claimed by ${checkItemData.item.claimedBy?.name}.`);

    // 13. Admin Moderation
    console.log('\n13. Testing Admin Moderation Console (/lost-found/admin/all)...');
    const adminRes = await fetch(`${BASE_URL}/lost-found/admin/all`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const adminData = await adminRes.json();
    if (!adminData.success) throw new Error(adminData.message);
    console.log(`✅ Admin retrieved ${adminData.items.length} total reports with summary metrics.`);

    console.log('\n🎉 ALL PHASE 3 LOST & FOUND BACKEND TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lost & Found test failed:', error.message);
    process.exit(1);
  }
};

runLostFoundTests();
