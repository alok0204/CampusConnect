import dotenv from 'dotenv';
import mongoose from 'mongoose';
import readline from 'readline';
import { Writable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Resolve environment files from multiple standard locations regardless of execution directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. backend/.env relative to script directory (backend/src/utils -> backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// 2. backend/.env relative to current working directory
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
// 3. .env relative to current working directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// 4. Default dotenv lookup
dotenv.config();

const REQUIRED_DATABASE = 'campusconnect';

/**
 * Redacts database credentials from MongoDB connection URI for safe console output.
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/:\/\/([^@]+)@/, '://***:***@');
};

/**
 * Validates whether the URI follows MongoDB connection string format.
 */
export const isValidMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return false;
  return /^mongodb(?:\+srv)?:\/\//i.test(uri.trim());
};

/**
 * Checks whether URI points to localhost or 127.0.0.1 (matching backend/src/config/db.js rule).
 */
export const isLocalhostUri = (uri) => {
  if (!uri || typeof uri !== 'string') return false;
  return /localhost|127\.0\.0\.1/i.test(uri.trim());
};

/**
 * Extracts the explicit database name from a MongoDB connection URI if present.
 */
export const extractDatabaseName = (uri) => {
  if (!uri || typeof uri !== 'string') return null;
  try {
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^\/]+\/([^?\/]+)/i);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
};

/**
 * Prompts the user for MongoDB Atlas connection URI via standard input.
 */
const promptMongoUri = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdout.write('\nEnter your MongoDB Atlas Connection URI (mongodb+srv://.../campusconnect): ');

    rl.question('', (answer) => {
      rl.close();
      resolve(answer ? answer.trim() : '');
    });
  });
};

/**
 * Prompts the user for password input via standard input without echoing plaintext characters.
 */
