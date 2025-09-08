import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { handlePaymentRedirect } from '../utils/paymentUtils';
import authPersistence from '../utils/authPersistence';
import axios from 'axios';
import API_BASE_URL from '../config';

/**
 * Enhanced Payment Flow Component
 * Demonstrates complete integration with authentication preservation
 */
const EnhancedPaymentFlow = ({ orderData, onPaymentStart }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /**
   * Initialize payment with enhanced authentication handling
   */
  const initiatePayment = async () => {
    try {
      // Ensure user is authenticated
      if (!isAuthenticated || !user) {
        toast.error('Please log in to proceed with payment');
        navigate('/login');
        return;
      }

      setIsProcessing(true);
      
      // Get current auth token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        navigate('/login');
        return;
      }

      // Store authentication state securely before payment
      authPersistence.storePrePaymentAuth(token);
      
      // Prepare payment data
      const paymentPayload = {
        amount: orderData.totalAmount,
        currency: 'ETB',
        email: user.email,
        first_name: user.fullName?.split(' ')[0] || 'Customer',
        last_name: user.fullName?.split(' ').slice(1).join(' ') || 'User',
        tx_ref: `order-${orderData.orderId}-${Date.now()}`,
        orderId: orderData.orderId,
        return_url: `${window.location.origin}/order/${orderData.orderId}/success?restoreAuth=true`,
        callback_url: `${API_BASE_URL}/api/payment/callback/${orderData.orderId}`
      };

      console.log('Initiating payment with enhanced flow...');
      
      // Call payment initialization API
      const response = await axios.post(
        `${API_BASE_URL}/api/payment`,
        paymentPayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Payment initialization failed');
      }

      const checkoutUrl = response.data?.data?.checkout_url;
      if (!checkoutUrl) {
        throw new Error('Invalid payment response - no checkout URL');
      }

      // Notify parent component
      if (onPaymentStart) {
        onPaymentStart(paymentPayload);
      }

      // Handle payment redirect with authentication preservation
      handlePaymentRedirect(checkoutUrl, {
        preserveAuth: true,
        orderId: orderData.orderId
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initialize payment');
      setIsProcessing(false);
      
      // Clear any stored auth data on error
      authPersistence.clearPaymentSession();
    }
  };

  return (
    <div className="enhanced-payment-flow">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Secure Payment</h3>
        
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{orderData.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-lg">ETB {orderData.totalAmount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{user?.fullName}</span>
            </div>
          </div>
        </div>

        {/* Security Features Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">🔒 Secure Payment Features</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✓ Authentication state preserved during payment</li>
            <li>✓ Automatic redirect after payment completion</li>
            <li>✓ Real-time payment status verification</li>
            <li>✓ Secure token handling and restoration</li>
          </ul>
        </div>

        {/* Payment Button */}
        <button
          onClick={initiatePayment}
          disabled={isProcessing || !isAuthenticated}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            isProcessing || !isAuthenticated
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              Processing Payment...
            </span>
          ) : (
            'Pay with Chapa'
          )}
        </button>

        {!isAuthenticated && (
          <p className="text-red-600 text-sm mt-2 text-center">
            Please log in to proceed with payment
          </p>
        )}

        {/* Payment Flow Information */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Payment Flow</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Your authentication state is securely stored</li>
            <li>2. You'll be redirected to Chapa payment gateway</li>
            <li>3. After payment, you'll return to our success/failure page</li>
            <li>4. Your authentication will be automatically restored</li>
            <li>5. Payment status will be verified and displayed</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

/**
 * Example usage component showing integration
 */
export const PaymentFlowExample = () => {
  const [orderData] = useState({
    orderId: 'example-order-123',
    totalAmount: 250.00,
    items: [
      { name: 'Pizza Margherita', price: 150.00 },
      { name: 'Coca Cola', price: 50.00 },
      { name: 'Delivery Fee', price: 50.00 }
    ]
  });

  const handlePaymentStart = (paymentData) => {
    console.log('Payment started:', paymentData);
    // You can track payment initiation here
  };

  const handlePaymentComplete = (result) => {
    console.log('Payment completed:', result);
    // Handle post-payment logic here
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Enhanced Payment Flow Demo</h2>
      
      <EnhancedPaymentFlow
        orderData={orderData}
        onPaymentStart={handlePaymentStart}
        onPaymentComplete={handlePaymentComplete}
      />
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Integration Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Replace orderData with real order information</li>
          <li>• Customize success/failure page styling</li>
          <li>• Add error handling for your specific use cases</li>
          <li>• Configure environment variables properly</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedPaymentFlow;
