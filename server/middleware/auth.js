const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model



const { check, validationResult } = require('express-validator');

const validateRegistration = [
    check('fullName', 'Name is required').trim().not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

// User Registration
router.post('/register', validateRegistration, async (req, res) => {
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
        const { fullName, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            fullName,
            email,
            password
        });

        await user.save();

        // Verify required environment variables
        if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
            console.error('JWT_SECRET or REFRESH_TOKEN_SECRET is not configured');
            return res.status(500).json({ 
                success: false,
                msg: 'Server configuration error' 
            });
        }

        // Generate access token
        const accessToken = jwt.sign(
            { 
                userId: user.id,
                role: user.role,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '15m',
                issuer: 'food-delivery-api',
                audience: 'food-delivery-client'
            }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { 
                userId: user.id,
                type: 'refresh'
            },
            process.env.REFRESH_TOKEN_SECRET,
            { 
                expiresIn: '7d',
                issuer: 'food-delivery-api',
                audience: 'food-delivery-client'
            }
        );

        // Set HTTP-only cookie for refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return user info and access token
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            accessToken
        });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error during registration',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
    }
});

const validateLogin = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists()
];

// Refresh Access Token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'No refresh token provided'
            });
        }

        // Verify the refresh token
        const decoded = jwt.verify(
            refreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        );

        // Check if user still exists and is active
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive'
            });
        }

        // Generate new access token with same structure as login
        const accessToken = jwt.sign(
            { 
                userId: user.id,
                role: user.role,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '15m',
                issuer: 'food-delivery-api',
                audience: 'food-delivery-client'
            }
        );

        res.json({ success: true, accessToken });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid or expired refresh token'
        });
    }
});

// Validate Access Token
router.get('/validate', async (req, res) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists and is active
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Token is not valid'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            },
            message: 'Token is valid'
        });

    } catch (error) {
        console.error('Token validation error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
});

// User Logout
router.post('/logout', (req, res) => {
    try {
        // Clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        res.json({ success: true, message: 'Successfully logged out' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Error during logout'
        });
    }
});

// User Login
router.post('/login', validateLogin, async (req, res) => {
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
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                msg: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                msg: 'Invalid credentials' 
            });
        }

        // Verify required environment variables
        if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
            console.error('JWT_SECRET or REFRESH_TOKEN_SECRET is not configured');
            return res.status(500).json({ 
                success: false,
                msg: 'Server configuration error' 
            });
        }

        // Generate access token with additional security claims
        const accessToken = jwt.sign(
            { 
                userId: user.id,
                role: user.role,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { 
                expiresIn: '15m',
                issuer: 'food-delivery-api',
                audience: 'food-delivery-client'
            }
        );

        // Generate refresh token with additional security claims
        const refreshToken = jwt.sign(
            { 
                userId: user.id,
                type: 'refresh'
            },
            process.env.REFRESH_TOKEN_SECRET,
            { 
                expiresIn: '7d',
                issuer: 'food-delivery-api',
                audience: 'food-delivery-client'
            }
        );

        // Set HTTP-only cookie for refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return user info and access token
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            accessToken
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error during login',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
    }
});

module.exports = router;
