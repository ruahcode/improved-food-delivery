//name
//cuisine
//rating
//deliveryTime
//menuItems
//image
//isOpen
//location

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const restaurantSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Restaurant name is required'],
        trim: true,
        maxlength: [100, 'Restaurant name cannot exceed 100 characters']
    },
    cuisine: {
        type: String,
        required: [true, 'Cuisine type is required'],
        trim: true
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    deliveryTime: {
        type: Number,
        required: [true, 'Delivery time is required'],
        min: [1, 'Delivery time must be at least 1 minute']
    },
    menuItems: {
        type: Array,
        default: []
    },
    image: {
        type: String,
        required: [true, 'Restaurant image is required']
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    country: {
        type: String,
        trim: true,
        default: 'Ethiopia'
    }
}, {
    timestamps: true
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

//

module.exports = Restaurant;    