-- Database Triggers and Functions for University Parking Management System

-- ============================================
-- TRIGGER: Update vehicle primary status
-- ============================================

CREATE OR REPLACE FUNCTION ensure_driver_has_primary_vehicle()
RETURNS TRIGGER AS $$
DECLARE
    v_other_vehicle_id UUID;
BEGIN
    IF NEW.is_active = false AND NEW.is_primary = true THEN
        -- Check if driver has other active vehicles
        IF NOT EXISTS (
            SELECT 1 FROM vehicles 
            WHERE driver_id = NEW.driver_id 
            AND is_active = true 
            AND id != NEW.id
        ) THEN
            RAISE EXCEPTION 'Cannot deactivate primary vehicle if no other active vehicles exist';
        END IF;
        
        -- Set another vehicle as primary
        SELECT id INTO v_other_vehicle_id FROM vehicles
        WHERE driver_id = NEW.driver_id 
        AND is_active = true 
        AND id != NEW.id
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF v_other_vehicle_id IS NOT NULL THEN
            UPDATE vehicles 
            SET is_primary = true 
            WHERE id = v_other_vehicle_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_primary_vehicle
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION ensure_driver_has_primary_vehicle();

-- ============================================
-- TRIGGER: Prevent duplicate vehicle registration
-- ============================================

CREATE OR REPLACE FUNCTION prevent_duplicate_vehicle_registration()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM vehicles 
        WHERE registration_number = NEW.registration_number 
        AND driver_id != NEW.driver_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'This vehicle is already registered under another account';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_duplicate_vehicle
BEFORE INSERT OR UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_vehicle_registration();

-- ============================================
-- TRIGGER: Update parking zone statistics
-- ============================================

CREATE OR REPLACE FUNCTION update_zone_statistics()
RETURNS TRIGGER AS $$
DECLARE
    v_total_spaces INTEGER;
    v_occupied_spaces INTEGER;
    v_reserved_spaces INTEGER;
    v_cordoned_spaces INTEGER;
    v_maintenance_spaces INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_spaces FROM parking_spaces WHERE zone_id = NEW.zone_id;
    SELECT COUNT(*) INTO v_occupied_spaces FROM parking_spaces WHERE zone_id = NEW.zone_id AND status = 'occupied';
    SELECT COUNT(*) INTO v_reserved_spaces FROM parking_spaces WHERE zone_id = NEW.zone_id AND status = 'reserved';
    SELECT COUNT(*) INTO v_cordoned_spaces FROM parking_spaces WHERE zone_id = NEW.zone_id AND status = 'cordoned';
    SELECT COUNT(*) INTO v_maintenance_spaces FROM parking_spaces WHERE zone_id = NEW.zone_id AND status = 'maintenance';

    UPDATE parking_zones
    SET 
        total_spaces = v_total_spaces,
        reserved_spaces = v_reserved_spaces,
        cordoned_spaces = v_cordoned_spaces,
        maintenance_spaces = v_maintenance_spaces,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.zone_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_zone_stats_after_space_insert
AFTER INSERT ON parking_spaces
FOR EACH ROW
EXECUTE FUNCTION update_zone_statistics();

CREATE TRIGGER trigger_update_zone_stats_after_space_update
AFTER UPDATE ON parking_spaces
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_zone_statistics();

-- ============================================
-- TRIGGER: Record occupancy history
-- ============================================

CREATE OR REPLACE FUNCTION record_zone_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO zone_occupancy_history (
        parking_zone_id,
        occupied_spaces,
        available_spaces,
        reserved_spaces,
        cordoned_spaces,
        occupancy_percentage
    )
    VALUES (
        NEW.id,
        (SELECT COUNT(*) FROM parking_spaces WHERE zone_id = NEW.id AND status = 'occupied'),
        (SELECT COUNT(*) FROM parking_spaces WHERE zone_id = NEW.id AND status = 'available'),
        NEW.reserved_spaces,
        NEW.cordoned_spaces,
        ROUND(100.0 * (SELECT COUNT(*) FROM parking_spaces WHERE zone_id = NEW.id AND status = 'occupied') / NEW.total_spaces, 2)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_record_occupancy
AFTER UPDATE ON parking_zones
FOR EACH ROW
WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
EXECUTE FUNCTION record_zone_occupancy();

-- ============================================
-- TRIGGER: Calculate vehicle log duration
-- ============================================

CREATE OR REPLACE FUNCTION calculate_vehicle_log_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.exit_time IS NOT NULL AND NEW.entry_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_log_duration
BEFORE INSERT OR UPDATE ON vehicle_logs
FOR EACH ROW
EXECUTE FUNCTION calculate_vehicle_log_duration();

-- ============================================
-- TRIGGER: Auto-create notification on infringement
-- ============================================

CREATE OR REPLACE FUNCTION notify_on_infringement()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        recipient_user_id,
        notification_type,
        title,
        message,
        related_infringement_id
    )
    SELECT
        d.user_id,
        'infringement'::notification_type,
        'Parking Infringement Reported',
        'An infringement has been reported for your vehicle: ' || v.registration_number,
        NEW.id
    FROM drivers d
    JOIN vehicles v ON d.id = v.driver_id
    WHERE v.id = NEW.vehicle_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_infringement
