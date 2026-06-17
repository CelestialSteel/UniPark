-- University Parking Management System Database Schema
-- PostgreSQL

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'security', 'driver');
CREATE TYPE parking_space_status AS ENUM ('available', 'occupied', 'reserved', 'cordoned', 'maintenance');
CREATE TYPE zone_status AS ENUM ('active', 'cordoned', 'maintenance', 'full');
CREATE TYPE infringement_status AS ENUM ('reported', 'under_review', 'resolved', 'dismissed', 'appealed');
CREATE TYPE vehicle_entry_status AS ENUM ('entered', 'exited');
CREATE TYPE notification_type AS ENUM ('infringement', 'alert', 'alert_lifted', 'reservation_confirmation', 'system');

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- DRIVERS/CAMPUS GOERS TABLE
-- ============================================

CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE,
    faculty_id VARCHAR(50) UNIQUE,
    staff_id VARCHAR(50) UNIQUE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_license ON drivers(license_number);

-- ============================================
-- VEHICLES TABLE
-- ============================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    vehicle_type VARCHAR(50), -- car, truck, motorcycle, etc.
    registered_by_user_id UUID NOT NULL REFERENCES users(id), -- Security person who registered it
    is_primary BOOLEAN DEFAULT false, -- Driver must have at least one
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- Note: Each driver must have at least one primary vehicle
-- This is enforced by trigger: ensure_driver_has_primary_vehicle
-- (PostgreSQL CHECK constraints cannot use subqueries)

-- ============================================
-- PARKING ZONES TABLE
-- ============================================

CREATE TABLE parking_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(100) NOT NULL UNIQUE,
    zone_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    location VARCHAR(255),
    total_spaces INTEGER NOT NULL,
    reserved_spaces INTEGER DEFAULT 0,
    cordoned_spaces INTEGER DEFAULT 0,
    maintenance_spaces INTEGER DEFAULT 0,
    status zone_status DEFAULT 'active',
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parking_zones_status ON parking_zones(status);
CREATE INDEX idx_parking_zones_code ON parking_zones(zone_code);

-- ============================================
-- PARKING SPACES TABLE
-- ============================================

CREATE TABLE parking_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID NOT NULL REFERENCES parking_zones(id) ON DELETE CASCADE,
    space_number VARCHAR(20) NOT NULL,
    status parking_space_status DEFAULT 'available',
    reserved_for_user_id UUID REFERENCES drivers(id), -- If reserved for specific driver
    currently_occupied_by_vehicle_id UUID REFERENCES vehicles(id),
    cordoned_reason TEXT,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(zone_id, space_number)
);

CREATE INDEX idx_parking_spaces_zone_id ON parking_spaces(zone_id);
CREATE INDEX idx_parking_spaces_status ON parking_spaces(status);
CREATE INDEX idx_parking_spaces_occupied_by ON parking_spaces(currently_occupied_by_vehicle_id);

-- ============================================
-- VEHICLE ENTRY/EXIT LOG TABLE
-- ============================================

CREATE TABLE vehicle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    parking_space_id UUID REFERENCES parking_spaces(id), -- NULL if not allocated
    parking_zone_id UUID REFERENCES parking_zones(id),
    status vehicle_entry_status NOT NULL,
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    duration_minutes INTEGER, -- Calculated on exit
    recorded_by_user_id UUID REFERENCES users(id), -- Security or system
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_logs_vehicle_id ON vehicle_logs(vehicle_id);
CREATE INDEX idx_vehicle_logs_driver_id ON vehicle_logs(driver_id);
CREATE INDEX idx_vehicle_logs_parking_zone_id ON vehicle_logs(parking_zone_id);
CREATE INDEX idx_vehicle_logs_entry_time ON vehicle_logs(entry_time);
CREATE INDEX idx_vehicle_logs_status ON vehicle_logs(status);

-- ============================================
-- ALERTS TABLE
-- ============================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parking_zone_id UUID NOT NULL REFERENCES parking_zones(id),
    alert_type VARCHAR(100) NOT NULL, -- 'zone_full', 'high_occupancy', 'maintenance', etc.
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_zone_id ON alerts(parking_zone_id);
CREATE INDEX idx_alerts_active ON alerts(is_active);

-- ============================================
-- INFRINGEMENTS TABLE
-- ============================================

