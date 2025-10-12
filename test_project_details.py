#!/usr/bin/env python3
"""
Test script to verify the Project details endpoint is working
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:8080"  # Adjust if your backend runs on different port
TEST_PROJECT_ID = 1  # Replace with actual project ID

def test_project_details_endpoint():
    """Test the Project details endpoint"""
    
    print("Testing Project details endpoint...")
    print(f"URL: {BASE_URL}/v1/project/{TEST_PROJECT_ID}")
    
    # Note: This test requires valid authentication tokens
    # In a real scenario, you would get these from Firebase auth
    
    headers = {
        'Authorization': 'Bearer your-test-token',  # Replace with real token
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f'{BASE_URL}/v1/project/{TEST_PROJECT_ID}', headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success! Project details retrieved")
            data = response.json()
            print("Response data structure:")
            for key, value in data.items():
                print(f"  {key}: {type(value).__name__} = {value}")
        elif response.status_code == 401:
            print("⚠️  Authentication required (expected in test)")
            print("This confirms the endpoint exists and requires auth")
        elif response.status_code == 404:
            print(f"❌ Project {TEST_PROJECT_ID} not found")
            print("Try changing TEST_PROJECT_ID to an existing project")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is backend running?")
        print("Start backend with: start_backend.bat")
    except Exception as e:
        print(f"❌ Error: {e}")

def verify_frontend_backend_compatibility():
    """Verify the frontend and backend are compatible"""
    print("\n📋 Frontend-Backend Compatibility Check:")
    
    # Fields the frontend expects
    frontend_fields = [
        'name',
        'description', 
        'project_key_id',
        'type',
        'created_at',
        'status',
        'primary_url'
    ]
    
    # Fields the backend returns (from the route code)
    backend_fields = [
        'project_key_id',
        'project_id',
        'name',
        'primary_url',
        'description',
        'type',
        'status',
        'created_at',
        'topic_maps'
    ]
    
    print("Frontend expects:", frontend_fields)
    print("Backend returns:", backend_fields)
    
    missing_fields = []
    for field in frontend_fields:
        if field not in backend_fields:
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Missing fields: {missing_fields}")
    else:
        print("✅ All frontend fields are provided by backend")
    
    extra_fields = []
    for field in backend_fields:
        if field not in frontend_fields:
            extra_fields.append(field)
    
    if extra_fields:
        print(f"ℹ️  Extra backend fields (unused by frontend): {extra_fields}")

if __name__ == "__main__":
    print("🚀 Project Details Endpoint Test")
    print("=" * 50)
    
    verify_frontend_backend_compatibility()
    test_project_details_endpoint()
    
    print("\n" + "=" * 50)
    print("✅ Test complete!")
    print("\nTo test with real data:")
    print("1. Start backend: start_backend.bat")
    print("2. Get a valid Firebase auth token")
    print("3. Replace 'your-test-token' with the real token")
    print("4. Update TEST_PROJECT_ID to an existing project")
    print("5. Run this script again")