AFTER INSERT ON infringements
FOR EACH ROW
EXECUTE FUNCTION notify_on_infringement();

-- ============================================
-- TRIGGER: Release cordoned space automatically
-- ============================================

CREATE OR REPLACE FUNCTION auto_release_cordoned_space()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cordoned' AND NEW.cordoned_reason IS NOT NULL THEN
        -- Can add logic to auto-release after certain period if needed
        INSERT INTO audit_logs (
            action,
            entity_type,
            entity_id,
            new_values
        )
        VALUES (
            'SPACE_CORDONED',
            'parking_space',
            NEW.id,
            jsonb_build_object('reason', NEW.cordoned_reason)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_cordoned_logging
AFTER UPDATE ON parking_spaces
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cordoned')
EXECUTE FUNCTION auto_release_cordoned_space();

-- ============================================
-- TRIGGER: Update last vehicle exit time
-- ============================================

CREATE OR REPLACE FUNCTION update_vehicle_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE drivers
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.driver_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_vehicle_activity
AFTER INSERT ON vehicle_logs
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_last_activity();

-- ============================================
-- FUNCTION: Get available parking spaces in zone
-- ============================================

CREATE OR REPLACE FUNCTION get_available_spaces_in_zone(p_zone_id UUID)
RETURNS TABLE (
    space_id UUID,
    space_number VARCHAR,
    zone_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.id,
        ps.space_number,
        pz.zone_name
    FROM parking_spaces ps
    JOIN parking_zones pz ON ps.zone_id = pz.id
    WHERE ps.zone_id = p_zone_id
    AND ps.status = 'available'
    ORDER BY ps.space_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Log vehicle entry
-- ============================================

CREATE OR REPLACE FUNCTION log_vehicle_entry(
    p_vehicle_id UUID,
    p_driver_id UUID,
    p_parking_zone_id UUID,
    p_parking_space_id UUID,
    p_recorded_by_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO vehicle_logs (
        vehicle_id,
        driver_id,
        parking_zone_id,
        parking_space_id,
        status,
        entry_time,
        recorded_by_user_id
    )
    VALUES (
        p_vehicle_id,
        p_driver_id,
        p_parking_zone_id,
        p_parking_space_id,
        'entered'::vehicle_entry_status,
        CURRENT_TIMESTAMP,
        p_recorded_by_user_id
    )
    RETURNING id INTO v_log_id;

    -- Update parking space status
    UPDATE parking_spaces
    SET 
        status = 'occupied',
        currently_occupied_by_vehicle_id = p_vehicle_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_parking_space_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Log vehicle exit
-- ============================================

CREATE OR REPLACE FUNCTION log_vehicle_exit(
    p_vehicle_id UUID,
    p_parking_space_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- Get the entry log
    SELECT id INTO v_log_id FROM vehicle_logs
    WHERE vehicle_id = p_vehicle_id
    AND status = 'entered'
    AND exit_time IS NULL
    ORDER BY entry_time DESC
    LIMIT 1;

    IF v_log_id IS NULL THEN
        RAISE EXCEPTION 'No active entry log found for this vehicle';
    END IF;

    -- Update the log with exit time
    UPDATE vehicle_logs
    SET 
        status = 'exited'::vehicle_entry_status,
        exit_time = CURRENT_TIMESTAMP
    WHERE id = v_log_id;

    -- Update parking space status
    UPDATE parking_spaces
    SET 
        status = 'available',
        currently_occupied_by_vehicle_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_parking_space_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
