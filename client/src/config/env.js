/**
 * Environment Configuration
 * Provides type-safe access to environment variables
 */

export const env = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Sturdy Memory',
  nodeEnv: import.meta.env.MODE || 'development',
  
  // Features
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  
  // Third-party Services
  chapaPublicKey: import.meta.env.VITE_CHAPA_PUBLIC_KEY || '',
};

// Log environment in development
if (import.meta.env.DEV) {
  console.log('Environment:', {
    mode: import.meta.env.MODE,
    ...env,
    // Don't log sensitive values in production
    chapaPublicKey: env.chapaPublicKey ? '***' : 'Not set',
  });
}

// Validate required environment variables
const requiredVars = ['VITE_API_BASE_URL'];
const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  if (import.meta.env.PROD) {
    // In production, you might want to handle this more gracefully
    console.error('Application may not function correctly without these variables');
  }
}

export default env;
