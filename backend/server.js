const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// IN-MEMORY CACHE (No DB required for Demo)
let operators = [
    { username: "Chief_Dispatcher", email: "demo@lifeline.ai", role: "Dispatcher" }
];

// ── LOG IN (Hackathon Mode) ──
app.post('/api/login', (req, res) => {
    // Demo mode: authentication is bypassed for presentation purposes
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Credentials required for operational link." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Any password works (e.g. "demo123" or any non-empty string)
    // 2. If operator doesn't exist, we auto-create a demo session for the judge
    let operator = operators.find(u => u.email === normalizedEmail);
    
    if (!operator) {
        operator = { 
            username: normalizedEmail.split('@')[0] || "Guest_Operator", 
            email: normalizedEmail, 
            role: 'Dispatcher' 
        };
    }

    console.log(`✨ [SYSTEM]: Demo Mode access granted to ${normalizedEmail}`);
    
    res.status(200).json({
        success: true,
        message: "Demo link established.",
        token: "demo-jwt-token-12345",
        user: operator
    });
});

// ── SIGN UP (Redirects to Session Logic) ──
app.post('/api/signup', (req, res) => {
    // Demo mode: authentication is bypassed for presentation purposes
    const { username, email } = req.body;
    const operator = { username: username || "New_Operator", email: email.trim().toLowerCase(), role: 'Dispatcher' };
    
    operators.push(operator);
    res.status(201).json({ success: true, message: "Profile created (Demo).", user: operator });
});

app.listen(PORT, () => {
    console.log(`\n🚀 LifeLine AI Backend: V.3.9.0-DEMO`);
    console.log(`📡 Link Endpoint: http://localhost:${PORT}`);
    console.log(`⚠️  Security Warning: Auth Bypass Active forpresentation purposes\n`);
});
