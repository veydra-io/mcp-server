# ContentCurator Backend Startup Script
# This script activates the virtual environment and starts the backend server with all required environment variables

Push-Location "C:\Users\alexa\Documents\GitHub\contentcurator-app\backend"; & ".\.venv\Scripts\Activate.ps1"; $env:GITHUB_OWNER = "FrontAnalyticsInc"; $env:PYTHONPATH = "C:\Users\alexa\Documents\GitHub\contentcurator-app\shared"; python main.py