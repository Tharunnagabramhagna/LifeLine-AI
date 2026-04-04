import random

def get_routes(start, end):
    """
    Simulate multiple routes between two points.
    
    Returns:
        list: A list of route dictionaries with name and estimated time.
    """
    if not start or not end:
        return []
        
    routes = [
        {"name": "Main Highway (Route A)", "time": random.randint(10, 25)},
        {"name": "Inner City (Route B)", "time": random.randint(15, 30)},
        {"name": "Expressway (Route C)", "time": random.randint(12, 20)}
    ]
    return routes

def get_best_route(routes):
    """
    Select the route with the minimum estimated time.
    
    Returns:
        dict: The best route.
    """
    if not routes:
        return None
    return min(routes, key=lambda x: x["time"])
