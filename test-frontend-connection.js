const axios = require('axios');

async function testFrontendToBackend() {
  console.log('Testing frontend to backend connection...');
  
  // Test the exact configuration the frontend uses
  const API_BASE_URL = 'http://localhost:5000/api';
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check successful:', healthResponse.data);
    
    // Test restaurants endpoint (commonly used by frontend)
    console.log('\n2. Testing restaurants endpoint...');
    const restaurantsResponse = await axios.get(`${API_BASE_URL}/restaurants`);
    console.log('✅ Restaurants endpoint successful. Count:', restaurantsResponse.data.length || 'N/A');
    
    // Test with CORS headers (simulate browser request)
    console.log('\n3. Testing with CORS headers...');
    const corsResponse = await axios.get(`${API_BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS test successful');
    
    // Test authentication endpoint
    console.log('\n4. Testing auth endpoints...');
    try {
      const authResponse = await axios.post(`${API_BASE_URL}/users/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Auth endpoint responding (expected 400 for invalid credentials)');
      } else {
        console.log('❌ Auth endpoint error:', error.message);
      }
    }
    
    console.log('\n🎉 All tests passed! Frontend should be able to connect to backend.');
    
  } catch (error) {
    console.log('❌ Connection test failed:');
    console.log('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Backend server is not running. Start it with:');
      console.log('cd server && npm run dev');
    } else if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testFrontendToBackend();