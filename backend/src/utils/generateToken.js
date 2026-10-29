import jwt from 'jsonwebtoken';

const DEV_FALLBACK_SECRET = 'campus_connect_super_secret_jwt_key_2026';

/**
 * Safely resolves the JWT secret.
 * In production, strictly requires process.env.JWT_SECRET to be present and non-default.
 * In development, falls back to the development secret for offline developer convenience.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim() === '' || secret === DEV_FALLBACK_SECRET) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is required in production and must not use the default development fallback key.'
      );
    }
    return secret;
  }

  return secret || DEV_FALLBACK_SECRET;
};

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

export default generateToken;
