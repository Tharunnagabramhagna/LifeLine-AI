import sqlite3
import json
import os

DB_PATH = "lifeline.db"


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hospitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            total_beds INTEGER NOT NULL,
            available_beds INTEGER NOT NULL,
            specialty TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active'
        )
    ''')

    # Check if table is empty, if so, seed from hospitals.json
    cursor.execute("SELECT COUNT(*) FROM hospitals")
    if cursor.fetchone()[0] == 0:
        if os.path.exists('hospitals.json'):
            with open('hospitals.json', 'r') as f:
                hospitals = json.load(f)
                for h in hospitals:
                    cursor.execute('''
                        INSERT INTO hospitals (name, lat, lon, total_beds, available_beds, specialty, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ''', (h['name'], h['lat'], h['lon'], h['total_beds'], h['available_beds'], h['specialty'], 'Active'))

    conn.commit()
    conn.close()


def get_all_hospitals():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hospitals")
    rows = cursor.fetchall()
    hospitals = [dict(row) for row in rows]
    conn.close()
    return hospitals


def update_hospital_beds(hosp_id, available_beds):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE hospitals SET available_beds = ? WHERE id = ?",
        (available_beds,
         hosp_id))
    conn.commit()
    conn.close()


def update_hospital_status(hosp_id, status):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE hospitals SET status = ? WHERE id = ?", (status, hosp_id))
    conn.commit()
    conn.close()


def consume_bed(hosp_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE hospitals SET available_beds = available_beds - 1 WHERE id = ? AND available_beds > 0",
        (hosp_id,
         ))
    conn.commit()
    conn.close()


def release_bed(hosp_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE hospitals SET available_beds = available_beds + 1 WHERE id = ? AND available_beds < total_beds",
        (hosp_id,
         ))
    conn.commit()
    conn.close()


def get_active_hospitals():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM hospitals WHERE status = 'Active' AND available_beds > 0")
    rows = cursor.fetchall()
    hospitals = [dict(row) for row in rows]
    conn.close()
    return hospitals


if __name__ == "__main__":
    init_db()
    print("Database initialized.")
