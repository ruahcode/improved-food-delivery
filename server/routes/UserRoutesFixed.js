const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const User = require('../models/User');
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

// Simple registration
router.post('/register', async (req, res) => {
  try {
    console.log('Registration attempt:', { ...req.body, password: req.body.password ? 'provided' : 'missing' });
    
    const { name, fullName, email, password, role = 'user' } = req.body;
    const userName = name || fullName;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }
    
    console.log('Processing registration for:', { name, email, role });
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user using Mongoose (this will trigger pre-save middleware for password hashing)
    const user = new User({
      name: userName.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Don't hash here - let the model's pre-save middleware handle it
      role
    });

    console.log('Saving new user...');
    await user.save();
    console.log('User saved successfully');
    
    // Generate token
    const token = user.generateAuthToken();
    
    // Create session
    const session = await user.createSession(
      req.headers['user-agent'] || '',
      req.ip || ''
    );

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

    // Issue refresh token cookie for silent re-auth
    const refreshToken = jwt.sign(
      { userId: user._id, type: 'refresh' },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    // Get user object without password
    const userObj = user.toObject();
    delete userObj.password;

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

    // Issue refresh token cookie for silent re-auth
    const refreshToken = jwt.sign(
      { userId: user._id, type: 'refresh' },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

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

// Get current user
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

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }

    // Verify refresh token with dedicated secret
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Generate new access token
    const accessToken = user.generateAuthToken();

    res.json({ success: true, accessToken });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
});

// Logout route - no auth required since we're logging out
router.post('/logout', async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: false, // Set to false for development
      sameSite: 'lax'
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

// Update user profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'phone', 'address'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).send({ error: 'Invalid updates!' });
    }

    // If address is being updated, we need to handle it specially
    if (req.body.address) {
      req.user.address = { ...req.user.address, ...req.body.address };
      updates.splice(updates.indexOf('address'), 1);
    }

    // Update other fields
    updates.forEach(update => {
      if (update !== 'address') {
        req.user[update] = req.body[update];
      }
    });

    await req.user.save();
    
    // Remove sensitive data before sending response
    const user = req.user.toObject();
    delete user.password;
    delete user.tokens;
    delete user.avatar;

    res.send({ success: true, user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).send({ success: false, error: error.message });
  }
});

module.exports = { router, verifyToken };