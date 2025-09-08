import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  restoreOrRefreshAuth,
  verifyPaymentStatus,
  getPaymentStatusInfo,
  handlePaymentError,
  cleanupPaymentSession
} from '../utils/paymentUtils';

/**
 * Custom hook for managing payment flow with authentication preservation
 * @param {string} orderId - Order ID to track
 * @param {Object} options - Configuration options
 */
export const usePaymentFlow = (orderId, options = {}) => {
  const [status, setStatus] = useState('loading');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isAuthRestored, setIsAuthRestored] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const {
    autoVerify = true,
    redirectOnError = true,
    showToasts = true
  } = options;

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      setStatus('authenticating');
      
      // Attempt to restore or refresh authentication
      const token = await restoreOrRefreshAuth(searchParams);
      
      if (token) {
        setAuthToken(token);
        setIsAuthRestored(true);
        console.log('Authentication successfully restored/refreshed');
        return token;
      } else {
        console.warn('Failed to restore authentication');
        setError('Authentication required. Please log in again.');
        
        if (redirectOnError) {
          // Store current location for redirect after login
          sessionStorage.setItem('pendingPaymentVerification', orderId);
          navigate('/login');
        }
        
        return null;
      }
    } catch (error) {
      console.error('Authentication initialization error:', error);
      setError('Failed to restore authentication');
      return null;
    }
  }, [searchParams, orderId, navigate, redirectOnError]);

  /**
   * Verify payment status
   */
  const verifyPayment = useCallback(async (token) => {
    try {
      if (!token) {
        throw new Error('Authentication token required');
      }

      if (!orderId) {
        throw new Error('Order ID required');
      }

      setStatus('verifying');
      setError(null);

      const result = await verifyPaymentStatus(orderId, token);

      if (result.success) {
        setOrder(result.order);
        setStatus(result.status);
        
        if (showToasts) {
          const statusInfo = getPaymentStatusInfo(result.status);
          if (statusInfo.type === 'success') {
            toast.success(statusInfo.message);
          } else if (statusInfo.type === 'warning') {
            toast.warning(statusInfo.message);
          }
        }
      } else {
        setError(result.error);
        setStatus('failed');
        
        if (showToasts) {
          toast.error(result.error || 'Payment verification failed');
        }
      }

      return result;
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error.message);
      setStatus('error');
      
      if (showToasts) {
        toast.error('Failed to verify payment status');
      }
      
      return { success: false, error: error.message };
    }
  }, [orderId, showToasts]);

  /**
   * Retry payment verification
   */
  const retryVerification = useCallback(async () => {
    if (!authToken) {
      const token = await initializeAuth();
      if (token) {
        return await verifyPayment(token);
      }
    } else {
      return await verifyPayment(authToken);
    }
  }, [authToken, initializeAuth, verifyPayment]);

  /**
   * Handle payment completion (success or failure)
   */
  const handlePaymentComplete = useCallback((paymentStatus, orderData) => {
    try {
      // Clean up payment session data
      cleanupPaymentSession();
      
      // Store order data for reference
      if (orderData) {
        sessionStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
      }
      
      // Update status
      setStatus(paymentStatus);
      setOrder(orderData);
      
      console.log(`Payment completed with status: ${paymentStatus}`);
    } catch (error) {
      console.error('Error handling payment completion:', error);
    }
  }, [orderId]);

  /**
   * Navigate to appropriate page based on payment status
   */
  const navigateBasedOnStatus = useCallback((paymentStatus, fallbackPath = '/') => {
    try {
      switch (paymentStatus) {
        case 'paid':
        case 'completed':
          navigate(`/order/${orderId}/success`);
          break;
        case 'failed':
        case 'cancelled':
          navigate(`/order/${orderId}/failed`);
          break;
        case 'pending':
          navigate(`/order/${orderId}/pending`);
          break;
        default:
          navigate(fallbackPath);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      navigate(fallbackPath);
    }
  }, [navigate, orderId]);

  /**
   * Initialize the payment flow
   */
  useEffect(() => {
    const initializeFlow = async () => {
      try {
        // Initialize authentication
        const token = await initializeAuth();
        
        if (token && autoVerify) {
          // Verify payment status
          await verifyPayment(token);
        }
      } catch (error) {
        console.error('Payment flow initialization error:', error);
        if (redirectOnError) {
          handlePaymentError(error, navigate, { orderId });
        }
      }
    };

    if (orderId) {
      initializeFlow();
    } else {
      setError('Order ID is required');
      setStatus('error');
    }
  }, [orderId, initializeAuth, verifyPayment, autoVerify, redirectOnError, navigate]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Optional: cleanup on unmount
      if (status === 'completed' || status === 'failed') {
        cleanupPaymentSession();
      }
    };
  }, [status]);

  return {
    // State
    status,
    order,
    error,
    authToken,
    isAuthRestored,
    
    // Actions
    retryVerification,
    handlePaymentComplete,
    navigateBasedOnStatus,
    
    // Utilities
    statusInfo: getPaymentStatusInfo(status),
    isLoading: status === 'loading' || status === 'authenticating' || status === 'verifying',
    isSuccess: status === 'paid' || status === 'completed',
    isFailure: status === 'failed' || status === 'cancelled' || status === 'error',
    isPending: status === 'pending' || status === 'verifying'
  };
};
