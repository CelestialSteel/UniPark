-- ============================================
-- MIGRATION: Visitor vehicle entry/exit
-- ============================================
--
-- This migration lets a security guard log a vehicle entry even when the
-- plate is not yet linked to a registered driver. We do this by:
--   1. Making `vehicle_id` and `driver_id` nullable on `vehicle_logs`
--   2. Adding `guest_registration`, `guest_name`, and `guest_group` columns
--      so we can still capture *who* showed up at the gate
--   3. Adding an index on `guest_registration` for quick lookup of the
--      parked-but-not-registered vehicles
--
-- Safe to re-run: every ALTER uses IF EXISTS / IF NOT EXISTS guards.
-- 1. Drop the NOT NULL constraint on vehicle_id and driver_id
ALTER TABLE vehicle_logs
ALTER COLUMN vehicle_id DROP NOT NULL;
ALTER TABLE vehicle_logs
ALTER COLUMN driver_id DROP NOT NULL;
-- 2. Add the guest columns (no-op if they already exist)
ALTER TABLE vehicle_logs
ADD COLUMN IF NOT EXISTS guest_registration VARCHAR(50);
ALTER TABLE vehicle_logs
ADD COLUMN IF NOT EXISTS guest_name VARCHAR(150);
ALTER TABLE vehicle_logs
ADD COLUMN IF NOT EXISTS guest_group VARCHAR(50);
-- 3. Index for fast lookup of currently-parked vehicles (incl. visitors)
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_guest_registration ON vehicle_logs(guest_registration);
-- 4. Index for the "active session" query (status='entered' AND exit_time IS NULL)
--    This is already implicitly supported by the existing status index, but a
--    partial index is much faster and tiny.
CREATE INDEX IF NOT EXISTS idx_vehicle_logs_active ON vehicle_logs(parking_zone_id, entry_time)
WHERE status = 'entered'
    AND exit_time IS NULL;