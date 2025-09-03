import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaShoppingCart, 
  FaCreditCard, 
  FaMoneyBillWave, 
  FaMapMarkerAlt, 
  FaCheckCircle, 
  FaSpinner,
  FaExclamationTriangle,
  FaArrowLeft,
  FaSignInAlt
} from 'react-icons/fa';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';

// Helper function to parse price from string or number
// const parsePrice = (price) => {
//   if (price === null || price === undefined) return 0;
  
//   // If it's already a number, return it directly
//   if (typeof price === 'number') return price;
  
//   // If it's a string, remove any non-numeric characters except decimal point
//   if (typeof price === 'string') {
//     // Remove any currency symbols, commas, etc.
//     const cleaned = price.replace(/[^0-9.]/g, '');
//     // Convert to number and handle any potential NaN
//     const parsed = parseFloat(cleaned);
//     return isNaN(parsed) ? 0 : parsed;
//   }
  
//   return 0;
// };

const Checkout = () => {
  const navigate = useNavigate();
  const { 
    cart: cartContext, 
    getRestaurantsInCart, 
    getItemsForRestaurant, 
    clearCart 
  } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    specialInstructions: '',
    paymentMethod: 'cash_on_delivery'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  // Get cart items and restaurant data
  const getCartItems = () => {
    // Get all restaurants in cart
    const restaurants = getRestaurantsInCart();
    
    // If no restaurants, return empty array
    if (restaurants.length === 0) return [];
    
    // Set the restaurant from the first restaurant in the cart
    if (!restaurant && restaurants[0]) {
      setRestaurant(restaurants[0]);
    }
    
    // Get items for the current restaurant
    if (restaurant?._id) {
      return getItemsForRestaurant(restaurant._id);
    }
    
    // Fallback to first restaurant's items
    return getItemsForRestaurant(restaurants[0]._id);
  };
  
  const contextCart = getCartItems();

  // Calculate subtotal from cart items array with proper number handling and validation
  const calculateSubtotal = useCallback(() => {
    if (!Array.isArray(contextCart) || !contextCart.length) return 0;
    
    try {
      return contextCart.reduce((total, item, index) => {
        // Validate item structure
        if (!item) {
          console.warn(`Invalid item at index ${index} in cart:`, item);
          return total;
        }
        
        // Parse and validate price
        const price = parseFloat(item.price);
        if (isNaN(price) || price < 0) {
          console.warn(`Invalid price for item at index ${index}:`, item.price);
          return total;
        }
        
        // Parse and validate quantity
        const quantity = parseInt(item.quantity, 10);
        if (isNaN(quantity) || quantity < 1) {
          console.warn(`Invalid quantity for item at index ${index}:`, item.quantity);
          return total;
        }
        
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating subtotal:', error);
      return 0;
    }
  }, [contextCart]);
  
  // Debug logging
  useEffect(() => {
    const logCartData = () => {
      console.log('Cart Data in Checkout:', {
        items: contextCart,
        restaurantId: restaurant?._id,
        itemCount: contextCart.length,
        calculatedSubtotal: calculateSubtotal(),
        rawCartContext: cartContext,
        allRestaurants: getRestaurantsInCart()
      });
    };
    
    logCartData();
  }, [cartContext, restaurant, contextCart, calculateSubtotal, getRestaurantsInCart]);

  const deliveryFee = 5.00; // Fixed delivery fee to match Cart component
  const subtotal = calculateSubtotal();
  const total = (subtotal + deliveryFee).toFixed(2);
  
  // Debug log to check cart data (only in development)
  if (import.meta.env.DEV) {
    console.log('Cart data in Checkout:', {
      items: Array.isArray(contextCart) ? contextCart.map(item => ({
        id: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        restaurantId: item.restaurantId
      })) : [],
      restaurantId: restaurant?._id,
      itemCount: Array.isArray(contextCart) ? contextCart.length : 0,
      calculatedSubtotal: subtotal,
      rawCartContext: cartContext // Log the raw cart context for debugging
    });
  }
  
  const { deliveryAddress, specialInstructions, paymentMethod } = formData;
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed - ${name}:`, value, typeof value); // Debug log
    
    // Mark that we've manually modified the address
    if (name === 'deliveryAddress') {
      setHasModifiedAddress(true);
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: String(value || '').trim() // Ensure it's always a string
      };
      console.log('New form data:', newData); // Debug log
      return newData;
    });
  };
  
  const handleRadioChange = (value) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: value
    }));
  };

  // Track if we've manually modified the address
  const [hasModifiedAddress, setHasModifiedAddress] = useState(false);

  // Add this effect to log form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  useEffect(() => {
    // Redirect to login if not authenticated and not already on login/signup page
    if (!authLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login') && !currentPath.includes('signup')) {
        sessionStorage.setItem('returnToAfterAuth', window.location.pathname);
        sessionStorage.setItem('pendingCheckout', JSON.stringify({
          deliveryAddress: formData.deliveryAddress,
          specialInstructions: formData.specialInstructions,
          paymentMethod: formData.paymentMethod,
          restaurant: restaurant
        }));
        navigate('/login');
      }
      return;
    }

    // Only set the address if we haven't manually modified it yet
    if (isAuthenticated && !hasModifiedAddress) {
      const pendingCheckout = sessionStorage.getItem('pendingCheckout');
      
      if (pendingCheckout) {
        try {
          const { deliveryAddress, specialInstructions, paymentMethod } = JSON.parse(pendingCheckout);
          console.log('Setting form data from pending checkout:', { deliveryAddress });
          const addressValue = deliveryAddress || 
            (typeof user?.address === 'object' ? 
              (user.address.street || user.address.full || JSON.stringify(user.address)) : 
              String(user?.address || ''));
          setFormData(prev => ({
            ...prev,
            deliveryAddress: addressValue,
            specialInstructions: specialInstructions || '',
            paymentMethod: paymentMethod || 'cash_on_delivery'
          }));
          sessionStorage.removeItem('pendingCheckout');
        } catch (error) {
          console.error('Error parsing pending checkout:', error);
        }
      } else if (user?.address && !formData.deliveryAddress) {
        console.log('Setting form data from user address:', user.address, typeof user.address);
        const addressValue = typeof user.address === 'object' ? 
          (user.address.street || user.address.full || JSON.stringify(user.address)) : 
          String(user.address || '');
        setFormData(prev => ({
          ...prev,
          deliveryAddress: addressValue
        }));
      }
    }
  }, [
    isAuthenticated, 
    authLoading, 
    navigate, 
    user, 
    formData.deliveryAddress, 
    formData.paymentMethod, 
    formData.specialInstructions, 
    restaurant,
    hasModifiedAddress  // Added missing dependency
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Ensure user is authenticated
      if (!isAuthenticated) {
        // Save form data to session storage before redirecting to login
        sessionStorage.setItem('pendingCheckout', JSON.stringify({
          deliveryAddress: formData.deliveryAddress,
          specialInstructions: formData.specialInstructions,
          paymentMethod: formData.paymentMethod,
          restaurant: restaurant
        }));
        navigate('/login');
        return;
      }

      // Validate form
      const trimmedAddress = String(deliveryAddress || '').trim();
      console.log('Validating address:', { deliveryAddress, trimmedAddress, type: typeof deliveryAddress });
      if (!trimmedAddress) {
        setError('Please enter a delivery address');
        setIsLoading(false);
        return;
      }

      if (!paymentMethod) {
        setError('Please select a payment method');
        setIsLoading(false);
        return;
      }

      // For Chapa payments, we'll handle the navigation after order creation
      if (paymentMethod === 'chapa') {
        try {
          // First, create the order
          const order = await createOrder(trimmedAddress);
          
          if (order && order._id) {
            // Save auth token in session storage before redirecting to payment
            const token = localStorage.getItem('token');
            if (token) {
              sessionStorage.setItem('prePaymentAuth', token);
              sessionStorage.setItem('prePaymentPath', window.location.pathname);
            }
            
            // Then navigate to Chapa payment page with the order ID
            navigate('/chapa-payment', { 
              state: { 
                orderId: order._id,
                amount: order.totalPrice,
                email: user?.email || '',
                firstName: user?.firstName || 'Customer',
                lastName: user?.lastName || ''
              },
              replace: true
            });
          }
        } catch (error) {
          console.error('Error in Chapa payment flow:', error);
          setError(error.message || 'Failed to process payment. Please try again.');
          setIsLoading(false);
        }
        return;
      }

      // For cash on delivery, proceed with normal order creation
      const order = await createOrder(trimmedAddress);
      
      // Handle successful order creation for cash on delivery
      setOrderDetails(order);
      setOrderPlaced(true);
      clearCart();
      
      // Navigate to orders page
      setTimeout(() => {
        navigate('/orders', { 
          state: { 
            orderSuccess: true, 
            newOrderId: order._id,
            orderDetails: order
          } 
        });
      }, 2000);
      
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
      setIsLoading(false);
    }
  };

  // Helper function to create an order
  const createOrder = async (address) => {
    // Get the authentication token from the most reliable source
    const token = localStorage.getItem('token') || 
                 document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    try {
      // Debug: Log the cart and restaurant information for troubleshooting
      console.log('Cart items:', contextCart);
      console.log('Restaurant from props:', restaurant);
      console.log('Cart context:', cartContext);
      
      // Get restaurant ID from the most reliable source first
      let validRestaurant = null;
      let validRestaurantId = null;
      
      // 1. Check if we have a restaurant from props
      if (restaurant?._id) {
        validRestaurant = restaurant;
        validRestaurantId = restaurant._id;
      } 
      // 2. Check if we have a restaurant from the cart context
      if (!validRestaurantId && cartContext) {
        // Try to find the first cart entry with a restaurant
        const cartEntry = Object.values(cartContext).find(entry => entry?.restaurant?._id);
        if (cartEntry?.restaurant?._id) {
          validRestaurant = cartEntry.restaurant;
          validRestaurantId = cartEntry.restaurant._id;
        }
      }
      // 3. Try to get restaurant ID from cart items as fallback
      if (!validRestaurantId && Array.isArray(contextCart) && contextCart.length > 0) {
        const firstItem = contextCart[0];
        validRestaurantId = firstItem?.restaurantId || 
                          firstItem?.menuItem?.restaurantId ||
                          firstItem?.menuItemId?.restaurantId;
        
        if (validRestaurantId) {
          validRestaurantId = String(validRestaurantId).trim();
        }
      }
      
      if (!validRestaurantId) {
        console.error('Missing restaurant information. Cart context:', cartContext);
        throw new Error('Cannot determine restaurant. Your cart might be empty or the restaurant information is missing.');
      }
      
      // If we don't have the full restaurant object, try to fetch it
      if (!validRestaurant && validRestaurantId) {
        try {
          const response = await axios.get(`http://localhost:5000/api/restaurants/${validRestaurantId}`);
          if (response.data.success && response.data.restaurant) {
            validRestaurant = response.data.restaurant;
          }
        } catch (error) {
          console.error('Error fetching restaurant details:', error);
          // Continue with just the ID if we can't fetch details
        }
      }

      // Prepare order items with required fields
      const orderItems = contextCart.map(item => ({
        menuItemId: item.menuItemId || item._id,
        name: item.name || 'Menu Item',
        quantity: item.quantity || 1,
        price: item.price || 0
      }));

      // Calculate total price and include delivery fee to match UI total
      const itemsTotal = orderItems.reduce((sum, item) => {
        const priceNum = parseFloat(item.price) || 0;
        const qtyNum = parseInt(item.quantity) || 0;
        return sum + (priceNum * qtyNum);
      }, 0);
      const calculatedTotal = itemsTotal + deliveryFee;

      // Get user ID from AuthContext
      if (!user?._id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Prepare order data
      const orderData = {
        userId: String(user._id).trim(),
        restaurantId: validRestaurantId,
        restaurant: validRestaurant, // Include full restaurant data if available
        items: orderItems,
        totalPrice: parseFloat(calculatedTotal.toFixed(2)),
        deliveryAddress: String(address || '').trim(),
        paymentMethod: paymentMethod,
        specialInstructions: String(specialInstructions || '').trim(),
        status: 'pending',
        paymentStatus: paymentMethod === 'chapa' ? 'unpaid' : 'pending',
        deliveryStatus: 'pending',
        // Include additional restaurant info for the order
        restaurantName: validRestaurant?.name || 'Restaurant',
        restaurantAddress: validRestaurant?.address || ''
      };

      console.log('Creating order with data:', orderData);

      // Create order with proper authentication
      const response = await axios.post(
        '/api/order/checkout',
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true,
          validateStatus: (status) => status < 500
        }
      );

      console.log('Order creation response:', response.data);

      if (!response.data.success) {
        const errorMsg = response.data.message || 'Failed to create order';
        console.error('Order creation failed:', errorMsg, response.data);
        throw new Error(errorMsg);
      }

      if (!response.data.order) {
        throw new Error('Order was created but no order details were returned');
      }

      return response.data.order;
      
    } catch (error) {
      console.error('Error in createOrder:', {
        error: error.message,
        response: error.response?.data,
        cart: contextCart,
        restaurantId: restaurant?._id || null,
        paymentMethod,
        specialInstructions,
        total
      });
      throw error; // Re-throw to be handled by the caller
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-4xl text-red-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the current URL to redirect back after login
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('redirectAfterLogin', currentPath);
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <FaSignInAlt className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to proceed with checkout</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Log In
            </button>
            <p className="text-sm text-gray-500">Don't have an account?</p>
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-white text-red-600 border border-red-600 py-2 px-4 rounded-md hover:bg-red-50 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced && orderDetails) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">Your order has been received and is being processed.</p>

          {/* Flex row for order items and summary */}
          <div className="flex flex-col md:flex-row gap-8 bg-gray-50 p-6 rounded-lg text-left mb-6">
            {/* Ordered Items */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Ordered Items</h3>
              <ul className="space-y-2">
                {orderDetails.items && orderDetails.items.map((item, idx) => (
                  <li key={item.menuItemId || item._id || idx} className="flex justify-between items-center">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Order Summary */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Order Summary</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Order #:</span> {orderDetails.orderNumber || orderDetails._id}</p>
                <p>
                  <span className="font-medium">Status:</span>
                  <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                    {orderDetails.status || 'Processing'}
                  </span>
                </p>
                <p><span className="font-medium">Estimated Delivery:</span> 30-45 minutes</p>
                <p><span className="font-medium">Delivery Address:</span> {orderDetails.deliveryAddress}</p>
                <p><span className="font-medium">Payment Method:</span> 
                  {orderDetails.paymentMethod === 'chapa' ? 'Chapa Payment' : 'Cash on Delivery'}
                </p>
                <p className="mt-4 font-medium">Total: ${orderDetails.totalPrice?.toFixed(2)}</p>
              </div>
            </div>  
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              View Order Status
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-600 hover:text-gray-800"
            disabled={isLoading}
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-start">
            <FaExclamationTriangle className="text-xl mr-2 mt-1" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              <FaMapMarkerAlt className="inline mr-2" /> Delivery Address
            </label>
            <input
              type="text"
              name="deliveryAddress"
              value={String(deliveryAddress || '')}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your delivery address"
              disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Special Instructions (optional)
            </label>
            <textarea
              name="specialInstructions"
              value={specialInstructions}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="e.g. Leave at the door, call on arrival, etc."
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Payment Method</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={() => handleRadioChange('cash_on_delivery')}
                  className="mr-3"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium flex items-center">
                    <FaMoneyBillWave className="text-green-500 mr-2" />
                    Cash on Delivery
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Pay with cash when your order is delivered</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="chapa"
                  checked={paymentMethod === 'chapa'}
                  onChange={() => handleRadioChange('chapa')}
                  className="mr-3"
                  disabled={isLoading}
                />
                <div>
                  <div className="font-medium flex items-center">
                    <FaCreditCard className="text-blue-500 mr-2" />
                    Pay with Chapa
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Secure online payment with Chapa</p>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span>Delivery Fee:</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold mt-2">
              <span>Total:</span>
              <span>${total}</span>
            </div>
          </div>
          <button
            type="submit"
            className={`w-full py-3 rounded-md font-semibold text-lg transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
            disabled={isLoading}
            onClick={(e) => {
              if (paymentMethod === 'chapa') {
                e.preventDefault();
                // First submit the form to create the order
                handleSubmit(e).then(() => {
                  // The handleSubmit will handle the redirect to Chapa
                });
              }
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" /> 
                {paymentMethod === 'chapa' ? 'Processing Payment...' : 'Placing Order...'}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                {paymentMethod === 'chapa' ? (
                  <>
                    <FaCreditCard className="mr-2" /> Pay with Chapa (${total})
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="mr-2" /> Place Order (${total})
                  </>
                )}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;