# LifeLine-AI 🚑

Emergency dispatch and response system built with React + Node.js.

## Project Structure

```
LifeLine-AI/
├── backend/        → Node.js API server (Express + SQLite + JWT + Socket.io)
├── frontend/       → React + Vite web application
├── simulation/     → Python simulation logic (lifeline_core.py, alert_system.py)
└── routing/        → Python routing utilities (map_utils.py, routing_api.py)
```

## How to Run

### Terminal 1 — Start Backend API

```bash
cd backend
npm install
node server.js
```

Backend runs at: **http://localhost:5000**

### Terminal 2 — Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

## Environment Variables

Create `frontend/.env` with:

```
VITE_API_URL=http://localhost:5000
```

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/signup` | POST | Register new user |
| `/api/login` | POST | Authenticate + get JWT |
| `/api/events` | GET | Get all emergency events |
| `/api/ambulances` | GET | Get all ambulances |
| `/api/emergency` | POST | Create new emergency |
| `/api/complete/:id` | POST | Mark event as complete |

## Features

- 🔐 JWT Authentication (SQLite-backed)
- 🗺️ Live Leaflet map with ambulance tracking
- 📡 Real-time Socket.io updates
- 🚨 Emergency dispatch + assignment
- 📊 Analytics dashboard
- 🌙 Dark / Light theme
