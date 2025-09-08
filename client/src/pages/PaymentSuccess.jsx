// client/src/pages/PaymentSuccess.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSpinner, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const PaymentSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Memoize searchParams to prevent unnecessary re-renders
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [_order, setOrder] = useState(null); // Prefix with underscore to indicate intentionally unused
  const [error, setError] = useState('');

  useEffect(() => {
    let retryTimeout;
    let isMounted = true;

    const verifyPayment = async (retryCount = 0) => {
      try {
        // Handle authentication restoration if needed
        if (searchParams.get('restoreAuth') === 'true') {
          const authToken = searchParams.get('authToken');
          if (authToken) {
            localStorage.setItem('token', authToken);
            // Remove auth params from URL
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('restoreAuth');
            newUrl.searchParams.delete('authToken');
            window.history.replaceState({}, '', newUrl);
          }
        }

        // Get order ID from URL params or search params
        const currentOrderId = orderId || searchParams.get('orderId');
        
        if (!currentOrderId) {
          throw new Error('No order ID found');
        }

        // Get tx_ref from URL params if available
        const tx_ref = searchParams.get('tx_ref');
        
        // Choose verification endpoint based on available parameters
        const verifyEndpoint = tx_ref 
          ? `${import.meta.env.VITE_API_BASE_URL}/payment/verify/tx/${tx_ref}`
          : `${import.meta.env.VITE_API_BASE_URL}/payment/verify/${currentOrderId}`;
        
        console.log(`Verifying payment using endpoint: ${verifyEndpoint}`);
        
        // Get auth token
        const token = localStorage.getItem('token');
        
        // Verify payment with backend
        const response = await axios.get(
          verifyEndpoint,
          { 
            withCredentials: true,
            headers: {
              'Authorization': token ? `Bearer ${token}` : undefined,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );

        if (!isMounted) return;

        if (response.data.success) {
          if (response.data.paymentStatus === 'processing') {
            // Payment is still processing, retry after delay
            const retryAfter = response.data.retryAfter || 5000;
            toast.info('Payment is being processed. Please wait...');
            
            retryTimeout = setTimeout(() => {
              if (retryCount < 10) { // Max 10 retries (about 50 seconds total)
                verifyPayment(retryCount + 1);
              } else {
                setError('Payment verification is taking longer than expected. Please check your orders.');
                setIsLoading(false);
              }
            }, retryAfter);
            return;
          }
          
          // Payment is confirmed
          setOrder(response.data.order || { _id: currentOrderId });
          toast.success('Payment successful! Your order has been confirmed.');
          setIsLoading(false);
        } else {
          throw new Error(response.data.message || 'Payment verification failed');
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Payment verification error:', error);
        
        // Handle different types of errors
        let errorMessage = 'Failed to verify payment';
        
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          
          if (status === 401 || status === 403) {
            errorMessage = 'Authentication required. Please log in.';
          } else if (status === 404) {
            errorMessage = 'Order not found. Please check your order details.';
          } else {
            errorMessage = data?.message || error.message || 'Failed to verify payment';
          }
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message || 'Failed to verify payment';
        }
        
        setError(errorMessage);
        
        // Only show error toast if this is not a retry attempt
        if (!retryTimeout) {
          toast.error('There was an issue verifying your payment. Please check your orders.');
        }
        
        setIsLoading(false);
      }
    };

    verifyPayment();

    // Cleanup function
    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [orderId, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-700">Verifying your payment...</h2>
          <p className="text-gray-500 mt-2">Please wait while we confirm your payment details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">
            <FaTimesCircle className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/orders')}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <FaCheckCircle className="text-6xl text-green-500 mb-6 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order. Your payment has been processed successfully.
          {(orderId || searchParams.get('orderId')) && (
            <span className="block mt-2 font-medium">
              Order ID: {orderId || searchParams.get('orderId')}
            </span>
          )}
          {searchParams.get('tx_ref') && (
            <span className="block mt-1 text-sm text-gray-500">
              Transaction: {searchParams.get('tx_ref')}
            </span>
          )}
          {searchParams.get('warning') === 'verification_delayed' && (
            <span className="block mt-2 text-sm text-yellow-600">
              Note: Payment verification took longer than expected. If you have concerns, please contact support.
            </span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            View My Orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;