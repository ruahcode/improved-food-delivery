const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { requireAuth } = require('../middleware/authMiddleware');

// Get all orders for the logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        console.log('Fetching orders for user:', req.user._id);
        
        // Get user ID from authenticated user
        const userId = req.user._id;
        
        // Only find orders for the authenticated user
        const orders = await Order.find({ userId })
            .populate('restaurantId', 'name image') // Populate restaurant name and image
            .populate('items.menuItemId', 'name price') // Populate menu item details
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean(); // Convert to plain JavaScript objects
            
        console.log(`Found ${orders.length} orders for user ${userId}`);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching orders', 
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Checkout route - MUST be before /:id route
router.post('/checkout', requireAuth, async (req, res) => {
    try {
        
        // Log incoming request for debugging
        console.log('Checkout request received:', {
            userId: req.user?._id,
            bodyUserId: req.body.userId,
            restaurantId: req.body.restaurantId,
            itemsCount: req.body.items?.length || 0,
            hasAddress: !!req.body.deliveryAddress,
            paymentMethod: req.body.paymentMethod || 'not provided',
            hasAuthUser: !!req.user
        });
        console.log('Request body:', req.body);
        console.log('Authenticated user:', req.user?._id);
        
        const { 
            restaurantId,
            items, 
            totalPrice, 
            deliveryAddress, 
            paymentMethod = 'cash_on_delivery',
            specialInstructions,
            status = 'pending'
        } = req.body;
        
        // Get userId from authenticated user
        const userId = req.user?._id;
        
        if (!userId) {
            console.error('No authenticated user found');
            await session.abortTransaction();
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in again.',
                error: 'No authenticated user'
            });
        }

        // 1. Validate required fields with detailed error messages
        const missingFields = [];
        if (!restaurantId) missingFields.push('restaurantId');
        if (!deliveryAddress) missingFields.push('deliveryAddress');
        if (!items || !Array.isArray(items) || items.length === 0) missingFields.push('items');
        
        if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
            console.error('Checkout validation failed:', errorMsg);
            return res.status(400).json({ 
                success: false, 
                message: errorMsg,
                missingFields
            });
        }

        // Validate ObjectId format for restaurantId
        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            const errorMsg = `Invalid restaurant ID format: ${restaurantId}`;
            console.error(errorMsg);
            return res.status(400).json({
                success: false,
                message: 'Invalid restaurant ID format',
                field: 'restaurantId',
                value: restaurantId
            });
        }

        // Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            const errorMsg = 'Items array is empty or invalid';
            console.error(errorMsg);
            return res.status(400).json({
                success: false,
                message: errorMsg,
                field: 'items'
            });
        }

        // Process and validate each item
        const processedItems = items.map(item => {
            // Ensure required fields exist
            if (!item.menuItemId) {
                throw new Error('Missing menuItemId in cart item');
            }
            if (!item.name) {
                throw new Error('Missing name in cart item');
            }
            if (!item.quantity || item.quantity < 1) {
                throw new Error(`Invalid quantity for item: ${item.name}`);
            }
            if (!item.price || item.price < 0) {
                throw new Error(`Invalid price for item: ${item.name}`);
            }

            return {
                menuItemId: item.menuItemId,
                name: item.name,
                quantity: parseInt(item.quantity, 10),
                price: parseFloat(item.price)
            };
        });

        // Calculate total price from items if not provided
        const calculatedTotal = processedItems.reduce(
            (sum, item) => sum + (item.price * item.quantity), 0
        );

        // Use provided total or calculated total, but validate if both exist
        const finalTotal = totalPrice || calculatedTotal;
        
        if (totalPrice && Math.abs(totalPrice - calculatedTotal) > 0.01) {
            console.warn(`Price mismatch: provided=${totalPrice}, calculated=${calculatedTotal}`);
        }

        // Create the order
        const order = new Order({
            userId: new mongoose.Types.ObjectId(userId),
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            items: processedItems,
            totalPrice: finalTotal,
            paymentMethod,
            paymentStatus: paymentMethod === 'chapa' ? 'unpaid' : 'pending',
            deliveryStatus: 'pending',
            deliveryAddress: String(deliveryAddress).trim(),
            specialInstructions: String(specialInstructions || '').trim(),
            status: paymentMethod === 'chapa' ? 'pending_payment' : 'pending'
        });
        
        // Save the order first to get the ID
        const savedOrder = await order.save();
        
        // If payment method is chapa, generate and save tx_ref
        if (paymentMethod === 'chapa') {
            const tx_ref = `order-${savedOrder._id}-${Date.now()}`;
            savedOrder.tx_ref = tx_ref;
            await savedOrder.save();
        }

        // Validate the order before saving
        const validationError = order.validateSync();
        if (validationError) {
            const errors = [];
            if (validationError.errors) {
                for (const field in validationError.errors) {
                    errors.push(validationError.errors[field].message);
                }
            }
            const errorMsg = `Validation failed: ${errors.join('; ')}`;
            console.error('Order validation error:', errorMsg, validationError);
            return res.status(400).json({
                success: false,
                message: errorMsg,
                errors: validationError.errors
            });
        }

        // Clear the cart after successful order
        await Cart.findOneAndUpdate(
            { userId: new mongoose.Types.ObjectId(userId) },
            { $set: { items: [] } }
        );
        
        console.log(`Order ${savedOrder._id} created successfully`);
        
        res.json({
            success: true,
            message: 'Order created successfully',
            order: savedOrder
        });

    } catch (error) {
        console.error('Error in checkout:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate order detected',
                error: error.message
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = [];
            for (const field in error.errors) {
                errors.push(error.errors[field].message);
            }
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors
            });
        }
        
        // Handle other errors
        console.error('Unexpected checkout error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        res.status(500).json({
            success: false,
            message: 'Error processing checkout',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/', async (req, res) => {
    const order = new Order({
        userId: req.body.userId,
        restaurantId: req.body.restaurantId,
        items: req.body.items,
        totalPrice: req.body.totalPrice,
        paymentStatus: req.body.paymentStatus,
        deliveryStatus: req.body.deliveryStatus,
        status: 'pending_payment' // Ensure status is set
    });
    try {
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Prevent GET /checkout from being treated as :id
router.get('/checkout', (req, res) => {
    return res.status(405).json({ success: false, message: 'Use POST /api/orders/checkout to create an order' });
});

// Get all orders for specific restaurant (specific route before /:id to avoid conflicts)
router.get('/restaurant/:restaurantId/orders', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const orders = await Order.find({ restaurantId });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }
    try {
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        order.userId = req.body.userId;
        order.restaurantId = req.body.restaurantId;
        order.items = req.body.items;
        order.totalPrice = req.body.totalPrice;
        order.paymentStatus = req.body.paymentStatus;
        order.deliveryStatus = req.body.deliveryStatus;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a specific order (requires authentication)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        // First find the order to verify ownership
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found or you do not have permission to delete it' 
            });
        }
        
        // Delete the order
        await Order.findByIdAndDelete(req.params.id);
        
        res.json({ 
            success: true,
            message: 'Order deleted successfully',
            orderId: req.params.id
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete all orders for a user (requires authentication)
router.delete('/user/me', requireAuth, async (req, res) => {
    try {
        const result = await Order.deleteMany({ userId: req.user._id });
        
        res.json({ 
            success: true,
            message: `Deleted ${result.deletedCount} orders`,
            ...result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/restaurant/:restaurantId', async (req, res) => {
    try {
        const order = await Order.deleteMany({ restaurantId: req.params.restaurantId });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/item/:itemId', async (req, res) => {
    try {
        const order = await Order.deleteMany({ itemId: req.params.itemId });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// PATCH endpoint to update order status
router.patch('/update-status/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        order.status = status;
        await order.save();
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;