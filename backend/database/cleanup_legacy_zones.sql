-- Cleanup legacy mock parking zones and dependent records
-- Safe to run multiple times.
WITH old_zones AS (
    SELECT id
    FROM parking_zones
    WHERE zone_code IN ('ECA', 'NCA', 'NCB', 'SCA', 'WCA')
)
DELETE FROM alerts
WHERE parking_zone_id IN (
        SELECT id
        FROM old_zones
    );
WITH old_zones AS (
    SELECT id
    FROM parking_zones
    WHERE zone_code IN ('ECA', 'NCA', 'NCB', 'SCA', 'WCA')
)
DELETE FROM zone_occupancy_history
WHERE parking_zone_id IN (
        SELECT id
        FROM old_zones
    );
WITH old_zones AS (
    SELECT id
    FROM parking_zones
    WHERE zone_code IN ('ECA', 'NCA', 'NCB', 'SCA', 'WCA')
)
UPDATE vehicle_logs
SET parking_zone_id = NULL
WHERE parking_zone_id IN (
        SELECT id
        FROM old_zones
    );
WITH old_zones AS (
    SELECT id
    FROM parking_zones
    WHERE zone_code IN ('ECA', 'NCA', 'NCB', 'SCA', 'WCA')
)
UPDATE infringements
SET parking_zone_id = NULL
WHERE parking_zone_id IN (
        SELECT id
        FROM old_zones
    );
WITH old_zones AS (
    SELECT id
    FROM parking_zones
    WHERE zone_code IN ('ECA', 'NCA', 'NCB', 'SCA', 'WCA')
)
DELETE FROM reservations r USING parking_spaces ps
WHERE r.parking_space_id = ps.id
    AND ps.zone_id IN (
        SELECT id
        FROM old_zones
    );
DELETE FROM parking_zones
WHERE zone_code IN ('ECA', 'NCA', 'NCB', 'SCA', 'WCA');