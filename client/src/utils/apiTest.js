import axios from 'axios';
import { env } from '../config/env.js';

// Test API connectivity from frontend
export const testAPIConnection = async () => {
  console.log('Testing API connection from frontend...');
  console.log('API Base URL:', env.apiBaseUrl);
  
  try {
    // Test health endpoint
    const response = await axios.get(`${env.apiBaseUrl}/health`);
    console.log('✅ API Connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API Connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

// Test specific endpoints
export const testEndpoints = async () => {
  const endpoints = [
    '/health',
    '/restaurants',
    '/users/profile' // This should fail without auth, but should respond
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${env.apiBaseUrl}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      const status = error.response?.status || 'No response';
      console.log(`${status === 401 ? '✅' : '❌'} ${endpoint}: ${status} ${status === 401 ? '(Expected - needs auth)' : ''}`);
    }
  }
};