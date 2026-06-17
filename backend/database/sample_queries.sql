-- Sample Data and Common Queries for University Parking Management System

-- ============================================
-- SAMPLE DATA - USERS
-- ============================================

-- Admin user
INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number)
VALUES ('admin@university.edu', '$2b$12$...', 'admin', 'John', 'Administrator', '555-0001');

-- Security users
INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number) VALUES
('security1@university.edu', '$2b$12$...', 'security', 'Alice', 'Johnson', '555-0002'),
('security2@university.edu', '$2b$12$...', 'security', 'Bob', 'Smith', '555-0003');

-- Driver users
INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number) VALUES
('driver1@university.edu', '$2b$12$...', 'driver', 'Charlie', 'Brown', '555-0010'),
('driver2@university.edu', '$2b$12$...', 'driver', 'Diana', 'Prince', '555-0011'),
('driver3@university.edu', '$2b$12$...', 'driver', 'Edward', 'Norton', '555-0012');

-- ============================================
-- SAMPLE DATA - DRIVERS/CAMPUS GOERS
-- ============================================

INSERT INTO drivers (user_id, student_id, license_number, license_expiry, department)
SELECT id, 'STU001', 'DL123456', '2026-12-31', 'Computer Science'
FROM users WHERE email = 'driver1@university.edu';

INSERT INTO drivers (user_id, faculty_id, license_number, license_expiry, department)
SELECT id, 'FAC001', 'DL234567', '2027-06-30', 'Engineering'
FROM users WHERE email = 'driver2@university.edu';

INSERT INTO drivers (user_id, staff_id, license_number, license_expiry, department)
SELECT id, 'STF001', 'DL345678', '2028-03-15', 'Administration'
FROM users WHERE email = 'driver3@university.edu';

-- ============================================
-- SAMPLE DATA - PARKING ZONES
-- ============================================

INSERT INTO parking_zones (zone_name, zone_code, description, location, total_spaces, created_by_user_id)
SELECT 'North Campus A', 'NCA', 'North side parking zone A', 'North Campus', 50,
       (SELECT id FROM users WHERE email = 'admin@university.edu')
UNION ALL
SELECT 'North Campus B', 'NCB', 'North side parking zone B', 'North Campus', 45,
       (SELECT id FROM users WHERE email = 'admin@university.edu')
UNION ALL
SELECT 'South Campus', 'SCA', 'South side parking zone', 'South Campus', 75,
       (SELECT id FROM users WHERE email = 'admin@university.edu')
UNION ALL
SELECT 'East Campus', 'ECA', 'East side parking zone', 'East Campus', 60,
       (SELECT id FROM users WHERE email = 'admin@university.edu')
UNION ALL
SELECT 'West Campus', 'WCA', 'West side parking zone', 'West Campus', 40,
       (SELECT id FROM users WHERE email = 'admin@university.edu');

-- ============================================
-- SAMPLE DATA - PARKING SPACES (North Campus A only for brevity)
-- ============================================

INSERT INTO parking_spaces (zone_id, space_number, status, created_by_user_id)
SELECT pz.id, 'A' || LPAD(gs::text, 2, '0'), 'available',
       (SELECT id FROM users WHERE email = 'admin@university.edu')
FROM parking_zones pz, GENERATE_SERIES(1, 50) gs
WHERE pz.zone_code = 'NCA';

-- ============================================
-- SAMPLE DATA - VEHICLES
-- ============================================

INSERT INTO vehicles (driver_id, registration_number, make, model, color, vehicle_type, registered_by_user_id, is_primary)
SELECT d.id, 'ABC123', 'Toyota', 'Camry', 'Silver', 'car',
       (SELECT id FROM users WHERE email = 'security1@university.edu'), true
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'driver1@university.edu';

INSERT INTO vehicles (driver_id, registration_number, make, model, color, vehicle_type, registered_by_user_id, is_primary)
SELECT d.id, 'XYZ789', 'Honda', 'Civic', 'Blue', 'car',
       (SELECT id FROM users WHERE email = 'security1@university.edu'), true
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'driver2@university.edu';

INSERT INTO vehicles (driver_id, registration_number, make, model, color, vehicle_type, registered_by_user_id, is_primary)
SELECT d.id, 'DEF456', 'Ford', 'Mustang', 'Red', 'car',
       (SELECT id FROM users WHERE email = 'security2@university.edu'), true
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE u.email = 'driver3@university.edu';

-- ============================================
-- COMMON QUERIES
-- ============================================

-- 1. Get current occupancy status of all zones
SELECT
    pz.zone_name,
    pz.zone_code,
    zco.occupied_spaces,
    zco.available_spaces,
    zco.reserved_spaces,
    zco.cordoned_spaces,
    zco.occupancy_percentage
FROM zone_current_occupancy zco
JOIN parking_zones pz ON zco.id = pz.id
ORDER BY zco.occupancy_percentage DESC;

-- 2. Get driver's vehicles
SELECT
    d.id as driver_id,
    u.first_name,
    u.last_name,
    v.registration_number,
    v.make,
    v.model,
    v.is_primary,
    v.is_active
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN vehicles v ON d.id = v.driver_id
WHERE u.email = 'driver1@university.edu'
ORDER BY v.is_primary DESC;

-- 3. Get vehicle entry/exit history for a specific driver
SELECT
    vl.entry_time,
    vl.exit_time,
    vl.duration_minutes,
    v.registration_number,
    pz.zone_name,
    ps.space_number