CREATE TABLE infringements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    parking_zone_id UUID REFERENCES parking_zones(id),
    parking_space_id UUID REFERENCES parking_spaces(id),
    infringement_type VARCHAR(100) NOT NULL, -- 'overstay', 'no_permit', 'unauthorized_zone', etc.
    description TEXT,
    status infringement_status DEFAULT 'reported',
    severity VARCHAR(20), -- 'minor', 'moderate', 'severe'
    fine_amount DECIMAL(10, 2),
    reported_by_user_id UUID NOT NULL REFERENCES users(id), -- Security
    processed_by_user_id UUID REFERENCES users(id), -- Admin
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_infringements_vehicle_id ON infringements(vehicle_id);
CREATE INDEX idx_infringements_driver_id ON infringements(driver_id);
CREATE INDEX idx_infringements_status ON infringements(status);
CREATE INDEX idx_infringements_reported_at ON infringements(reported_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_infringement_id UUID REFERENCES infringements(id),
    related_alert_id UUID REFERENCES alerts(id),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- ZONE OCCUPANCY HISTORY (For Analytics)
-- ============================================

CREATE TABLE zone_occupancy_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parking_zone_id UUID NOT NULL REFERENCES parking_zones(id),
    occupied_spaces INTEGER NOT NULL,
    available_spaces INTEGER NOT NULL,
    reserved_spaces INTEGER NOT NULL,
    cordoned_spaces INTEGER NOT NULL,
    occupancy_percentage DECIMAL(5, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zone_occupancy_zone_id ON zone_occupancy_history(parking_zone_id);
CREATE INDEX idx_zone_occupancy_recorded_at ON zone_occupancy_history(recorded_at);

-- ============================================
-- PARKING SPACE RESERVATIONS
-- ============================================

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parking_space_id UUID NOT NULL REFERENCES parking_spaces(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    reservation_start TIMESTAMP NOT NULL,
    reservation_end TIMESTAMP NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES users(id), -- Admin
    purpose VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_driver_id ON reservations(driver_id);
CREATE INDEX idx_reservations_parking_space_id ON reservations(parking_space_id);
CREATE INDEX idx_reservations_active ON reservations(is_active);

-- ============================================
-- AUDIT LOG TABLE (For system tracking)
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Current parking zone occupancy
CREATE VIEW zone_current_occupancy AS
SELECT
    pz.id,
    pz.zone_name,
    pz.zone_code,
    pz.total_spaces,
    COUNT(CASE WHEN ps.status = 'occupied' THEN 1 END) as occupied_spaces,
    COUNT(CASE WHEN ps.status = 'available' THEN 1 END) as available_spaces,
    COUNT(CASE WHEN ps.status = 'reserved' THEN 1 END) as reserved_spaces,
    COUNT(CASE WHEN ps.status = 'cordoned' THEN 1 END) as cordoned_spaces,
    COUNT(CASE WHEN ps.status = 'maintenance' THEN 1 END) as maintenance_spaces,
    ROUND(100.0 * COUNT(CASE WHEN ps.status = 'occupied' THEN 1 END) / pz.total_spaces, 2) as occupancy_percentage
FROM parking_zones pz
LEFT JOIN parking_spaces ps ON pz.id = ps.zone_id
GROUP BY pz.id, pz.zone_name, pz.zone_code, pz.total_spaces;

-- Driver vehicle summary
CREATE VIEW driver_vehicle_summary AS
SELECT
    d.id as driver_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(v.id) as total_vehicles,
    COUNT(CASE WHEN v.is_primary = true THEN 1 END) as primary_vehicles,
    COUNT(CASE WHEN v.is_active = true THEN 1 END) as active_vehicles
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN vehicles v ON d.id = v.driver_id
GROUP BY d.id, u.email, u.first_name, u.last_name;

-- Active infringements
CREATE VIEW active_infringements AS
SELECT
    i.id,
    i.infringement_type,
    i.status,
    i.severity,
    i.fine_amount,
    v.registration_number,
    d.user_id as driver_user_id,
    u.email as driver_email,
    u.first_name,
    u.last_name,
    i.reported_at
FROM infringements i
JOIN vehicles v ON i.vehicle_id = v.id
JOIN drivers d ON i.driver_id = d.id
JOIN users u ON d.user_id = u.id
WHERE i.status != 'dismissed';
