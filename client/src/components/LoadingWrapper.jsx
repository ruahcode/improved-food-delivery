import React from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';

/**
 * A wrapper component that shows a loading spinner while content is loading
 * and handles error states
 */
const LoadingWrapper = ({
  isLoading = false,
  error = null,
  loadingText = 'Loading...',
  errorTitle = 'Error loading content',
  children,
  className = '',
  spinnerSize = 'md',
  minHeight = '200px',
}) => {
  // Show error state
  if (error) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg ${className}`}
        style={{ minHeight }}
      >
        <div className="text-red-600 text-2xl mb-2">⚠️ {errorTitle}</div>
        <p className="text-gray-700 text-center mb-4">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div 
        className={`flex flex-col items-center justify-center ${className}`}
        style={{ minHeight }}
      >
        <LoadingSpinner size={spinnerSize} />
        {loadingText && (
          <p className="mt-4 text-gray-600">{loadingText}</p>
        )}
      </div>
    );
  }

  // Show children when not loading and no error
  return children;
};

LoadingWrapper.propTypes = {
  /** Whether the content is currently loading */
  isLoading: PropTypes.bool,
  /** Error object if an error occurred */
  error: PropTypes.instanceOf(Error),
  /** Text to show while loading */
  loadingText: PropTypes.string,
  /** Title to show when there's an error */
  errorTitle: PropTypes.string,
  /** Child elements to render when not loading */
  children: PropTypes.node.isRequired,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Size of the loading spinner */
  spinnerSize: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Minimum height of the loading/error container */
  minHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default LoadingWrapper;
