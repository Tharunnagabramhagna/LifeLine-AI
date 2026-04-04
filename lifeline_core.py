import requests
import time
import random

import os

# Configuration
BACKEND_HOST = os.getenv("BACKEND_HOST", "localhost")
BACKEND_URL = f"http://{BACKEND_HOST}:5000/api"
LOGIN_URL = f"http://{BACKEND_HOST}:5000/api/login"

def get_auth_token():
    """
    Authenticates with the backend to get a JWT token.
    """
    try:
        print("🔐 [Simulation] Logging in to get auth token...")
        response = requests.post(LOGIN_URL, json={
            "email": "admin@lifeline.ai",
            "password": "admin123"
        })
        if response.status_code == 200:
            token = response.json().get('token')
            print("✅ [Auth] Login successful.")
            return token
        else:
            print(f"❌ [Auth] Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ [Auth Exception] {e}")
        return None

def trigger_emergency(event_type, location, region_id, token):
    """
    Sends emergency data to the Node.js backend with JWT token and region.
    """
    payload = {
        "type": event_type,
        "location": location,
        "region_id": region_id
    }
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        print(f"📡 [Simulation] Sending emergency event: {event_type} at {location} (Region: {region_id})...")
        response = requests.post(f"{BACKEND_URL}/emergency", json=payload, headers=headers)
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ [Backend Response] Event ID: {data['id']}")
            print(f"🚑 [Assignment] Ambulance Assigned: {data['ambulance_assigned']['location']}")
            print(f"📝 [Status] {data['ambulance_assigned']['status']}")
        else:
            print(f"❌ [Error] Failed to connect. Status: {response.status_code}, Body: {response.text}")
            
    except Exception as e:
        print(f"❌ [Exception] {e}")

if __name__ == "__main__":
    # Get token first
    token = get_auth_token()
    
    if token:
        # Simulate a few events across different regions
        emergencies = [
            ("CAR_ACCIDENT", "Broadway & 5th Ave", 1), # New York
            ("HEART_ATTACK", "Wall Street", 1),        # New York
            ("FIRE", "Piccadilly Circus", 2),         # London
            ("MEDICAL", "Shibuya Crossing", 3)        # Tokyo
        ]
        
        for event_type, location, region_id in emergencies:
            trigger_emergency(event_type, location, region_id, token)
            print("-" * 40)
            time.sleep(2)
    else:
        print("🛑 [Simulation] Aborting: No valid auth token.")
