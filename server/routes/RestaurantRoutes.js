const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { getRestaurantAnalytics, createRestaurant } = require('../controllers/RestaurantController');
// Auth middleware removed - using simplified approach

// Add address-based restaurant search route with input sanitization
router.get('/search/by-address', async (req, res) => {
    try {
        let { address, radius = 10 } = req.query;
        
        // Input validation and sanitization
        if (!address || typeof address !== 'string' || address.trim().length === 0) {
            return res.status(400).json({ message: 'A valid address is required' });
        }
        
        // Sanitize the address input
        address = address.trim().replace(/[{}[\]()&|\-+*?^$\\]/g, '');
        
        // Validate radius is a positive number
        radius = parseInt(radius, 10);
        if (isNaN(radius) || radius < 0 || radius > 100) {
            return res.status(400).json({ message: 'Invalid radius value' });
        }

        // Perform search with sanitized input
        const restaurants = await Restaurant.find({
            $and: [
                {
                    $or: [
                        { location: { $regex: address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
                        { name: { $regex: address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
                        { cuisine: { $regex: address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
                    ]
                },
                { isOpen: true }
            ]
        }).limit(20);

        res.json(restaurants);
    } catch (error) {
        console.error('Error searching restaurants by address:', error);
        res.status(500).json({ message: 'Error searching restaurants' });
    }
});

// Get restaurants by location coordinates with input validation
router.get('/search/by-location', async (req, res) => {
    try {
        let { lat, lng, radius = 10 } = req.query;
        
        // Input validation
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }
        
        // Convert and validate coordinates
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        radius = parseInt(radius, 10);
        
        if (isNaN(lat) || lat < -90 || lat > 90 ||
            isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }
        
        if (isNaN(radius) || radius < 0 || radius > 100) {
            return res.status(400).json({ message: 'Invalid radius value' });
        }

        // In a real app, you'd implement geospatial queries like this:
        // const restaurants = await Restaurant.find({
        //     location: {
        //         $near: {
        //             $geometry: {
        //                 type: 'Point',
        //                 coordinates: [lng, lat]
        //             },
        //             $maxDistance: radius * 1000 // Convert km to meters
        //         }
        //     },
        //     isOpen: true
        // }).limit(20);
        
        // For now, return all open restaurants with distance limit
        const restaurants = await Restaurant.find({ isOpen: true }).limit(20);
        
        res.json(restaurants);
    } catch (error) {
        console.error('Error searching restaurants by location:', error);
        res.status(500).json({ message: 'Error searching restaurants' });
    }
});

// This route was incorrectly returning promo codes - removing it
// router.get('/', async (req, res) => {
//     try {
//         const promoCodes = await PromoCode.find();
//         res.json(promoCodes);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

router.get('/popular', async (req, res) => {
    try {
        // Step 1: Get the top-rated restaurant for each country
        const topPerCountry = await Restaurant.aggregate([
            { $match: { isPopular: true } },
            { $sort: { country: 1, rating: -1 } },
            {
                $group: {
                    _id: "$country",
                    restaurant: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$restaurant" } }
        ]);
        // Step 2: Sort those by rating and pick the top 5
        const top5 = topPerCountry
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);
        res.json(top5);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all restaurants or filter by country
router.get('/', async (req, res) => {
    try {
        const { country, search } = req.query;
        const query = {};
        
        // Country filter with validation
        if (country) {
            if (typeof country !== 'string' || country.length > 100) {
                return res.status(400).json({ message: 'Invalid country parameter' });
            }
            query.country = { $regex: new RegExp(country.replace(/[^a-zA-Z0-9\s]/g, ''), 'i') };
        }
        
        // Search functionality with input sanitization
        if (search) {
            if (typeof search !== 'string' || search.length > 100) {
                return res.status(400).json({ message: 'Invalid search query' });
            }
            const sanitizedSearch = search.replace(/[^a-zA-Z0-9\s]/g, '');
            query.$or = [
                { name: { $regex: sanitizedSearch, $options: 'i' } },
                { 'address.city': { $regex: sanitizedSearch, $options: 'i' } },
                { cuisine: { $regex: sanitizedSearch, $options: 'i' } }
            ];
        }
        
        // Add pagination and limit results
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ rating: -1 }),
            Restaurant.countDocuments(query)
        ]);
        
        res.json({
            data: restaurants,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ message: 'Error fetching restaurants' });
    }
});

// Keep the /all route for backward compatibility
router.get('/all', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/open', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isOpen: true });
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/close', async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isOpen: false });
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Place custom filter routes BEFORE any parameterized routes
router.get('/cuisines', async (req, res) => {
  try {
    const cuisines = await Restaurant.distinct('cuisine');
    res.json(cuisines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single restaurant by ID
router.get('/:id', async (req, res) => {
    try {
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid restaurant ID format' });
        }
        
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({ message: 'Server error while fetching restaurant' });
    }
});










// Create new restaurant
router.post('/', createRestaurant);

//update the restaurant
// Middleware to check user role
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};

router.put('/:id', async (req, res) => {
    try {
        
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedRestaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(updatedRestaurant);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//delete the restaurant
router.delete('/:id', async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deletedRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get stats for a restaurant
router.get('/:id/stats', async (req, res) => {
  try {
    const restaurantId = req.params.id;
    // Total Orders
    const Order = require('../models/Order');
    const MenuItem = require('../models/MenuItem');

    const totalOrders = await Order.countDocuments({ restaurantId });
    // Total Revenue
    const orders = await Order.find({ restaurantId });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Top Item
    const allItems = await Order.aggregate([
      { $match: { restaurantId: mongoose.Types.ObjectId(restaurantId) } },
      { $unwind: "$items" },
      { $group: { _id: "$items.menuItemId", count: { $sum: "$items.quantity" } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    let topItem = null;
    if (allItems.length > 0) {
      const menuItem = await MenuItem.findById(allItems[0]._id);
      topItem = menuItem ? menuItem.name : null;
    }

    // Customer Rating (average)
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(restaurantId);
    const customerRating = restaurant?.rating || null;

    res.json({
      totalOrders,
      totalRevenue,
      topItem,
      customerRating
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// General dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const Order = require('../models/Order');
    const User = require('../models/User');
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    res.json({ totalRestaurants, totalOrders, totalUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/analytics', getRestaurantAnalytics);

module.exports = router;