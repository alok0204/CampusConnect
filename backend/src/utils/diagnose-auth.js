import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const diagnose = async () => {
  console.log('🔍 Starting Authentication Diagnostics...\n');

  try {
    await connectDB();

    const count = await User.countDocuments();
    console.log(`📊 Total users in MongoDB: ${count}`);

    const users = await User.find().select('+passwordHash');
    console.log(`Found ${users.length} users in database:`);

    for (const u of users) {
      console.log(`\n--- User: ${u.name} (${u.role}) ---`);
      console.log(`Email:       ${u.email}`);
      console.log(`College ID:  ${u.collegeId}`);
      console.log(`Roll Number: ${u.rollNumber}`);
      console.log(`Branch/Dept: ${u.branch || u.department}`);
      console.log(`Hash in DB:  ${u.passwordHash?.substring(0, 20)}...`);

      // Test password comparison
      let testPass = 'Student@123';
      if (u.role === 'ADMIN') testPass = 'Admin@123';
      if (u.role === 'FACULTY') testPass = 'Faculty@123';

      const isMatch = await u.matchPassword(testPass);
      console.log(`Password check ('${testPass}'): ${isMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
    }

    // Test API call to /api/auth/login
    console.log('\n📡 Testing API /api/auth/login for all 4 test users...');
    const testCases = [
      { id: 'anshul.cse@campus.edu', pass: 'Student@123', label: 'CSE Student by Email' },
      { id: '22CSE042', pass: 'Student@123', label: 'CSE Student by College ID' },
      { id: 'rohit.ece@campus.edu', pass: 'Student@123', label: 'ECE Student by Email' },
      { id: 'dr.sharma@campus.edu', pass: 'Faculty@123', label: 'Faculty by Email' },
      { id: 'admin@campus.edu', pass: 'Admin@123', label: 'Admin by Email' },
      { id: 'ADMIN001', pass: 'Admin@123', label: 'Admin by College ID' },
      { id: 'anshul.cse@campus.edu', pass: 'WrongPass', label: 'Invalid password (should fail 401)' },
    ];

    for (const tc of testCases) {
      try {
        const res = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: tc.id, password: tc.pass }),
        });
        const data = await res.json();
        if (res.status === 200 && data.success) {
          console.log(`✅ [${tc.label}] Login successful: ${data.user.name} (Role: ${data.user.role}, Token returned: ${!!data.token})`);
        } else if (res.status === 401 && tc.pass === 'WrongPass') {
          console.log(`✅ [${tc.label}] Correctly rejected with 401: ${data.message}`);
        } else {
          console.log(`❌ [${tc.label}] Failed with status ${res.status}: ${data.message}`);
        }
      } catch (err) {
        console.error(`❌ [${tc.label}] Network / Connection error:`, err.message);
      }
    }

    console.log('\n🎯 Diagnostics completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Diagnostics error:', error);
    process.exit(1);
  }
};

diagnose();
