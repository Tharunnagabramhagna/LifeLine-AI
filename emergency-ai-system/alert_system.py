import random

def send_alert():
    """
    Simulate sending an alert to the driver or dispatcher.
    """
    return "ALERT: Priority clearance requested! Please move aside."

def detect_obstacle():
    """
    Simulate obstacle detection (e.g., via camera or sensors).
    
    Returns:
        bool: True if obstacle is detected, False otherwise.
    """
    return random.choice([True, False, False, False]) # 25% chance of obstacle

def public_alert():
    """
    Simulate a public announcement or broadcast to other vehicles.
    """
    return "PUBLIC NOTICE: Emergency vehicle approaching. Clear the lane."
