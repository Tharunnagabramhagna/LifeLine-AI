const db = require('./database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        // Only seed if regions table is empty
        const regionCount = db.prepare('SELECT COUNT(*) as count FROM regions').get().count;
        if (regionCount > 0) {
            console.log('✅ Database already seeded.');
            return;
        }

        // Seed Regions
        const insertRegion = db.prepare('INSERT INTO regions (name, timezone) VALUES (?, ?)');
        insertRegion.run('New York', 'America/New_York');
        insertRegion.run('London', 'Europe/London');
        insertRegion.run('Tokyo', 'Asia/Tokyo');

        // Seed Ambulances (ID 1: NY, ID 2: London, ID 3: Tokyo)
        const insertAmbulance = db.prepare('INSERT INTO ambulances (location, region_id, status) VALUES (?, ?, ?)');
        insertAmbulance.run('Downtown Station', 1, 'IDLE');
        insertAmbulance.run('Heathrow Base', 2, 'IDLE');
        insertAmbulance.run('Shinjuku Hub', 3, 'IDLE');

        // Seed a default admin user for hackathon
        const hashedPassword = await bcrypt.hash('admin123', 10);
        db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(
            'Admin Dispatcher',
            'admin@lifeline.ai',
            hashedPassword
        );

        // Seed some sample events
        const insertEvent = db.prepare('INSERT INTO events (type, location, region_id, status, timestamp) VALUES (?, ?, ?, ?, ?)');
        insertEvent.run('CAR_ACCIDENT', 'Times Square', 1, 'PENDING', new Date().toISOString());

        console.log('✅ Demo data seeded with Regions and Admin User!');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
};

module.exports = seedData;
