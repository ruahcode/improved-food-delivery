const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testLogin() {
  try {
    console.log('Testing login functionality...\n');

    // First, create a test user
    console.log('1. Creating test user...');
    try {
      const createUserResponse = await axios.post(`${API_BASE_URL}/debug/create-user`);
      console.log('Create user response:', createUserResponse.data);
    } catch (error) {
      console.log('Create user error:', error.response?.data || error.message);
    }

    // Test login with correct credentials
    console.log('\n2. Testing login with correct credentials...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/user/login`, {
        email: 'test@test.com',
        password: 'Test123!'
      });
      console.log('Login success:', loginResponse.data);
      
      // Test the /me endpoint with the token
      if (loginResponse.data.token) {
        console.log('\n3. Testing /me endpoint with token...');
        const meResponse = await axios.get(`${API_BASE_URL}/user/me`, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });
        console.log('Me endpoint response:', meResponse.data);
      }
    } catch (error) {
      console.log('Login error:', error.response?.data || error.message);
    }

    // Test login with wrong password
    console.log('\n4. Testing login with wrong password...');
    try {
      const wrongPasswordResponse = await axios.post(`${API_BASE_URL}/user/login`, {
        email: 'test@test.com',
        password: 'WrongPassword123!'
      });
      console.log('Wrong password response:', wrongPasswordResponse.data);
    } catch (error) {
      console.log('Wrong password error (expected):', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Run the test
testLogin();