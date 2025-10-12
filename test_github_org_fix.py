"""
Test script to verify GitHub organization API works correctly
This tests the fix for using get_organization() instead of get_user()
"""
from github import Github
import os

# Setup
github_token = "GITHUB_TOKEN_REMOVED"
github_owner = "FrontAnalyticsInc" 
g = Github(github_token)

print("=== Testing GitHub Organization API Fix ===")

# Test 1: Try the old way (get_user) - this should fail
print("\n1. Testing old method (get_user):")
try:
    user_obj = g.get_user(github_owner)
    print(f"   Type: {type(user_obj)}")
    print(f"   Has create_repo? {hasattr(user_obj, 'create_repo')}")
    # Try to create a repo
    repo = user_obj.create_repo(
        name="test-old-method",
        description="Testing old method",
        private=True,
        auto_init=True
    )
    print(f"   ✅ SUCCESS (unexpected!): {repo.full_name}")
except Exception as e:
    print(f"   ❌ FAILED (expected): {e}")

# Test 2: Try the new way (get_organization) - this should work
print("\n2. Testing new method (get_organization):")
try:
    org_obj = g.get_organization(github_owner)
    print(f"   Type: {type(org_obj)}")
    print(f"   Has create_repo? {hasattr(org_obj, 'create_repo')}")
    # Try to create a repo
    repo = org_obj.create_repo(
        name="test-new-method",
        description="Testing new method",
        private=True,
        auto_init=True
    )
    print(f"   ✅ SUCCESS: {repo.full_name}")
    print(f"   URL: {repo.clone_url}")
    
    # Delete the test repo
    repo.delete()
    print(f"   🗑️  Deleted test repository")
    
except Exception as e:
    print(f"   ❌ FAILED: {e}")

# Test 3: Try the combined approach (what's in the fixed code)
print("\n3. Testing combined method (organization first, then user fallback):")
try:
    try:
        user_or_org = g.get_organization(github_owner)
        print(f"   Got organization: {type(user_or_org)}")
    except:
        user_or_org = g.get_user(github_owner)
        print(f"   Got user: {type(user_or_org)}")
    
    # Try to create a repo
    repo = user_or_org.create_repo(
        name="test-combined-method",
        description="Testing combined method",
        private=True,
        auto_init=True
    )
    print(f"   ✅ SUCCESS: {repo.full_name}")
    print(f"   URL: {repo.clone_url}")
    
    # Delete the test repo
    repo.delete()
    print(f"   🗑️  Deleted test repository")
    
except Exception as e:
    print(f"   ❌ FAILED: {e}")

print("\n=== Test Complete ===")
print("The combined method should work and is what's now in the backend code.")
