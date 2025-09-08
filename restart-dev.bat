@echo off
echo Stopping existing servers...

REM Kill any existing Node.js processes on ports 5000 and 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a 2>nul

echo Waiting for ports to be released...
timeout /t 3 /nobreak >nul

echo Starting backend server...
cd server
start "Backend Server" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
cd ..\client
start "Frontend Server" cmd /k "npm run dev"

echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this script (servers will continue running)
pause >nul