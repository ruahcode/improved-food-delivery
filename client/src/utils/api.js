import { env } from '../config/env.js';

// Get the API base URL from environment variables
export const API_BASE_URL = env.apiBaseUrl;

// Helper function to construct API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

export default {
  API_BASE_URL,
  getApiUrl
};