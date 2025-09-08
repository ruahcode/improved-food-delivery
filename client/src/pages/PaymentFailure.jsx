// client/src/pages/PaymentFailure.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaShoppingCart, FaHome } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PaymentFailure = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const error = searchParams.get('error');

  useEffect(() => {
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
    
    // Show error toast
    toast.error('Payment was not successful. Please try again.');
  }, [searchParams]);

  const errorMessages = {
    payment_failed: 'The payment could not be processed. Please try again or use a different payment method.',
    payment_declined: 'Your payment was declined. Please check your payment details and try again.',
    payment_cancelled: 'The payment was cancelled. Please try again if you wish to complete your purchase.',
    default: 'There was an issue processing your payment. Please try again or contact support if the problem persists.'
  };

  const getErrorMessage = () => {
    if (error && errorMessages[error]) {
      return errorMessages[error];
    }
    return errorMessages.default;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <FaTimesCircle className="text-6xl text-red-500 mb-6 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          {getErrorMessage()}
          {orderId && ` (Order ID: ${orderId})`}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
          >
            <FaShoppingCart className="mr-2" />
            Back to Cart
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
          >
            <FaHome className="mr-2" />
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;