const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
    getUsers,
    getOrders,
    getAnalytics,
    getTotalProducts,
    getTotalOrders,
    getTotalUsers,
    getTotalRevenue,
    updateUserStatus,
    getDetailedAnalytics,
    getProducts,
    updateProduct,
    deleteProduct
} = require('../controllers/adminController');

// Admin middleware using the same auth system as user routes
const requireAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Session expired or invalid'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Session expired or invalid'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(401).json({
            success: false,
            error: 'Session expired or invalid'
        });
    }
};

// Protected admin route example
router.get('/dashboard', requireAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the admin dashboard',
        user: req.user
    });
});

// Data endpoints
router.get('/users', requireAdmin, getUsers);
router.put('/users/:id/status', requireAdmin, updateUserStatus);
router.get('/orders', requireAdmin, getOrders);
router.get('/analytics', requireAdmin, getAnalytics);
router.get('/analytics/detailed', requireAdmin, getDetailedAnalytics);
router.get('/products', requireAdmin, getProducts);
router.put('/products/:id', requireAdmin, updateProduct);
router.delete('/products/:id', requireAdmin, deleteProduct);

// Stats endpoints
router.get('/stats/total-products', requireAdmin, getTotalProducts);
router.get('/stats/total-orders', requireAdmin, getTotalOrders);
router.get('/stats/total-users', requireAdmin, getTotalUsers);
router.get('/stats/total-revenue', requireAdmin, getTotalRevenue);

module.exports = router;
