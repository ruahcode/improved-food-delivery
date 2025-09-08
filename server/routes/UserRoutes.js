const express = require('express');
const router = express.Router();
// Rate limiter removed - using general rate limiting in server.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserSimple');
const Session = require('../models/Session');
// Simple auth middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    console.log('Token verification - Token present:', !!token);
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    console.log('Verifying token with JWT_SECRET:', process.env.JWT_SECRET ? 'Present' : 'Missing');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { userId: decoded.userId, email: decoded.email });
    
    const user = await User.findById(decoded.userId);
    console.log('User from token:', user ? { id: user._id, email: user.email, active: user.isActive } : 'Not found');
    
    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
  }
};

// Input validation middleware - simplified
const validateRegistration = [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Register a new user
router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt:', { ...req.body, password: req.body.password ? 'provided' : 'missing' });
        
        const { name, email, password, role = 'user' } = req.body;
        
        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }
        
        console.log('Processing registration for:', { name, email, role });
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new user
        const user = new User({
            fullName: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role
        });

        console.log('Saving new user...');
        await user.save();
        console.log('User saved successfully');

        // Generate token
        const token = user.generateAuthToken();
        
        // Create session for the new user
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const session = await user.createSession(userAgent, ipAddress);

        // Get user object without password
        const userObj = user.toObject();
        delete userObj.password;

        // Set secure HTTP-only cookie with enhanced security settings
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        };
        
        res.cookie('token', token, cookieOptions);

        console.log('Registration successful for:', userObj.email);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userObj,
            token: token
        });
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            ...(error.errors && { validationErrors: error.errors })
        });
        
        // Handle specific error types
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
        
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ email }).select('+password');
        console.log('User found:', user ? { id: user._id, email: user.email, hasPassword: !!user.password } : 'Not found');
        
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        console.log('Comparing passwords...');
        const isMatch = await user.comparePassword(password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password does not match');
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate token
        console.log('Generating token...');
        const token = user.generateAuthToken();
        console.log('Token generated successfully');
        
        // Create session
        console.log('Creating session...');
        const session = await user.createSession(
            req.get('user-agent') || '',
            req.ip
        );
        console.log('Session created:', session._id);

        // Set secure HTTP-only cookie
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/'
        };
        
        res.cookie('token', token, cookieOptions);

        // Return user data (without password)
        const userObj = user.toObject();
        delete userObj.password;

        console.log('Login successful for user:', userObj.email);
        res.json({
            success: true,
            user: userObj,
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Logout route
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // End the current session
        await Session.findByIdAndUpdate(req.session._id, { 
            expiresAt: new Date(),
            isActive: false 
        });

        // Clear the cookie with same options used to set it
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('token', {
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax'
        });

        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Logout from all devices (end all sessions)
router.post('/logout-all', verifyToken, async (req, res) => {
    try {
        // End all active sessions for the user
        await req.user.endAllSessions();

        // Clear the cookie with same options used to set it
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('token', {
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax'
        });

        res.json({
            success: true,
            message: 'Logged out from all devices'
        });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to logout from all devices',
            error: error.message
        });
    }
});

// Get current user profile with enhanced error handling
router.get('/me', verifyToken, async (req, res) => {
    try {
        console.log('GET /me request - User from token:', req.user ? { id: req.user._id, email: req.user.email } : 'No user');
        
        // Check if user exists in request (added by verifyToken middleware)
        if (!req.user || !req.user._id) {
            console.error('User not found in request. Possible session/token issue.');
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'User session not found or invalid'
            });
        }

        // Get fresh user data
        const user = await User.findById(req.user._id).select('-password');
        console.log('Fresh user data from DB:', user ? { id: user._id, email: user.email } : 'Not found');
        
        if (!user) {
            console.error(`User not found in database for ID: ${req.user._id}`);
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: 'User account not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile',
            error: error.message
        });
    }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        
        // Validate input
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        // Update user data
        const updateData = {
            fullName: name.trim(),
            ...(phone && { phone: phone.trim() }),
            ...(address && { address })
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

// Get all active sessions for current user
router.get('/sessions', verifyToken, async (req, res) => {
    try {
        const sessions = await req.user.getActiveSessions();
        res.json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user sessions',
            error: error.message
        });
    }
});

// End a specific session
router.delete('/sessions/:sessionId', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Find and end the session if it belongs to the current user
        const session = await Session.findOneAndUpdate(
            { _id: sessionId, user: req.user._id },
            { $set: { expiresAt: new Date() } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found or access denied'
            });
        }

        res.json({
            success: true,
            message: 'Session ended successfully'
        });
    } catch (error) {
        console.error('End session error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end session',
            error: error.message
        });
    }
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: 'Invalid authentication token'
        });
    }

    // Handle duplicate key errors (e.g., duplicate email)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value',
            error: `${field} already exists`
        });
    }

    // Default error handler
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

// Apply error handling middleware
router.use(errorHandler);

// Export the router and verifyToken middleware
module.exports = {
    router,
    verifyToken,
    errorHandler
};