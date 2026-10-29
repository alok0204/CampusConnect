import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { imagesDir } from '../middleware/upload.js';
import {
  isCloudinaryConfigured,
  uploadStreamToCloudinary,
  sanitizeStorageError,
} from '../config/cloudinary.js';

/**
 * Handle single image upload.
 * In production: strictly requires Cloudinary and returns HTTPS URL from Cloudinary.
 * In development: uses Cloudinary if configured; falls back to local disk if unconfigured.
 * Never silently falls back to local disk in production.
 *
 * @route POST /api/uploads/image
 * @access Private
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded or invalid file format.',
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const hasCloudinary = isCloudinaryConfigured();

    // 1. Production Mode: Cloudinary is mandatory; no silent disk fallback allowed
    if (isProduction) {
      if (!hasCloudinary) {
        console.error(
          '❌ Cloudinary storage is required in production but credentials are not configured.'
        );
        return res.status(500).json({
          success: false,
          message:
            'Cloudinary image storage is required in production but credentials are not configured.',
        });
      }

      try {
        const result = await uploadStreamToCloudinary(req.file.buffer, {
          originalName: req.file.originalname,
        });

        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully.',
          url: result.secure_url,
          file: {
            filename: result.public_id,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size || result.bytes,
          },
        });
      } catch (cloudError) {
        const safeError = sanitizeStorageError(cloudError);
        console.error('❌ Cloudinary upload error:', safeError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to cloud storage.',
          error: safeError,
        });
      }
    }

    // 2. Development Mode with Cloudinary credentials present
    if (hasCloudinary) {
      try {
        const result = await uploadStreamToCloudinary(req.file.buffer, {
          originalName: req.file.originalname,
        });

        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully.',
          url: result.secure_url,
          file: {
            filename: result.public_id,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size || result.bytes,
          },
        });
      } catch (cloudError) {
        const safeError = sanitizeStorageError(cloudError);
        console.warn('⚠️ Cloudinary upload error in development:', safeError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary.',
          error: safeError,
        });
      }
    }

    // 3. Development Mode fallback: Save to local disk for offline convenience
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
      const filename = `img-${uniqueSuffix}${ext}`;
      const filePath = path.join(imagesDir, filename);

      await fs.promises.writeFile(filePath, req.file.buffer);

      const relativeUrl = `/uploads/images/${filename}`;

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully.',
        url: relativeUrl,
        file: {
          filename: filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (diskError) {
      console.error('❌ Error saving image to local disk:', diskError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to save image to local disk.',
        error: diskError.message,
      });
    }
  } catch (error) {
    const safeError = sanitizeStorageError(error);
    console.error('❌ Unexpected error in uploadImage controller:', safeError);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during file upload.',
      error: safeError,
    });
  }
};
