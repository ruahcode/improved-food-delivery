@echo off
echo Starting Food Delivery Application...
echo.

echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MongoDB is running
) else (
    echo MongoDB is not running. Please start MongoDB first.
    echo You can start MongoDB with: net start MongoDB
    pause
    exit /b 1
)

echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd /d server && npm run dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend client...
start "Frontend Client" cmd /k "cd /d client && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause