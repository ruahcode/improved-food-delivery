const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const query = search ? {
            $or: [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
};

// @desc    Get all orders with pagination
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const query = status ? { deliveryStatus: status } : {};

        const orders = await Order.find(query)
            .populate('userId', 'fullName email')
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            orders,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res) => {
    try {
        const [totalUsers, totalOrders, totalRevenue, recentOrders] = await Promise.all([
            User.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Order.find()
                .populate('userId', 'fullName')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        res.json({
            success: true,
            analytics: {
                totalUsers,
                totalOrders,
                totalRevenue: revenue,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
};

// @desc    Get total active products
// @route   GET /api/admin/stats/total-products
// @access  Private/Admin
exports.getTotalProducts = async (req, res) => {
    try {
        const totalProducts = await MenuItem.countDocuments({ isAvailable: true });
        res.json({ success: true, totalProducts });
    } catch (error) {
        console.error('Error fetching total products:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch total products' 
        });
    }
};

// @desc    Get total orders
// @route   GET /api/admin/stats/total-orders
// @access  Private/Admin
exports.getTotalOrders = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        res.json({ success: true, totalOrders });
    } catch (error) {
        console.error('Error fetching total orders:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch total orders' 
        });
    }
};

// @desc    Get total users
// @route   GET /api/admin/stats/total-users
// @access  Private/Admin
exports.getTotalUsers = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        res.json({ success: true, totalUsers });
    } catch (error) {
        console.error('Error fetching total users:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch total users' 
        });
    }
};

// @desc    Get total revenue
// @route   GET /api/admin/stats/total-revenue
// @access  Private/Admin
exports.getTotalRevenue = async (req, res) => {
    try {
        const result = await Order.aggregate([
            { 
                $match: { 
                    paymentStatus: 'completed'
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    total: { $sum: '$totalPrice' } 
                } 
            }
        ]);
        
        const totalRevenue = result.length > 0 ? result[0].total : 0;
        res.json({ success: true, totalRevenue });
    } catch (error) {
        console.error('Error fetching total revenue:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch total revenue' 
        });
    }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ success: false, error: 'Failed to update user status' });
    }
};

// @desc    Get detailed analytics
// @route   GET /api/admin/analytics/detailed
// @access  Private/Admin
exports.getDetailedAnalytics = async (req, res) => {
    try {
        const { timeRange = 'week' } = req.query;
        const now = new Date();
        let startDate;

        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const [revenueData, orderData, popularItems, customerStats] = await Promise.all([
            // Revenue over time
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, paymentStatus: 'completed' } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        revenue: { $sum: '$totalPrice' }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Orders over time
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Popular items
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.name',
                        orders: { $sum: '$items.quantity' }
                    }
                },
                { $sort: { orders: -1 } },
                { $limit: 5 }
            ]),
            // Customer statistics
            User.aggregate([
                {
                    $facet: {
                        total: [{ $count: 'count' }],
                        newCustomers: [
                            { $match: { createdAt: { $gte: startDate } } },
                            { $count: 'count' }
                        ]
                    }
                }
            ])
        ]);

        const totalCustomers = customerStats[0].total[0]?.count || 0;
        const newCustomers = customerStats[0].newCustomers[0]?.count || 0;
        const avgOrderValue = await Order.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, avg: { $avg: '$totalPrice' } } }
        ]);

        res.json({
            success: true,
            analytics: {
                revenueData,
                orderData,
                popularItems,
                customerData: {
                    totalCustomers,
                    newCustomers,
                    avgOrderValue: avgOrderValue[0]?.avg || 0,
                    repeatRate: totalCustomers > 0 ? Math.round(((totalCustomers - newCustomers) / totalCustomers) * 100) : 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching detailed analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch detailed analytics' });
    }
};

// @desc    Get all products/menu items
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        const query = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const products = await MenuItem.find(query)
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await MenuItem.countDocuments(query);

        res.json({
            success: true,
            products,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const product = await MenuItem.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('restaurantId', 'name');

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: 'Failed to update product' });
    }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await MenuItem.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
};
