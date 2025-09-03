import { useState, useCallback } from 'react';
// Using _ to indicate this is intentionally unused
// We're only importing for the type definition in JSDoc
import { apiRequest as _apiRequest } from '../utils/api';

/**
 * Custom hook for handling API requests with loading and error states
 * @param {Function} apiCall - The API call function to wrap
 * @returns {Array} [execute, { data, loading, error }]
 */
const useApi = (apiCall) => {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall(...args);
      
      if (response.error) {
        setState({
          data: null,
          loading: false,
          error: response.error,
        });
      } else {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      }
      
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      setState({
        data: null,
        loading: false,
        error: error.message || 'An error occurred',
      });
      return { data: null, error, status: 0 };
    }
  }, [apiCall]);

  return [execute, { ...state, setState }];
};

export default useApi;
