-- Seed data for Hospital table
INSERT INTO Hospital (Name, Type, Capacity, Address, Ambulance_Count, Equipment)
VALUES 
('Central City Hospital', 'General', 500, '123 Main St, Central City', 15, 'MRI, CT Scanner, X-Ray, Ultrasound'),
('North Memorial Hospital', 'Specialized', 300, '456 Oak Avenue, North District', 10, 'CT Scanner, X-Ray, Ultrasound, Laboratory'),
('East Community Medical Center', 'Community', 200, '789 Elm Road, East Side', 5, 'X-Ray, Ultrasound, Basic Laboratory'),
('West Regional Medical Center', 'Regional', 450, '101 Pine Boulevard, West Region', 12, 'MRI, CT Scanner, X-Ray, Ultrasound, Advanced Laboratory'),
('South Children\'s Hospital', 'Children', 250, '202 Maple Lane, South District', 8, 'Pediatric ICU, X-Ray, Ultrasound');
