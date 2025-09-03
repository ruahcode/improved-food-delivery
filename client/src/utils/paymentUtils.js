import axios from 'axios';
import API_BASE_URL from '../config';

/**
 * Payment utility functions for handling Chapa payment flow
 * with authentication state preservation
 */

/**
 * Restore authentication state from URL parameters or session storage
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {boolean} Whether authentication was restored
 */
export const restoreAuthenticationState = (searchParams) => {
  try {
    // Check for auth restoration flag
    const shouldRestore = searchParams.get('restoreAuth') === 'true';
    if (!shouldRestore) return false;

    // Try to restore from URL parameter (secure session token)
    const authToken = searchParams.get('authToken');
    if (authToken) {
      localStorage.setItem('token', authToken);
      console.log('Authentication restored from payment callback');
      
      // Clean up URL parameters for security
      const url = new URL(window.location);
      url.searchParams.delete('authToken');
      url.searchParams.delete('session');
      window.history.replaceState({}, '', url.toString());
      
      return true;
    }

    // Fallback: check if token exists in localStorage
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
      console.log('Authentication already present');
      return true;
    }

    console.warn('Authentication restoration requested but no token available');
    return false;
  } catch (error) {
    console.error('Error restoring authentication state:', error);
    return false;
  }
};

/**
 * Verify payment status with the backend
 * @param {string} orderId - Order ID to verify
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Payment verification result
 */
export const verifyPaymentStatus = async (orderId, token) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    if (!token) {
      throw new Error('Authentication token is required');
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/payment/verify/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 15000 // 15 second timeout
      }
    );

    return {
      success: response.data.success,
      status: response.data.paymentStatus,
      order: response.data.order,
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    
    return {
      success: false,
      status: 'error',
      order: null,
      data: null,
      error: error.response?.data?.message || error.message || 'Payment verification failed'
    };
  }
};

/**
 * Handle payment redirect with authentication preservation
 * @param {string} checkoutUrl - Chapa checkout URL
 * @param {Object} options - Additional options
 */
export const handlePaymentRedirect = (checkoutUrl, options = {}) => {
  try {
    if (!checkoutUrl) {
      throw new Error('Checkout URL is required');
    }

    // Store current authentication state for restoration
    const token = localStorage.getItem('token');
    if (token && options.preserveAuth !== false) {
      sessionStorage.setItem('prePaymentAuth', token);
      sessionStorage.setItem('prePaymentTimestamp', Date.now().toString());
    }

    // Store current location for potential fallback
    sessionStorage.setItem('prePaymentLocation', window.location.pathname);

    // Redirect to payment gateway
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Error handling payment redirect:', error);
    throw error;
  }
};

/**
 * Get payment status display information
 * @param {string} status - Payment status
 * @returns {Object} Display information for the status
 */
export const getPaymentStatusInfo = (status) => {
  const statusMap = {
    'paid': {
      type: 'success',
      title: 'Payment Successful',
      message: 'Your payment has been processed successfully.',
      icon: '✅',
      color: 'green'
    },
    'completed': {
      type: 'success',
      title: 'Payment Completed',
      message: 'Your order has been confirmed and is being processed.',
      icon: '✅',
      color: 'green'
    },
    'failed': {
      type: 'error',
      title: 'Payment Failed',
      message: 'Your payment could not be processed. Please try again.',
      icon: '❌',
      color: 'red'
    },
    'cancelled': {
      type: 'warning',
      title: 'Payment Cancelled',
      message: 'You cancelled the payment process.',
      icon: '⚠️',
      color: 'orange'
    },
    'pending': {
      type: 'info',
      title: 'Payment Pending',
      message: 'Your payment is being processed. Please wait.',
      icon: '⏳',
      color: 'blue'
    },
    'verifying': {
      type: 'info',
      title: 'Verifying Payment',
      message: 'We are verifying your payment status. Please wait.',
      icon: '🔄',
      color: 'blue'
    },
    'error': {
      type: 'error',
      title: 'Verification Error',
      message: 'There was an error verifying your payment. Please contact support.',
      icon: '⚠️',
      color: 'red'
    }
  };

  return statusMap[status] || statusMap['error'];
};

