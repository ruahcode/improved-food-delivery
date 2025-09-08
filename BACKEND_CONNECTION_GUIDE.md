# Backend Connection Fix Guide

## Current Status
✅ Backend server is running on port 5000
✅ Database is connected
✅ API endpoints are responding

## If you're still having connection issues:

### Step 1: Start Backend Server
```bash
cd server
npm run dev
```
Wait for: "Server is running on port 5000"

### Step 2: Start Frontend Client
```bash
cd client
npm run dev
```
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
```bash
node quick-test.js
```
