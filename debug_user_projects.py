#!/usr/bin/env python3
"""
Debug script to test UserProjects endpoint and see the actual data structure
"""

import requests
import json

# Test configuration
BASE_URL = "http://localhost:8080"  # Adjust if your backend runs on different port

def test_user_projects_endpoint():
    """Test the UserProjects endpoint and analyze the data"""
    
    print("Testing UserProjects endpoint...")
    print(f"URL: {BASE_URL}/v1/user/projects")
    
    # Note: This test requires valid authentication tokens
    headers = {
        'Authorization': 'Bearer your-test-token',  # Replace with real token
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f'{BASE_URL}/v1/user/projects', headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success! Projects retrieved")
            data = response.json()
            print(f"Total projects returned: {len(data)}")
            print("\nProject data structure:")
            
            for i, project in enumerate(data):
                print(f"\n--- Project {i+1} ---")
                for key, value in project.items():
                    print(f"  {key}: {value} ({type(value).__name__})")
                
                # Check for potential mismatches
                if 'project_key_id' in project and 'project_id' in project:
                    if project['project_key_id'] != project['project_id']:
                        print(f"  ⚠️  ID MISMATCH: project_key_id={project['project_key_id']} != project_id={project['project_id']}")
                    else:
                        print(f"  ✅ IDs match: {project['project_key_id']}")
                        
        elif response.status_code == 401:
            print("⚠️  Authentication required (expected in test)")
            print("Replace 'your-test-token' with a real Firebase auth token")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is backend running?")
        print("Start backend with: start_backend.bat")
    except Exception as e:
        print(f"❌ Error: {e}")

def analyze_data_flow():
    """Analyze the expected data flow"""
    print("\n📊 Data Flow Analysis:")
    print("1. Authorization entities contain 'project_key' (datastore Key)")
    print("2. project_key.id gives us the project entity ID")
    print("3. We fetch project entities using these IDs")
    print("4. Project entities have:")
    print("   - entity.key.id (the datastore ID)")
    print("   - entity.get('project_id') (separate field)")
    print("   - entity.get('project_name')")
    print("   - entity.get('description')")
    print("\n5. Frontend expects:")
    print("   - project.project_key_id (for URLs)")
    print("   - project.name (for display)")
    print("   - project.description (for display)")
    print("\n6. The mismatch could be:")
    print("   - Authorization pointing to wrong project")
    print("   - Cached data out of sync")
    print("   - Array indexing issue in backend")
    print("   - Missing/deleted project entities")

if __name__ == "__main__":
    print("🔍 UserProjects Data Debugging")
    print("=" * 50)
    
    analyze_data_flow()
    test_user_projects_endpoint()
    
    print("\n" + "=" * 50)
    print("🔧 Next steps to debug:")
    print("1. Check backend logs for WARNING messages")
    print("2. Compare project names/descriptions in database vs displayed")
    print("3. Verify authorization entities are pointing to correct projects")
    print("4. Clear frontend cache and test again")