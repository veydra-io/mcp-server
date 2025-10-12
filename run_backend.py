import sys
import os

# Set up environment variables
os.environ['GITHUB_TOKEN'] = 'GITHUB_TOKEN_REMOVED'
os.environ['GITHUB_OWNER'] = 'FrontAnalyticsInc'

# Add shared to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'shared'))

# Change to backend directory  
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
os.chdir(backend_dir)

# Import and run the main module
exec(open('main.py').read())
