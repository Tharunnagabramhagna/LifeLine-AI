<div align="center">

# LifeLine AI

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?style=flat&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat&logo=socketdotio&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat&logo=sqlite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker&logoColor=white)

*A real-time emergency response platform — live ambulance dispatch, map tracking, analytics, and simulation in a single operator dashboard.*

</div>

---

## What It Does

LifeLine AI is a full-stack emergency dispatch platform built for simulating and managing emergency response operations. Dispatchers log in, trigger emergency events (manually or on auto-loop), and watch ambulances get assigned in real time on a live map. The system tracks response times, event history, and fleet status — all pushed over WebSockets with no page refresh needed.

The Python modules (`routing/`, `simulation/`) contain a standalone A\* routing engine and a priority-queue dispatch simulator that model the core algorithms independently of the web stack.

---

## Key Features

**Implemented and working:**

- **JWT authentication** — register, login, and change password; tokens expire after 24h; passwords hashed with bcrypt
- **Protected routes** — dashboard is gated behind a `ProtectedRoute` component; unauthenticated users are redirected
- **Real-time WebSocket events** — `new-emergency`, `ambulance-assigned`, `ambulance:update`, `ambulance:init`, `event-completed` pushed over Socket.IO to all connected clients
- **Live map** — React Leaflet with CartoDB Dark Matter tiles; ambulance markers update in real time with IDLE/BUSY status colors
- **Emergency simulation** — one-click manual dispatch or auto-sim mode (fires every 6 seconds); auto-completes and resets ambulance status after 7 seconds
- **Ambulance auto-assignment** — on each new event, the backend finds the nearest IDLE unit in the same region and assigns it atomically
- **Analytics view** — average response time (seconds → minutes), total/active/completed event counts, SVG trend charts, fleet utilization percentage
- **Plan tiers** — Free (3 simulations, 5 active emergencies), Pro (50 sims, 20 active, auto-sim enabled), Enterprise (unlimited); enforced on both client and server
- **Settings view** — password change, theme toggle, navigation
- **Dark / light theme** — global `ThemeContext` with CSS variable swapping
- **Toast notifications** — real-time in-app alerts on new emergency detection
- **Subscription view** — plan selection and upgrade UI
- **SQLite persistence** — events, ambulances, regions, and users stored in `database.sqlite` via `better-sqlite3`; seeded on startup

**Standalone Python modules (not integrated with Express API):**

- **Routing engine** (`routing/`) — hybrid A\* + Dijkstra router with traffic prediction, in-memory LRU cache, and adapters for Google Maps, OSRM, and ORS
- **Simulation core** (`simulation/lifeline_core.py`) — priority queue dispatch engine, multi-threaded worker pool, event system (APPROACHING, OBSTACLE, BLOCKAGE, ARRIVED, DISPATCHED, EMERGENCY, REDISPATCHED), SMS/TTS stubs via Twilio/gTTS
- **Alert system** (`simulation/alert_system.py`) — event-driven alerting layer for the simulation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 + CSS variables |
| Maps | React Leaflet + Leaflet.js (CartoDB Dark Matter tiles) |
| Routing (client) | React Router v6 |
| Real-time | Socket.IO client + server |
| Backend | Express 4 + Node.js |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Database | SQLite via `better-sqlite3` |
| Containerization | Docker (backend `Dockerfile`) |
| Python routing | Custom A\* / Dijkstra hybrid, traffic predictor |
| Python simulation | Priority queue engine, threading, dataclasses |
| Icons | lucide-react |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│               React Frontend (Vite)                 │
│  Dashboard → DashboardView / AmbulancesView         │
│           → AnalyticsView / SettingsView            │
│  AuthContext  ThemeContext  Socket.IO client         │
│  React Leaflet map  ←  WebSocket events             │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST + WebSocket
┌────────────────────▼────────────────────────────────┐
│              Express API (Node.js)                  │
│  POST /api/register    POST /api/login              │
│  POST /api/emergency   GET /api/events              │
│  GET /api/ambulances   GET /api/regions             │
│  GET /api/analytics    POST /api/change-password    │
│  Socket.IO server → broadcasts all state changes    │
└────────────────────┬────────────────────────────────┘
                     │ better-sqlite3
┌────────────────────▼────────────────────────────────┐
│         SQLite (database.sqlite)                    │
│  users · events · ambulances · regions              │
└─────────────────────────────────────────────────────┘

 Python modules (standalone)
 routing/      → HybridRouter, A*, traffic predictor
 simulation/   → Priority queue engine, alert system
