/**
 * Environment Configuration and Validation
 * Validates required environment variables and provides type-safe access
 */

// List of required environment variables and their expected types
const requiredEnvVars = {
  // Frontend specific (only require essential ones)
  VITE_API_BASE_URL: 'string',
  VITE_CHAPA_PUBLIC_KEY: 'string',
};

// Parse environment variables based on expected type
const parseEnvVar = (key, value, type) => {
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  let num;
  switch (type) {
    case 'number':
      num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Environment variable ${key} must be a number`);
      }
      return num;
    case 'boolean':
      if (value === 'true') return true;
      if (value === 'false') return false;
      throw new Error(`Environment variable ${key} must be 'true' or 'false'`);
    case 'string':
      return value;
    case 'array':
      return value.split(',').map(item => item.trim());
    default:
      return value;
  }
};

// Validate and parse all required environment variables
const validateEnvVars = () => {
  const env = {};
  const errors = [];
  const warnings = [];

  // Check for missing .env file
  if (Object.keys(import.meta.env).length <= 1) { // Vite provides some default env vars
    warnings.push('No .env file found or it appears to be empty');
  }

  // Validate required environment variables
  Object.entries(requiredEnvVars).forEach(([key, type]) => {
    try {
      const value = import.meta.env[key];
      env[key] = parseEnvVar(key, value, type);
    } catch (error) {
      errors.push(error.message);
    }
  });

  // Log warnings and errors
  if (warnings.length > 0) {
    console.warn('Environment Configuration Warnings:', warnings);
  }
  
  if (errors.length > 0) {
    const errorMessage = `Environment Configuration Errors:\n${errors.join('\n')}`;
    if (import.meta.env.PROD) {
      // In production, we might want to fail fast
      throw new Error(errorMessage);
    } else {
      console.error(errorMessage);
    }
  }

  return env;
};

// Export validated environment variables
export const env = validateEnvVars();

// Helper function to access environment variables with a fallback
export const getEnv = (key, defaultValue = null) => {
  // First try to get from validated env, then from import.meta.env directly
  return env[key] ?? import.meta.env[key] ?? defaultValue;
};

// Log environment status (only in development)
if (!import.meta.env.PROD) {
  console.log('Environment Configuration:', {
    ...env,
    VITE_CHAPA_PUBLIC_KEY: env.VITE_CHAPA_PUBLIC_KEY ? '***MASKED***' : undefined,
  });
}

export default env;
