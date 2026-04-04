const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./database');
const seedData = require('./seed');

// Run seeding on startup
seedData();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for hackathon simplicity
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'lifeline-ai-secret-key'; // For hackathon demo

// CORS configuration
const corsOptions = {
    origin: "*", // Allow all origins for hackathon simplicity
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// --- Auth Routes ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Simple demo login (In real app, check against hashed DB password)
    if (email === 'admin@lifeline.ai' && password === 'admin123') {
        const user = { id: 1, email: email, role: 'dispatcher' };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log(`🔌 [Socket] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`🔌 [Socket] Client disconnected: ${socket.id}`);
    });
});

// --- Alert System Logic ---

/**
 * Triggers a console-based alert for system events.
 */
const triggerAlert = (alertType, data) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log("\n" + "!".repeat(50));
    
    switch (alertType) {
        case 'EMERGENCY_CREATED':
            console.log(`🚨 [ALERT] NEW EMERGENCY DETECTED at ${timestamp}`);
            console.log(`📍 TYPE: ${data.type}`);
            console.log(`📍 LOCATION: ${data.location}`);
            break;
        case 'AMBULANCE_ASSIGNED':
            console.log(`🚑 [ALERT] AMBULANCE ASSIGNED at ${timestamp}`);
            console.log(`🆔 EVENT ID: ${data.eventId}`);
            console.log(`🆔 AMBULANCE ID: #${data.ambulance.id}`);
            console.log(`📍 AMBULANCE LOC: ${data.ambulance.location}`);
            break;
        default:
            console.log(`🔔 [NOTIFICATION] ${alertType}: ${JSON.stringify(data)}`);
    }
    
    console.log("!".repeat(50) + "\n");
};

// --- Emergency Events API ---

// POST /api/emergency → Create emergency event and assign ambulance (Protected)
app.post('/api/emergency', authenticateToken, (req, res) => {
    const { type, location, region_id } = req.body;

    if (!type || !location || !region_id) {
        return res.status(400).json({ error: 'Type, location, and region_id are required' });
    }

    try {
        // --- 1. Alert: Emergency Created ---
        triggerAlert('EMERGENCY_CREATED', { type, location });

        // 1. Store event in SQLite
        const stmt = db.prepare('INSERT INTO events (type, location, region_id) VALUES (?, ?, ?)');
        const result = stmt.run(type, location, region_id);
        const eventId = result.lastInsertRowid;

        // 2. Fetch an available ambulance (Simple logic: first IDLE ambulance in region)
        let ambulance = db.prepare('SELECT * FROM ambulances WHERE status = ? AND region_id = ?').get('IDLE', region_id);
        
        // If no IDLE in region, pick any in region to simulate priority rerouting
        if (!ambulance) {
            ambulance = db.prepare('SELECT * FROM ambulances WHERE region_id = ? LIMIT 1').get(region_id);
        }

        // 3. Update ambulance status and link it to event
        if (ambulance) {
            db.prepare('UPDATE ambulances SET status = ? WHERE id = ?').run('EN_ROUTE', ambulance.id);
            db.prepare('UPDATE events SET status = ?, ambulance_id = ? WHERE id = ?').run('ASSIGNED', ambulance.id, eventId);

            // --- 2. Alert: Ambulance Assigned ---
            triggerAlert('AMBULANCE_ASSIGNED', { eventId, ambulance });
        }

        // 4. Return event data + ambulance assignment
        const responseData = { 
            id: eventId, 
            type, 
            location, 
            region_id,
            status: 'ASSIGNED',
            timestamp: new Date().toISOString(),
            ambulance_assigned: ambulance 
        };

        // --- NEW: Emit real-time events ---
        io.emit('new-emergency', responseData);
        io.emit('ambulance-assigned', { eventId, ambulance });

        res.status(201).json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create emergency event' });
    }
});

// POST /api/complete/:eventId → Finish trip and set ambulance IDLE (Protected)
app.post('/api/complete/:eventId', authenticateToken, (req, res) => {
    const { eventId } = req.params;
    try {
        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const completedAt = new Date().toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:MM:SS

        if (event.ambulance_id) {
            db.prepare('UPDATE ambulances SET status = ? WHERE id = ?').run('IDLE', event.ambulance_id);
        }

        db.prepare("UPDATE events SET status = ?, completed_at = ? WHERE id = ?").run('COMPLETED', completedAt, eventId);

        // Notify frontend
        io.emit('event-completed', { eventId, ambulanceId: event.ambulance_id, completed_at: completedAt });

        res.json({ success: true, message: 'Trip finished successfully', completed_at: completedAt });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to complete event' });
    }
});

// GET /api/analytics → Fetch response time analytics
app.get('/api/analytics', (req, res) => {
    try {
        // Calculate average response time in seconds for completed events
        // Note: strftime('%s', ...) converts ISO date to unix epoch seconds
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_events,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status != 'COMPLETED' THEN 1 ELSE 0 END) as active_count,
                AVG(CASE WHEN status = 'COMPLETED' THEN (strftime('%s', completed_at) - strftime('%s', timestamp)) ELSE NULL END) as avg_response_time_sec
            FROM events
        `).get();

        res.json({
            total_emergencies: stats.total_events || 0,
            completed: stats.completed_count || 0,
            active: stats.active_count || 0,
            average_response_time: stats.avg_response_time_sec ? Math.round(stats.avg_response_time_sec / 60) : 0 // Convert to minutes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// GET /api/events → Fetch all active events
app.get('/api/events', (req, res) => {
    const { region_id } = req.query;
    try {
        let query = 'SELECT * FROM events ORDER BY timestamp DESC';
        let params = [];

        if (region_id) {
            query = 'SELECT * FROM events WHERE region_id = ? ORDER BY timestamp DESC';
            params = [region_id];
        }

        const events = db.prepare(query).all(...params);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// --- Ambulance Data API ---

// GET /api/ambulances → Fetch all ambulances
app.get('/api/ambulances', (req, res) => {
    const { region_id } = req.query;
    try {
        let query = 'SELECT * FROM ambulances';
        let params = [];

        if (region_id) {
            query = 'SELECT * FROM ambulances WHERE region_id = ?';
            params = [region_id];
        }

        const ambulances = db.prepare(query).all(...params);
        res.json(ambulances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ambulances' });
    }
});

// GET /api/regions → Fetch all regions
app.get('/api/regions', (req, res) => {
    try {
        const regions = db.prepare('SELECT * FROM regions').all();
        res.json(regions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch regions' });
    }
});

// GET /api/analytics → Fetch real-time metrics
app.get('/api/analytics', (req, res) => {
    try {
        const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
        const active = db.prepare('SELECT COUNT(*) as count FROM events WHERE status != ?').get('COMPLETED').count;
        const completed = db.prepare('SELECT COUNT(*) as count FROM events WHERE status = ?').get('COMPLETED').count;
        const availableAmbulances = db.prepare('SELECT COUNT(*) as count FROM ambulances WHERE status = ?').get('IDLE').count;

        // Calculate average response time in minutes
        // (completed_at - timestamp) in seconds, then divide by 60
        const avgStats = db.prepare(`
            SELECT AVG(
                (strftime('%s', completed_at) - strftime('%s', timestamp))
            ) as avg_sec 
            FROM events 
            WHERE status = 'COMPLETED' AND completed_at IS NOT NULL
        `).get();

        const averageResponseTime = avgStats.avg_sec ? Math.round((avgStats.avg_sec / 60) * 10) / 10 : 0;

        res.json({
            averageResponseTime,
            totalEvents,
            completed,
            active,
            availableAmbulances
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
    console.log(`🚀 [Server] Running on http://localhost:${PORT}`);
});
