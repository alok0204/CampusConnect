import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { uploadImageMiddleware } from '../middleware/upload.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = express.Router();

// Middleware wrapper to catch Multer file size / format errors gracefully
const handleImageUpload = (req, res, next) => {
  const upload = uploadImageMiddleware.single('image');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File is too large. Maximum allowed size is 10 MB.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed. Only JPG, JPEG, PNG, and WebP are allowed.',
      });
    }
    next();
  });
};

// Route: POST /api/uploads/image
router.post('/image', protect, handleImageUpload, uploadImage);

export default router;
