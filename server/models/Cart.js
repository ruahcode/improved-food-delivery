//userId
//items
//totalPrice
//createdAt
//updatedAt
//restaurant

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    items: [{
        menuItemId:{
            type:Schema.Types.ObjectId,
            ref:'MenuItem',
            required:true
        },
        name: String,
        quantity: Number,
        price: Number,
        restaurant: {
            type:Schema.Types.ObjectId,
            ref:'Restaurant',
            required:true
        },
        restaurantName: String,
        
      }],
    restaurants:[{
        type:Schema.Types.ObjectId,
        ref:'Restaurant',
    }],
    totalPrice:{
        type:Number,
        default:0,
    }
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
