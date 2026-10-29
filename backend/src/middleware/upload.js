import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory (used for local development fallback and static serving)
const uploadsBaseDir = path.join(__dirname, '../../uploads');
export const imagesDir = path.join(uploadsBaseDir, 'images');

// Ensure upload directories exist for local development
[uploadsBaseDir, imagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Use in-memory buffer storage so images can be streamed to Cloudinary in production
// without leaving temporary disk artifacts, while still allowing local save in dev
const imageStorage = multer.memoryStorage();

// Image file filter (JPG, JPEG, PNG, WebP)
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid image file format. Only JPG, JPEG, PNG, and WebP images are permitted.'),
      false
    );
  }
};

// Multer upload middleware (Max 10MB per image)
export const uploadImageMiddleware = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
