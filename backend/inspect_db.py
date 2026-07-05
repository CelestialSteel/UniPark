"""Inspect vehicles, drivers, and unipark zones."""
import psycopg

conn = psycopg.connect(
    "host=localhost dbname=unipark_db user=moran password=Psql2345")
cur = conn.cursor()

cur.execute("""
    SELECT v.registration_number, d.id, u.first_name, u.last_name
    FROM vehicles v
    JOIN drivers d ON d.id = v.driver_id
    JOIN users u ON u.id = d.user_id
    LIMIT 10
""")
print("=== Registered vehicles ===")
for row in cur.fetchall():
    print("  ", row)

cur.execute("SELECT id, zone_name, zone_code, total_spaces, occupied_spaces FROM parking_zones ORDER BY zone_name LIMIT 12")
print("\n=== Zones ===")
for row in cur.fetchall():
    print("  ", row)

cur.execute("""
    SELECT vehicle_registration, parking_zone_name, status
    FROM (
        SELECT
            COALESCE(v.registration_number, vl.guest_registration) AS vehicle_registration,
            pz.zone_name AS parking_zone_name,
            vl.status
        FROM vehicle_logs vl
        LEFT JOIN vehicles v ON v.id = vl.vehicle_id
        JOIN parking_zones pz ON pz.id = vl.parking_zone_id
    ) t
    WHERE status = 'entered'
""")
print("\n=== Currently active logs ===")
for row in cur.fetchall():
    print("  ", row)
