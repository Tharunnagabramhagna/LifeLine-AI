-- Demo Data for LifeLine AI SQLite Database

-- 1. Sample Users
INSERT INTO users (name, email, password) VALUES 
('Tharun Satrasala', 'tharun@example.com', 'hashed_password_123'),
('Jane Doe', 'jane@example.com', 'hashed_password_456'),
('John Smith', 'john@example.com', 'hashed_password_789');

-- 2. Lost Items (user_id 1 and 2)
INSERT INTO lost_items (user_id, name, description, location, image, date) VALUES 
(1, 'iPhone 13 Pro', 'Graphite color, clear case, cracked screen protector on top right.', 'Central Park Mall', 'https://example.com/images/lost_iphone.jpg', '2026-04-01 10:00:00'),
(1, 'Blue Leather Wallet', 'Contains ID card for Tharun and some cash. Small scratch on the front.', 'Downtown Metro Station', '', '2026-04-02 14:30:00'),
(2, 'Golden Retriever', 'Name is Buddy, wearing a red collar. Very friendly.', 'Oakwood Park', 'https://example.com/images/buddy.jpg', '2026-04-03 09:15:00'),
(2, 'Silver Laptop (MacBook)', 'MacBook Air M2, 13-inch. Has a sticker of a rocket on the back.', 'Starbucks - 5th Ave', '', '2026-04-03 16:45:00'),
(1, 'Car Keys', 'Toyota keychain with a remote button.', 'City Library Parking', '', '2026-04-04 11:20:00');

-- 3. Found Items (user_id 3)
INSERT INTO found_items (user_id, name, description, location, image, date) VALUES 
(3, 'iPhone 13', 'Found a graphite iPhone 13 Pro near the fountain. Screen protector is cracked.', 'Central Park Mall', 'https://example.com/images/found_phone.jpg', '2026-04-01 11:05:00'), -- CLEAR MATCH with Lost Item 1
(3, 'Men Wallet', 'Found a blue leather wallet with an ID card inside.', 'Metro Station Entrance', '', '2026-04-02 15:00:00'), -- CLEAR MATCH with Lost Item 2
(3, 'Large Dog', 'Golden retriever found wandering near the playground. Red collar.', 'Oakwood Park', 'https://example.com/images/found_dog.jpg', '2026-04-03 10:30:00'), -- CLEAR MATCH with Lost Item 3
(3, 'Black Sunglasses', 'Ray-Ban style sunglasses found on a bench.', 'Riverside Walk', '', '2026-04-04 12:00:00'),
(3, 'Water Bottle', 'HydroFlask, blue color, 32oz.', 'University Gym', '', '2026-04-04 14:00:00');
