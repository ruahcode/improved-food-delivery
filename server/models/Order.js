//userId
//restaurantId
//items
//totalPrice
//createdAt
//updatedAt
//paymentStatus
//deliveryStatus

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: props => `${props.value} is not a valid user ID`
        }
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: [true, 'Restaurant ID is required'],
        validate: {
            validator: function(v) {
                return mongoose.Types.ObjectId.isValid(v);
            },
            message: props => `${props.value} is not a valid restaurant ID`
        }
    },
    items: [{
        menuItemId: {
            type: Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: [true, 'Menu item ID is required']
        },
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1'],
            max: [100, 'Maximum quantity is 100']
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        }
    }],
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['pending', 'paid', 'completed', 'failed', 'refunded', 'unpaid', 'processing'],
            message: '{VALUE} is not a valid payment status'
        },
        default: 'pending'
    },
    deliveryStatus: {
        type: String,
        enum: {
            values: ['pending', 'preparing', 'out for delivery', 'delivered', 'cancelled'],
            message: '{VALUE} is not a valid delivery status'
        },
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: {
            values: ['cash_on_delivery', 'card', 'online_payment', 'chapa'],
            message: '{VALUE} is not a valid payment method'
        },
        default: 'cash_on_delivery',
        required: true
    },
    deliveryAddress: {
        type: String,
        required: [true, 'Delivery address is required'],
        trim: true,
        minlength: [3, 'Delivery address is too short'],
        maxlength: [500, 'Delivery address is too long']
    },
    specialInstructions: {
        type: String,
        default: '',
        trim: true,
        maxlength: [500, 'Special instructions are too long']
    },
    tx_ref: {
        type: String,
        trim: true
    },
    paymentHistory: [{
        amount: Number,
        currency: String,
        transactionId: String,
        paymentMethod: String,
        status: String,
        timestamp: { type: Date, default: Date.now },
        verificationData: Object,
        verifiedVia: String
    }],
    paymentVerifiedAt: Date,
    status: {
        type: String,
        enum: ['pending', 'pending_payment', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        get: function() { return this.totalPrice; }
    }
}, {
    timestamps: true
});

// Add indexes for faster querying
orderSchema.index({ userId: 1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ deliveryStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ tx_ref: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Order;