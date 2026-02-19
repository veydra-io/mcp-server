@echo off
echo.
echo ===========================================
echo   ContentCurator Backend Server Startup
echo ===========================================
echo.
echo 🚀 Starting ContentCurator Backend Server...
echo 📦 Activating virtual environment...
echo 🔧 Setting GitHub environment variables...
echo 🌐 Server will start on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo ===========================================
echo.

REM Change to project directory
cd /d "C:\Users\alexa\Documents\GitHub\contentcurator-app"

REM Activate virtual environment and start backend server with all environment variables
powershell -Command "& .\backend\.venv\Scripts\Activate.ps1; $env:GITHUB_TOKEN=$env:GITHUB_TOKEN; $env:GITHUB_OWNER='FrontAnalyticsInc'; $env:PYTHONPATH='C:\Users\alexa\Documents\GitHub\contentcurator-app\shared;C:\Users\alexa\Documents\GitHub\contentcurator-app'; cd backend; python main.py"

echo.
echo Server stopped.
pause
