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
} catch (e) {
  console.log("Ambulance seeding skipped on boot", e);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        credentials: true,
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'lifeline-ai-secret-key'; // For hackathon demo

// CORS configuration
const corsOptions = {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// --- Auth Routes ---

// POST /api/register → Register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Incoming register:", req.body);

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(`
      INSERT INTO users (name, email, password, plan)
      VALUES (?, ?, ?, ?)
    `).run(name, email, hashedPassword, "FREE");

    res.json({
      success: true,
      userId: result.lastInsertRowid
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/login → Authenticate user and return JWT
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Compare password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'Dispatcher' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            token, 
            user: { id: user.id, name: user.name, email: user.email, plan: user.plan } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during login' });
    }
});

// POST /api/change-password → Update user password
app.post('/api/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'All fields required.' });
    }
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);
        
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Error updating password' });
    }
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log(`🔌 [Socket] Client connected: ${socket.id}`);
    
    // FORCE SOCKET EMISSION ON LOAD
    try {
        const ambs = db.prepare('SELECT * FROM ambulances').all();
        const formattedAmbs = ambs.map(a => ({ ...a, location: { lat: a.lat, lon: a.lon } }));
        socket.emit("ambulance:init", formattedAmbs);
    } catch (e) {}

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
    const { type, severity, location, lat, lon, region_id } = req.body;

    if (!type || !location || !region_id) {
        return res.status(400).json({ error: 'Type, location, and region_id are required' });
    }

    try {
        // --- 1. Alert: Emergency Created ---
        triggerAlert('EMERGENCY_CREATED', { type, location });

        // 1. Store event in SQLite
        const stmt = db.prepare('INSERT INTO events (type, severity, location, lat, lon, region_id) VALUES (?, ?, ?, ?, ?, ?)');
        const result = stmt.run(type, severity || 'MEDIUM', location, lat || null, lon || null, region_id);
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
            severity: severity || 'MEDIUM',
            location: { name: location, lat, lon }, 
            region_id,
            status: 'ASSIGNED',
            timestamp: new Date().toISOString(),
            ambulance_assigned: ambulance 
        };

        // --- NEW: Emit real-time events ---
        io.emit('new-emergency', responseData);
        if (ambulance) {
            io.emit('ambulance-assigned', { eventId, ambulance: { ...ambulance, location: { lat: ambulance.lat, lon: ambulance.lon } } });
        }

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

// POST /api/simulate → Generates random emergency
app.post("/api/simulate", authenticateToken, (req, res) => {
  const types = ["HEART_ATTACK", "ACCIDENT", "FIRE", "STROKE"];
  const severities = ["CRITICAL", "HIGH", "MEDIUM"];
  const locations = [
    { name: "Besant Road", lat: 16.501, lon: 80.621 },
    { name: "Bandar Road", lat: 16.511, lon: 80.631 },
    { name: "MG Road", lat: 16.495, lon: 80.615 },
    { name: "Benz Circle", lat: 16.498, lon: 80.648 }
  ];

  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const loc = locations[Math.floor(Math.random() * locations.length)];
  const region_id = 1;

  try {
      triggerAlert('EMERGENCY_CREATED', { type, location: loc.name });

      const stmt = db.prepare('INSERT INTO events (type, severity, location, lat, lon, region_id) VALUES (?, ?, ?, ?, ?, ?)');
      const result = stmt.run(type, severity, loc.name, loc.lat, loc.lon, region_id);
      const eventId = result.lastInsertRowid;

      let ambulance = db.prepare('SELECT * FROM ambulances WHERE status = ? AND region_id = ?').get('IDLE', region_id);
      if (!ambulance) ambulance = db.prepare('SELECT * FROM ambulances WHERE region_id = ? LIMIT 1').get(region_id);

      if (ambulance) {
          db.prepare('UPDATE ambulances SET status = ? WHERE id = ?').run('BUSY', ambulance.id);
          db.prepare('UPDATE events SET status = ?, ambulance_id = ? WHERE id = ?').run('ASSIGNED', ambulance.id, eventId);
          triggerAlert('AMBULANCE_ASSIGNED', { eventId, ambulance });
      }

      const responseData = { 
          id: eventId, type, severity,
          location: { name: loc.name, lat: loc.lat, lon: loc.lon }, 
          region_id, status: ambulance ? 'ASSIGNED' : 'PENDING',
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          ambulance_assigned: ambulance 
      };

      io.emit('new-emergency', responseData);
      if (ambulance) {
          const ambulancePayload = { ...ambulance, status: 'BUSY', location: { lat: ambulance.lat, lon: ambulance.lon } };
          
          io.emit('ambulance:update', ambulancePayload);
          io.emit('ambulance-assigned', { eventId, ambulance: ambulancePayload });
      }

      // Optional auto-complete after 7 seconds for simulation closure
      setTimeout(() => {
          if (ambulance) {
              const completedAt = new Date().toISOString().replace('T', ' ').split('.')[0];
              db.prepare('UPDATE ambulances SET status = ? WHERE id = ?').run('IDLE', ambulance.id);
              db.prepare("UPDATE events SET status = ?, completed_at = ? WHERE id = ?").run('COMPLETED', completedAt, eventId);
              
              const updatedAmbulance = { ...ambulance, status: 'IDLE' };
              const completedEmergency = { ...responseData, status: 'COMPLETED', completed_at: completedAt };
              
              io.emit('event-completed', completedEmergency);
              io.emit('ambulance:update', updatedAmbulance);
          }
      }, 7000);

      res.status(201).json(responseData);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed simulation' });
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
    const { region_id, plan } = req.query;
    try {
        let query = 'SELECT * FROM events ORDER BY timestamp DESC';
        let params = [];

        if (region_id) {
            query = 'SELECT * FROM events WHERE region_id = ? ORDER BY timestamp DESC';
            params = [region_id];
        }

        if (plan?.toLowerCase() === 'free') {
            query += ' LIMIT 3';
        }

        let events = db.prepare(query).all(...params);

        if (plan?.toLowerCase() === 'free' && events.length === 0) {
            events = [
              {
                id: "demo1",
                type: "HEART_ATTACK",
                severity: "CRITICAL",
                location: "MG Road",
                lat: 16.495,
                lon: 80.615,
                region_id: 1,
                status: "COMPLETED",
                timestamp: new Date().toISOString()
              },
              {
                id: "demo2",
                type: "ACCIDENT",
                severity: "HIGH",
                location: "City Center",
                lat: 16.518,
                lon: 80.632,
                region_id: 1,
                status: "COMPLETED",
                timestamp: new Date().toISOString()
              }
            ];
        }
        
        // Format for frontend (nested location + proper field names)
        const formattedEvents = events.map(e => ({
            ...e,
            location: { name: e.location, lat: e.lat, lon: e.lon },
            createdAt: e.timestamp // Frontend uses createdAt
        }));

        res.json(formattedEvents);
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

        // Format for frontend (nested location)
        const formattedAmbulances = ambulances.map(a => ({
            ...a,
            location: { lat: a.lat, lon: a.lon }
        }));
        
        io.emit("ambulance:update", formattedAmbulances);

        res.json(formattedAmbulances);
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
