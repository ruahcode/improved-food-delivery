const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

exports.createRestaurant = async (req, res) => {
  try {
    const { name, cuisine, image, location, deliveryTime, country, rating, isOpen } = req.body;
    
    // Basic validation
    if (!name || !cuisine || !image || !location || !deliveryTime) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, cuisine, image, location, deliveryTime' 
      });
    }
    
    // Ensure deliveryTime is a number
    const parsedDeliveryTime = parseInt(deliveryTime, 10);
    if (isNaN(parsedDeliveryTime) || parsedDeliveryTime <= 0) {
      return res.status(400).json({ 
        message: 'Delivery time must be a positive number' 
      });
    }
    
    // Create restaurant object with validated data
    const newRestaurant = new Restaurant({
      name: name.trim(),
      cuisine: cuisine.trim(),
      image,
      location: location.trim(),
      deliveryTime: parsedDeliveryTime,
      country: country?.trim() || 'Ethiopia',
      isOpen: isOpen !== undefined ? isOpen : true,
      isPopular: false,
      rating: rating !== undefined ? parseFloat(rating) : 0
    });
    
    const savedRestaurant = await newRestaurant.save();
    res.status(201).json(savedRestaurant);
  } catch (error) {
    console.error('Restaurant creation error:', error);
    
    // Provide a more user-friendly error message
    let errorMessage = 'Failed to create restaurant';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors)
        .map(err => err.message)
        .join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'A restaurant with this information already exists';
    }
    
    res.status(400).json({ 
      message: errorMessage,
      details: error.errors ? Object.values(error.errors).map(err => err.message) : []
    });
  }
};

exports.getRestaurantAnalytics = async (req, res) => {
  try {
    const restaurantId = req.params.id;

    // Total Orders
    const totalOrders = await Order.countDocuments({ restaurant: restaurantId });

    // Total Revenue
    const orders = await Order.find({ restaurant: restaurantId });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Most Popular Menu Item
    const menuItems = await MenuItem.find({ restaurant: restaurantId });
    let popularItem = null;
    let maxCount = 0;
    for (const item of menuItems) {
      if (item.ordersCount && item.ordersCount > maxCount) {
        maxCount = item.ordersCount;
        popularItem = item;
      }
    }

    res.json({
      totalOrders,
      totalRevenue,
      mostPopularItem: popularItem ? popularItem.name : 'N/A',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Add this function or update your existing getRestaurants function

exports.getRestaurants = async (req, res) => {
  try {
    const { country } = req.query;
    let query = {};
    if (country) {
      query.country = country;
    }
    const restaurants = await Restaurant.find(query);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
