import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const orderId = searchParams.get('orderId');
        const txRef = searchParams.get('tx_ref');
        
        if (!orderId) {
          throw new Error('No order ID found in URL');
        }

        // Verify the payment status with your backend
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/payment/verify/${orderId}`, 
          { withCredentials: true }
        );

        if (response.data.success) {
          setPaymentStatus('success');
          setOrder(response.data.order);
        } else {
          setPaymentStatus('failed');
          setError(response.data.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setPaymentStatus('error');
        setError(err.response?.data?.message || 'Failed to verify payment status');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <FaSpinner className="animate-spin text-red-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success' && order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-6xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Thank you for your order.</p>
          
          <div className="bg-gray-50 p-4 rounded-lg text-left mb-6">
            <h3 className="font-semibold mb-2">Order Details</h3>
            <p><span className="font-medium">Order ID:</span> {order._id}</p>
            <p><span className="font-medium">Amount:</span> ETB {order.totalPrice?.toFixed(2)}</p>
            <p><span className="font-medium">Status:</span> {order.paymentStatus}</p>
          </div>
          
          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  // Show error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <FaTimesCircle className="text-red-500 text-6xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment {paymentStatus === 'failed' ? 'Failed' : 'Error'}</h2>
        <p className="text-gray-600 mb-6">
          {error || 'There was an issue processing your payment. Please try again or contact support.'}
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/cart')}
            className="bg-gray-200 text-gray-800 py-2 px-6 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Cart
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
