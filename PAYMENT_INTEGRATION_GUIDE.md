# Enhanced Chapa Payment Integration Guide

## Overview

This guide provides a complete MERN stack implementation for Chapa payment integration that:
- ✅ **Skips login/signup** - Maintains user authentication state during payment flow
- ✅ **Handles redirects** - Automatically routes to success/failure pages based on payment outcome
- ✅ **Secure token handling** - Prevents authentication loss during payment redirects
- ✅ **Reusable components** - Modular functions for easy integration

## Architecture

### Backend Components

1. **Enhanced Chapa Service** (`server/utils/chapa.js`)
   - Payment verification with Chapa API
   - Secure session token generation/validation
   - Transaction reference parsing utilities
   - Webhook signature validation

2. **Payment Routes** (`server/routes/Payment.js`)
   - `/api/payment/verify/:orderId` - Enhanced payment verification
   - `/api/payment/callback/:orderId` - Authentication-aware callback handler
   - Secure session management during redirects

3. **Auth Validation** (`server/middleware/auth.js`)
   - `/api/auth/validate` - Token validation endpoint
   - Enhanced refresh token handling

### Frontend Components

1. **Payment Flow Hook** (`client/src/hooks/usePaymentFlow.js`)
   - Manages complete payment verification flow
   - Handles authentication restoration
   - Provides loading states and error handling

2. **Payment Utilities** (`client/src/utils/paymentUtils.js`)
   - Authentication restoration functions
   - Payment status verification
   - Error handling and redirect management

3. **Auth Persistence** (`client/src/utils/authPersistence.js`)
   - Secure token storage with obfuscation
   - Pre-payment authentication backup
   - Session cleanup utilities

4. **Enhanced Pages**
   - `PaymentSuccess.jsx` - Improved success page with auth restoration
   - `PaymentFailure.jsx` - Comprehensive failure handling

## Integration Steps

### 1. Backend Setup

Ensure your `.env` file includes:
```env
CHAPA_SECRET_KEY=your_chapa_secret_key
CHAPA_PUBLIC_KEY=your_chapa_public_key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

### 2. Frontend Integration

#### Basic Usage:
```jsx
import { usePaymentFlow } from '../hooks/usePaymentFlow';

const MyPaymentPage = () => {
  const { orderId } = useParams();
  
  const {
    status,
    order,
    error,
    isAuthRestored,
    retryVerification,
    isLoading,
    isSuccess,
    isFailure
  } = usePaymentFlow(orderId);

  if (isLoading) return <div>Verifying payment...</div>;
  if (isSuccess) return <div>Payment successful!</div>;
  if (isFailure) return <div>Payment failed: {error}</div>;
};
```

#### Advanced Usage with Custom Component:
```jsx
import EnhancedPaymentFlow from '../components/EnhancedPaymentFlow';

const CheckoutPage = () => {
  const orderData = {
    orderId: 'order-123',
    totalAmount: 250.00
  };

  return (
    <EnhancedPaymentFlow
      orderData={orderData}
      onPaymentStart={(data) => console.log('Payment started:', data)}
      onPaymentComplete={(result) => console.log('Payment completed:', result)}
    />
  );
};
```

### 3. Payment Flow Process

1. **Payment Initiation**:
   ```jsx
   // User clicks pay button
   // → Authentication state stored securely
   // → Redirect to Chapa with callback URLs
   ```

2. **Payment Processing**:
   ```
   User completes payment on Chapa
   → Chapa redirects to callback URL with session token
   → Backend verifies payment and updates order
   → Redirect to success/failure page with auth restoration
   ```

3. **Return Flow**:
   ```jsx
   // Success/failure page loads
   // → Authentication automatically restored
   // → Payment status verified
   // → User sees appropriate feedback
   ```

## API Endpoints

### Payment Verification
```
GET /api/payment/verify/:orderId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "paymentStatus": "paid",
  "status": "confirmed",
  "orderId": "order-123",
  "tx_ref": "order-123-1234567890",
  "order": { ... }
}
```

### Payment Callback
```
GET /api/payment/callback/:orderId?status=success&tx_ref=xxx&session=xxx

Redirects to:
- Success: /order/:orderId/success?restoreAuth=true&authToken=xxx
- Failure: /order/:orderId/failed?reason=payment_failed
```

### Token Validation
```
GET /api/auth/validate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": { "id": "...", "fullName": "...", "email": "...", "role": "..." },
  "message": "Token is valid"
}
```

## Security Features

1. **Token Obfuscation**: Client-side tokens are obfuscated (not encrypted, but hidden)
2. **Session Validation**: Payment sessions expire after 30 minutes
3. **Secure Callbacks**: Backend validates payment sessions and tokens
4. **HTTPS Enforcement**: Secure cookies in production
5. **Error Handling**: Comprehensive error states and recovery

## Error Handling

The system handles various error scenarios:
- Authentication token expiry during payment
- Payment gateway failures
- Network connectivity issues
- Invalid order states
- Session corruption

## Testing

To test the payment flow:

1. **Start your servers**:
   ```bash
   # Backend
   cd server && npm start
   
   # Frontend  
   cd client && npm run dev
   ```

2. **Test authentication persistence**:
   - Log in as a user
   - Initiate payment
   - Complete payment on Chapa test environment
   - Verify you're still logged in on return

3. **Test error scenarios**:
   - Cancel payment on Chapa
   - Use invalid order IDs
   - Test with expired tokens

## Customization

### Custom Success/Failure Pages
Extend the base components:
```jsx
import { usePaymentFlow } from '../hooks/usePaymentFlow';

const CustomPaymentSuccess = () => {
  const { status, order, isSuccess } = usePaymentFlow(orderId);
  
  // Add your custom logic here
  return (
    <div>
      {/* Your custom success UI */}
    </div>
  );
};
```

### Custom Payment Button
```jsx
import { handlePaymentRedirect } from '../utils/paymentUtils';

const CustomPayButton = ({ orderData }) => {
  const handlePay = async () => {
    // Your custom payment logic
    const checkoutUrl = await initializePayment(orderData);
    handlePaymentRedirect(checkoutUrl);
  };

  return <button onClick={handlePay}>Pay Now</button>;
};
```

## Troubleshooting

### Common Issues:

1. **Authentication Lost After Payment**
   - Check if `restoreAuth=true` is in return URL
   - Verify session storage is working
   - Check browser console for auth restoration logs

2. **Payment Verification Fails**
   - Verify Chapa API credentials
   - Check network connectivity
   - Review server logs for detailed errors

3. **Redirect Issues**
   - Ensure FRONTEND_URL and BACKEND_URL are correct
   - Check CORS configuration
   - Verify callback URLs are accessible

### Debug Mode:
Set `NODE_ENV=development` to see detailed error messages and logs.

## Production Considerations

1. **Environment Variables**: Ensure all secrets are properly configured
2. **HTTPS**: Use HTTPS in production for secure cookies
3. **Error Monitoring**: Implement proper error tracking
4. **Rate Limiting**: Configure appropriate rate limits for payment endpoints
5. **Logging**: Implement comprehensive payment flow logging

## Support

For issues with this implementation:
1. Check browser console for client-side errors
2. Review server logs for backend issues
3. Verify Chapa API status and credentials
4. Test with Chapa's test environment first
