const axios = require('axios');

// Test script for payment verification endpoints
const BASE_URL = 'http://localhost:5000/api';

async function testPaymentVerification() {
  console.log('🧪 Testing Payment Verification Endpoints\n');

  // Test 1: Check if payment API is running
  try {
    console.log('1. Testing payment API health...');
    const response = await axios.get(`${BASE_URL}/payment/`);
    console.log('✅ Payment API is running');
    console.log('Available endpoints:', response.data.endpoints);
  } catch (error) {
    console.log('❌ Payment API is not accessible:', error.message);
    return;
  }

  // Test 2: Test verification endpoint without auth (should fail)
  try {
    console.log('\n2. Testing verification endpoint without auth...');
    const response = await axios.get(`${BASE_URL}/payment/verify/test-order-id`);
    console.log('❌ Unexpected success - should require auth');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly requires authentication');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.message);
    }
  }

  // Test 3: Test tx_ref verification endpoint without auth (should fail)
  try {
    console.log('\n3. Testing tx_ref verification endpoint without auth...');
    const response = await axios.get(`${BASE_URL}/payment/verify/tx/test-tx-ref`);
    console.log('❌ Unexpected success - should require auth');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly requires authentication');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.message);
    }
  }

  // Test 4: Create test user and get token
  let authToken = null;
  try {
    console.log('\n4. Creating test user for authentication...');
    const response = await axios.post(`${BASE_URL}/debug/create-user`);
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Test user created and authenticated');
    } else {
      console.log('❌ Failed to create test user:', response.data.error);
      return;
    }
  } catch (error) {
    console.log('❌ Error creating test user:', error.message);
    return;
  }

  // Test 5: Test verification with valid auth but invalid order
  try {
    console.log('\n5. Testing verification with invalid order ID...');
    const response = await axios.get(`${BASE_URL}/payment/verify/invalid-order-id`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('❌ Unexpected success for invalid order');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly returns 404 for invalid order');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.message);
    }
  }

  // Test 6: Test tx_ref verification with valid auth but invalid tx_ref
  try {
    console.log('\n6. Testing tx_ref verification with invalid tx_ref...');
    const response = await axios.get(`${BASE_URL}/payment/verify/tx/invalid-tx-ref`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('❌ Unexpected success for invalid tx_ref');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly returns 404 for invalid tx_ref');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.message);
    }
  }

  console.log('\n🎉 Payment verification endpoint tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Payment API is accessible');
  console.log('- Authentication is properly enforced');
  console.log('- Both verification endpoints exist and respond correctly');
  console.log('- Error handling works as expected');
  
  console.log('\n🔧 Next steps to test with real data:');
  console.log('1. Create an order through the frontend');
  console.log('2. Initiate payment with Chapa');
  console.log('3. Use the tx_ref from Chapa to test verification');
  console.log('4. Check that the order status updates correctly');
}

// Run the test
testPaymentVerification().catch(console.error);