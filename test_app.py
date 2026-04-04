import unittest
from geopy.distance import geodesic
import database_manager as db
import os

# Initialize test DB
db.DB_PATH = "test_lifeline.db"
if os.path.exists(db.DB_PATH):
    os.remove(db.DB_PATH)

EMERGENCY_MAP = {
    "Cardiac Arrest": "Cardiac",
    "Road Accident": "Trauma"
}


def assign_best_hospital(user_loc, emergency_type):
    target_specialty = EMERGENCY_MAP.get(emergency_type, "Trauma")
    active_hospitals = db.get_active_hospitals()

    suitable = [h for h in active_hospitals if h['specialty']
                == target_specialty]
    if not suitable:
        suitable = active_hospitals

    if not suitable:
        return None, float('inf')

    min_dist = float('inf')
    best = None
    for hosp in suitable:
        dist = geodesic(user_loc, (hosp['lat'], hosp['lon'])).km
        if dist < min_dist:
            min_dist = dist
            best = hosp
    return best, min_dist


class TestLifeLineAdvanced(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db.init_db()
        # Ensure we have a diversion hospital for testing
        hospitals = db.get_all_hospitals()
        if hospitals:
            db.update_hospital_status(hospitals[0]['id'], 'Diversion')

    def test_hospital_diversion_logic(self):
        user_loc = (17.4120, 78.4450)
        # The first hospital is now on diversion, so it should NOT be picked
        best_hosp, dist = assign_best_hospital(user_loc, "Road Accident")
        self.assertIsNotNone(best_hosp)
        self.assertNotEqual(best_hosp['status'], 'Diversion')

    def test_no_beds_logic(self):
        # Mark all hospitals as full
        hospitals = db.get_all_hospitals()
        for h in hospitals:
            db.update_hospital_beds(h['id'], 0)

        user_loc = (17.4120, 78.4450)
        best_hosp, dist = assign_best_hospital(user_loc, "Cardiac Arrest")
        self.assertIsNone(best_hosp)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(db.DB_PATH):
            os.remove(db.DB_PATH)


if __name__ == '__main__':
    unittest.main()
