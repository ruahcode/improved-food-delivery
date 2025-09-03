const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const logger = require('../utils/logger');
const sendEmail = require('../utils/email');

// Generate a random token
const generateToken = (bytes = 32) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(bytes, (err, buf) => {
      if (err) {
        logger.error('Error generating token', { error: err });
        return reject(err);
      }
      resolve(buf.toString('hex'));
    });
  });
};

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many login attempts, please try again after 15 minutes',
});

// Register a new user
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }

    try {
        const { name, fullName, email, password, role = 'user' } = req.body;
        const userName = fullName || name;

        if (!userName) {
            return res.status(400).json({
                success: false,
                error: 'Name is required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            name: userName,
            email,
            password,
            role
        });

        await user.save();

        // Generate JWT token
        const token = user.generateAuthToken();
        
        // Create session
        const session = await user.createSession(req.get('user-agent') || '', req.ip);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            sessionId: session._id
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during registration',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Login user
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Please contact support.'
            });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        // Generate JWT token
        const token = user.generateAuthToken();
        
        // Create session
        const session = await user.createSession(req.get('user-agent') || '', req.ip);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            sessionId: session._id
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (sessionId) {
            // End specific session
            await Session.findByIdAndUpdate(sessionId, {
                isActive: false,
                endedAt: Date.now()
            });
        } else if (req.user) {
            // End all active sessions for the user
            await req.user.endAllSessions();
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during logout',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Middleware to check if user is authenticated
exports.requireAuth = (roles = []) => {
    return async (req, res, next) => {
        try {
            // Get token from header
            const token = req.header('Authorization')?.replace('Bearer ', '');
            console.log('Token received:', token ? 'Present' : 'Missing');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token, authorization denied'
                });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);
            
            // Check if user exists and is active
            const user = await User.findById(decoded.userId).select('-password');
            console.log('User found:', user ? { id: user._id, role: user.role, active: user.isActive } : 'Not found');
            
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Token is not valid'
                });
            }

            // Check user role if roles are specified
            console.log('Required roles:', roles, 'User role:', user.role);
            if (roles.length > 0 && !roles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to access this route'
                });
            }

            // Add user and token to request object
            req.user = user;
            req.token = token;
            
            next();
        } catch (error) {
            console.error('Authentication error:', error);
            res.status(401).json({
                success: false,
                error: 'Token is not valid',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };
}

// Forgot password request
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if the email exists or not
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = await generateToken();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token and expiry to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const message = `You are receiving this email because you (or someone else) has requested a password reset.\n\n` +
      `Please click on the following link to complete the process within one hour of receiving it:\n\n` +
      `${resetUrl}\n\n` +
      `If you did not request this, please ignore this email and your password will remain unchanged.`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message
    });

    logger.info(`Password reset email sent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    
    // Reset the token and expiry in case of error
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({
      success: false,
      error: 'Email could not be sent',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset user password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user by token and check if it's not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Invalidate all existing sessions
    await Session.deleteMany({ user: user._id });
    
    await user.save();

    // Send confirmation email
    const message = `Your password has been successfully reset.\n\n` +
      `If you did not request this change, please contact us immediately.`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Successful',
      message
    });

    logger.info(`Password reset for user ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Error resetting password',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/auth/verify-email/:token
 * @desc    Verify user email
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    
    await user.save();

    logger.info(`Email verified for user ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    logger.error('Email verification error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Error verifying email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
exports.resendVerification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Don't reveal if the email exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a verification email.'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }

    // Generate verification token
    const verificationToken = await generateToken();
    const verificationExpiry = Date.now() + 3600000; // 1 hour from now

    // Save token and expiry to user
    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    user.emailVerificationExpire = verificationExpiry;
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Send email
    const message = `Please verify your email by clicking on the following link. This link will expire in 1 hour.\n\n` +
      `${verificationUrl}\n\n` +
      `If you did not create an account, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email',
      message
    });

    logger.info(`Verification email resent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Verification email resent. Please check your email.'
    });
  } catch (error) {
    logger.error('Resend verification email error', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Error sending verification email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Apply rate limiting to auth endpoints
exports.authLimiter = authLimiter;
