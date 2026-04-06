const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    timezone TEXT DEFAULT 'UTC'
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'MEDIUM',
    location TEXT NOT NULL,
    lat REAL,
    lon REAL,
    region_id INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING',
    ambulance_id INTEGER,
    timestamp TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (region_id) REFERENCES regions(id),
    FOREIGN KEY (ambulance_id) REFERENCES ambulances(id)
  );

  CREATE TABLE IF NOT EXISTS ambulances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    number TEXT,
    location TEXT NOT NULL,
    lat REAL,
    lon REAL,
    region_id INTEGER NOT NULL,
    status TEXT DEFAULT 'IDLE',
    FOREIGN KEY (region_id) REFERENCES regions(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    plan TEXT DEFAULT 'FREE'
  );
`);

module.exports = db;
