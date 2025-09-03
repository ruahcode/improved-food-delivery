const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Define required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'NODE_ENV'
];

// Validate environment variables
function validateEnv() {
  const missingVars = [];
  const invalidVars = [];

  // Check for missing required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Validate JWT configuration
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    invalidVars.push('JWT_SECRET must be at least 32 characters long');
  }

  // Validate MongoDB URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    invalidVars.push('MONGODB_URI must be a valid MongoDB connection string');
  }

  // Throw error if any validation fails
  if (missingVars.length > 0 || invalidVars.length > 0) {
    const error = new Error('Environment validation failed');
    error.missingVars = missingVars;
    error.invalidVars = invalidVars;
    throw error;
  }

  // Log success message in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment variables validated successfully');
  }
}

module.exports = { validateEnv };
