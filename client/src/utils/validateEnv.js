/**
 * Validates required environment variables and provides helpful error messages
 */

export const validateEnvVars = () => {
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_CHAPA_PUBLIC_KEY'
  ];

  const missingVars = [];
  const invalidVars = [];

  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    
    if (value === undefined) {
      missingVars.push(varName);
    } else if (value === '') {
      invalidVars.push({ name: varName, reason: 'is empty' });
    } else if (varName.endsWith('_URL') && !isValidUrl(value)) {
      invalidVars.push({ name: varName, reason: 'is not a valid URL' });
    } else if (varName.endsWith('_DOMAIN') && !isValidDomain(value)) {
      invalidVars.push({ name: varName, reason: 'is not a valid domain' });
    }
  });

  // Log warnings in development
  if (import.meta.env.DEV) {
    if (missingVars.length > 0) {
      console.warn(
        'Missing required environment variables:', 
        missingVars.join(', '), 
        '\nPlease check your .env file.'
      );
    }

    if (invalidVars.length > 0) {
      console.warn(
        'Invalid environment variables:',
        invalidVars.map(v => `${v.name} (${v.reason})`).join(', ')
      );
    }
  }

  // Throw error in production if required vars are missing
  if (import.meta.env.PROD && missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  return {
    isValid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars
  };
};

// Helper function to validate URLs
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

// Helper function to validate domains
const isValidDomain = (domain) => {
  // Simple domain validation
  return /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain);
};

// Validate environment variables on module load
if (typeof window !== 'undefined') {
  validateEnvVars();
}
