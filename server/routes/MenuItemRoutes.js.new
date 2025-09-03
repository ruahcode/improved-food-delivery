const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const admin = require('../middleware/admin');
const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsByRestaurant,
  getMenuItemById
} = require('../controllers/MenuItemController');

// Place custom filter routes BEFORE any parameterized routes
router.get('/delivery-options', async (req, res) => {
  try {
    const options = await MenuItem.distinct('deliveryOptions');
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all menu items or filter by restaurant ID
router.get('/', getMenuItems);

// Get menu items by restaurant ID
router.get('/restaurant/:restaurantId', getMenuItemsByRestaurant);

// Get single menu item by ID
router.get('/:id', getMenuItemById);

// Create a new menu item (admin only)
router.post('/', [admin.protect, admin.admin], createMenuItem);

// Update a menu item (admin only)
router.put('/:id', [admin.protect, admin.admin], updateMenuItem);

// Delete a menu item (admin only)
router.delete('/:id', [admin.protect, admin.admin], deleteMenuItem);

// Get popular filters
router.get('/popular-filters', async (req, res) => {
  try {
    const filters = await MenuItem.distinct('popularFilters');
    res.json(filters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