FROM vehicle_logs vl
JOIN vehicles v ON vl.vehicle_id = v.id
JOIN drivers d ON vl.driver_id = d.id
JOIN users u ON d.user_id = u.id
LEFT JOIN parking_zones pz ON vl.parking_zone_id = pz.id
LEFT JOIN parking_spaces ps ON vl.parking_space_id = ps.id
WHERE u.email = 'driver1@university.edu'
ORDER BY vl.entry_time DESC;

-- 4. Find vehicles currently parked in a zone
SELECT
    v.registration_number,
    v.make,
    v.model,
    ps.space_number,
    vl.entry_time,
    u.first_name,
    u.last_name
FROM vehicle_logs vl
JOIN vehicles v ON vl.vehicle_id = v.id
JOIN drivers d ON vl.driver_id = d.id
JOIN users u ON d.user_id = u.id
JOIN parking_spaces ps ON vl.parking_space_id = ps.id
WHERE vl.status = 'entered'
AND vl.exit_time IS NULL
ORDER BY vl.entry_time;

-- 5. Get all active infringements
SELECT
    i.id,
    i.infringement_type,
    i.status,
    i.severity,
    i.fine_amount,
    v.registration_number,
    u.first_name,
    u.last_name,
    u.email,
    i.reported_at
FROM infringements i
JOIN vehicles v ON i.vehicle_id = v.id
JOIN drivers d ON i.driver_id = d.id
JOIN users u ON d.user_id = u.id
WHERE i.status IN ('reported', 'under_review')
ORDER BY i.reported_at DESC;

-- 6. Get unread notifications for a user
SELECT
    n.id,
    n.notification_type,
    n.title,
    n.message,
    n.created_at
FROM notifications n
WHERE n.recipient_user_id = (SELECT id FROM users WHERE email = 'driver1@university.edu')
AND n.is_read = false
ORDER BY n.created_at DESC;

-- 7. Get zone occupancy trends over time
SELECT
    pz.zone_name,
    zoh.recorded_at,
    zoh.occupied_spaces,
    zoh.available_spaces,
    zoh.occupancy_percentage
FROM zone_occupancy_history zoh
JOIN parking_zones pz ON zoh.parking_zone_id = pz.id
WHERE pz.zone_code = 'NCA'
AND zoh.recorded_at > NOW() - INTERVAL '24 hours'
ORDER BY zoh.recorded_at DESC;

-- 8. Get driver infringement summary
SELECT
    u.first_name,
    u.last_name,
    COUNT(*) as total_infringements,
    COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) as resolved,
    COUNT(CASE WHEN i.status IN ('reported', 'under_review') THEN 1 END) as pending,
    SUM(i.fine_amount) as total_fines
FROM infringements i
JOIN drivers d ON i.driver_id = d.id
JOIN users u ON d.user_id = u.id
GROUP BY d.id, u.first_name, u.last_name
HAVING COUNT(*) > 0
ORDER BY total_infringements DESC;

-- 9. Get zone statistics for admin dashboard
SELECT
    pz.zone_name,
    pz.zone_code,
    pz.total_spaces,
    (SELECT COUNT(*) FROM parking_spaces WHERE zone_id = pz.id AND status = 'occupied') as occupied,
    (SELECT COUNT(*) FROM parking_spaces WHERE zone_id = pz.id AND status = 'available') as available,
    (SELECT COUNT(*) FROM parking_spaces WHERE zone_id = pz.id AND status = 'reserved') as reserved,
    (SELECT COUNT(*) FROM infringements WHERE parking_zone_id = pz.id AND status IN ('reported', 'under_review')) as pending_infringements
FROM parking_zones pz
WHERE pz.status = 'active'
ORDER BY pz.zone_name;

-- 10. Find drivers with multiple vehicles
SELECT
    u.first_name,
    u.last_name,
    u.email,
    dvs.total_vehicles,
    dvs.active_vehicles
FROM driver_vehicle_summary dvs
JOIN users u ON dvs.driver_id = (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = u.email LIMIT 1))
WHERE dvs.total_vehicles > 1
ORDER BY dvs.total_vehicles DESC;

-- ============================================
-- ANALYTICS QUERIES
-- ============================================

-- Peak occupancy hours
SELECT
    DATE_TRUNC('hour', vl.entry_time) as hour,
    pz.zone_name,
    COUNT(*) as vehicle_entries
FROM vehicle_logs vl
JOIN parking_zones pz ON vl.parking_zone_id = pz.id
WHERE vl.entry_time > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', vl.entry_time), pz.zone_name
ORDER BY hour DESC, vehicle_entries DESC;

-- Average parking duration by zone
SELECT
    pz.zone_name,
    ROUND(AVG(vl.duration_minutes), 2) as avg_duration_minutes,
    MIN(vl.duration_minutes) as min_duration,
    MAX(vl.duration_minutes) as max_duration,
    COUNT(*) as total_sessions
FROM vehicle_logs vl
JOIN parking_zones pz ON vl.parking_zone_id = pz.id
WHERE vl.exit_time IS NOT NULL
AND vl.entry_time > NOW() - INTERVAL '30 days'
GROUP BY pz.zone_name
ORDER BY avg_duration_minutes DESC;

-- Most common infringement types
SELECT
    infringement_type,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
    ROUND(AVG(CAST(fine_amount AS NUMERIC)), 2) as avg_fine
FROM infringements
WHERE reported_at > NOW() - INTERVAL '30 days'
GROUP BY infringement_type
ORDER BY count DESC;
