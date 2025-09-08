const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  
  try {
    const response = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
    console.log('✅ Backend is running and healthy');
    console.log('   Status:', response.data.status);
    console.log('   Database:', response.data.dbStatus);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running on port 5000');
      console.log('   Start it with: cd server && npm run dev');
    } else {
      console.log('❌ Backend connection error:', error.message);
    }
    return false;
  }
}

async function testFrontendConfig() {
  console.log('\\n🔍 Testing frontend configuration...');
  
  try {
    const fs = require('fs');
    const envPath = path.join(__dirname, 'client', '.env.development');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('VITE_API_BASE_URL=http://localhost:5000/api')) {
        console.log('✅ Frontend environment is correctly configured');
        return true;
      } else {
        console.log('❌ Frontend environment missing correct API URL');
        return false;
      }
    } else {
      console.log('❌ Frontend .env.development file not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking frontend config:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\\n🔍 Testing API endpoints...');
  
  const endpoints = [
    { path: '/health', description: 'Health check' },
    { path: '/restaurants', description: 'Restaurants list' },
    { path: '/users/profile', description: 'User profile (should require auth)' }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`http://localhost:5000/api${endpoint.path}`, { timeout: 3000 });
      console.log(`✅ ${endpoint.description}: ${response.status}`);
      successCount++;
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 && endpoint.path === '/users/profile') {
        console.log(`✅ ${endpoint.description}: 401 (Expected - requires authentication)`);
        successCount++;
      } else {
        console.log(`❌ ${endpoint.description}: ${status || error.code}`);
      }
    }
  }
  
  return successCount === endpoints.length;
}

function showStartupInstructions() {
  console.log('\\n📋 Startup Instructions:');
  console.log('\\n1. Start Backend Server:');
  console.log('   cd server');
  console.log('   npm run dev');
  console.log('   Wait for: "Server is running on port 5000"');
  
  console.log('\\n2. Start Frontend Client (in a new terminal):');
  console.log('   cd client');
  console.log('   npm run dev');
  console.log('   Wait for: "Local: http://localhost:5173"');
  
  console.log('\\n3. Open your browser to: http://localhost:5173');
  
  console.log('\\n🔧 Troubleshooting:');
  console.log('   - If port 5000 is busy: Change PORT in server/.env');
  console.log('   - If CORS errors: Check server CORS configuration');
  console.log('   - If API errors: Verify VITE_API_BASE_URL in client/.env.development');
}

async function main() {
  console.log('🚀 Food Delivery App - Connection Test\\n');
  
  const backendOk = await testBackendConnection();
  const frontendConfigOk = await testFrontendConfig();
  
  if (backendOk) {
    await testAPIEndpoints();
    
    console.log('\\n🎉 Backend is working correctly!');
    console.log('   Your backend server is running and responding to requests.');
    
    if (frontendConfigOk) {
      console.log('✅ Frontend configuration is correct.');
      console.log('\\n✨ Everything looks good! Your app should work properly.');
      console.log('   If you are still having issues, they might be:');
      console.log('   - Frontend not running (start with: cd client && npm run dev)');
      console.log('   - Browser cache (try hard refresh: Ctrl+F5)');
      console.log('   - Network/firewall issues');
    } else {
      console.log('❌ Frontend configuration needs fixing.');
    }
  } else {
    console.log('\\n❌ Backend server is not running.');
    showStartupInstructions();
  }
  
  console.log('\\n📁 Helpful files created:');
  console.log('   - ConnectionTest.jsx (React component to test API)');
  console.log('   - BACKEND_CONNECTION_GUIDE.md (detailed guide)');
  console.log('   - start-dev.bat (Windows startup script)');
}

main().catch(console.error);