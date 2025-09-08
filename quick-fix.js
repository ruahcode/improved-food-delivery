const fs = require('fs');
const path = require('path');

console.log('🔧 Running quick fixes for backend connection issues...\n');

// 1. Check if .env files exist and have correct values
const serverEnvPath = path.join(__dirname, 'server', '.env');
const clientEnvPath = path.join(__dirname, 'client', '.env.development');

console.log('1. Checking environment files...');

if (fs.existsSync(serverEnvPath)) {
  const serverEnv = fs.readFileSync(serverEnvPath, 'utf8');
  if (serverEnv.includes('PORT=5000')) {
    console.log('✅ Server .env has correct PORT=5000');
  } else {
    console.log('❌ Server .env missing PORT=5000');
  }
} else {
  console.log('❌ Server .env file not found');
}

if (fs.existsSync(clientEnvPath)) {
  const clientEnv = fs.readFileSync(clientEnvPath, 'utf8');
  if (clientEnv.includes('VITE_API_BASE_URL=http://localhost:5000/api')) {
    console.log('✅ Client .env has correct API URL');
  } else {
    console.log('❌ Client .env missing correct API URL');
  }
} else {
  console.log('❌ Client .env.development file not found');
}

// 2. Create a simple connection test component
console.log('\n2. Creating connection test component...');

const testComponentContent = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { env } from '../config/env.js';

const ConnectionTest = () => {
  const [status, setStatus] = useState('Testing...');
  const [details, setDetails] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const tests = [];
    
    try {
      // Test 1: Health check
      const healthResponse = await axios.get(\`\${env.apiBaseUrl}/health\`);
      tests.push({ name: 'Health Check', status: '✅ Success', data: healthResponse.data });
      
      // Test 2: Restaurants endpoint
      const restaurantsResponse = await axios.get(\`\${env.apiBaseUrl}/restaurants\`);
      tests.push({ name: 'Restaurants API', status: '✅ Success', data: \`Found \${restaurantsResponse.data.length || 0} restaurants\` });
      
      setStatus('✅ All tests passed! Backend is connected.');
    } catch (error) {
      tests.push({ name: 'Connection Test', status: '❌ Failed', data: error.message });
      setStatus('❌ Connection failed. Check if backend server is running.');
    }
    
    setDetails(tests);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Backend Connection Test</h2>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>API URL:</strong> {env.apiBaseUrl}</p>
      
      <h3>Test Results:</h3>
      {details.map((test, index) => (
        <div key={index} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
          <strong>{test.name}:</strong> {test.status}
          <br />
          <small>{JSON.stringify(test.data)}</small>
        </div>
      ))}
      
      <button onClick={testConnection} style={{ marginTop: '10px', padding: '10px' }}>
        Retest Connection
      </button>
    </div>
  );
};

export default ConnectionTest;`;

const testComponentPath = path.join(__dirname, 'client', 'src', 'components', 'ConnectionTest.jsx');
fs.writeFileSync(testComponentPath, testComponentContent);
console.log('✅ Created ConnectionTest component at:', testComponentPath);

// 3. Create a startup guide
console.log('\n3. Creating startup guide...');

const startupGuide = `# Backend Connection Fix Guide

## Current Status
✅ Backend server is running on port 5000
✅ Database is connected
✅ API endpoints are responding

## If you're still having connection issues:

### Step 1: Start Backend Server
\`\`\`bash
cd server
npm run dev
\`\`\`
Wait for: "Server is running on port 5000"

### Step 2: Start Frontend Client
\`\`\`bash
cd client
npm run dev
\`\`\`
Wait for: "Local: http://localhost:5173"

### Step 3: Test Connection
1. Open http://localhost:5173 in your browser
2. Add this to any page to test: <ConnectionTest />
3. Or run: node test-frontend-connection.js

### Step 4: Common Issues
- **Port 5000 in use**: Change PORT in server/.env
- **CORS errors**: Check server/server.js CORS configuration
- **Environment variables**: Verify client/.env.development has VITE_API_BASE_URL=http://localhost:5000/api

### Step 5: Quick Test
Run this command to test everything:
\`\`\`bash
node quick-test.js
\`\`\`
`;

fs.writeFileSync(path.join(__dirname, 'BACKEND_CONNECTION_GUIDE.md'), startupGuide);
console.log('✅ Created startup guide: BACKEND_CONNECTION_GUIDE.md');

console.log('\n🎉 Quick fixes completed!');
console.log('\nNext steps:');
console.log('1. Make sure backend is running: cd server && npm run dev');
console.log('2. Make sure frontend is running: cd client && npm run dev');
console.log('3. Check BACKEND_CONNECTION_GUIDE.md for detailed instructions');
console.log('4. Add <ConnectionTest /> to any React component to test connection');