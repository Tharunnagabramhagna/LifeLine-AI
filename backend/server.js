const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const seedData = require('./seed');

// Run seeding on startup
seedData();

// GUARANTEE DATA EXISTS (CRITICAL)
try {
  const existing = db.prepare("SELECT COUNT(*) as count FROM ambulances").get();
  if (existing.count === 0) {
    const insert = db.prepare("INSERT INTO ambulances (name, status, lat, lon, location, region_id) VALUES (?, ?, ?, ?, ?, ?)");
    for (let i = 1; i <= 5; i++) {
        insert.run(`Ambulance ${i}`, "IDLE", 16.5 + (Math.random() * 0.05), 80.6 + (Math.random() * 0.05), "Seeded Loc", 1);
    }
    console.log("Seeded 5 ambulances natively");
  }

  const hospCount = db.prepare("SELECT COUNT(*) as count FROM hospitals").get().count;
  if (hospCount === 0) {
      const insertH = db.prepare("INSERT INTO hospitals (name, lat, lon, region_id, units) VALUES (?, ?, ?, ?, ?)");
      insertH.run("Seed Central Hospital", 16.518, 80.632, 1, 10);
      insertH.run("Seed Metro Care", 16.492, 80.658, 1, 5);
      console.log("Seeded hospitals natively");
  }
} catch (e) {
  console.log("Seeding skipped on boot", e);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", credentials: true }
});

const PORT = 5005;
const JWT_SECRET = 'lifeline-ai-secret-key';

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// Diagnostic Routes
app.get('/', (req, res) => res.json({ status: 'API ALIVE', port: PORT }));
app.get('/api/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
const registerHandler = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
        const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (existingUser) return res.status(400).json({ error: "User exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = db.prepare("INSERT INTO users (name, email, password, plan) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, "FREE");
        res.json({ success: true, userId: result.lastInsertRowid });
    } catch (err) { res.status(500).json({ error: "Internal error" }); }
};

const loginHandler = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ 
            success: true, 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                plan: user.plan,
                simulation_count: user.simulation_count || 0
            } 
        });
    } catch (err) { res.status(500).json({ error: "Internal error" }); }
};

app.post('/api/register', registerHandler);
app.post('/api/login', loginHandler);
app.post('/register', registerHandler); // Fallback
app.post('/login', loginHandler); // Fallback

// Socket logic
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    try {
        const ambs = db.prepare('SELECT * FROM ambulances').all();
        socket.emit("ambulance:init", ambs.map(a => ({ ...a, location: { lat: a.lat, lon: a.lon } })));
    } catch (e) {}
});

