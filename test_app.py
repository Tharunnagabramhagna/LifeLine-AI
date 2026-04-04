import unittest
from geopy.distance import geodesic

# Mock data from app.py
AMBULANCES = [
    {"id": "AMB-001", "lat": 17.4000, "lon": 78.4500, "status": "Available"},
    {"id": "AMB-002", "lat": 17.4300, "lon": 78.4200, "status": "Available"},
    {"id": "AMB-003", "lat": 17.3700, "lon": 78.5000, "status": "Available"}
]

def get_nearest_ambulance(user_loc):
    min_dist = float('inf')
    nearest = None
    for amb in AMBULANCES:
        dist = geodesic(user_loc, (amb['lat'], amb['lon'])).km
        if dist < min_dist:
            min_dist = dist
            nearest = amb
    return nearest, min_dist

class TestLifeLine(unittest.TestCase):
    def test_nearest_ambulance(self):
        user_loc = (17.4120, 78.4450)
        nearest, dist = get_nearest_ambulance(user_loc)
        self.assertEqual(nearest['id'], "AMB-001")
        self.assertLess(dist, 2.0)

if __name__ == '__main__':
    unittest.main()