/**
 * Handle payment flow errors with proper user feedback
 * @param {Error} error - The error that occurred
 * @param {Function} navigate - React Router navigate function
 * @param {Object} options - Additional options
 */
export const handlePaymentError = (error, navigate, options = {}) => {
  console.error('Payment flow error:', error);

  const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
  
  // Store error details for the error page
  sessionStorage.setItem('paymentError', JSON.stringify({
    message: errorMessage,
    timestamp: Date.now(),
    details: options.includeDetails ? error.stack : undefined
  }));

  // Navigate to appropriate error page
  if (options.orderId) {
    navigate(`/order/${options.orderId}/failed?reason=error`);
  } else {
    navigate('/payment/failed?reason=general_error');
  }
};

/**
 * Clean up payment-related session storage
 */
export const cleanupPaymentSession = () => {
  try {
    sessionStorage.removeItem('prePaymentAuth');
    sessionStorage.removeItem('prePaymentTimestamp');
    sessionStorage.removeItem('prePaymentLocation');
    sessionStorage.removeItem('paymentError');
  } catch (error) {
    console.warn('Error cleaning up payment session:', error);
  }
};

/**
 * Check if authentication token is still valid
 * @param {string} token - JWT token to validate
 * @returns {Promise<boolean>} Whether token is valid
 */
export const validateAuthToken = async (token) => {
  try {
    if (!token) return false;

    const response = await axios.get(`${API_BASE_URL}/api/auth/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true,
      timeout: 5000
    });

    return response.data.success === true;
  } catch (error) {
    console.warn('Token validation failed:', error.message);
    return false;
  }
};

/**
 * Attempt to refresh authentication token
 * @returns {Promise<string|null>} New token or null if refresh failed
 */
export const refreshAuthToken = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {}, {
      withCredentials: true,
      timeout: 5000
    });

    if (response.data.success && response.data.accessToken) {
      localStorage.setItem('token', response.data.accessToken);
      return response.data.accessToken;
    }

    return null;
  } catch (error) {
    console.warn('Token refresh failed:', error.message);
    return null;
  }
};

/**
 * Initialize payment with authentication preservation
 * @param {Object} paymentData - Payment data including orderId, amount, etc.
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Checkout URL for redirect
 */
export const initializeSecurePayment = async (paymentData, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Store auth state before payment
    const authPersistence = (await import('./authPersistence')).default;
    authPersistence.storePrePaymentAuth(token);

    // Prepare payment payload
    const payload = {
      ...paymentData,
      return_url: `${window.location.origin}/order/${paymentData.orderId}/success?restoreAuth=true`,
      callback_url: `${API_BASE_URL}/api/payment/callback/${paymentData.orderId}`,
      ...options.additionalData
    };

    const response = await axios.post(`${API_BASE_URL}/api/payment`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Payment initialization failed');
    }

    const checkoutUrl = response.data?.data?.checkout_url;
    if (!checkoutUrl) {
      throw new Error('Invalid payment response');
    }

    return checkoutUrl;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

/**
 * Comprehensive authentication restoration for payment callbacks
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Promise<string|null>} Valid token or null
 */
export const restoreOrRefreshAuth = async (searchParams) => {
  try {
    // First, try to restore from callback
    const restored = restoreAuthenticationState(searchParams);
    if (restored) {
      const token = localStorage.getItem('token');
      const isValid = await validateAuthToken(token);
      if (isValid) return token;
    }

    // Try to refresh existing token
    const refreshedToken = await refreshAuthToken();
    if (refreshedToken) return refreshedToken;

    // Check session storage for pre-payment auth
    const prePaymentAuth = sessionStorage.getItem('prePaymentAuth');
    const prePaymentTimestamp = sessionStorage.getItem('prePaymentTimestamp');
    
    if (prePaymentAuth && prePaymentTimestamp) {
      const timeDiff = Date.now() - parseInt(prePaymentTimestamp);
      // Only use if less than 30 minutes old
      if (timeDiff < 30 * 60 * 1000) {
        localStorage.setItem('token', prePaymentAuth);
        const isValid = await validateAuthToken(prePaymentAuth);
        if (isValid) {
          cleanupPaymentSession();
          return prePaymentAuth;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error in authentication restoration:', error);
    return null;
  }
};
