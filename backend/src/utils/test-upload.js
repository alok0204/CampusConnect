import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function runUploadTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('📸 CAMPUS CONNECT — IMAGE UPLOAD & PERSISTENCE TEST SUITE 📸');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // 1. Authenticate as Student
    console.log('🔹 [1/6] Authenticating Student...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-suite',
      },
      body: JSON.stringify({ identifier: 'anshul.cse@campus.edu', password: 'Student@123' }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Student login failed: ${loginData.message}`);
    const token = loginData.token;
    console.log(`  ✅ Student authenticated: ${loginData.user.name} (${loginData.user.collegeId})`);

    // 2. Upload a valid test JPEG image
    console.log('\n🔹 [2/6] Testing Valid Image Upload (POST /api/uploads/image)...');
    // Create a 1x1 test JPEG pixel
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
    formData.append('image', blob, 'test-photo.jpg');

    const uploadRes = await fetch(`${BASE_URL}/uploads/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.url) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }
    const uploadedImageUrl = uploadData.url;
    console.log(`  ✅ Image uploaded successfully: ${uploadedImageUrl}`);
    console.log(`  ✅ Safe unique filename generated: ${uploadData.file?.filename}`);

    // 3. Test Static Serving / Fetching of Uploaded Image
    console.log('\n🔹 [3/6] Testing Fetching / Serving of Uploaded Image...');
    const imageFetchUrl =
      uploadedImageUrl.startsWith('http://') || uploadedImageUrl.startsWith('https://')
        ? uploadedImageUrl
        : `http://localhost:5000${uploadedImageUrl}`;
    const staticRes = await fetch(imageFetchUrl);
    if (staticRes.status !== 200) {
      throw new Error(`Static file serving failed with status ${staticRes.status}`);
    }
    const contentType = staticRes.headers.get('content-type');
    console.log(`  ✅ Static asset served: status=${staticRes.status}, content-type=${contentType}`);

    // 4. Test Profile Picture Update & Persistence
    console.log('\n🔹 [4/6] Testing Profile Photo Persistence...');
    const profileUpdateRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profileImage: uploadedImageUrl }),
    });
    const profileUpdateData = await profileUpdateRes.json();
    if (!profileUpdateData.success || profileUpdateData.user.profileImage !== uploadedImageUrl) {
      throw new Error('Profile photo update failed to persist');
    }

    const getProfileRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const getProfileData = await getProfileRes.json();
    if (getProfileData.profile.profileImage !== uploadedImageUrl) {
      throw new Error('Profile photo fetch does not match uploaded URL');
    }
    console.log(`  ✅ Profile photo updated and persisted: ${getProfileData.profile.profileImage}`);

    // 5. Test Event & Lost-Found Creation with Uploaded Image
    console.log('\n🔹 [5/6] Testing Event & Lost-Found Creation with Uploaded Image...');
    const eventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Image Upload Showcase Workshop',
        description: 'Demonstrating real uploaded event posters on Campus Connect.',
        category: 'Workshop',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Auditorium Lab 1',
        organizer: 'Developers Club',
        targetAudience: 'ALL',
        branch: 'ALL',
        image: uploadedImageUrl,
      }),
    });
    const eventData = await eventRes.json();
    if (!eventData.success || eventData.event.image !== uploadedImageUrl) {
      throw new Error('Event creation with uploaded image failed');
    }
    console.log(`  ✅ Event created with uploaded image: ID ${eventData.event._id}`);

    const lostFoundRes = await fetch(`${BASE_URL}/lost-found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'found',
        title: 'Found Keys with Metallic Keychain',
        description: 'Set of 3 keys found near main library entrance benches.',
        category: 'Keys & Wallets',
        location: 'Library Entrance',
        date: new Date().toISOString().split('T')[0],
        time: '02:30 PM',
        contactPreference: 'portal',
        image: uploadedImageUrl,
      }),
    });
    const lostFoundData = await lostFoundRes.json();
    if (!lostFoundData.success || lostFoundData.item.image !== uploadedImageUrl) {
      throw new Error('Lost & Found creation with uploaded image failed');
    }
    console.log(`  ✅ Lost & Found item created with uploaded image: ID ${lostFoundData.item._id}`);

    // 6. Test Security Constraints (Invalid type rejection & oversized file rejection)
    console.log('\n🔹 [6/6] Testing Security Constraints & File Validation...');

    // A. Invalid file format (e.g. text/plain pretending to be an image or script)
    const textBlob = new Blob(['console.log("hacked")'], { type: 'text/plain' });
    const badFormData = new FormData();
    badFormData.append('image', textBlob, 'hack.sh');

    const badUploadRes = await fetch(`${BASE_URL}/uploads/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: badFormData,
    });
    const badUploadData = await badUploadRes.json();
    if (badUploadRes.status === 400 && !badUploadData.success) {
      console.log('  🛡️ Security verified: Invalid file type/extension rejected with 400 Bad Request');
    } else {
      throw new Error('Security flaw: Invalid file type was not rejected');
    }

    // B. Oversized file (> 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const largeBlob = new Blob([largeBuffer], { type: 'image/jpeg' });
    const largeFormData = new FormData();
    largeFormData.append('image', largeBlob, 'huge-photo.jpg');

    const largeUploadRes = await fetch(`${BASE_URL}/uploads/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: largeFormData,
    });
    const largeUploadData = await largeUploadRes.json();
    if (largeUploadRes.status === 400 && !largeUploadData.success) {
      console.log('  🛡️ Security verified: Oversized file (>10MB) rejected with 400 Bad Request');
    } else {
      throw new Error('Security flaw: Oversized file was not rejected');
    }

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎉 ALL IMAGE UPLOAD & SECURITY CHECKS PASSED 100%! 🎉');
    console.log('════════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
}

runUploadTests();
