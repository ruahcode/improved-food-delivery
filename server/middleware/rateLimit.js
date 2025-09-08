const rateLimit = require('express-rate-limit');
const { MemoryStore } = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');

// Common rate limit configuration
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Default max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use IP + user agent for more accurate rate limiting
      const ip = ipKeyGenerator(req);
      return `${ip}_${req.headers['user-agent']}`;
    },
    skip = () => false,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    store = new MemoryStore({
      checkPeriod: 15 * 60 * 1000, // 15 minutes
    })
  } = options;

  return rateLimit({
    windowMs,
    max,
    keyGenerator,
    skip,
    skipFailedRequests,
    skipSuccessfulRequests,
    store,
    handler: (req, res, next, options) => {
      const { statusCode, message } = options;
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      
      res.status(statusCode).json({
        success: false,
        status: statusCode,
        message,
        retryAfter: Math.ceil(options.windowMs / 1000) // in seconds
      });
    },
    ...options
  });
};

/**
 * Rate limiting for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: 'Too many login attempts. Please try again later.',
  skipSuccessfulRequests: true, // Only count failed attempts
  skip: (req) => {
    // Skip rate limiting for trusted IPs (e.g., your office IP)
    const trustedIPs = process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [];
    return trustedIPs.includes(req.ip);
  }
});

/**
 * Rate limiting for registration routes
 * Less restrictive than login but still prevents abuse
 */
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 registration attempts per hour
  message: 'Too many registration attempts. Please try again later.',
  skipSuccessfulRequests: true, // Only count failed attempts
  skip: (req) => {
    // Skip rate limiting for trusted IPs
    const trustedIPs = process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [];
    return trustedIPs.includes(req.ip);
  }
});

/**
 * Rate limiting for public API endpoints
 * More lenient than auth endpoints but still protects against abuse
 */
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: 'Too many API requests. Please try again later.',
  skipFailedRequests: true, // Don't count failed requests
  skip: (req) => {
    // Skip rate limiting for certain paths or IPs
    const skipPaths = ['/api/status', '/health'];
    const trustedIPs = process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [];
    
    return skipPaths.includes(req.path) || trustedIPs.includes(req.ip);
  }
});

/**
 * Stricter rate limiting for sensitive operations
 * e.g., password resets, email verification, etc.
 */
const sensitiveOperationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many attempts. Please try again later.',
  skip: (req) => {
    // Skip rate limiting for trusted IPs
    const trustedIPs = process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [];
    return trustedIPs.includes(req.ip);
  },
  skipFailedRequests: false, // Count all attempts, successful or not
  keyGenerator: (req) => {
    // Include the request path in the key to limit per-endpoint
    const ip = ipKeyGenerator(req);
    return `${ip}_${req.path}`;
  }
});

module.exports = {
  authLimiter,
  registrationLimiter,
  apiLimiter,
  sensitiveOperationLimiter,
  createRateLimiter // Export for custom limiters in other files
};
