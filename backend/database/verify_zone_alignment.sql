-- Verify final zone alignment
WITH expected(zone_name, zone_code, location, total_spaces) AS (
    VALUES ('Phase 1', 'PH1', 'Phase 1', 120),
        ('Phase 2', 'PH2', 'Phase 2', 180),
        ('SBS Lot', 'SBS', 'SBS', 70),
        (
            'Sports Complex Lot',
            'SCL',
            'Sports Complex',
            90
        ),
        ('Library Lot', 'P2LIB', 'Phase 2', 40),
        ('Graduation Square', 'P2GRAD', 'Phase 2', 30),
        ('MSB Lot', 'P2MSB', 'Phase 2', 50),
        ('Engineering Lot', 'P2ENG', 'Phase 2', 60),
        ('Gate E Lot', 'P2GATEE', 'Phase 2', 35)
)
SELECT e.zone_code,
    e.zone_name AS expected_name,
    pz.zone_name AS actual_name,
    e.location AS expected_location,
    pz.location AS actual_location,
    e.total_spaces AS expected_spaces,
    pz.total_spaces AS actual_spaces,
    CASE
        WHEN pz.zone_code IS NULL THEN 'MISSING'
        WHEN pz.zone_name <> e.zone_name THEN 'NAME_MISMATCH'
        WHEN COALESCE(pz.location, '') <> COALESCE(e.location, '') THEN 'LOCATION_MISMATCH'
        WHEN pz.total_spaces <> e.total_spaces THEN 'CAPACITY_MISMATCH'
        ELSE 'OK'
    END AS status
FROM expected e
    LEFT JOIN parking_zones pz ON pz.zone_code = e.zone_code
ORDER BY e.zone_code;
SELECT zone_name,
    zone_code,
    location,
    total_spaces,
    status
FROM parking_zones
ORDER BY zone_code;
WITH expected_codes AS (
    SELECT code
    FROM (
            VALUES ('PH1'),
                ('PH2'),
                ('SBS'),
                ('SCL'),
                ('P2LIB'),
                ('P2GRAD'),
                ('P2MSB'),
                ('P2ENG'),
                ('P2GATEE')
        ) AS t(code)
)
SELECT zone_name,
    zone_code
FROM parking_zones
WHERE zone_code NOT IN (
        SELECT code
        FROM expected_codes
    )
ORDER BY zone_code;