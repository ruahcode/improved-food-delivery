require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const axios = require('axios');

const app = express();

// Import routes
const { router: userRoutes } = require('./routes/UserRoutesFixed');
const RestaurantRoutes = require('./routes/RestaurantRoutes');
const MenuItemRoutes = require('./routes/MenuItemRoutes');
const CartRoutes = require('./routes/CartRoutes');
const OrderRoutes = require('./routes/OrderRoutes');
const PromoCodeRoutes = require('./routes/PromoCodeRoutes');
const paymentRoutes = require('./routes/Payment');
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const { 
  authLimiter, 
  registrationLimiter, 
  apiLimiter, 
  sensitiveOperationLimiter,
  createRateLimiter 
} = require('./middleware/rateLimit');

// Import logger
const logger = require('./utils/logger');

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.CORS_ORIGIN || 'https://yourdomain.com', 'https://checkout.chapa.co']
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'https://checkout.chapa.co'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Expires',
    'X-Requested-With',
    'Accept',
    'Cache-Control',
    'Origin',
    'X-Refresh-Token',
    'X-Requested-With',
    'Set-Cookie',
    'Cookie',
    'Pragma'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Set-Cookie',
    'Authorization',
    'Expires',
    'Content-Type'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 600, // Cache preflight response for 10 minutes
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", "ws://localhost:5173", "http://localhost:5000", "http://localhost:5173"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  frameguard: { action: 'deny' },
  hsts: false, // Disable HSTS for development
  ieNoOpen: true,
  noSniff: true,
  xssFilter: true,
}));

// CORS and other middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Apply CORS with the configured options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  
  next();
});

// Database connection with error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      console.log('Connected to MongoDB');
    }
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Starting server without database connection...');
    throw error;
  }
};

// Connect to the database
connectDB().catch(console.error);

// Debug JWT configuration
console.log('JWT Configuration:', {
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '1d (default)'
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Food Delivery API' });
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Apply rate limiting to auth routes
app.use('/api/auth/register', registrationLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', registrationLimiter);

// Apply sensitive operation rate limiting
app.use('/api/auth/reset-password', sensitiveOperationLimiter);
app.use('/api/auth/forgot-password', sensitiveOperationLimiter);
app.use('/api/auth/verify-email', sensitiveOperationLimiter);

// Trust first proxy (if behind a proxy like Nginx)
app.set('trust proxy', 1); // Trust first proxy

// Log rate limit events
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  logger.info(`Request from ${ip} to ${req.path}`, {
    method: req.method,
    userAgent: req.headers['user-agent']
  });
  next();
});

// Token verification route removed - using simplified auth


// API Routes
app.use('/api/users', userRoutes);
app.use('/api/restaurants', RestaurantRoutes);
app.use('/api/menu-items', MenuItemRoutes);
app.use('/api/cart', CartRoutes);
app.use('/api/orders', OrderRoutes);
app.use('/api/promo-codes', PromoCodeRoutes);
app.use('/api/payment', paymentRoutes);

// Debug route to test token
app.get('/api/debug/token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.userId);
    res.json({ decoded, user: user ? { id: user._id, email: user.email, role: user.role } : null });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Test login endpoint
app.post('/api/debug/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const User = require('./models/User');
    
    console.log('Test login attempt:', { email, password: password ? 'provided' : 'missing' });
    
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? { id: user._id, email: user.email, hasPassword: !!user.password } : 'Not found');
    
    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.json({ success: false, error: 'Invalid password' });
    }
    
    const token = user.generateAuthToken();
    res.json({ success: true, token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Test login error:', error);
    res.json({ success: false, error: error.message });
  }
});

// Temporary admin creation route
app.post('/api/debug/create-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      const token = existingAdmin.generateAuthToken();
      return res.json({ 
        success: true, 
        message: 'Admin already exists',
        token, 
        user: { id: existingAdmin._id, email: existingAdmin.email, role: existingAdmin.role } 
      });
    }
    
    const admin = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Admin123!',
      role: 'admin'
    });
    await admin.save();
    const token = admin.generateAuthToken();
    res.json({ success: true, token, user: { id: admin._id, email: admin.email, role: admin.role } });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Create test user route
app.post('/api/debug/create-user', async (req, res) => {
  try {
    const User = require('./models/User');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@gmail.com' });
    if (existingUser) {
      const token = existingUser.generateAuthToken();
      return res.json({ 
        success: true, 
        message: 'Test user already exists',
        token, 
        user: { id: existingUser._id, email: existingUser.email, role: existingUser.role } 
      });
    }
    
    const user = new User({
      name: 'Test User',
      email: 'test@gmail.com',
      password: 'test123',
      role: 'user'
    });
    await user.save();
    const token = user.generateAuthToken();
    res.json({ success: true, token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Admin routes
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Food Delivery API' });
});

// Routes for User (fixed)
app.use('/api/user', userRoutes);

//Routes for Restaurant
app.use('/api/restaurant', RestaurantRoutes);

//Routes for MenuItem
app.use('/api/menuItem', MenuItemRoutes);

//Routes for Cart
app.use('/api/cart', CartRoutes);

//Routes for Order
app.use('/api/order', OrderRoutes);

//Routes for PromoCode
app.use('/api/promoCode', PromoCodeRoutes);

//Routes for Payment
app.use('/api/payment', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  console.error('Error details:', {
    message: err.message,
    name: err.name,
    ...(err.errors && { errors: err.errors }),
    ...(err.code && { code: err.code }),
    ...(err.keyValue && { keyValue: err.keyValue })
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Create the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  if (server) {
    server.close(() => {
      console.log('Server closed due to uncaught exception');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (server) {
    server.close(() => {
      console.log('Server closed due to unhandled rejection');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Export the app, connectDB function, and server instance for testing
module.exports = {
  app,
  connectDB,
  server
};
