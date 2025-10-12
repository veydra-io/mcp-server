#!/usr/bin/env python3
"""
Test script to verify that variables are being saved correctly to model metadata
"""

import requests
import json

def test_variables_saving():
    # Test data
    api_url = "http://localhost:5000"
    model_id = "4878819521462272"  # Your model ID
    
    # Test payload
    payload = {
        "initial_topic": "Test retirement home staffing model"
    }
    
    # Headers (you'll need to add your auth token)
    headers = {
        "Content-Type": "application/json",
        # "Authorization": "Bearer YOUR_TOKEN_HERE"  # Add your token
    }
    
    try:
        # Call the initialize endpoint
        print(f"Testing initialization endpoint for model {model_id}...")
        response = requests.post(
            f"{api_url}/v1/model/{model_id}/initialize",
            json=payload,
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nResponse data:")
            print(json.dumps(data, indent=2))
            
            # Check if variables are present
            if 'metadata' in data and 'variables' in data['metadata']:
                variables = data['metadata']['variables']
                print(f"\n✅ Variables found in metadata: {variables}")
                
                # Check nested structure
                if isinstance(variables, dict):
                    print(f"   - Parameters: {len(variables.get('parameters', []))}")
                    print(f"   - Auxiliaries: {len(variables.get('auxiliaries', []))}")
                    print(f"   - Stocks: {len(variables.get('stocks', []))}")
                else:
                    print("   - Variables is not a dict (unexpected format)")
            else:
                print("\n❌ No variables found in metadata")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_variables_saving()