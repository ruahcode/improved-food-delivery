const axios = require('axios');

async function testFrontendAuth() {
  console.log('🔍 Testing frontend authentication flow...\n');
  
  // Configure axios like the frontend does
  axios.defaults.withCredentials = true;
  
  try {
    // Test the exact API call the frontend makes
    console.log('1. Testing login API call...');
    const response = await axios.post('http://localhost:5000/api/user/login', {
      email: 'testuser@example.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Token received:', !!response.data.token);
    console.log('   User data:', !!response.data.user);
    
    if (response.data.token) {
      // Test authenticated request
      console.log('\n2. Testing authenticated request...');
      const meResponse = await axios.get('http://localhost:5000/api/user/me', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('✅ Authenticated request successful');
      console.log('   User:', meResponse.data.user.email);
    }
    
    console.log('\n🎉 Frontend authentication flow is working correctly!');
    console.log('\n📋 Test Credentials:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: password123');
    
  } catch (error) {
    console.log('❌ Authentication test failed:');
    console.log('   Status:', error.response?.status);
    console.log('   Message:', error.response?.data?.message || error.message);
    console.log('   Data:', error.response?.data);
  }
}

testFrontendAuth();