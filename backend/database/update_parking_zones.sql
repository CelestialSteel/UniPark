-- Update parking zones for UniPark
-- Applies the required 4 main zones and 5 Phase 2 sub-zones.
-- Safe to run multiple times (uses UPSERT by zone_code).
WITH admin_user AS (
    SELECT id
    FROM users
    WHERE role = 'admin'
    ORDER BY created_at
    LIMIT 1
), required_zones AS (
    SELECT *
    FROM (
            VALUES (
                    'Phase 1',
                    'PH1',
                    'Main parking zone: Phase 1',
                    'Phase 1',
                    120
                ),
                (
                    'Phase 2',
                    'PH2',
                    'Main parking zone: Phase 2',
                    'Phase 2',
                    180
                ),
                (
                    'SBS Lot',
                    'SBS',
                    'Main parking zone: SBS Lot',
                    'SBS',
                    70
                ),
                (
                    'Sports Complex Lot',
                    'SCL',
                    'Main parking zone: Sports Complex Lot',
                    'Sports Complex',
                    90
                ),
                (
                    'Library Lot',
                    'P2LIB',
                    'Phase 2 sub-zone: Library Lot',
                    'Phase 2',
                    40
                ),
                (
                    'Graduation Square',
                    'P2GRAD',
                    'Phase 2 sub-zone: Graduation Square',
                    'Phase 2',
                    30
                ),
                (
                    'MSB Lot',
                    'P2MSB',
                    'Phase 2 sub-zone: MSB Lot',
                    'Phase 2',
                    50
                ),
                (
                    'Engineering Lot',
                    'P2ENG',
                    'Phase 2 sub-zone: Engineering Lot',
                    'Phase 2',
                    60
                ),
                (
                    'Gate E Lot',
                    'P2GATEE',
                    'Phase 2 sub-zone: Gate E Lot',
                    'Phase 2',
                    35
                )
        ) AS t(
            zone_name,
            zone_code,
            description,
            location,
            total_spaces
        )
)
INSERT INTO parking_zones (
        zone_name,
        zone_code,
        description,
        location,
        total_spaces,
        created_by_user_id,
        status
    )
SELECT rz.zone_name,
    rz.zone_code,
    rz.description,
    rz.location,
    rz.total_spaces,
    au.id,
    'active'
FROM required_zones rz
    CROSS JOIN admin_user au ON CONFLICT (zone_code) DO
UPDATE
SET zone_name = EXCLUDED.zone_name,
    description = EXCLUDED.description,
    location = EXCLUDED.location,
    total_spaces = EXCLUDED.total_spaces,
    status = 'active';
-- Optional cleanup (uncomment if you want ONLY these zones in the DB):
-- DELETE FROM parking_zones
-- WHERE zone_code NOT IN ('PH1', 'PH2', 'SBS', 'SCL', 'P2LIB', 'P2GRAD', 'P2MSB', 'P2ENG', 'P2GATEE');
-- Verify
SELECT zone_name,
    zone_code,
    location,
    total_spaces,
    status
FROM parking_zones
ORDER BY CASE
        zone_code
        WHEN 'PH1' THEN 1
        WHEN 'PH2' THEN 2
        WHEN 'SBS' THEN 3
        WHEN 'SCL' THEN 4
        WHEN 'P2LIB' THEN 5
        WHEN 'P2GRAD' THEN 6
        WHEN 'P2MSB' THEN 7
        WHEN 'P2ENG' THEN 8
        WHEN 'P2GATEE' THEN 9
        ELSE 99
    END,
    zone_name;