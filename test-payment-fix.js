const axios = require('axios');

async function testPaymentVerification() {
  const BASE_URL = 'http://localhost:5000/api';
  
  try {
    // Get test user token
    console.log('Getting test user token...');
    const authResponse = await axios.post(`${BASE_URL}/debug/create-user`);
    const token = authResponse.data.token;
    console.log('✅ Got auth token');

    // Test verification endpoint with a real order ID from your logs
    const orderId = '68b013319bbc9d6e2af6a885';
    
    console.log(`Testing verification for order: ${orderId}`);
    const verifyResponse = await axios.get(`${BASE_URL}/payment/verify/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Verification response:', verifyResponse.data);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testPaymentVerification();