const http = require('http');
const { spawn } = require('child_process');

// Test if a port is accessible
function testPort(port, host = 'localhost') {
  return new Promise((resolve) => {
    const req = http.request({
      host,
      port,
      method: 'GET',
      path: port === 5000 ? '/api/health' : '/',
      timeout: 5000
    }, (res) => {
      resolve({ success: true, status: res.statusCode });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('Testing server connections...\n');

  // Test backend
  console.log('Testing backend (port 5000)...');
  const backendResult = await testPort(5000);
  console.log(`Backend: ${backendResult.success ? '✓ OK' : '✗ Failed'} - ${backendResult.error || `Status: ${backendResult.status}`}\n`);

  // Test frontend
  console.log('Testing frontend (port 5173)...');
  const frontendResult = await testPort(5173);
  console.log(`Frontend: ${frontendResult.success ? '✓ OK' : '✗ Failed'} - ${frontendResult.error || `Status: ${frontendResult.status}`}\n`);

  // Provide recommendations
  if (!backendResult.success) {
    console.log('❌ Backend server is not responding. Please:');
    console.log('   1. Navigate to the server directory: cd server');
    console.log('   2. Start the backend: npm run dev');
    console.log('   3. Check for any error messages\n');
  }

  if (!frontendResult.success) {
    console.log('❌ Frontend server is not responding. Please:');
    console.log('   1. Navigate to the client directory: cd client');
    console.log('   2. Start the frontend: npm run dev');
    console.log('   3. Check for any error messages\n');
  }

  if (backendResult.success && frontendResult.success) {
    console.log('✅ Both servers are running correctly!');
    console.log('   Backend: http://localhost:5000');
    console.log('   Frontend: http://localhost:5173');
    console.log('\nIf you\'re still experiencing ERR_EMPTY_RESPONSE errors:');
    console.log('   1. Clear your browser cache');
    console.log('   2. Try opening in an incognito/private window');
    console.log('   3. Check browser console for specific error messages');
  }
}

main().catch(console.error);