```

---

## Project Structure

```
LifeLine-AI/
├── backend/
│   ├── server.js        # Express API, Socket.IO server, all routes
│   ├── database.js      # SQLite schema init (better-sqlite3)
│   ├── seed.js          # Startup seeding for regions and ambulances
│   └── Dockerfile       # Backend container config
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Main shell: socket events, sim logic, routing
│   │   │   ├── AuthPage.jsx       # Login / register
│   │   │   └── StartScreen.jsx    # Splash / landing
│   │   ├── components/
│   │   │   ├── views/
│   │   │   │   ├── DashboardView.jsx   # Map + event feed
│   │   │   │   ├── AmbulancesView.jsx  # Fleet status
│   │   │   │   ├── AnalyticsView.jsx   # Charts + metrics
│   │   │   │   ├── SettingsView.jsx    # Password + theme
│   │   │   │   └── SubscriptionView.jsx
│   │   │   ├── Map.jsx            # React Leaflet map
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # JWT state management
│   │   │   └── ThemeContext.jsx   # Dark/light theme
│   │   ├── config/plans.js        # Plan limits (free/pro/enterprise)
│   │   ├── services/api.js        # REST API helpers
│   │   └── socket.js              # Socket.IO client singleton
│   └── package.json
├── routing/
│   ├── advanced_routing_service.py  # Hybrid A*/Dijkstra router + cache
│   └── map_utils.py                 # Graph, routing providers, traffic predictor
└── simulation/
    ├── lifeline_core.py   # Emergency dispatch simulation engine
    └── alert_system.py    # Priority event alert system
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | — | Create account |
| POST | `/api/login` | — | Returns JWT |
| POST | `/api/change-password` | Bearer | Update password |
| POST | `/api/emergency` | Bearer | Create emergency + auto-assign ambulance |
| POST | `/api/simulate` | — | Trigger random emergency event |
| GET | `/api/events` | — | List events (region + plan filtering) |
| GET | `/api/ambulances` | — | List ambulances with lat/lon |
| GET | `/api/regions` | — | List regions |
| GET | `/api/analytics` | — | Response time, counts, utilization |

**WebSocket events (Socket.IO):**

| Event | Direction | Payload |
|---|---|---|
| `ambulance:init` | Server → Client | Full ambulance list on connect |
| `new-emergency` | Server → Client | New emergency object |
| `ambulance-assigned` | Server → Client | `{ eventId, ambulance }` |
| `ambulance:update` | Server → Client | Single or array of updated ambulances |
| `event-completed` | Server → Client | Completed emergency + ambulance reset |

---

## Setup & Installation

### Requirements

- Node.js v18+
- Python 3.8+ (optional — for routing/simulation modules only)

### 1. Clone

```bash
git clone https://github.com/Tharunnagabramhagna/LifeLine-AI.git
cd LifeLine-AI
```

### 2. Start the backend

```bash
cd backend
npm install
node server.js
```

The SQLite database is created and seeded automatically on first run. Backend runs on `http://localhost:5000`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 4. Docker (backend only)

```bash
cd backend
docker build -t lifeline-backend .
docker run -p 5000:5000 lifeline-backend
```

---

## Simulation Plans

| | Free | Pro | Enterprise |
|---|---|---|---|
| Max simulations | 3 | 50 | Unlimited |
| Max active emergencies | 5 | 20 | Unlimited |
| Auto-simulation mode | ✗ | ✓ | ✓ |

---

## Roadmap

**Near-term:**
- [ ] Connect Python routing engine to Express API (replace mock lat/lon with real route paths on the map)
- [ ] Integrate simulation core into backend for multi-ambulance concurrent dispatch
- [ ] Real-time ambulance position movement along route on Leaflet map
- [ ] Region selector on the dashboard map

**Longer-term:**
- [ ] Hospital layer on map with proximity-based routing
- [ ] SMS/call alerts via Twilio (stubs exist in `lifeline_core.py`)
- [ ] Multi-region operator roles
- [ ] Mobile responsive dashboard

---

## Contributing

The codebase has a clean split: Express API handles persistence and real-time events, and the Python modules handle routing and simulation logic independently. The most impactful contribution is wiring the two together — the routing API adapter (`routing/routing_api.py`) is already structured for integration.

---

## Author

**Tharun** — [GitHub](https://github.com/Tharunnagabramhagna)

---

## License

MIT

