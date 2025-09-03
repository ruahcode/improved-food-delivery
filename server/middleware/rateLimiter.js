const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Rate limiter specifically for the /api/user/me endpoint
const userMeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests to user profile endpoint, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use the built-in IPv6-safe key generator with user agent for more granular rate limiting
    const ip = ipKeyGenerator(req);
    return `${ip}-${req.headers['user-agent']}`;
  },
  skip: (req) => {
    // Skip rate limiting for authenticated users with a valid token
    return !!req.user && req.user.id;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

module.exports = {
  userMeLimiter,
  skip: () => false // Default skip function that can be overridden
};
