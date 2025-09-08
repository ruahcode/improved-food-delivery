const axios = require('axios');

async function checkBackendConnection() {
  console.log('Checking backend connection...');
  
  try {
    // Test basic connection
    const response = await axios.get('http://localhost:5000/api/health', {
      timeout: 5000
    });
    
    console.log('✅ Backend is running!');
    console.log('Health check response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Backend connection failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('- Server is not running on port 5000');
      console.log('- Run: cd server && npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('- Server is taking too long to respond');
    } else {
      console.log('- Error:', error.message);
    }
    
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\nTesting API endpoints...');
  
  const endpoints = [
    '/api/health',
    '/api/debug/create-user',
    '/api/restaurants'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`http://localhost:5000${endpoint}`, {
        timeout: 3000
      });
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.response?.status || error.code}`);
    }
  }
}

async function main() {
  const isConnected = await checkBackendConnection();
  
  if (isConnected) {
    await testAPIEndpoints();
  } else {
    console.log('\n🔧 To fix this issue:');
    console.log('1. Open a terminal in the server directory');
    console.log('2. Run: npm install (if not done already)');
    console.log('3. Run: npm run dev');
    console.log('4. Wait for "Server is running on port 5000" message');
    console.log('5. Run this script again to verify');
  }
}

main().catch(console.error);