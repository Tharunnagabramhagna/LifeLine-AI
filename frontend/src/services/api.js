// services/api.js
// Final Hackathon Demo Data Layer - Zero Network Dependency
// This file serves as the single source of truth for the LifeLine India fleet.

const SIMULATED_DELAY = 400; // ms for cinematic feel
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getAmbulances = async () => {
  await delay(SIMULATED_DELAY);
  return MOCK_AMBULANCES;
};

export const getEvents = async () => {
  await delay(SIMULATED_DELAY);
  return MOCK_EVENTS;
};

export const getHospitals = async () => {
  await delay(SIMULATED_DELAY);
  return MOCK_HOSPITALS;
};

// ── 🏥 LifeLine India Hospitals (Spread across Vijayawada) ──
const MOCK_HOSPITALS = [
  { id: "HOSP-01", name: "Apollo Hospital",    location: { lat: 16.5180, lon: 80.6320 }, units: 12 },
  { id: "HOSP-02", name: "Ayush Hospital",     location: { lat: 16.4920, lon: 80.6580 }, units: 8 },
  { id: "HOSP-03", name: "Care Hospital",      location: { lat: 16.5380, lon: 80.6750 }, units: 15 },
  { id: "HOSP-04", name: "AIIMS Vijayawada",   location: { lat: 16.4750, lon: 80.6150 }, units: 5 },
  { id: "HOSP-05", name: "Medicover Hospital", location: { lat: 16.5280, lon: 80.6050 }, units: 10 },
  { id: "HOSP-06", name: "NRI Hospital",       location: { lat: 16.4880, lon: 80.6900 }, units: 7 },
];

// ── 🚑 LifeLine India Fleet (14 Units - Spread across zones) ──
const MOCK_AMBULANCES = [
  // Central zone
  { id: "AMB-101", name: "Ravi Kumar",   number: "AP09 AB 1234", status: "BUSY",      location: { lat: 16.5062, lon: 80.6480 }, speed: 68, eta: 6,  hospital: "Apollo Hospital" },
  { id: "AMB-102", name: "Suresh Reddy", number: "TS10 CD 5678", status: "AVAILABLE", location: { lat: 16.5080, lon: 80.6350 }, speed: null, eta: null, hospital: null },
  { id: "AMB-103", name: "Arjun Sharma", number: "KA01 EF 9012", status: "BUSY",      location: { lat: 16.5020, lon: 80.6550 }, speed: 72, eta: 9,  hospital: "Ayush Hospital"  },

  // North zone
  { id: "AMB-104", name: "Imran Khan",   number: "MH12 GH 3456", status: "AVAILABLE", location: { lat: 16.5300, lon: 80.6200 }, speed: null, eta: null, hospital: null },
  { id: "AMB-105", name: "Vikram Singh", number: "DL05 JK 7890", status: "BUSY",      location: { lat: 16.5420, lon: 80.6480 }, speed: 55, eta: 12, hospital: "Care Hospital"   },
  { id: "AMB-106", name: "Rahul Verma",  number: "AP28 LM 4321", status: "AVAILABLE", location: { lat: 16.5350, lon: 80.6700 }, speed: null, eta: null, hospital: null },

  // South zone
  { id: "AMB-107", name: "Manoj Yadav",  number: "UP32 QR 8765", status: "BUSY",      location: { lat: 16.4780, lon: 80.6400 }, speed: 80, eta: 5,  hospital: "Apollo Hospital" },
  { id: "AMB-108", name: "Kiran Patel",  number: "GJ01 ST 1122", status: "AVAILABLE", location: { lat: 16.4850, lon: 80.6600 }, speed: null, eta: null, hospital: null },
  { id: "AMB-109", name: "Rajesh Goud",  number: "TS08 XY 9988", status: "BUSY",      location: { lat: 16.4700, lon: 80.6250 }, speed: 63, eta: 14, hospital: "AIIMS Vijayawada" },

  // East zone
  { id: "AMB-110", name: "Pawan Kumar",  number: "AP16 HH 0011", status: "AVAILABLE", location: { lat: 16.5100, lon: 80.6800 }, speed: null, eta: null, hospital: null },
  { id: "AMB-111", name: "Siri Reddy",   number: "TS12 KL 2233", status: "BUSY",      location: { lat: 16.5200, lon: 80.6950 }, speed: 70, eta: 8,  hospital: "Care Hospital"   },

  // West zone
  { id: "AMB-112", name: "Balu Naik",    number: "KA05 MN 4455", status: "AVAILABLE", location: { lat: 16.5050, lon: 80.6100 }, speed: null, eta: null, hospital: null },
  { id: "AMB-113", name: "Lakshmi Rao",  number: "MH01 OP 6677", status: "BUSY",      location: { lat: 16.4950, lon: 80.5980 }, speed: 58, eta: 11, hospital: "Ayush Hospital"  },

  // Outer zone
  { id: "AMB-114", name: "Vijay Mohan",  number: "AP31 QP 8899", status: "AVAILABLE", location: { lat: 16.4600, lon: 80.6700 }, speed: null, eta: null, hospital: null },
];

const MOCK_EVENTS = [
  { id: "EVT-001", type: "Cardiac Arrest", severity: "CRITICAL", location: "MG Road, Vijayawada", timestamp: "2025-04-04T10:32:00Z", assignedUnit: "AMB-101" },
  { id: "EVT-002", type: "Road Accident", severity: "CRITICAL", location: "Benz Circle, Vijayawada", timestamp: "2025-04-04T10:15:00Z", assignedUnit: "AMB-103" },
  { id: "EVT-003", type: "Fire Incident", severity: "MEDIUM", location: "Autonagar, Vijayawada", timestamp: "2025-04-04T09:45:00Z", assignedUnit: null },
  { id: "EVT-004", type: "Medical Emergency", severity: "LOW", location: "Bhavanipuram, Vijayawada", timestamp: "2025-04-04T08:30:00Z", assignedUnit: null }
];
