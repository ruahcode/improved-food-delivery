# Chapa Payment Integration Examples

## Quick Start Integration

### 1. Basic Payment Button with Auth Preservation

```jsx
import React, { useContext } from 'react';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import { initializeSecurePayment } from '../utils/paymentUtils';

const PaymentButton = ({ orderData }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to proceed');
      return;
    }

    try {
      setIsProcessing(true);
      
      const paymentData = {
        amount: orderData.totalAmount,
        currency: 'ETB',
        email: user.email,
        first_name: user.fullName?.split(' ')[0] || 'Customer',
        last_name: user.fullName?.split(' ').slice(1).join(' ') || 'User',
        orderId: orderData.orderId
      };

      const checkoutUrl = await initializeSecurePayment(paymentData);
      
      // This will preserve authentication and redirect
      window.location.href = checkoutUrl;
      
    } catch (error) {
      toast.error(error.message);
      setIsProcessing(false);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={isProcessing || !isAuthenticated}
      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
    >
      {isProcessing ? 'Processing...' : 'Pay with Chapa'}
    </button>
  );
};
```

### 2. Payment Status Page with Auto-Verification

```jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

const OrderPaymentStatus = () => {
  const { orderId } = useParams();
  
  const {
    status,
    order,
    error,
    isAuthRestored,
    retryVerification,
    statusInfo,
    isLoading,
    isSuccess
  } = usePaymentFlow(orderId, {
    autoVerify: true,
    showToasts: true
  });

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Verifying your payment...</p>
        {isAuthRestored && <p className="text-green-600 text-sm">✓ Authentication restored</p>}
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Your order has been confirmed.</p>
        
        {order && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Amount:</strong> ETB {order.totalAmount}</p>
            <p><strong>Status:</strong> {order.status}</p>
          </div>
        )}
        
        <button 
          onClick={() => window.location.href = '/orders'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <div className="text-6xl mb-4">❌</div>
      <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
      <p className="text-gray-600 mb-6">{error || 'Payment could not be processed'}</p>
      
      <div className="space-x-4">
        <button 
          onClick={retryVerification}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Retry Verification
        </button>
        <button 
          onClick={() => window.location.href = '/checkout'}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};
```

### 3. Checkout Integration

```jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { initializeSecurePayment } from '../utils/paymentUtils';

const CheckoutPage = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setIsProcessing(true);

      // Create order first
      const orderResponse = await createOrder(cart, user);
      const orderId = orderResponse.data.orderId;

      // Initialize payment with auth preservation
      const paymentData = {
        orderId,
        amount: calculateTotal(cart),
        currency: 'ETB',
        email: user.email,
        first_name: user.fullName?.split(' ')[0] || 'Customer',
        last_name: user.fullName?.split(' ').slice(1).join(' ') || 'User'
      };

      const checkoutUrl = await initializeSecurePayment(paymentData);
      
      // Redirect to payment (auth will be preserved)
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Checkout failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="checkout-page">
      {/* Your checkout UI */}
      <button 
        onClick={handleCheckout}
        disabled={isProcessing || !isAuthenticated}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Complete Payment'}
      </button>
    </div>
  );
};
```

## Backend Integration Examples

### Custom Payment Verification

```javascript
// In your route handler
const chapaService = require('../utils/chapa');

router.get('/custom-verify/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Use the enhanced Chapa service
    const verificationResult = await chapaService.verifyPayment(order.tx_ref);
    
    if (verificationResult.success) {
      // Update order status
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      await order.save();
      
      res.json({
        success: true,
        paymentStatus: 'paid',
        order: order,
        verificationData: verificationResult.data
      });
    } else {
      res.json({
        success: false,
        paymentStatus: 'failed',
        message: verificationResult.message
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

### Webhook Handler with Session Validation

```javascript
router.post('/webhook', async (req, res) => {
  try {
    const { event, tx_ref, status } = req.body;
    
    // Validate webhook signature (recommended)
    const chapaService = require('../utils/chapa');
    const signature = req.headers['x-chapa-signature'];
    const isValidSignature = chapaService.validateWebhookSignature(
      JSON.stringify(req.body), 
      signature
    );
    
    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    // Process webhook
    if (event === 'charge.complete') {
      const orderId = chapaService.parseOrderIdFromTxRef(tx_ref);
      
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = status === 'success' ? 'paid' : 'failed';
          order.status = status === 'success' ? 'confirmed' : 'cancelled';
          await order.save();
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});
```

## Key Benefits

1. **No Re-authentication Required**: Users stay logged in throughout the payment process
2. **Automatic Status Verification**: Payment status is verified automatically on return
3. **Robust Error Handling**: Comprehensive error states and recovery mechanisms
4. **Secure Token Management**: Tokens are obfuscated and securely managed
5. **Modular Design**: Easy to integrate into existing applications
6. **Production Ready**: Includes security best practices and error handling
