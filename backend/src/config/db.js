import mongoose from 'mongoose';

/**
 * Redacts database credentials from MongoDB connection URI for safe logging.
 */
const sanitizeMongoUri = (uri) => {
  if (!uri) return '';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
};

export const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.trim() === '') {
      throw new Error('FATAL: MONGODB_URI environment variable is required in production.');
    }

    if (/localhost|127\.0\.0\.1/i.test(uri)) {
      throw new Error('FATAL: Production database cannot point to localhost or 127.0.0.1.');
    }

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ Production MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(
        `❌ Failed to connect to production MongoDB (${sanitizeMongoUri(uri)}):`,
        error.message
      );
      throw error;
    }
  }

  // Development mode: Attempt local MongoDB first, fallback to in-memory server
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusconnect';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Could not connect to local MongoDB at ${uri} (${error.message}).`);

    try {
      console.log('🔄 Starting fallback embedded MongoDB server for development...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`✅ Fallback in-memory MongoDB connected at: ${memUri}`);
      return conn;
    } catch (memError) {
      console.error('❌ Failed to start fallback MongoDB instance:', memError.message);
      throw error;
    }
  }
};
