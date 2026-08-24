import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function testAvatarSync() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🖼️ CAMPUS CONNECT — GLOBAL PROFILE PICTURE SYNC TEST SUITE 🖼️');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // ---------------------------------------------------------
    // 1. Authenticate as Anshul Sharma
    // ---------------------------------------------------------
    console.log('🔹 [1/7] Authenticating as Anshul Sharma...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'anshul.cse@campus.edu', password: 'Student@123' }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Anshul login failed: ${loginData.message}`);
    const anshulToken = loginData.token;
    const anshulId = loginData.user._id || loginData.user.id;
    console.log(`  ✅ Anshul logged in: ${loginData.user.name} (ID: ${anshulId})`);

    // ---------------------------------------------------------
    // 2. Upload a new custom profile photo for Anshul
    // ---------------------------------------------------------
    console.log('\n🔹 [2/7] Uploading new profile photo for Anshul...');
    const sampleJpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
      0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x03, 0x02, 0x02, 0x03, 0x02,
      0x02, 0x03, 0x03, 0x03, 0x03, 0x04, 0x03, 0x03, 0x04, 0x05, 0x08, 0x05, 0x05, 0x04, 0x04,
      0x05, 0x0a, 0x07, 0x07, 0x06, 0x08, 0x0c, 0x0a, 0x0c, 0x0c, 0x0b, 0x0a, 0x0b, 0x0b, 0x0d,
      0x0e, 0x12, 0x10, 0x0d, 0x0e, 0x11, 0x0e, 0x0b, 0x0b, 0x10, 0x16, 0x10, 0x11, 0x13, 0x14,
      0x15, 0x15, 0x15, 0x0c, 0x0f, 0x17, 0x18, 0x16, 0x14, 0x18, 0x12, 0x14, 0x15, 0x14, 0xff,
      0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00,
      0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9,
    ]);

    const blob = new Blob([sampleJpegBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('image', blob, 'anshul-new-avatar.jpg');

    const uploadRes = await fetch(`${BASE_URL}/uploads/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${anshulToken}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.url) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }
    const anshulNewPhotoUrl = uploadData.url;
    console.log(`  ✅ New photo uploaded to server: ${anshulNewPhotoUrl}`);

    // ---------------------------------------------------------
    // 3. Save new profile picture on Anshul's profile
    // ---------------------------------------------------------
    console.log('\n🔹 [3/7] Updating Anshul profile record (PUT /api/users/profile)...');
    const updateProfileRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anshulToken}`,
      },
      body: JSON.stringify({ profileImage: anshulNewPhotoUrl }),
    });
    const updateProfileData = await updateProfileRes.json();
    if (!updateProfileData.success || updateProfileData.user.profileImage !== anshulNewPhotoUrl) {
      throw new Error('Profile update failed');
    }
    console.log(`  ✅ Profile updated: ${updateProfileData.user.profileImage}`);

    // ---------------------------------------------------------
    // 4. Verify Single Source of Truth on /api/auth/me & /api/users/profile
    // ---------------------------------------------------------
    console.log('\n🔹 [4/7] Verifying Single Source of Truth on GET /api/auth/me & GET /api/users/profile...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${anshulToken}` },
    });
    const meData = await meRes.json();
    if (meData.user.profileImage !== anshulNewPhotoUrl) {
      throw new Error(`GET /api/auth/me returned stale photo: ${meData.user.profileImage}`);
    }
    console.log(`  ✅ GET /api/auth/me returns latest photo: ${meData.user.profileImage}`);

    const getProfileRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${anshulToken}` },
    });
    const getProfileData = await getProfileRes.json();
    if (getProfileData.profile.profileImage !== anshulNewPhotoUrl) {
      throw new Error(`GET /api/users/profile returned stale photo: ${getProfileData.profile.profileImage}`);
    }
    console.log(`  ✅ GET /api/users/profile returns latest photo: ${getProfileData.profile.profileImage}`);

    // ---------------------------------------------------------
    // 5. Verify Anshul's avatar in Events, Lost & Found, and Clubs
    // ---------------------------------------------------------
    console.log('\n🔹 [5/7] Verifying Anshul avatar synchronization in Events, Lost & Found, and Clubs...');

    // Events
    const eventsRes = await fetch(`${BASE_URL}/events`, {
      headers: { Authorization: `Bearer ${anshulToken}` },
    });
    const eventsData = await eventsRes.json();
    const anshulEvents = eventsData.events.filter(
      (e) => e.creator && (e.creator._id === anshulId || e.creator.email === 'anshul.cse@campus.edu')
    );
    if (anshulEvents.length > 0) {
      for (const evt of anshulEvents) {
        if (evt.creator.profileImage !== anshulNewPhotoUrl) {
          throw new Error(`Event creator avatar not synchronized: ${evt.creator.profileImage}`);
        }
      }
      console.log(`  ✅ Events: All ${anshulEvents.length} events created by Anshul dynamically return new photo.`);
    } else {
      console.log('  ℹ️ No approved events currently owned by Anshul to inspect in public feed.');
    }

    // Lost & Found
    const lfRes = await fetch(`${BASE_URL}/lost-found`, {
      headers: { Authorization: `Bearer ${anshulToken}` },
    });
    const lfData = await lfRes.json();
    const anshulItems = lfData.items.filter(
      (item) => item.creator && (item.creator._id === anshulId || item.creator.email === 'anshul.cse@campus.edu')
    );
    if (anshulItems.length > 0) {
      for (const item of anshulItems) {
        if (item.creator.profileImage !== anshulNewPhotoUrl) {
          throw new Error(`Lost & Found creator avatar not synchronized: ${item.creator.profileImage}`);
        }
      }
      console.log(`  ✅ Lost & Found: All ${anshulItems.length} items reported by Anshul dynamically return new photo.`);
    }

    // Clubs (GDSC President)
    const clubsRes = await fetch(`${BASE_URL}/clubs`, {
      headers: { Authorization: `Bearer ${anshulToken}` },
    });
    const clubsData = await clubsRes.json();
    const gdsc = clubsData.clubs.find((c) => c.name.includes('GDSC') || c.name.includes('Google Developer'));
    if (gdsc) {
      const singleClubRes = await fetch(`${BASE_URL}/clubs/${gdsc._id}`, {
        headers: { Authorization: `Bearer ${anshulToken}` },
      });
      const singleClubData = await singleClubRes.json();
      if (
        singleClubData.club?.studentPresident &&
        singleClubData.club.studentPresident._id === anshulId
      ) {
        if (singleClubData.club.studentPresident.profileImage !== anshulNewPhotoUrl) {
          throw new Error('Club President avatar not synchronized');
        }
        console.log(`  ✅ Clubs: GDSC Student President (${singleClubData.club.studentPresident.name}) dynamically returns new photo.`);
      }
    }

    // ---------------------------------------------------------
    // 6. Cross-User Visibility: Login as Rohit Verma and observe Anshul's updated photo
    // ---------------------------------------------------------
    console.log('\n🔹 [6/7] Cross-User Verification: Logging in as Rohit Verma to view Anshul...');
    const rohitLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rohit.ece@campus.edu', password: 'Student@123' }),
    });
    const rohitLoginData = await rohitLoginRes.json();
    if (!rohitLoginData.success) throw new Error('Rohit login failed');
    const rohitToken = rohitLoginData.token;

    // Fetch Lost & Found as Rohit
    const rohitLfRes = await fetch(`${BASE_URL}/lost-found`, {
      headers: { Authorization: `Bearer ${rohitToken}` },
    });
    const rohitLfData = await rohitLfRes.json();
    const anshulItemSeenByRohit = rohitLfData.items.find(
      (item) => item.creator && (item.creator._id === anshulId || item.creator.email === 'anshul.cse@campus.edu')
    );
    if (anshulItemSeenByRohit) {
      if (anshulItemSeenByRohit.creator.profileImage !== anshulNewPhotoUrl) {
        throw new Error('Cross-user visibility failed: Rohit does not see Anshul updated photo');
      }
      console.log(`  ✅ Rohit sees Anshul updated avatar on Lost & Found item: ${anshulItemSeenByRohit.creator.profileImage}`);
    }

    // Fetch Club as Rohit
    if (gdsc) {
      const rohitClubRes = await fetch(`${BASE_URL}/clubs/${gdsc._id}`, {
        headers: { Authorization: `Bearer ${rohitToken}` },
      });
      const rohitClubData = await rohitClubRes.json();
      if (rohitClubData.club?.studentPresident?._id === anshulId) {
        if (rohitClubData.club.studentPresident.profileImage !== anshulNewPhotoUrl) {
          throw new Error('Cross-user club president avatar failed');
        }
        console.log(`  ✅ Rohit sees Anshul updated avatar on GDSC leadership card.`);
      }
    }

    // ---------------------------------------------------------
    // 7. Generic Test: Rohit Verma updates his own photo
    // ---------------------------------------------------------
    console.log('\n🔹 [7/7] Generic Verification: Rohit Verma updates his own photo...');
    const rohitBlob = new Blob([sampleJpegBuffer], { type: 'image/jpeg' });
    const rohitFormData = new FormData();
    rohitFormData.append('image', rohitBlob, 'rohit-new-avatar.jpg');

    const rohitUploadRes = await fetch(`${BASE_URL}/uploads/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rohitToken}` },
      body: rohitFormData,
    });
    const rohitUploadData = await rohitUploadRes.json();
    const rohitPhotoUrl = rohitUploadData.url;

    const rohitProfileUpdate = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rohitToken}`,
      },
      body: JSON.stringify({ profileImage: rohitPhotoUrl }),
    });
    const rohitProfileData = await rohitProfileUpdate.json();
    if (!rohitProfileData.success || rohitProfileData.user.profileImage !== rohitPhotoUrl) {
      throw new Error('Rohit profile photo update failed');
    }
    console.log(`  ✅ Rohit updated his own profile photo: ${rohitPhotoUrl}`);

    // Re-verify login persistence
    const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rohit.ece@campus.edu', password: 'Student@123' }),
    });
    const reLoginData = await reLoginRes.json();
    if (reLoginData.user.profileImage !== rohitPhotoUrl) {
      throw new Error('Re-login persistence failed for Rohit');
    }
    console.log(`  ✅ Re-login verified: Rohit photo persists across logout/login.`);

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL PROFILE PICTURE SYNCHRONIZATION TESTS PASSED 100%! 🎉');
    console.log('════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Avatar Sync Test Failed:', error.message);
    process.exit(1);
  }
}

testAvatarSync();
