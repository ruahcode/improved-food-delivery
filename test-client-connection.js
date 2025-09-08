const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testClientConnection() {
  try {
    console.log('Testing client connection to server...\n');

    // Test basic connection
    console.log('1. Testing basic connection...');
    try {
      const response = await axios.get('http://localhost:5000');
      console.log('Server response:', response.data);
    } catch (error) {
      console.log('Connection error:', error.message);
      return;
    }

    // Test CORS preflight
    console.log('\n2. Testing CORS preflight...');
    try {
      const response = await axios.options(`${API_BASE_URL}/user/login`);
      console.log('CORS preflight response status:', response.status);
    } catch (error) {
      console.log('CORS preflight error:', error.response?.status || error.message);
    }

    // Test login endpoint directly
    console.log('\n3. Testing login endpoint directly...');
    try {
      const response = await axios.post(`${API_BASE_URL}/user/login`, {
        email: 'test@test.com',
        password: 'Test123!'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      console.log('Direct login response:', response.data);
    } catch (error) {
      console.log('Direct login error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testClientConnection();