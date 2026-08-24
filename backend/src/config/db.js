import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusconnect';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Could not connect to local MongoDB at ${uri} (${error.message}).`);
    
    // In development, attempt to spin up an in-memory MongoDB instance as a fallback
    if (process.env.NODE_ENV !== 'production') {
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
    } else {
      throw error;
    }
  }
};
