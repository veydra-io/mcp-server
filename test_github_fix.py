import requests
import json
from github import Github
import os

# Test GitHub organization fix
print("=== Testing GitHub Organization Fix ===")

# Set up authentication
login_data = {
    "email": "alexanderalton+test72@gmail.com",
    "password": "1234567890"
}

# Login
response = requests.post("http://localhost:5000/v1/login", json=login_data)
if response.status_code != 200:
    print(f"❌ Login failed: {response.text}")
    exit(1)

token = response.json()['token']
headers = {"Authorization": f"Bearer {token}"}

# GitHub setup for verification
github_token = os.environ.get('GITHUB_TOKEN', 'your-github-token-here')
github_owner = "FrontAnalyticsInc"
g = Github(github_token)

print("✅ Authentication successful")

# Test model creation with organization fix
model_data = {
    "name": "GitHub Organization Test Model",
    "description": "Testing organization repository creation with fix",
    "source_data_description": "Test data for GitHub organization integration",
    "is_public": False
}

print("\n🔄 Creating model...")
response = requests.post("http://localhost:5000/v1/model", headers=headers, json=model_data)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    model_info = response.json()
    print(f"Response: {json.dumps(model_info, indent=2)}")
    
    if 'repository_url' in model_info:
        repo_url = model_info['repository_url']
        print(f"\n📁 Repository URL: {repo_url}")
        
        # Extract owner/repo from URL
        import re
        match = re.search(r'github\.com[:/]([^/]+)/([^/.]+)', repo_url)
        if match:
            owner = match.group(1)
            repo_name = match.group(2)
            
            print(f"🔍 Checking if repository exists: {owner}/{repo_name}")
            
            try:
                repo = g.get_repo(f"{owner}/{repo_name}")
                print(f"✅ SUCCESS! Repository EXISTS: {repo.full_name}")
                print(f"   📝 Description: {repo.description}")
                print(f"   🔒 Private: {repo.private}")
                print(f"   📅 Created: {repo.created_at}")
                print(f"   🌐 Clone URL: {repo.clone_url}")
                
                # Test deletion
                print(f"\n🗑️  Testing model deletion...")
                delete_response = requests.delete(f"http://localhost:5000/v1/model/{model_info['id']}", headers=headers)
                print(f"Delete Status: {delete_response.status_code}")
                if delete_response.status_code == 200:
                    print("✅ Model deleted successfully")
                    
                    # Verify repository was also deleted
                    try:
                        repo = g.get_repo(f"{owner}/{repo_name}")
                        print("❌ Repository still exists after model deletion")
                    except:
                        print("✅ Repository was successfully deleted")
                else:
                    print(f"❌ Model deletion failed: {delete_response.text}")
                
            except Exception as e:
                print(f"❌ FAILED! Repository DOES NOT EXIST: {e}")
        else:
            print("❌ Could not parse repository URL")
    else:
        print("❌ No repository_url in response")
else:
    print(f"❌ Model creation failed: {response.text}")

print("\n=== Test Complete ===")
