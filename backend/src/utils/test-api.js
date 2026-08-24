// Quick smoke test script for testing backend endpoints

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting API Smoke Tests...\n');

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health status:', healthData.status);

    // 2. Login as Student
    console.log('\n2. Testing POST /api/auth/login (Student by Email)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'anshul.cse@campus.edu',
        password: 'Student@123',
      }),
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(`Login failed: ${loginData.message}`);
    console.log(`✅ Logged in as: ${loginData.user.name} (${loginData.user.role}, ${loginData.user.branch})`);
    const studentToken = loginData.token;

    // 3. Login as Admin by College ID
    console.log('\n3. Testing POST /api/auth/login (Admin by College ID)...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ADMIN001',
        password: 'Admin@123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginData.success) throw new Error(`Admin login failed: ${adminLoginData.message}`);
    console.log(`✅ Logged in as Admin: ${adminLoginData.user.name} (${adminLoginData.user.role})`);

    // 4. Get Current User (/auth/me)
    console.log('\n4. Testing GET /api/auth/me...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json();
    console.log(`✅ Current authenticated user verified: ${meData.user.email}`);

    // 5. Get User Profile (/users/profile)
    console.log('\n5. Testing GET /api/users/profile...');
    const profileRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const profileData = await profileRes.json();
    console.log(`✅ Profile retrieved: ${profileData.profile.name}, Roll: ${profileData.profile.rollNumber}`);

    // 6. Update Profile
    console.log('\n6. Testing PUT /api/users/profile...');
    const updateRes = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        section: 'A',
      }),
    });
    const updateData = await updateRes.json();
    console.log(`✅ Profile updated: Section is now ${updateData.user.section}`);

    // 7. Student Registration
    console.log('\n7. Testing POST /api/auth/register-student (New student)...');
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const regStudentRes = await fetch(`${BASE_URL}/auth/register-student`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test Student ${randomId}`,
        email: `student${randomId}@campus.edu`,
        collegeId: `23CSE${randomId}`,
        rollNumber: `23CSE${randomId}`,
        branch: 'CSE',
        year: '1st Year',
        section: 'C',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    const regStudentData = await regStudentRes.json();
    if (!regStudentData.success) throw new Error(`Student register failed: ${regStudentData.message}`);
    console.log(`✅ New student registered: ${regStudentData.user.name} (${regStudentData.user.collegeId})`);

    // 8. Faculty Registration
    console.log('\n8. Testing POST /api/auth/register-faculty (New faculty)...');
    const regFacultyRes = await fetch(`${BASE_URL}/auth/register-faculty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Prof. Test Faculty ${randomId}`,
        email: `faculty${randomId}@campus.edu`,
        collegeId: `FAC_TEST_${randomId}`,
        department: 'Electronics & Communication',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      }),
    });
    const regFacultyData = await regFacultyRes.json();
    if (!regFacultyData.success) throw new Error(`Faculty register failed: ${regFacultyData.message}`);
    console.log(`✅ New faculty registered: ${regFacultyData.user.name} (${regFacultyData.user.department})`);

    console.log('\n🎉 ALL PHASE 1 BACKEND SMOKE TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

runTests();
