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
        insertRegion.run('Vijayawada', 'Asia/Kolkata');
        insertRegion.run('Guntur', 'Asia/Kolkata');

        // Seed Ambulances (Vijayawada: 16.5062, 80.6480)
        const insertAmbulance = db.prepare('INSERT INTO ambulances (name, number, location, lat, lon, region_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insertAmbulance.run('Apollo Unit 1', 'AP-12-AX-4567', 'MG Road', 16.5062, 80.6480, 1, 'IDLE');
        insertAmbulance.run('Care Hospital A1', 'AP-07-TY-1234', 'Benz Circle', 16.5080, 80.6400, 1, 'IDLE');
        insertAmbulance.run('Medica Unit X', 'AP-16-QA-9087', 'Gachibowli', 16.5120, 80.6550, 1, 'IDLE');

        // Seed a default admin user for hackathon
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.prepare('INSERT INTO users (name, email, password, plan) VALUES (?, ?, ?, ?)').run(
            'Admin Dispatcher',
            'admin@lifeline.ai',
            hashedPassword,
            'ENTERPRISE'
        );


        // Seed some sample events
        const insertEvent = db.prepare('INSERT INTO events (type, severity, location, lat, lon, region_id, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        insertEvent.run('CAR_ACCIDENT', 'Critical', 'Bandar Road Intersection', 16.5070, 80.6490, 1, 'PENDING', new Date().toISOString());
        insertEvent.run('HEART_ATTACK', 'Critical', 'Besant Road', 16.5040, 80.6460, 1, 'PENDING', new Date().toISOString());

        console.log('✅ Demo data seeded with Regions, Units, and Admin User!');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
};

module.exports = seedData;
