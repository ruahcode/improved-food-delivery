const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPass123',
  role: 'user'
};

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing Registration...');
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful');
      console.log('📝 User created:', registerResponse.data.user);
      console.log('🔑 Token received:', registerResponse.data.token ? 'Yes' : 'No');
    }

    // Test 2: Login with the same credentials
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      console.log('👤 User data:', loginResponse.data.user);
      console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');
      
      const token = loginResponse.data.token;

      // Test 3: Access protected route
      console.log('\n3️⃣ Testing Protected Route Access...');
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (meResponse.data.success) {
        console.log('✅ Protected route access successful');
        console.log('👤 Current user:', meResponse.data.user);
      }

      // Test 4: Logout
      console.log('\n4️⃣ Testing Logout...');
      const logoutResponse = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (logoutResponse.data.success) {
        console.log('✅ Logout successful');
      }
    }

    console.log('\n🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data?.details) {
      console.error('📋 Error details:', error.response.data.details);
    }
  }
}

// Test invalid credentials
async function testInvalidLogin() {
  console.log('\n🔒 Testing Invalid Login...');
  
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Invalid login properly rejected');
    } else {
      console.error('❌ Unexpected error:', error.response?.data);
    }
  }
}

// Run tests
if (require.main === module) {
  testAuthFlow().then(() => {
    return testInvalidLogin();
  }).catch(console.error);
}

module.exports = { testAuthFlow, testInvalidLogin };