const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testRegistration() {
  try {
    console.log('Testing registration...\n');

    const registrationData = {
      name: 'Abigail Test',
      email: 'test@example.com',
      password: 'Test1234',
      role: 'user'
    };

    console.log('Registration data:', registrationData);

    const response = await axios.post(`${API_BASE_URL}/user/register`, registrationData);
    console.log('Registration success:', response.data);

  } catch (error) {
    console.log('Registration error:', error.response?.data || error.message);
  }
}

testRegistration();