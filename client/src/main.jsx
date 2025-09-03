import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './styles/main.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';

// Import and validate environment configuration
import './utils/envConfig';
import { validateEnvVars } from './utils/validateEnv';

// Validate environment variables
const envValidation = validateEnvVars();

// Log environment status
if (import.meta.env.DEV) {
  console.log('Environment validation:', envValidation);
}

// Check for critical environment variables in production
if (import.meta.env.PROD && !envValidation.isValid) {
  console.error('Critical environment variables are missing or invalid:', {
    missing: envValidation.missingVars,
    invalid: envValidation.invalidVars
  });
  
  // Show error in the UI if we're in the browser
  if (typeof document !== 'undefined') {
    document.body.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">
        <h1>Configuration Error</h1>
        <p>The application cannot start due to missing or invalid configuration.</p>
        ${envValidation.missingVars.length ? `
          <h3>Missing Environment Variables:</h3>
          <ul>
            ${envValidation.missingVars.map(v => `<li>${v}</li>`).join('')}
          </ul>
        ` : ''}
        ${envValidation.invalidVars.length ? `
          <h3>Invalid Environment Variables:</h3>
          <ul>
            ${envValidation.invalidVars.map(v => `<li>${v.name}: ${v.reason}</li>`).join('')}
          </ul>
        ` : ''}
        <p>Please check your environment configuration and restart the application.</p>
      </div>
    `;
  }
  
  // Prevent the app from rendering
  throw new Error('Application configuration is invalid');
}

// Error handler for uncaught errors
const handleGlobalError = (error, errorInfo) => {
  console.error('Uncaught error:', error, errorInfo);
  
  // In development, show error overlay
  if (import.meta.env.DEV) {
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
      errorOverlay.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: #f8d7da; 
             color: #721c24; padding: 1rem; z-index: 10000; font-family: monospace;">
          <h3>Uncaught Error: ${error.message}</h3>
          <pre>${error.stack || 'No stack trace available'}</pre>
          <button onclick="this.parentNode.remove()" style="cursor: pointer;">
            Dismiss
          </button>
        </div>
      `;
    }
  }
  
  // In production, you might want to log to an error reporting service
  // logErrorToService(error, errorInfo);
};

// Set up global error handlers
window.addEventListener('error', (event) => {
  handleGlobalError(event.error, 'Window error');
  return false; // Prevent default error handling
});

window.addEventListener('unhandledrejection', (event) => {
  handleGlobalError(event.reason, 'Unhandled rejection');
  event.preventDefault();
});

// Create error overlay element for development
if (import.meta.env.DEV) {
  const overlay = document.createElement('div');
  overlay.id = 'error-overlay';
  document.body.appendChild(overlay);
}

// Check for critical errors before rendering
const checkCriticalErrors = () => {
  const errors = [];
  
  // Check for required browser features
  if (typeof Promise === 'undefined') {
    errors.push('This app requires Promises. Please use a modern browser.');
  }
  
  if (!('fetch' in window)) {
    errors.push('This app requires the Fetch API. Please use a modern browser.');
  }
  
  return errors;
};

// Check for critical errors
const criticalErrors = checkCriticalErrors();

// Render the app with error boundary
const root = createRoot(document.getElementById('root'));

try {
  if (criticalErrors.length > 0) {
    // Show critical errors
    root.render(
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Browser Compatibility Issue</h1>
        <p>The application cannot run due to the following issues:</p>
        <ul>
          {criticalErrors.map((error, index) => (
            <li key={index} style={{ color: 'red', margin: '0.5rem 0' }}>{error}</li>
          ))}
        </ul>
        <p>Please update your browser or contact support if the issue persists.</p>
      </div>
    );
  } else {
    // Render the app normally
    root.render(
      <StrictMode>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </Router>
      </StrictMode>
    );
  }
} catch (error) {
  // Handle errors during rendering
  console.error('Failed to render the application:', error);
  
  // Show a user-friendly error message
  root.render(
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>We're sorry, but the application failed to load. Please try refreshing the page.</p>
      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          padding: '0.5rem 1rem', 
          marginTop: '1rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Refresh Page
      </button>
    </div>
  );
}
