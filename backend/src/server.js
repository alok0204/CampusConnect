import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { autoSeedIfEmpty } from './utils/seed.js';
import { getJwtSecret } from './utils/generateToken.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import clubRoutes from './routes/clubRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Narrowest safe proxy trust setting for reverse proxy hosting (Render)
// Trusts the 1st reverse proxy hop so req.ip correctly resolves the client IP for rate limiting
app.set('trust proxy', 1);

// Helper to parse and normalize configured production frontend URLs from CLIENT_URL
// Supports comma-separated origins and strips trailing slashes for exact origin matching
export const getProductionAllowedOrigins = () => {
  const envOrigins = process.env.CLIENT_URL || '';
  return envOrigins
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export const isOriginAllowed = (origin) => {
  // Allow requests with no origin header (mobile apps, curl, server-to-server health checks)
  if (!origin) return true;

  const normalizedOrigin = origin.trim().replace(/\/+$/, '');
  const prodOrigins = getProductionAllowedOrigins();

  if (process.env.NODE_ENV === 'production') {
    // In production, strictly match explicitly configured origins in CLIENT_URL
    // Wildcards and untrusted preview domains are strictly disallowed
    return prodOrigins.includes(normalizedOrigin);
  }

  // In development, allow configured origins, local development ports, and LAN IPs
  if (prodOrigins.includes(normalizedOrigin) || devOrigins.includes(normalizedOrigin)) {
    return true;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
    normalizedOrigin
  );
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads directory with explicit cross-origin headers
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Logging middleware in dev
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    app: 'Campus Connect API',
    version: '1.0.0',
    time: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/uploads', uploadRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server after connecting to Database
const startServer = async () => {
  try {
    // Fail-fast environment validation for production
    getJwtSecret();

    await connectDB();

    // Auto-seed demo data in development, or in production only if explicitly requested
    if (process.env.NODE_ENV !== 'production' || process.env.AUTO_SEED === 'true') {
      await autoSeedIfEmpty();
    } else {
      console.log('ℹ️ Skipping auto-seeding in production mode (set AUTO_SEED=true to seed initial demo data).');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Campus Connect Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export default app;
