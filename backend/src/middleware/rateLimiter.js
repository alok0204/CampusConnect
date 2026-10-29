import { rateLimit } from 'express-rate-limit';

/**
 * Authentication rate limiter for sensitive endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/forgot-password
 *
 * Enforces a maximum of 10 requests per 15 minutes per client IP.
 * Uses draft-6 standard RateLimit-* headers.
 * Returns HTTP 429 with safe error message upon breach.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
  // In automated test suites, allow bypass via explicit test header only when not in production
  skip: (req) => {
    if (process.env.NODE_ENV === 'production') return false;
    return req.headers['x-bypass-rate-limit'] === 'test-suite';
  },
});

export default authLimiter;
