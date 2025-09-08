const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { 
  authLimiter, 
  registrationLimiter,
  sensitiveOperationLimiter 
} = require('../middleware/rateLimit');
const {
  registerValidation,
  loginValidation,
  handleValidationErrors
} = require('../middleware/authValidation');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  registrationLimiter,
  registerValidation,
  handleValidationErrors,
  authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  authLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

// @route   POST api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  '/forgot-password',
  sensitiveOperationLimiter,
  [
    check('email', 'Please include a valid email')
      .isEmail()
      .normalizeEmail()
  ],
  authController.forgotPassword
);

// @route   POST api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post(
  '/reset-password/:token',
  sensitiveOperationLimiter,
  [
    check('password')
      .isLength({ min: 8, max: 100 })
      .withMessage('Password must be between 8 and 100 characters')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[^a-zA-Z0-9]/)
      .withMessage('Password must contain at least one special character')
      .escape()
  ],
  authController.resetPassword
);

// @route   POST api/auth/logout
// @desc    Logout user / clear session
// @access  Private
router.post(
    '/logout',
    authController.requireAuth(),
    authController.logout
);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get(
  '/me',
  authController.requireAuth(),
  authController.getCurrentUser
);

// @route   POST api/auth/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.post(
  '/verify-email/:token',
  sensitiveOperationLimiter,
  authController.verifyEmail
);

// @route   POST api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post(
  '/resend-verification',
  sensitiveOperationLimiter,
  [
    check('email', 'Please include a valid email')
      .isEmail()
      .normalizeEmail()
  ],
  authController.resendVerification
);

module.exports = router;
