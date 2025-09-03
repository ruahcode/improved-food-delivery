const axios = require('axios');

const testRegistration = async () => {
  try {
    console.log('Testing registration endpoint...');
    
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123',
      role: 'user'
    };
    
    console.log('Sending registration request with:', {
      ...testUser,
      password: 'provided'
    });
    
    const response = await axios.post('http://localhost:5000/api/user/register', testUser, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('Registration successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Test login with the same user
    console.log('\nTesting login with registered user...');
    const loginResponse = await axios.post('http://localhost:5000/api/user/login', {
      email: testUser.email,
      password: testUser.password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Login response:', loginResponse.data);
    
  } catch (error) {
    console.error('Test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Test duplicate email handling
const testDuplicateEmail = async () => {
  try {
    console.log('\n\nTesting duplicate email handling...');
    
    const duplicateUser = {
      name: 'Duplicate User',
      email: 'duplicate@example.com',
      password: 'TestPassword123',
      role: 'user'
    };
    
    // Register first time
    console.log('First registration attempt...');
    await axios.post('http://localhost:5000/api/user/register', duplicateUser);
    console.log('First registration successful');
    
    // Try to register again with same email
    console.log('Second registration attempt with same email...');
    const response = await axios.post('http://localhost:5000/api/user/register', duplicateUser);
    
    console.log('ERROR: Second registration should have failed!');
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('SUCCESS: Duplicate email properly rejected');
      console.log('Error message:', error.response.data.message);
    } else {
      console.error('Unexpected error:', error.response?.data || error.message);
    }
  }
};

// Run tests
const runTests = async () => {
  await testRegistration();
  await testDuplicateEmail();
};

runTests();