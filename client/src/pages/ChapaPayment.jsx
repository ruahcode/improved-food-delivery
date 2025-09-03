import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config';

const ChapaPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    email: '',
    fullName: '',
    orderId: '',
  });
  const [chapaConfig, setChapaConfig] = useState({
    publicKey: 'CHAPUBK_TEST-794xWlFZD7wX67SACb5IH3SpheEwmBwL',
    txRef: `tx-${Date.now()}`,
    currency: 'ETB',
  });

  useEffect(() => {
    // Get order details from location state
    const locationState = location.state || {};
    const { orderId, amount, email, firstName, lastName, fullName } = locationState;
    if (!orderId) {
      toast.error('No order ID provided');
      navigate('/checkout');
      return;
    }
    
    // Store current auth token before redirect
    const token = localStorage.getItem('token');
    if (token) {
      sessionStorage.setItem('prePaymentAuth', token);
      sessionStorage.setItem('prePaymentPath', window.location.pathname);
    }

    // Prefer explicit fullName, otherwise build from first/last
    const derivedFullName = (fullName && String(fullName).trim())
      || [firstName, lastName].filter(Boolean).join(' ').trim();

    setPaymentData(prev => ({
      ...prev,
      amount: amount || 0,
      orderId: orderId,
      email: (email || prev.email || '').trim(),
      fullName: (derivedFullName || prev.fullName || '').trim(),
    }));
    
    const txRef = `order-${orderId}-${Date.now()}`;
    setChapaConfig(prev => ({
      ...prev,
      txRef,
    }));
  }, [location, navigate]);

  const handleChange = (e) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields with better error messages
      if (!paymentData.orderId) {
        throw new Error('Order ID is missing. Please try the checkout process again.');
      }

      // Validate email format
      if (!paymentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.email)) {
        throw new Error('Please provide a valid email address');
      }

      // Validate amount
      const amount = parseFloat(paymentData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please provide a valid payment amount greater than 0');
      }

      // Ensure amount is in the correct format (2 decimal places)
      const formattedAmount = amount.toFixed(2);
      if (isNaN(formattedAmount) || parseFloat(formattedAmount) <= 0) {
        throw new Error('Invalid payment amount format');
      }

      // Get authentication token
      const token = localStorage.getItem('token') || sessionStorage.getItem('prePaymentAuth');

      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Store auth context for after payment redirect
      sessionStorage.setItem('prePaymentAuth', token);
      sessionStorage.setItem('prePaymentPath', window.location.pathname);

      // Helper to split full name into first and last for Chapa
      const splitFullName = (name) => {
        const safe = (name || '').trim();
        if (!safe) return ['Customer', 'User'];
        const parts = safe.split(/\s+/);
        const first = parts.shift() || 'Customer';
        const last = parts.join(' ') || 'User';
        return [first, last];
      };

      const [firstNameVal, lastNameVal] = splitFullName(paymentData.fullName);

      // Store authentication state securely before payment redirect
      try {
        const authPersistence = (await import('../utils/authPersistence')).default;
        if (authPersistence && typeof authPersistence.storePrePaymentAuth === 'function') {
          authPersistence.storePrePaymentAuth(token);
        }
      } catch (authError) {
        console.warn('Failed to store pre-payment auth:', authError);
        // Fallback to sessionStorage
        sessionStorage.setItem('prePaymentAuth', token);
      }

      // Store current location for fallback
      sessionStorage.setItem('prePaymentLocation', window.location.pathname);

      // Build enhanced return URL with authentication restoration
      const origin = window.location.origin;
      const successReturnUrl = `${origin}/order/${paymentData.orderId}/success`;
      const failureReturnUrl = `${origin}/order/${paymentData.orderId}/failed`;

      // Prepare payment payload with all required fields
      const paymentPayload = {
        amount: formattedAmount,
        currency: 'ETB',
        email: paymentData.email.trim().toLowerCase(),
        first_name: String(firstNameVal).substring(0, 50).trim(),
        last_name: String(lastNameVal).substring(0, 50).trim(),
        tx_ref: `order-${paymentData.orderId}-${Date.now()}`,
        return_url: successReturnUrl,
        callback_url: `${API_BASE_URL}/api/payment/callback/${paymentData.orderId}`,
        orderId: paymentData.orderId // Include orderId for backend processing
      };

      console.log('Preparing payment request with payload:', {
        ...paymentPayload,
        email: '[REDACTED]'
      });

      const response = await axios.post(
        `${API_BASE_URL}/payment`,
        paymentPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log('Payment API response:', response.data);

      if (response.data?.success === false) {
        throw new Error(response.data.message || 'Payment initialization failed');
      }

      if (!response.data?.data?.checkout_url) {
        console.error('Invalid response format from payment gateway:', response.data);
        throw new Error('Invalid response from payment service. Please try again.');
      }

      // Store payment session data
      const paymentSession = {
        orderId: paymentData.orderId,
        txRef: paymentPayload.tx_ref,
        amount: formattedAmount,
        timestamp: Date.now()
      };
      sessionStorage.setItem('paymentSession', JSON.stringify(paymentSession));

      // Redirect to payment gateway
      console.log('Redirecting to Chapa checkout...');
      window.location.href = response.data.data.checkout_url;
    } catch (error) {
      let errorMessage = 'Payment initialization failed. Please try again.';

      if (error.response) {
        // Server responded with error status code
        const { data } = error.response;
        let serverMessage = undefined;
        if (typeof data?.message === 'string') serverMessage = data.message;
        else if (typeof data?.error === 'string') serverMessage = data.error;
        else if (typeof data?.details?.message === 'string') serverMessage = data.details.message;

        // Handle validation errors
        if (!serverMessage && data?.details?.errors) {
          const validationErrors = Object.entries(data.details.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : ''}`)
            .join('; ');
          if (validationErrors) {
            serverMessage = `Validation error: ${validationErrors}`;
          }
        }

        if (!serverMessage && data) {
          try {
            serverMessage = JSON.stringify(data);
          } catch {
            serverMessage = 'Payment failed with an unexpected server response';
          }
        }

        if (serverMessage) errorMessage = serverMessage;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Payment error:', { error, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-red-900">Complete Your Payment</h2>
          <p className="mt-2 text-red-600">You'll be redirected to Chapa to complete your payment</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-red-600">Order ID:</span>
            <span className="font-medium">{paymentData.orderId}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-red-600">Amount:</span>
            <span className="font-bold">{paymentData.amount} {chapaConfig.currency}</span>
          </div>
        </div>

        <form id="chapa-payment-form" onSubmit={handleSubmit} className="mt-8">
          <div className="mb-4">
            <label className="block text-red-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={paymentData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
              placeholder="you@example.com"
            />
          </div>
          <div className="mb-4">
            <label className="block text-red-700 text-sm font-bold mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={paymentData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
              placeholder="Your full name"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/checkout')}
            className="text-sm font-medium text-red-600 hover:text-red-500"
          >
            ← Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapaPayment;