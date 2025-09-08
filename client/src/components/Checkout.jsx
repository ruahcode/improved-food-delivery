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
import { validateCheckoutData, validateCartItems } from '../utils/checkoutValidation';
import { makeAuthenticatedRequest } from '../utils/tokenRefresh';
import API_BASE_URL from '../config';

const Checkout = () => {
  const navigate = useNavigate();
  const { getRestaurantsInCart, getItemsForRestaurant, clearCart, isLoading: cartLoading } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    deliveryAddress: '',
    specialInstructions: '',
    paymentMethod: 'cash_on_delivery'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [hasModifiedAddress, setHasModifiedAddress] = useState(false);
  const [contextCart, setContextCart] = useState([]);

  const getCartItems = useCallback(() => {
    const restaurants = getRestaurantsInCart();
    if (!restaurants.length) return [];

    if (!restaurant && restaurants[0]) {
      setRestaurant(restaurants[0]);
    }

    if (restaurant?._id) return getItemsForRestaurant(restaurant._id);

    return getItemsForRestaurant(restaurants[0]._id);
  }, [restaurant, getRestaurantsInCart, getItemsForRestaurant]);

  useEffect(() => {
    const items = getCartItems();
    setContextCart(items);
    
    // If no cart items and we're on checkout page, try to recover from sessionStorage
    if (items.length === 0 && window.location.pathname.includes('checkout')) {
      const pendingCheckout = sessionStorage.getItem('pendingCheckout');
      if (pendingCheckout) {
        try {
          const parsed = JSON.parse(pendingCheckout);
          if (parsed.restaurant) {
            setRestaurant(parsed.restaurant);
          }
        } catch (e) {
          console.error('Failed to recover checkout data:', e);
        }
      }
    }
  }, [getCartItems]);

  const calculateSubtotal = useCallback(() => {
    if (!Array.isArray(contextCart) || !contextCart.length) return 0;
    return contextCart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 0;
      return total + price * quantity;
    }, 0);
  }, [contextCart]);

  const deliveryFee = 5.0;
  const subtotal = calculateSubtotal();
  const total = (subtotal + deliveryFee).toFixed(2);

  const { deliveryAddress, specialInstructions, paymentMethod } = formData;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'deliveryAddress') setHasModifiedAddress(true);
    setFormData(prev => ({ ...prev, [name]: value || '' }));
  };

  const handleRadioChange = (value) => setFormData(prev => ({ ...prev, paymentMethod: value }));

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login') && !currentPath.includes('signup')) {
        sessionStorage.setItem('returnToAfterAuth', currentPath);
        sessionStorage.setItem('pendingCheckout', JSON.stringify({
          deliveryAddress,
          specialInstructions,
          paymentMethod,
          restaurant
        }));
        navigate('/login');
      }
      return;
    }

    if (isAuthenticated && !hasModifiedAddress) {
      const pendingCheckout = sessionStorage.getItem('pendingCheckout');
      if (pendingCheckout) {
        try {
          const parsed = JSON.parse(pendingCheckout);
          const addressValue = parsed.deliveryAddress || 
            (typeof user?.address === 'string' ? user.address : (user?.address?.street || ''));
          setFormData(prev => ({
            ...prev,
            deliveryAddress: addressValue,
            specialInstructions: parsed.specialInstructions || '',
            paymentMethod: parsed.paymentMethod || 'cash_on_delivery'
          }));
          sessionStorage.removeItem('pendingCheckout');
        } catch {
          console.error('Failed to parse pending checkout');
        }
      } else if (user?.address && !deliveryAddress) {
        const addressValue = typeof user.address === 'string' ? user.address : (user.address?.street || '');
        setFormData(prev => ({ ...prev, deliveryAddress: addressValue }));
      }
    }
  }, [isAuthenticated, authLoading, navigate, user, hasModifiedAddress, restaurant, deliveryAddress, specialInstructions, paymentMethod]);

  const createOrder = async (address) => {
    // Validate user is still authenticated
    if (!user || !user._id) {
      throw new Error('Session expired. Please log in again.');
    }

    let validRestaurantId = restaurant?._id || (contextCart[0]?.restaurantId || contextCart[0]?.menuItem?.restaurantId);
    if (!validRestaurantId) throw new Error('Cannot determine restaurant');

    const orderItems = contextCart.map(item => {
      const processedItem = {
        menuItemId: item.menuItemId || item._id,
        name: item.name || 'Menu Item',
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0
      };
      console.log('Processing cart item:', item, '-> processed:', processedItem);
      return processedItem;
    });

    const calculatedTotal = orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) + deliveryFee;

    const orderData = {
      restaurantId: validRestaurantId,
      items: orderItems,
      totalPrice: parseFloat(calculatedTotal.toFixed(2)),
      deliveryAddress: address,
      paymentMethod,
      specialInstructions: specialInstructions || ''
    };
    
    console.log('Final order data:', orderData);

    return await makeAuthenticatedRequest(async () => {
      console.log('Sending order data:', orderData);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/orders/checkout`,
        orderData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }, 
          withCredentials: true 
        }
      );

      if (!response.data.success) throw new Error(response.data.message || 'Failed to create order');
      return response.data.order;
    }).catch(error => {
      console.error('Checkout error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 500) {
        throw new Error(error.response?.data?.message || 'Server error occurred. Please try again.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Network error. Please check your connection.');
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isAuthenticated || !user?._id) {
        sessionStorage.setItem('pendingCheckout', JSON.stringify({ ...formData, restaurant }));
        navigate('/login');
        return;
      }

      // Comprehensive validation before checkout
      const validationData = {
        user,
        cart: contextCart,
        restaurant,
        deliveryAddress: String(deliveryAddress || '').trim(),
        paymentMethod
      };
      
      const validation = validateCheckoutData(validationData);
      if (!validation.isValid) {
        setError(validation.errors[0]);
        setIsLoading(false);
        if (validation.errors[0].includes('Cart is empty')) {
          setTimeout(() => navigate('/restaurants'), 2000);
        }
        return;
      }
      
      const cartValidation = validateCartItems(contextCart);
      if (!cartValidation.isValid) {
        setError(cartValidation.error);
        setIsLoading(false);
        return;
      }

      const trimmedAddress = validationData.deliveryAddress;
      
      if (paymentMethod === 'chapa') {
        const order = await createOrder(trimmedAddress);
        if (order?._id) {
          // Store auth context for after payment redirect
          const token = localStorage.getItem('token');
          sessionStorage.setItem('prePaymentAuth', token);
          sessionStorage.setItem('prePaymentPath', window.location.pathname);
          
          // Prepare payment payload
          const [firstName, lastName] = (user?.fullName || user?.firstName + ' ' + user?.lastName || 'Customer User').split(' ');
          const paymentPayload = {
            amount: order.totalPrice.toFixed(2),
            currency: 'ETB',
            email: user?.email?.trim().toLowerCase(),
            fullName: user?.fullName || `${user?.firstName || 'Customer'} ${user?.lastName || 'User'}`,
            tx_ref: `order-${order._id}-${Date.now()}`,
            orderId: order._id,
            deliveryAddress: trimmedAddress,
            city: 'Addis Ababa',
            state: 'Addis Ababa',
            country: 'Ethiopia',
            // Use the existing payment success/failure routes
            return_url: `${window.location.origin}/payment/success/${order._id}`,
            callback_url: `${API_BASE_URL}/payment/webhook`,
            // For development, you can add a test flag if needed
            ...(import.meta.env.MODE === 'development' && { test: 'true' })
          };
          
          // Call payment API directly
          const response = await axios.post(
            `${API_BASE_URL}/payment`,
            paymentPayload,
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          );
          
          if (response.data?.success && response.data?.data?.checkout_url) {
            // Redirect directly to Chapa checkout
            window.location.href = response.data.data.checkout_url;
          } else {
            throw new Error(response.data?.message || 'Payment initialization failed');
          }
        }
        return;
      }

      const order = await createOrder(trimmedAddress);
      setOrderDetails(order);
      setOrderPlaced(true);
      clearCart();

      setTimeout(() => navigate('/orders', { state: { orderSuccess: true, newOrderId: order._id, orderDetails: order } }), 2000);

    } catch (err) {
      console.error('Checkout submission error:', err);
      if (err.message?.includes('Session expired')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.setItem('pendingCheckout', JSON.stringify({ ...formData, restaurant }));
        navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
        return;
      }
      setError(err.message || 'Failed to place order');
      setIsLoading(false);
    }
  };

  if (authLoading || cartLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><FaSpinner className="animate-spin text-4xl text-red-500" /></div>;

  if (!isAuthenticated) {
    localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <FaSignInAlt className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to proceed with checkout</p>
          <div className="space-y-3">
            <button onClick={() => navigate('/login')} className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors">Log In</button>
            <p className="text-sm text-gray-500">Don't have an account?</p>
            <button onClick={() => navigate('/signup')} className="w-full bg-white text-red-600 border border-red-600 py-2 px-4 rounded-md hover:bg-red-50 transition-colors">Sign Up</button>
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-800" disabled={isLoading}><FaArrowLeft className="text-xl" /></button>
          <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
        </div>

        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-start"><FaExclamationTriangle className="text-xl mr-2 mt-1" /><span>{error}</span></div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2"><FaMapMarkerAlt className="inline mr-2" /> Delivery Address</label>
            <input type="text" name="deliveryAddress" value={String(deliveryAddress || '')} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Enter your delivery address" disabled={isLoading} />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Special Instructions (optional)</label>
            <textarea name="specialInstructions" value={specialInstructions} onChange={handleInputChange} className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="e.g. Leave at the door, call on arrival, etc." disabled={isLoading} />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Payment Method</label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="paymentMethod" value="cash_on_delivery" checked={paymentMethod === 'cash_on_delivery'} onChange={() => handleRadioChange('cash_on_delivery')} className="mr-3" disabled={isLoading} />
                <div><div className="font-medium flex items-center"><FaMoneyBillWave className="text-green-500 mr-2" /> Cash on Delivery</div><p className="text-sm text-gray-500 mt-1">Pay with cash when your order is delivered</p></div>
              </label>
              <label className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <input type="radio" name="paymentMethod" value="chapa" checked={paymentMethod === 'chapa'} onChange={() => handleRadioChange('chapa')} className="mr-3" disabled={isLoading} />
                <div><div className="font-medium flex items-center"><FaCreditCard className="text-blue-500 mr-2" /> Pay with Chapa</div><p className="text-sm text-gray-500 mt-1">Secure online payment with Chapa</p></div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center text-lg font-semibold"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-lg"><span>Delivery Fee:</span><span>${deliveryFee.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-xl font-bold mt-2"><span>Total:</span><span>${total}</span></div>
          </div>

          <button type="submit" className={`w-full py-3 rounded-md font-semibold text-lg transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`} disabled={isLoading}>
            {isLoading ? <span className="flex items-center justify-center"><FaSpinner className="animate-spin mr-2" /> {paymentMethod === 'chapa' ? 'Processing Payment...' : 'Placing Order...'}</span> : <span className="flex items-center justify-center">{paymentMethod === 'chapa' ? <><FaCreditCard className="mr-2" /> Pay with Chapa (${total})</> : <><FaShoppingCart className="mr-2" /> Place Order (${total})</>}</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
