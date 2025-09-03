const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

// Get all menu items
const getMenuItems = async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};

// Create a new menu item
const createMenuItem = async (req, res) => {
    try {
        const { restaurant, ...menuItemData } = req.body;
        
        // Create the menu item
        const newMenuItem = new MenuItem({
            ...menuItemData,
            restaurant: restaurant,
            isAvailable: menuItemData.isAvailable !== false // Default to true if not provided
        });

        const savedMenuItem = await newMenuItem.save();

        // Add the menu item to the restaurant's menuItems array
        if (restaurant) {
            await Restaurant.findByIdAndUpdate(
                restaurant,
                { $addToSet: { menuItems: savedMenuItem._id } },
                { new: true }
            );
        }

        res.status(201).json(savedMenuItem);
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Error creating menu item' });
    }
};

// Update a menu item
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { restaurant, ...updateData } = req.body;

        const updatedItem = await MenuItem.findByIdAndUpdate(
            id,
            { ...updateData, restaurant },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // If restaurant was changed, update both restaurants
        if (restaurant && restaurant !== updatedItem.restaurant) {
            // Remove from old restaurant
            await Restaurant.findByIdAndUpdate(
                updatedItem.restaurant,
                { $pull: { menuItems: id } }
            );
            // Add to new restaurant
            await Restaurant.findByIdAndUpdate(
                restaurant,
                { $addToSet: { menuItems: id } }
            );
        }

        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Error updating menu item' });
    }
};

// Delete a menu item
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First get the menu item to find its restaurant
        const menuItem = await MenuItem.findById(id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Delete the menu item
        await MenuItem.findByIdAndDelete(id);

        // Remove from restaurant's menuItems array
        if (menuItem.restaurant) {
            await Restaurant.findByIdAndUpdate(
                menuItem.restaurant,
                { $pull: { menuItems: id } }
            );
        }

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Error deleting menu item' });
    }
};

// Get menu items by restaurant
const getMenuItemsByRestaurant = async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ restaurant: req.params.restaurantId })
            .populate('restaurant', 'name');
        res.json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items by restaurant:', error);
        res.status(500).json({ message: 'Error fetching menu items' });
    }
};

// Get single menu item by ID
const getMenuItemById = async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id).populate('restaurant', 'name');
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ message: 'Error fetching menu item' });
    }
};

module.exports = {
    getMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemsByRestaurant,
    getMenuItemById
};
