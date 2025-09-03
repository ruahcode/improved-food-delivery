import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaShoppingCart, FaHome } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { apiRequest } from '../utils/api';

const PaymentCallback = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const verifyPayment = async () => {
    try {
      // Try to get token from localStorage first
      let token = localStorage.getItem('token');
      
      // If no token in localStorage, check URL params (for Chapa callback)
      if (!token && searchParams.get('token')) {
        token = searchParams.get('token');
        localStorage.setItem('token', token);
      }

      if (!token) {
        throw new Error('Authentication required. Please log in to view this page.');
      }

      // Get tx_ref from URL params if available
      const tx_ref = searchParams.get('tx_ref');
      
      // Choose verification endpoint based on available parameters
      const verifyEndpoint = tx_ref 
        ? `/payment/verify/tx/${tx_ref}`
        : `/payment/verify/${orderId}`;
      
      console.log(`Verifying payment using endpoint: ${verifyEndpoint}`);

      // Verify payment status with the server
      const { data, error: apiError } = await apiRequest(
        verifyEndpoint,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        { showLoader: true }
      );

      if (apiError) {
        throw new Error(apiError);
      }

      if (data.success) {
        setOrder(data.order || data);
        
        // Determine status from response
        const paymentStatus = data.paymentStatus || (data.order ? data.order.paymentStatus : null);
        
        if (paymentStatus === 'paid' || data.success) {
          // Redirect immediately to success page without showing intermediate success UI
          navigate(`/payment/success?orderId=${orderId}`, { replace: true });
          return;
          
        } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
          setStatus('failed');
          // Redirect to failed page with error details
          setTimeout(() => {
            navigate(`/payment/failed?orderId=${orderId}&error=payment_${paymentStatus}`, { replace: true });
          }, 1500);
          
        } else if (paymentStatus === 'processing') {
          // Payment is still being processed
          if (retryCount < 5) {
            setStatus('pending');
            toast.info('Payment verification is in progress. Please wait...');
            
            const retryDelay = data.retryAfter || 3000;
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              verifyPayment();
            }, retryDelay);
          } else {
            // After max retries, redirect to success with warning
            setStatus('success');
            toast.warning('Payment verification is taking longer than expected. Please check your orders.');
            setTimeout(() => {
              navigate(`/payment/success?orderId=${orderId}&warning=verification_delayed`, { replace: true });
            }, 1500);
          }
        } else {
          // For other statuses, treat as failed
          setStatus('failed');
          setTimeout(() => {
            navigate(`/payment/failed?orderId=${orderId}&error=payment_${paymentStatus}`, { replace: true });
          }, 1500);
        }
      } else {
        throw new Error(data.message || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to verify payment. Please try again.';
      let shouldRetry = false;
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        errorMessage = 'Network error during verification. Retrying...';
        shouldRetry = retryCount < 3;
      } else if (error.message.includes('Authentication required')) {
        errorMessage = 'Please log in to verify your payment.';
        // Redirect to login
        setTimeout(() => {
          navigate('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        }, 2000);
      }
      
      setError(errorMessage);
      
      if (shouldRetry) {
        setStatus('pending');
        toast.info('Retrying payment verification...');
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          verifyPayment();
        }, 3000);
      } else {
        setStatus('error');
        toast.error(errorMessage);
        
        // Redirect to failure page after a short delay
        setTimeout(() => {
          navigate(`/payment/failed?orderId=${orderId}&error=payment_verification_failed`, { replace: true });
        }, 2000);
      }
    }
  };

  useEffect(() => {
    // Handle authentication restoration if needed
    const urlSearchParams = new URLSearchParams(location.search);
    if (urlSearchParams.get('restoreAuth') === 'true') {
      const authToken = urlSearchParams.get('authToken');
      if (authToken) {
        localStorage.setItem('token', authToken);
        // Remove auth params from URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('restoreAuth');
        newUrl.searchParams.delete('authToken');
        window.history.replaceState({}, '', newUrl);
      }
    }
    
    // Only verify if we haven't started yet or if this is a retry
    if (status === 'verifying' || retryCount > 0) {
      verifyPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, navigate, retryCount]);

  if (status === 'verifying' || status === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <FaSpinner className="animate-spin text-6xl text-red-600 mb-6 mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {status === 'verifying' ? 'Verifying Payment' : 'Payment Processing'}
          </h2>
          <p className="text-gray-600 mb-6">
            {status === 'verifying' 
              ? 'Please wait while we verify your payment details...' 
              : 'Your payment is being processed. This may take a moment...'}
          </p>
          
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              Attempt {retryCount + 1} of {status === 'pending' ? '6' : '4'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Success status now redirects immediately, so this section is no longer needed

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaTimesCircle className="text-4xl text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Error
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'There was an issue processing your payment.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaSpinner className="animate-spin" />
              Try Again
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FaHome />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default loading state (shouldn't normally be reached)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Processing your request...</p>
      </div>
    </div>
  );
};

export default PaymentCallback;