// --- Emergency Events ---
app.post('/api/emergency', authenticateToken, (req, res) => {
    const { type, location, lat, lon, region_id } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO events (type, location, lat, lon, region_id) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(type, location, lat, lon, region_id);
        const eventId = result.lastInsertRowid;
        let ambulance = db.prepare('SELECT * FROM ambulances WHERE status = ? AND region_id = ?').get('IDLE', region_id);
        if (ambulance) {
            db.prepare('UPDATE ambulances SET status = ? WHERE id = ?').run('BUSY', ambulance.id);
            db.prepare('UPDATE events SET status = ?, ambulance_id = ? WHERE id = ?').run('ASSIGNED', ambulance.id, eventId);
            const ambPayload = { ...ambulance, status: 'BUSY', location: { lat: ambulance.lat, lon: ambulance.lon } };
            io.emit('ambulance:update', ambPayload);
            io.emit('new-emergency', { id: eventId, type, location: { name: location, lat, lon }, status: 'ASSIGNED', ambulance_assigned: ambPayload });
        }
        res.status(201).json({ success: true, eventId });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/simulate', authenticateToken, async (req, res) => {
    const user = db.prepare('SELECT plan, simulation_count FROM users WHERE id = ?').get(req.user.id);
    if (user && user.plan.toLowerCase() === 'free' && user.simulation_count >= 3) {
        return res.status(403).json({ error: "Limit reached. Upgrade for more simulations." });
    }

    const types = ["ACCIDENT", "HEART_ATTACK", "FIRE", "STROKE"];
    const type = types[Math.floor(Math.random() * types.length)];
    const locs = [
      { name: "Central Mall", lat: 16.506, lon: 80.648 },
      { name: "Railway Station", lat: 16.516, lon: 80.620 },
      { name: "Besant Road", lat: 16.501, lon: 80.621 },
      { name: "MG Road Junction", lat: 16.495, lon: 80.615 }
    ];
    const loc = locs[Math.floor(Math.random() * locs.length)];

    try {
        db.prepare('UPDATE users SET simulation_count = simulation_count + 1 WHERE id = ?').run(req.user.id);
        const newCount = (user.simulation_count || 0) + 1;

        const result = db.prepare('INSERT INTO events (type, location, lat, lon, region_id) VALUES (?, ?, ?, ?, ?)').run(type, loc.name, loc.lat, loc.lon, 1);
        const eventId = result.lastInsertRowid;
        let amb = db.prepare('SELECT * FROM ambulances WHERE status = ? LIMIT 1').get('IDLE');
        
        if (amb) {
            db.prepare('UPDATE ambulances SET status = ? WHERE id = ?').run('BUSY', amb.id);
            db.prepare('UPDATE events SET status = ?, ambulance_id = ? WHERE id = ?').run('ASSIGNED', amb.id, eventId);
            const payload = { ...amb, status: 'BUSY', location: { lat: amb.lat, lon: amb.lon } };
            const eventPayload = { id: eventId, type, location: loc, status: 'ASSIGNED', timestamp: new Date().toISOString(), ambulance_assigned: payload };
            io.emit('new-emergency', eventPayload);
            io.emit('ambulance:update', payload);
            setTimeout(() => {
                db.prepare('UPDATE ambulances SET status = ? WHERE id = ?').run('IDLE', amb.id);
                db.prepare('UPDATE events SET status = ? WHERE id = ?').run('COMPLETED', eventId);
                io.emit('ambulance:update', { ...amb, status: 'IDLE' });
                io.emit('event-completed', { id: eventId, status: 'COMPLETED' });
            }, 8000);
        }
        res.status(201).json({ success: true, simulation_count: newCount });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});


app.post('/api/user/plan', authenticateToken, (req, res) => {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ error: "No plan provided" });
    try {
        db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan.toUpperCase(), req.user.id);
        res.json({ success: true, plan: plan.toUpperCase() });
    } catch (err) { res.status(500).json({ error: "Failed" }); }
});

// GET endpoints
app.get('/api/ambulances', (req, res) => {

    const ambs = db.prepare('SELECT * FROM ambulances').all();
    res.json(ambs.map(a => ({ ...a, location: { lat: a.lat, lon: a.lon } })));
});

app.get('/api/events', (req, res) => {
    const events = db.prepare('SELECT * FROM events ORDER BY timestamp DESC LIMIT 10').all();
    res.json(events.map(e => ({ ...e, location: { name: e.location, lat: e.lat, lon: e.lon } })));
});

app.get('/api/hospitals', (req, res) => {
    const hoss = db.prepare('SELECT * FROM hospitals').all();
    res.json(hoss.map(h => ({ ...h, location: { lat: h.lat, lon: h.lon } })));
});

app.get('/api/analytics', (req, res) => {
    const stats = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status="COMPLETED" THEN 1 ELSE 0 END) as done FROM events').get();
    res.json({ totalEvents: stats.total || 0, completed: stats.done || 0, active: (stats.total - stats.done) || 0, averageResponseTime: 4.5 });
});

server.listen(PORT, () => {
    console.log(`🚀 [Server] Running on http://localhost:${PORT}`);
});
