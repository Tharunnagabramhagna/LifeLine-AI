import random
import time

def trigger_alert(message, alert_type="CONSOLE"):
    """
    Simulates triggering an alert across different channels.
    Channels: CONSOLE, SMS, AUDIO
    """
    print(f"[{alert_type}] ALERT: {message}")

def detect_obstacle():
    """
    STEP 1: Simulated AI detection system (behaves like Datature trained model).
    Detects: car, pedestrian, obstacle.
    Includes probability control and real-time detection delay.
    """
    # STEP 6: Add slight delay to simulate real-time AI inference
    time.sleep(0.5) 
    
    # STEP 6: Probability control (e.g., 70% chance of encountering an object)
    if random.random() < 0.7:
        # Returns one of the classes the model was trained on
        object_type = random.choice(["car", "pedestrian", "obstacle"])
        return True, object_type
    
    return False, None

def handle_obstacle(location, object_type):
    """
    STEP 3 & 4: Handles AI detection results with clear logging and alerts.
    """
    # STEP 4: Update Logging with detection result, location, and action
    print(f"\nAI LOG: Model detected [{object_type}] at {location}")
    print(f"ACTION: Slowing down ambulance for {object_type}...")
    
    # STEP 3: Integrate with alert system
    message = f"AI Detected: {object_type} ahead!"
    trigger_alert(message, "CONSOLE")
    trigger_alert(message, "SMS")
    trigger_alert(message, "AUDIO")

def handle_blockage():
    """
    Handles a road blockage by triggering alerts and showing rerouting logic.
    """
    trigger_alert("Road blockage detected", "CONSOLE")
    trigger_alert("Road blockage detected", "SMS")
    trigger_alert("Road blockage detected", "AUDIO")
    trigger_alert("Rerouting ambulance", "CONSOLE")
    print("ACTION: Finding alternative route...")

def simulate_ambulance(route):
    """
    Simulates the ambulance moving through a given route.
    """
    print("--- Ambulance Emergency Response Simulation (AI-Powered) ---")
    
    for i, location in enumerate(route):
        print(f"\nStep {i+1}: Ambulance at {location}")
        trigger_alert("Ambulance approaching", "CONSOLE")
        trigger_alert("Ambulance approaching", "SMS")
        trigger_alert("Ambulance approaching", "AUDIO")
        
        # STEP 2: Replace existing random logic with AI detection simulation
        # First, check for general AI detected obstacles (car, pedestrian, obstacle)
        detected, object_type = detect_obstacle()
        
        if detected:
            handle_obstacle(location, object_type)
        else:
            # Randomly simulate a heavy blockage separate from object detection
            # or proceed if the road is clear
            event = random.choice(["blockage", "none", "none"])
            if event == "blockage":
                handle_blockage()
            else:
                print(f"AI LOG: No obstacles detected by model at {location}")
                print("STATUS: Road clear. Proceeding at full speed.")
            
        time.sleep(1)  # Simulate travel time between steps

    print("\n--- Simulation Completed: Destination Reached ---")

if __name__ == "__main__":
    # Define a sample route
    emergency_route = [
        "Main Street", 
        "Broadway Avenue", 
        "Green Park Intersection", 
        "City Hospital Entrance"
    ]
    
    simulate_ambulance(emergency_route)
