-- ============================================
-- MIGRATION: Add occupied_spaces counter to parking_zones
-- ============================================
--
-- The original `schema.sql` declares this column, but the running
-- database does not have it. This migration adds it (idempotent) so
-- the entry / exit endpoints have a reliable counter to bump when a
-- vehicle is logged in or out at the gate.
--
-- No-op if the column already exists.
ALTER TABLE parking_zones
ADD COLUMN IF NOT EXISTS occupied_spaces INTEGER NOT NULL DEFAULT 0;