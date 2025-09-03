import axios from 'axios';
import { env } from '../config/env';

// Create an axios instance with default config
const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true, // This is important for sending cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds
  validateStatus: (status) => status < 500, // Don't throw for 4xx errors
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    // Don't add token to login/register requests
    const isAuthRequest = config.url?.includes('/login') || config.url?.includes('/register');
    if (!isAuthRequest) {
      const token = localStorage.getItem('token');
      if (token && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      console.error('Authentication error:', error.response?.data?.message || 'Please log in');
    }
    return Promise.reject(error);
  }
);

/**
 * Handles API requests with proper error handling and loading states
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} options - Axios request config (method, headers, data, etc.)
 * @param {Object} config - Additional configuration (e.g., showLoader, handleErrors)
 * @returns {Promise<{data: any, error: string | null, status: number}>}
 */
export const apiRequest = async (endpoint, options = {}, config = {}) => {
  const { showLoader = true } = config;

  try {
    // Show loading indicator if needed
    if (showLoader) {
      // You can dispatch a global loading state here if you're using a state management solution
      // For example: store.dispatch(showGlobalLoader());
    }

    // Use the axios instance for the request
    const response = await api({
      url: endpoint,
      ...options,
    });

    return {
      data: response.data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    console.error('API Request Error:', error);
    
    // Handle error response
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        data: null,
        error: error.response.data?.message || error.message,
        status: error.response.status,
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        data: null,
        error: 'No response from server. Please check your connection.',
        status: 0,
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        data: null,
        error: error.message || 'An error occurred while setting up the request',
        status: 0,
      };
    }
  } finally {
    // Hide loading indicator if it was shown
    if (showLoader) {
      // For example: store.dispatch(hideGlobalLoader());
    }
  }
};

/**

  // Handle specific error status codes
  if (status === 401) {
    // Handle unauthorized error (e.g., redirect to login)
    if (window.location.pathname !== '/login') {
      // Store the current URL for redirecting back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/login';
    }
    return;
  }

  // Show error notification if enabled
  if (showNotification) {
    // You can integrate with a notification system here
    // For example: showToast(error.message || 'An error occurred', 'error');
    console.error('API Error:', error.message);
  }
}

/**
 * Helper function for GET requests
 */
export const get = (endpoint, config = {}) => {
  return apiRequest(endpoint, { method: 'GET' }, config);
};

/**
 * Helper function for POST requests
 */
export const post = (endpoint, data = {}, config = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }, config);
};

/**
 * Helper function for PUT requests
 */
export const put = (endpoint, data = {}, config = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, config);
};

/**
 * Helper function for DELETE requests
 */
export const del = (endpoint, config = {}) => {
  return apiRequest(endpoint, { method: 'DELETE' }, config);
};

/**
 * Helper function for PATCH requests
 */
export const patch = (endpoint, data = {}, config = {}) => {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, config);
};
