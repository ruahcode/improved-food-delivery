import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaArrowLeft, FaUtensils, FaSpinner, FaSignInAlt } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set loading to false after initial render
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-4xl text-red-500" />
      </div>
    );
  }

  const deliveryFee = 5.00; // Fixed delivery fee per restaurant
  const restaurantCount = Object.keys(cart).length;
  const subtotal = totalPrice;
  const total = subtotal + (restaurantCount * deliveryFee);

  if (restaurantCount === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="bg-white p-6 rounded-full mb-4">
          <FaUtensils className="text-4xl text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 py-10 px-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8 px-2">
          <button 
            onClick={() => navigate(-1)} 
            className="text-red-600 hover:text-red-700 flex items-center font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-center flex-grow text-gray-800">Your Cart</h1>
        </div>

        <div className="space-y-6 mb-8">
          {Object.entries(cart).map(([restaurantId, restaurantData]) => (
            <div key={restaurantId} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-red-50 px-6 py-3 border-b">
                <h2 className="font-semibold text-red-700">{restaurantData.restaurant.name}</h2>
              </div>
              <div className="p-4 space-y-4">
                {restaurantData.items.map(item => (
                  <div key={`${item.id}-${restaurantId}`} className="flex items-center justify-between gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img 
                        src={item.image || 'https://via.placeholder.com/100'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                      />
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                        <p className="text-gray-500 text-sm">${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                        <button 
                          onClick={() => updateQuantity(restaurantId, item._id, item.quantity - 1, item.selectedOptions)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-200 focus:outline-none"
                        >
                          <FaMinus size={10} />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium text-gray-700 bg-white">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(restaurantId, item._id, item.quantity + 1, item.selectedOptions)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-200 focus:outline-none"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                      <span className="font-medium w-16 text-right text-gray-700">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => removeFromCart(restaurantId, item._id, item.selectedOptions)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition"
                        title="Remove"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-right text-sm text-gray-600">
                  <div className="inline-flex items-center">
                    <span>Delivery fee: </span>
                    <span className="ml-2 font-medium">${deliveryFee.toFixed(2)}</span>
                    {/* <button 
                      onClick={() => {
                        if (window.confirm('Remove all items from this restaurant?')) {
                          Object.keys(cart[restaurantId].items).forEach(itemId => {
                            removeFromCart(restaurantId, itemId, cart[restaurantId].items[itemId].selectedOptions);
                          });
                        }
                      }}
                      className="ml-4 text-red-500 hover:text-red-700 text-xs flex items-center"
                    >
                      <FaTrash className="mr-1" size={10} /> Remove all
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sticky bottom-0">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fees ({restaurantCount} {restaurantCount === 1 ? 'restaurant' : 'restaurants'})</span>
              <span>${(restaurantCount * deliveryFee).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex justify-between font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                setShowAuthModal(true);
                return;
              }
              navigate('/checkout');
            }}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={authLoading}
          >
            {authLoading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                Loading...
              </span>
            ) : (
              'Proceed to Checkout'
            )}
          </button>
          
          {/* Authentication Required Modal */}
          {showAuthModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="text-center">
                  <FaSignInAlt className="text-4xl text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Sign In Required</h3>
                  <p className="text-gray-600 mb-6">Please sign in to proceed with your order</p>
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => {
                        localStorage.setItem('fromCheckout', 'true');
                        navigate('/login');
                      }}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setShowAuthModal(false)}
                      className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <p className="text-xs text-center text-gray-500 mt-2">
            By placing this order, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cart;