const promptPassword = () => {
  return new Promise((resolve) => {
    let muted = false;
    const mutableStdout = new Writable({
      write: (chunk, encoding, callback) => {
        if (!muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    process.stdout.write('\nEnter secure password for the new Administrator (min 8 chars): ');
    muted = true;

    rl.question('', (answer) => {
      muted = false;
      process.stdout.write('\n');
      rl.close();
      resolve(answer ? answer.trim() : '');
    });
  });
};

export const createInitialAdmin = async () => {
  // Support standard MONGODB_URI or dedicated Atlas environment variables
  let uri = process.env.MONGODB_ATLAS_URI || process.env.ATLAS_URI || process.env.MONGODB_URI;

  // Localhost / 127.0.0.1 guard (identical to backend/src/config/db.js production check)
  // Admin creation requires the remote MongoDB Atlas database, never localhost or in-memory fallback
  if (uri && isLocalhostUri(uri)) {
    console.warn(`\n⚠️  Localhost URI detected in configuration (${sanitizeMongoUri(uri)}).`);
    console.warn('   CampusConnect admin creation targets your remote MongoDB Atlas cluster, not localhost.');
    console.warn('   Localhost fallback is disabled to prevent ECONNREFUSED.\n');
    uri = '';
  }

  // Interactive prompt if URI is missing or was pointing to localhost
  if (!uri || !uri.trim()) {
    if (process.stdin.isTTY) {
      uri = await promptMongoUri();
    }
  }

  // If still missing after prompt
  if (!uri || !uri.trim()) {
    console.error('\n❌ Error: MongoDB Atlas MONGODB_URI is required.');
    console.error('   CampusConnect admin creation requires a remote MongoDB Atlas database.\n');
    console.error('How to resolve:');
    console.error('  1. Open backend/.env and update MONGODB_URI with your MongoDB Atlas connection string:');
    console.error('     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/campusconnect?retryWrites=true&w=majority');
    console.error('  2. OR set it in PowerShell for this session before running:');
    console.error('     $env:MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/campusconnect?retryWrites=true&w=majority"');
    console.error('     npm run create-admin\n');
    process.exit(1);
  }

  // Final validation against localhost
  if (isLocalhostUri(uri)) {
    console.error('\n❌ Error: Localhost or 127.0.0.1 URI is not allowed for admin creation.');
    console.error('   Please provide a valid remote MongoDB Atlas connection string.\n');
    process.exit(1);
  }

  // Validate connection string format
  if (!isValidMongoUri(uri)) {
    console.error('\n❌ Error: MONGODB_URI is invalid. It must start with "mongodb://" or "mongodb+srv://".');
    console.error('   Please verify your connection string.\n');
    process.exit(1);
  }

  // Pre-connection check: Stop safely if URI explicitly targets a different database
  const explicitDb = extractDatabaseName(uri);
  if (explicitDb && explicitDb !== REQUIRED_DATABASE) {
    console.error(`\n❌ Error: The connection URI explicitly targets database "${explicitDb}".`);
    console.error(`   CampusConnect requires connecting specifically to the "${REQUIRED_DATABASE}" database.`);
    console.error('   Aborting safely without connecting or modifying any data.\n');
    process.exit(1);
  }

  const targetEmail = (process.env.ADMIN_EMAIL || 'AlokVishwas@gmail.com').toLowerCase().trim();
  const targetName = (process.env.ADMIN_NAME || 'Alok Vishwas').trim();
  const targetCollegeId = (process.env.ADMIN_COLLEGE_ID || 'ADMIN001').trim();

  try {
    console.log(`\n🔄 Connecting to MongoDB at ${sanitizeMongoUri(uri)}...`);

    // Explicitly target campusconnect database — never fall back to default 'test' database
    const conn = await mongoose.connect(uri, {
      dbName: REQUIRED_DATABASE,
      serverSelectionTimeoutMS: 10000,
    });

    const activeHost = conn.connection.host;
    const activeDbName = conn.connection.name;

    // Post-connection safety gate: verify the active database is campusconnect
    if (activeDbName !== REQUIRED_DATABASE) {
      console.error(`\n❌ Error: Connected database is "${activeDbName}" instead of "${REQUIRED_DATABASE}".`);
      console.error('   Never falling back to "test" or an unexpected database.');
      console.error('   Aborting safely without modifying any data.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Connected to MongoDB Cluster Host: ${activeHost}`);
    console.log(`Active Target Database Name: ${activeDbName}`);

    // Check for existing account before prompting for password
    const existing = await User.findOne({
      $or: [
        { email: targetEmail },
        { collegeId: targetCollegeId },
      ],
    });

    if (existing) {
      console.log(`\n⚠️ An account with email "${targetEmail}" or ID "${targetCollegeId}" already exists (Role: ${existing.role}).`);
      console.log('ℹ️ Refusing duplicate creation to prevent accidental overwrites or privilege conflicts.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Now that the database is verified and no duplicate exists, prompt for password
    let password = process.env.ADMIN_PASSWORD;

    if (!password || !password.trim()) {
      if (process.stdin.isTTY) {
        password = await promptPassword();
      } else {
        console.error('❌ Error: ADMIN_PASSWORD environment variable is required in non-interactive environments.');
        console.error('Please provide ADMIN_PASSWORD before running this script.\n');
        await mongoose.disconnect();
        process.exit(1);
      }
    }

    if (!password || password.length < 8) {
      console.error('❌ Error: Administrator password must be at least 8 characters long.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Refuse well-known trivial / default demo passwords for the production administrator
    const trivialPasswords = ['12345678', 'password', 'admin123', 'admin@123', 'campusconnect'];
    if (trivialPasswords.includes(password.toLowerCase())) {
      console.error('❌ Error: Insecure / default password detected. Please choose a strong, unique administrator password.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Hash password with bcryptjs (10 salt rounds)
    const passwordHash = await User.hashPassword(password);

    // Create administrator
    const admin = await User.create({
      name: targetName,
      email: targetEmail,
      passwordHash,
      collegeId: targetCollegeId,
      role: 'ADMIN',
      isVerified: true,
      department: 'Central Administration',
      branch: 'ADMIN',
    });

    console.log('\n🎉 Administrator account created successfully!');
    console.log(`   Name:       ${admin.name}`);
    console.log(`   Email:      ${admin.email}`);
    console.log(`   College ID: ${admin.collegeId}`);
    console.log(`   Role:       ${admin.role}`);
    console.log(`   Database:   ${activeDbName}`);
    console.log('   Status:     Active & Verified\n');
    console.log('🔒 Security Note: You can now log into Campus Connect with this email and password.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to connect or create administrator account:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

if (process.argv[1] && (process.argv[1].endsWith('createAdmin.js') || process.argv[1].endsWith('createAdmin'))) {
  createInitialAdmin();
}

export default createInitialAdmin;
