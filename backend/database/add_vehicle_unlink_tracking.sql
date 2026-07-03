-- Adds persistence for driver vehicle unlink reasons.
-- Safe to run multiple times.
CREATE TABLE IF NOT EXISTS vehicle_unlink_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    unlinked_by_user_id UUID NOT NULL REFERENCES users(id),
    reason VARCHAR(120) NOT NULL,
    details TEXT,
    unlinked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehicle_unlink_events_vehicle_id ON vehicle_unlink_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_unlink_events_driver_id ON vehicle_unlink_events(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_unlink_events_unlinked_at ON vehicle_unlink_events(unlinked_at);