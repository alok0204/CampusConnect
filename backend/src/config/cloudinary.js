import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

/**
 * Checks whether Cloudinary environment credentials are configured.
 * Supports either CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET).
 */
export const isCloudinaryConfigured = () => {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim() !== '') {
    return true;
  }
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY.trim() !== '' &&
      process.env.CLOUDINARY_API_SECRET &&
      process.env.CLOUDINARY_API_SECRET.trim() !== ''
  );
};

/**
 * Configures Cloudinary with secure: true to always return HTTPS asset URLs.
 */
export const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim() !== '') {
    cloudinary.config({
      cloudinary_url: process.env.CLOUDINARY_URL.trim(),
      secure: true,
    });
    return cloudinary;
  }

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true,
    });
    return cloudinary;
  }

  return null;
};

/**
 * Sanitizes any raw string or error message so secrets are never logged or exposed.
 */
export const sanitizeStorageError = (error) => {
  if (!error) return 'Image storage operation failed.';
  const message = error.message || String(error);
  return message
    .replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
    .replace(/api_secret[:=]\s*[^\s,&]+/gi, 'api_secret=***')
    .replace(/api_key[:=]\s*[^\s,&]+/gi, 'api_key=***');
};

/**
 * Uploads an in-memory image buffer to Cloudinary in the 'campusconnect' folder.
 * Returns an object containing the HTTPS secure_url, public_id, format, and size.
 */
export const uploadStreamToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const instance = configureCloudinary();
    if (!instance) {
      return reject(
        new Error('Cloudinary credentials are missing or incompletely configured.')
      );
    }

    const uniqueId = `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

    const stream = instance.uploader.upload_stream(
      {
        folder: 'campusconnect',
        resource_type: 'image',
        public_id: uniqueId,
        overwrite: true,
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(new Error(sanitizeStorageError(error)));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    stream.end(buffer);
  });
};

export default {
  isCloudinaryConfigured,
  configureCloudinary,
  uploadStreamToCloudinary,
  sanitizeStorageError,
};
