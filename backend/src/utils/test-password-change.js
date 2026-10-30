import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User.js';
import userRoutes from '../routes/userRoutes.js';
import authRoutes from '../routes/authRoutes.js';

const runPasswordChangeTests = async () => {
  console.log('🧪 Starting Security & Password Change Automated Test Suite...\n');

  // 1. In-memory database setup
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // 2. Setup Express test application
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // 3. Create two distinct test users in isolated DB
    const studentPassword = 'OldPassword123!';
    const victimPassword = 'VictimPassword123!';

    const studentUser = await User.create({
      name: 'Test Student',
      email: 'student.test@campus.edu',
      passwordHash: await User.hashPassword(studentPassword),
      collegeId: '22CSE999',
      rollNumber: '22CSE999',
      branch: 'CSE',
      year: '3rd Year',
      section: 'A',
      role: 'STUDENT',
      isVerified: true,
    });

    const victimUser = await User.create({
      name: 'Victim Student',
      email: 'victim.test@campus.edu',
      passwordHash: await User.hashPassword(victimPassword),
      collegeId: '22ECE888',
      rollNumber: '22ECE888',
      branch: 'ECE',
      year: '2nd Year',
      section: 'B',
      role: 'STUDENT',
      isVerified: true,
    });

    // Helper: Login
    const login = async (email, password) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });
      return { status: res.status, data: await res.json() };
    };

    // Helper: Change password
    const changePasswordReq = async (token, body) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}/users/change-password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });
      return { status: res.status, data: await res.json() };
    };

    // Initial login for student
    const studentLogin1 = await login('student.test@campus.edu', studentPassword);
    if (studentLogin1.status !== 200 || !studentLogin1.data.token) {
      throw new Error('Initial student login failed');
    }
    const studentToken = studentLogin1.data.token;

    // --- TEST 1: Unauthenticated request ---
    console.log('Test 1: Unauthenticated request to /api/users/change-password...');
    const t1 = await changePasswordReq(null, {
      currentPassword: studentPassword,
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });
    if (t1.status === 401) {
      console.log('✅ PASS: Unauthenticated request rejected with HTTP 401.');
    } else {
      throw new Error(`❌ FAIL: Expected HTTP 401, got ${t1.status}`);
    }

    // --- TEST 2: Missing fields ---
    console.log('\nTest 2: Missing required password fields...');
    const t2a = await changePasswordReq(studentToken, { currentPassword: studentPassword });
    const t2b = await changePasswordReq(studentToken, { newPassword: 'NewPassword123!' });
    if (t2a.status === 400 && t2b.status === 400) {
      console.log('✅ PASS: Missing fields correctly rejected with HTTP 400.');
    } else {
      throw new Error('❌ FAIL: Missing fields were not rejected with HTTP 400.');
    }

    // --- TEST 3: Minimum 8 characters validation ---
    console.log('\nTest 3: Short new password (< 8 chars)...');
    const t3 = await changePasswordReq(studentToken, {
      currentPassword: studentPassword,
      newPassword: 'short',
      confirmPassword: 'short',
    });
    if (t3.status === 400 && t3.data.message.includes('8 characters')) {
      console.log('✅ PASS: Short password rejected with HTTP 400 and clear message.');
    } else {
      throw new Error(`❌ FAIL: Expected 400 for short password, got ${t3.status}`);
    }

    // --- TEST 4: Mismatched new password and confirm password ---
    console.log('\nTest 4: Mismatched new password & confirmation...');
    const t4 = await changePasswordReq(studentToken, {
      currentPassword: studentPassword,
      newPassword: 'NewPassword123!',
      confirmPassword: 'DifferentPassword123!',
    });
    if (t4.status === 400 && t4.data.message.includes('not match')) {
      console.log('✅ PASS: Password mismatch rejected with HTTP 400.');
    } else {
      throw new Error(`❌ FAIL: Expected 400 for mismatched passwords, got ${t4.status}`);
    }

    // --- TEST 5: Incorrect current password ---
    console.log('\nTest 5: Incorrect current password...');
    const t5 = await changePasswordReq(studentToken, {
      currentPassword: 'WrongOldPassword999!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });
    if (t5.status === 400 && t5.data.message.includes('Current password is incorrect')) {
      console.log('✅ PASS: Incorrect current password rejected with HTTP 400.');
    } else {
      throw new Error(`❌ FAIL: Expected 400 for incorrect current password, got ${t5.status}`);
    }

    // --- TEST 6: User A cannot change User B's password ---
    console.log("\nTest 6: User isolation (User A cannot affect User B's password)...");
    const t6 = await changePasswordReq(studentToken, {
      userId: victimUser._id.toString(), // attempting to target victim's ID in body
      id: victimUser._id.toString(),
      currentPassword: victimPassword, // providing victim's password with student's token
      newPassword: 'HackedPassword123!',
      confirmPassword: 'HackedPassword123!',
    });
    if (t6.status === 400 && t6.data.message.includes('Current password is incorrect')) {
      console.log('✅ PASS: Attacker cannot use foreign credentials or ID to modify accounts.');
    } else {
      throw new Error(`❌ FAIL: Expected 400, got ${t6.status}`);
    }

    const victimCheckLogin = await login('victim.test@campus.edu', victimPassword);
    if (victimCheckLogin.status === 200) {
      console.log("✅ PASS: Victim user's password remained unchanged and intact.");
    } else {
      throw new Error("❌ FAIL: User isolation violated! Victim user password was modified.");
    }

    // --- TEST 7: Valid password change ---
    console.log('\nTest 7: Valid password change with correct current password...');
    const validNewPassword = 'BrandNewSecurePassword2026!';
    const t7 = await changePasswordReq(studentToken, {
      currentPassword: studentPassword,
      newPassword: validNewPassword,
      confirmPassword: validNewPassword,
    });
    if (t7.status === 200 && t7.data.success) {
      console.log('✅ PASS: Password changed successfully (HTTP 200).');
    } else {
      throw new Error(`❌ FAIL: Expected 200 for valid change, got ${t7.status}: ${JSON.stringify(t7.data)}`);
    }

    // --- TEST 8: Old password no longer works ---
    console.log('\nTest 8: Login with OLD password must fail...');
    const oldLoginRes = await login('student.test@campus.edu', studentPassword);
    if (oldLoginRes.status === 401) {
      console.log('✅ PASS: Login with old password rejected with HTTP 401.');
    } else {
      throw new Error(`❌ FAIL: Old password still worked! Expected 401, got ${oldLoginRes.status}`);
    }

    // --- TEST 9: Login with NEW password must succeed ---
    console.log('\nTest 9: Login with NEW password must succeed...');
    const newLoginRes = await login('student.test@campus.edu', validNewPassword);
    if (newLoginRes.status === 200 && newLoginRes.data.token) {
      console.log('✅ PASS: Login with new password succeeded (HTTP 200).');
    } else {
      throw new Error(`❌ FAIL: Login with new password failed! Status: ${newLoginRes.status}`);
    }

    // --- TEST 10: Auth route parity (/api/auth/change-password) ---
    console.log('\nTest 10: Auth route parity (/api/auth/change-password)...');
    const authRouteRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newLoginRes.data.token}`,
      },
      body: JSON.stringify({
        currentPassword: validNewPassword,
        newPassword: 'EvenNewerPassword2026!',
        confirmPassword: 'EvenNewerPassword2026!',
      }),
    });
    const authRouteData = await authRouteRes.json();
    if (authRouteRes.status === 200 && authRouteData.success) {
      console.log('✅ PASS: /api/auth/change-password also functions with full parity (HTTP 200).');
    } else {
      throw new Error(`❌ FAIL: Expected 200 for auth route parity, got ${authRouteRes.status}`);
    }

    console.log('\n========================================');
    console.log('🎉 ALL 10 SECURITY & PASSWORD TESTS PASSED');
    console.log('========================================\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }
};

runPasswordChangeTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  });
