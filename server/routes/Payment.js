const express = require('express');
const axios = require('axios');
const cors = require('cors');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Authentication middleware with better error handling and CORS support
const authenticateToken = (req, res, next) => {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    // Try to get token from Authorization header first
    let token;
    const authHeader = req.headers['authorization'] || '';
    
    // Check for Bearer token in Authorization header
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    // If no token in header, check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // If still no token, check session storage
    else if (req.session && req.session.token) {
      token = req.session.token;
    }

    if (!token) {
      console.log('No authentication token found in headers, cookies, or session');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please log in.',
        code: 'NO_TOKEN'
      });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid or expired token. Please log in again.',
          code: 'INVALID_TOKEN'
        });
      }
      
      // Token is valid, attach user to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.',
      error: error.message
    });
  }
};

// CORS configuration for payment routes
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [process.env.CORS_ORIGIN || 'https://yourdomain.com']
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Cache-Control',
    'Origin',
    'Pragma',
    'Expires'
  ]
};

// Apply CORS to all payment routes
router.use(cors(corsOptions));

// Add explicit CORS headers for payment routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Apply authentication to all payment routes except OPTIONS and callback
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  // Skip authentication for callback endpoints
  if (req.path.startsWith('/callback/')) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// Initialize Chapa payment
router.post('/', async (req, res) => {
  try {
    console.log('Received payment request:', JSON.stringify(req.body, null, 2));

    // Log headers for debugging
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    // Parse the request body
    const {
      amount,
      email,
      fullName,
      tx_ref,
      callback_url,
      return_url,
      customization = {},
      orderId,
      deliveryAddress,
      city,
      state,
      country,
      ...rest
    } = req.body;

    console.log('Parsed request body:', {
      amount,
      email: email ? '[REDACTED]' : undefined,
      fullName,
      tx_ref,
      callback_url,
      return_url,
      customization,
      otherFields: Object.keys(rest).length > 0 ? Object.keys(rest) : 'none'
    });
    

    // Validate and normalize delivery address
    const normalizeAddress = (address) => {
      if (!address || typeof address !== 'string') return 'Default delivery address, Addis Ababa, Ethiopia';
      const normalized = address.trim();
      return normalized.length >= 15 ? normalized : `${normalized} District, Addis Ababa, Ethiopia`;
    };

    const normalizedDeliveryAddress = normalizeAddress(deliveryAddress);
    const normalizedCity = city && city.trim().length >= 2 ? city.trim() : 'Addis Ababa';
    const normalizedState = state && state.trim().length >= 2 ? state.trim() : 'Addis Ababa';
    const normalizedCountry = country && country.trim().length >= 2 ? country.trim() : 'Ethiopia';

    // First, validate required fields
    const requiredFields = {
      amount: 'Amount is required',
      email: 'Email is required',
      tx_ref: 'Transaction reference is required'
    };

    // Check for missing required fields
    const missingFields = Object.entries(requiredFields)
      .filter(([field]) => !req.body[field])
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        code: 'MISSING_FIELDS'
      });
    }

    // Convert amount to a number and validate
    const amountValue = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    
    if (isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Please provide a valid positive number.',
        code: 'INVALID_AMOUNT'
      });
    }
    
    // Format amount to string with exactly 2 decimal places
    const formattedAmount = amountValue.toFixed(2);
    
    // Sanitize description to only allow letters, numbers, hyphens, underscores, spaces, and dots
    const sanitizeText = (text) => {
      if (!text) return '';
      return String(text).replace(/[^a-zA-Z0-9\s\-_.]/g, '').substring(0, 100);
    };
    
    // Build callback/return URLs but avoid sending localhost to Chapa in development
    const isLocal = (url) => typeof url === 'string' && /^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(url);
    const resolvedCallbackUrl = (callback_url || (process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/payment/webhook` : undefined))?.trim();
    const resolvedReturnUrl = (return_url || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/order/success` : undefined))?.trim();

    // Only include URLs if acceptable. In development, allow localhost to enable local testing
    const allowLocal = process.env.NODE_ENV !== 'production';
    const safeCallbackUrl = resolvedCallbackUrl && (allowLocal || !isLocal(resolvedCallbackUrl)) ? resolvedCallbackUrl : undefined;
    const safeReturnUrl = resolvedReturnUrl && (allowLocal || !isLocal(resolvedReturnUrl)) ? resolvedReturnUrl : undefined;

    // Prepare customization fields within provider limits
    const customizationTitle = sanitizeText('Food Payment').substring(0, 16); // Chapa: max 16 chars
    const customizationDescription = sanitizeText('Payment for food delivery order').substring(0, 100);

    // Normalize full name with sensible defaults and limits
    const normalizedFullName = String(fullName || 'Customer User').substring(0, 100).trim();

    const nameParts=normalizedFullName.split(/\s+/);
    const derivedfirstName=nameParts[0]||'Customer';
    const derivedlastName=nameParts.slice(1).join(' ')||'User';
   

    // Generate secure payment session for authentication persistence
    const chapaService = require('../utils/chapa');
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    let paymentSession = null;

    if (authToken && req.user) {
      try {
        paymentSession = chapaService.generatePaymentSession(
          req.user.id,
          orderId || 'temp',
          authToken
        );
      } catch (error) {
        console.warn('Failed to generate payment session:', error.message);
      }
    }

    // Build enhanced callback and return URLs with session
    const enhancedCallbackUrl = orderId
      ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/callback/${orderId}${paymentSession ? `?session=${encodeURIComponent(paymentSession)}` : ''}`
      : safeCallbackUrl;

    const enhancedReturnUrl = orderId
      ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/callback/${orderId}${paymentSession ? `?session=${encodeURIComponent(paymentSession)}&restoreAuth=true` : ''}`
      : safeReturnUrl;

    // Create the chapaRequest object with required fields including delivery address
    const chapaRequest = {
      amount: formattedAmount,
      currency: 'ETB',
      email: email.trim().toLowerCase(),
      first_name: derivedfirstName,
      last_name: derivedlastName,
      tx_ref: tx_ref || `order-${orderId || Date.now()}-${Date.now()}`,
      delivery_address: normalizedDeliveryAddress,
      city: normalizedCity,
      state: normalizedState,
      country: normalizedCountry,
      ...(enhancedCallbackUrl ? { callback_url: enhancedCallbackUrl } : {}),
      ...(enhancedReturnUrl ? { return_url: enhancedReturnUrl } : {}),
      'customization[title]': customizationTitle,
      'customization[description]': customizationDescription
    };
    console.log('chapaRequest:', chapaRequest);

    // Validate Chapa secret key
    if (!process.env.CHAPA_SECRET_KEY) {
      console.error('CHAPA_SECRET_KEY is not configured');
      return res.status(500).json({ 
        success: false, 
        message: 'Payment service is not properly configured',
        error: 'Missing payment configuration' 
      });
    }

    // Log request details (without sensitive data)
    const logRequest = { 
      ...chapaRequest, 
      email: '[REDACTED]',
      amount: chapaRequest.amount,
      currency: chapaRequest.currency,
      tx_ref: chapaRequest.tx_ref
    };
    
    console.log('Making request to Chapa API with payload:', JSON.stringify(logRequest, null, 2));
    console.log('Using Chapa Key:', process.env.CHAPA_SECRET_KEY ? 'Key found' : 'Key missing');
    
    if (!process.env.CHAPA_SECRET_KEY) {
      console.error('CHAPA_SECRET_KEY is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Payment processing is not properly configured',
        code: 'PAYMENT_CONFIG_ERROR'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
    }

    try {
      // Convert object to URL-encoded form data
      const formData = new URLSearchParams();
      Object.entries(chapaRequest).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      const response = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        formData.toString(),
        {
          headers: {
            'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          timeout: 30000, // 30 seconds timeout
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        }
      );

      console.log('Chapa API Response:', JSON.stringify(response.data, null, 2));

      console.log('Chapa API Response Status:', response.status);
      console.log('Chapa API Response Data:', JSON.stringify(response.data, null, 2));

      console.log('Chapa API Response:', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }, null, 2));

      if (response.data?.status === 'success' && response.data?.data?.checkout_url) {
        // Handle successful response
        return res.status(200).json({
          success: true,
          message: 'Payment initiated successfully',
          data: {
            checkout_url: response.data.data.checkout_url,
            tx_ref: chapaRequest.tx_ref,
            reference: response.data.tx_ref || chapaRequest.tx_ref
          }
        });
      } else {
        // Handle non-200 responses from Chapa
        const errorMessage = response.data?.message || 'Payment initialization failed';
        console.error('Chapa API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          responseData: response.data
        });
        let errorCode = 'CHAPA_API_ERROR';
        let statusCode = response.status || 500;
        if (response.data?.code) {
          errorCode = response.data.code;
        }
        return res.status(statusCode).json({
          success: false,
          message: errorMessage,
          error: response.data?.message || 'Payment processing failed',
          code: errorCode,
          details: response.data || {}
        });
      }
    } catch (error) {
      console.error('Error initializing payment:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers ? {
            ...error.config.headers,
            'Authorization': error.config.headers?.Authorization ? 'Bearer [REDACTED]' : undefined
          } : undefined,
          data: error.config?.data
        },
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });

      let errorMessage = 'Failed to initialize payment';
      let errorCode = 'PAYMENT_INIT_ERROR';
      let statusCode = 500;
      let details = {};

      if (error.response) {
        // The request was made and the server responded with a status code
        statusCode = error.response.status;
        
        // Handle Chapa API error responses
        if (error.response.data) {
          errorMessage = error.response.data.message || errorMessage;
          errorCode = error.response.data.code || errorCode;
          details = error.response.data;
          
          // Special handling for common Chapa errors
          if (error.response.data.errors) {
            const fieldErrors = [];
            Object.entries(error.response.data.errors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                fieldErrors.push(`${field}: ${messages.join(', ')}`);
              }
            });
            if (fieldErrors.length > 0) {
              errorMessage = `Validation error: ${fieldErrors.join('; ')}`;
              errorCode = 'VALIDATION_ERROR';
            }
          }
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from payment gateway. Please check your internet connection and try again.';
        errorCode = 'PAYMENT_GATEWAY_UNAVAILABLE';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Payment gateway request timed out. Please try again.';
        errorCode = 'PAYMENT_GATEWAY_TIMEOUT';
        statusCode = 504;
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
        errorCode = 'NETWORK_ERROR';
        statusCode = 503;
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: error.response?.data || error.message,
        code: errorCode,
        details: details
      });
    }
  } catch (error) {
    const errorId = require('crypto').randomBytes(8).toString('hex');
    
    // Log detailed error on server side only
    console.error(`Payment Error [${errorId}]:`, {
      message: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Return minimal error information to client
    return res.status(500).json({
      success: false,
      message: 'Failed to process payment. Please contact support if the issue persists.',
      errorId: errorId,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook for Chapa payment callback
router.post('/webhook', async (req, res) => {
  try {
    const { event, tx_ref, status } = req.body;
    
    if (event === 'charge.complete' && status === 'success') {
      // Extract order ID from tx_ref (format: order-{orderId}-{timestamp})
      const orderId = tx_ref.split('-')[1];
      
      if (!orderId) {
        console.error('Invalid tx_ref format:', tx_ref);
        return res.status(400).json({ success: false, message: 'Invalid tx_ref format' });
      }

      // Find and update the order
      const order = await Order.findByIdAndUpdate(
        orderId,
        { 
          paymentStatus: 'paid',
          status: 'confirmed',
          $push: {
            paymentHistory: {
              amount: req.body.amount,
              currency: req.body.currency,
              transactionId: req.body.tx_ref,
              paymentMethod: 'chapa',
              status: 'completed',
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );

      if (!order) {
        console.error('Order not found:', orderId);
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      console.log(`Order ${orderId} payment confirmed`);
      return res.status(200).json({ success: true });
    }

    // For other events or statuses, just acknowledge receipt
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
});

// Enhanced payment verification endpoint for API calls (by orderId)
router.get('/verify/:orderId', async (req, res) => {
  // Try to authenticate, but don't fail if no auth for confirmed orders
  let userId = null;
  try {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    }
  } catch (error) {
    console.log('No valid auth token for verification');
  }
  try {
    const { orderId } = req.params;

    console.log(`Verifying payment for order: ${orderId}, user: ${userId}`);

    // Find the order - if we have userId, filter by it, otherwise just find by orderId
    const query = userId ? { _id: orderId, userId: userId } : { _id: orderId };
    const order = await Order.findOne(query);

    if (!order) {
      console.log(`Order not found: ${orderId} for user: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // If no userId but order is confirmed, allow verification
    if (!userId && (order.paymentStatus !== 'paid' && order.status !== 'confirmed')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for unconfirmed orders'
      });
    }

    console.log(`Order found - paymentStatus: ${order.paymentStatus}, status: ${order.status}`);

    // If payment is already verified, return cached result
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') {
      console.log('Payment already verified, returning success');
      return res.status(200).json({
        success: true,
        verified: true,
        paymentStatus: 'paid',
        status: 'confirmed',
        orderId: order._id,
        tx_ref: order.tx_ref,
        amount: order.totalAmount || order.totalPrice,
        currency: 'ETB',
        message: 'Payment completed successfully',
        order: {
          id: order._id,
          paymentStatus: order.paymentStatus,
          status: order.status,
          totalPrice: order.totalPrice,
          items: order.items
        }
      });
    }

    // If we have a transaction reference, try to verify with Chapa
    if (order.tx_ref) {
      const chapaService = require('../utils/chapa');
      
      try {
        const verificationResult = await chapaService.verifyPayment(order.tx_ref);
        
        if (verificationResult.success) {
          // Update order status
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          order.paymentVerifiedAt = new Date();

          // Add payment history entry
          if (!order.paymentHistory) {
            order.paymentHistory = [];
          }

          order.paymentHistory.push({
            amount: verificationResult.data.amount,
            currency: verificationResult.data.currency,
            transactionId: order.tx_ref,
            paymentMethod: 'chapa',
            status: 'completed',
            timestamp: new Date(),
            verificationData: verificationResult.data,
            verifiedVia: 'direct_api_call'
          });

          await order.save();
          
          return res.json({
            success: true,
            paymentStatus: 'paid',
            status: order.status,
            orderId: order._id,
            tx_ref: order.tx_ref,
            amount: order.totalAmount,
            currency: 'ETB',
            order: order,
            verified: true
          });
        }
      } catch (error) {
        console.error('Chapa verification error (non-fatal):', error.message);
        // Continue to check webhook status even if verification fails
      }
      
      // If we get here, the direct verification failed or was inconclusive
      // Check if we have a pending webhook
      if (order.paymentStatus === 'pending' || order.paymentStatus === 'processing') {
        return res.json({
          success: true,
          paymentStatus: 'processing',
          status: order.status,
          orderId: order._id,
          message: 'Payment is being processed. Please wait...',
          retryAfter: 5000 // Tell client to retry after 5 seconds
        });
      }
    }

    // No tx_ref means payment was never initiated, but check if callback updated the order
    console.log(`Order status check - paymentStatus: ${order.paymentStatus}, status: ${order.status}`);
    
    // If callback already updated the order to paid, return success
    if (order.paymentStatus === 'paid' || order.status === 'confirmed') {
      console.log('Order was updated by callback, returning success');
      return res.status(200).json({
        success: true,
        verified: true,
        paymentStatus: 'paid',
        status: 'confirmed',
        orderId: order._id,
        amount: order.totalAmount || order.totalPrice,
        currency: 'ETB',
        message: 'Payment completed successfully',
        source: 'callback_updated'
      });
    }
    
    return res.json({
      success: false,
      paymentStatus: order.paymentStatus || 'pending',
      status: order.status,
      orderId: order._id,
      message: 'Payment verification pending'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Payment verification endpoint by transaction reference (tx_ref)
router.get('/verify/tx/:tx_ref', authenticateToken, async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const userId = req.user.id;

    console.log(`Verifying payment for tx_ref: ${tx_ref}, user: ${userId}`);

    // Validate tx_ref format
    if (!tx_ref || typeof tx_ref !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction reference'
      });
    }

    // Find order by tx_ref and user
    const order = await Order.findOne({
      tx_ref: tx_ref,
      userId: userId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found for this transaction reference'
      });
    }

    // If payment is already verified, return cached result
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'completed') {
      return res.json({
        success: true,
        paymentStatus: 'paid',
        status: order.status,
        orderId: order._id,
        tx_ref: order.tx_ref,
        amount: order.totalAmount || order.totalPrice,
        currency: 'ETB',
        order: order,
        verified: true
      });
    }

    // Verify payment with Chapa API
    const chapaService = require('../utils/chapa');
    
    try {
      console.log(`Calling Chapa API to verify tx_ref: ${tx_ref}`);
      const verificationResult = await chapaService.verifyPayment(tx_ref);
      
      console.log('Chapa verification result:', {
        success: verificationResult.success,
        status: verificationResult.status,
        message: verificationResult.message
      });
      
      if (verificationResult.success) {
        // Update order status
        order.paymentStatus = 'paid';
        order.status = 'confirmed';
        order.paymentVerifiedAt = new Date();

        // Add payment history entry
        if (!order.paymentHistory) {
          order.paymentHistory = [];
        }

        order.paymentHistory.push({
          amount: verificationResult.data.amount || order.totalAmount || order.totalPrice,
          currency: verificationResult.data.currency || 'ETB',
          transactionId: tx_ref,
          paymentMethod: 'chapa',
          status: 'completed',
          timestamp: new Date(),
          verificationData: verificationResult.data,
          verifiedVia: 'tx_ref_api_call'
        });

        await order.save();
        
        console.log(`Payment verified successfully for order: ${order._id}`);
        
        return res.json({
          success: true,
          paymentStatus: 'paid',
          status: order.status,
          orderId: order._id,
          tx_ref: order.tx_ref,
          amount: order.totalAmount || order.totalPrice,
          currency: 'ETB',
          order: order,
          verified: true,
          verificationData: verificationResult.data
        });
      } else {
        // Payment verification failed
        console.log(`Payment verification failed for tx_ref: ${tx_ref}`);
        
        return res.json({
          success: false,
          paymentStatus: 'failed',
          status: order.status,
          orderId: order._id,
          tx_ref: order.tx_ref,
          message: verificationResult.message || 'Payment verification failed',
          error: verificationResult.error
        });
      }
    } catch (chapaError) {
      console.error('Chapa API error:', chapaError.message);
      
      // Check if it's a network/timeout error vs payment failure
      if (chapaError.message.includes('timeout') || chapaError.message.includes('network')) {
        return res.json({
          success: true,
          paymentStatus: 'processing',
          status: order.status,
          orderId: order._id,
          tx_ref: order.tx_ref,
          message: 'Payment verification is temporarily unavailable. Please try again.',
          retryAfter: 5000
        });
      }
      
      // For other errors, return failure
      return res.status(500).json({
        success: false,
        message: 'Payment verification service unavailable',
        error: process.env.NODE_ENV === 'development' ? chapaError.message : 'Service temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Payment callback handler for Chapa redirects (maintains authentication)
router.get('/callback/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, tx_ref, session } = req.query;

    console.log('Payment callback received:', { orderId, status, tx_ref, hasSession: !!session });

    // Validate payment session if provided
    let sessionData = null;
    if (session) {
      const chapaService = require('../utils/chapa');
      sessionData = chapaService.validatePaymentSession(session);
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?reason=order_not_found`);
    }

    // For callback, trust the status parameter from Chapa
    let finalStatus = status === 'success' ? 'success' : 'failed';
    
    console.log('Payment callback - final status determined:', finalStatus);

    // Update order based on final status
    if (finalStatus === 'success') {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.paymentVerifiedAt = new Date();
      
      if (!order.paymentHistory) {
        order.paymentHistory = [];
      }

      order.paymentHistory.push({
        amount: order.totalPrice,
        currency: 'ETB',
        transactionId: tx_ref || order.tx_ref || `callback-${orderId}`,
        paymentMethod: 'chapa',
        status: 'completed',
        timestamp: new Date(),
        callbackStatus: status,
        source: 'chapa_callback'
      });
    } else {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
    }

    await order.save();
    console.log(`Order ${orderId} updated - paymentStatus: ${order.paymentStatus}, status: ${order.status}`);

    // Build redirect URL with authentication restoration
    const baseUrl = finalStatus === 'success'
      ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success/${orderId}`
      : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/failed/${orderId}`;

    const params = new URLSearchParams();
    params.append('orderId', orderId);
    if (sessionData && sessionData.token) {
      params.append('restoreAuth', 'true');
      params.append('authToken', sessionData.token);
    }
    if (tx_ref) params.append('tx_ref', tx_ref);
    if (finalStatus === 'failed') {
      params.append('error', 'payment_failed');
    }
    params.append('verified', 'true');

    const redirectUrl = `${baseUrl}?${params.toString()}`;

    console.log('Redirecting to:', redirectUrl.replace(/authToken=[^&]+/, 'authToken=[REDACTED]'));

    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Payment callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failed?reason=callback_error`);
  }
});

// Complete payment status endpoint - returns everything frontend needs
router.get('/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find order without strict auth requirements
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Return complete status
    const isSuccess = order.paymentStatus === 'paid' || order.status === 'confirmed';
    
    return res.status(200).json({
      success: true,
      paymentSuccess: isSuccess,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      orderId: order._id,
      amount: order.totalPrice,
      currency: 'ETB',
      verified: isSuccess,
      message: isSuccess ? 'Payment completed successfully' : 'Payment pending',
      order: {
        id: order._id,
        items: order.items,
        totalPrice: order.totalPrice,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      }
    });
    
  } catch (error) {
    console.error('Payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking payment status'
    });
  }
});

// Health check endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'Payment API is running',
    endpoints: {
      initialize: 'POST /',
      verify_by_order: 'GET /verify/:orderId',
      verify_by_tx_ref: 'GET /verify/tx/:tx_ref',
      status: 'GET /status/:orderId',
      webhook: 'POST /webhook',
      callback: 'GET /callback/:orderId'
    }
  });
});

module.exports = router;