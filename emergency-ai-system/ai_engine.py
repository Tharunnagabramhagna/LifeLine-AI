def decide_action(traffic, obstacle, signal):
    """
    Decide the best action for the emergency vehicle based on current conditions.
    
    Args:
        traffic (str): Traffic level (Low, Medium, High)
        obstacle (bool): Whether an obstacle is detected
        signal (str): Current traffic signal state (Red, Yellow, Green)
        
    Returns:
        tuple: (action, reason)
    """
    if obstacle:
        return "REROUTE", "Obstacle detected on the current path. Finding alternative route."
    
    if traffic == "High":
        if signal == "Red":
            return "TURN_GREEN", "High traffic and red signal detected. Requesting priority signal change."
        return "SEND_ALERT", "High traffic density. Sending emergency alerts to nearby vehicles."
    
    if signal == "Red":
        return "TURN_GREEN", "Red signal detected. Requesting priority signal change for clear passage."
        
    return "PROCEED", "Conditions are clear. Proceeding as planned."
