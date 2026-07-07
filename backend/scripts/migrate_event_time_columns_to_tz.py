"""Idempotent migration: convert event-time columns from
``TIMESTAMP WITHOUT TIME ZONE`` to ``TIMESTAMP WITH TIME ZONE``.

Why this matters
================
The DB server is configured with timezone ``Africa/Nairobi`` (UTC+3) and
the application's time-bearing columns were originally created as naive
``TIMESTAMP`` columns. When the API writes ``datetime.now(timezone.utc)`` (a naive
UTC value) to a naive column, PostgreSQL reinterprets the value in the
session timezone (EAT) before storing it. When that value is later
returned to the frontend, the browser parses it as the user's local
time and the displayed timestamp is shifted by the DB's UTC offset (3
hours behind the real UTC instant).

Converting these columns to ``TIMESTAMP WITH TIME ZONE`` makes PostgreSQL
store the absolute UTC instant instead of a naive local string. Combined
with the backend's switch to ``datetime.now(timezone.utc)`` and the
frontend's explicit-UTC parsing, this puts the entire stack on UTC end
to end.

The challenge
=============
PostgreSQL will not allow an ``ALTER COLUMN ... TYPE`` if any trigger
references the column in its ``WHEN`` clause or body. We therefore:

    1. Find every trigger that depends on a target column.
    2. Drop those triggers (we have backups in
       ``backend/database/triggers_and_functions.sql``).
    3. ALTER the column.
    4. Recreate the trigger with the same DDL as the original.

This script is **safe to re-run**: each step is guarded with an
information_schema check.

Run:
    python scripts/migrate_event_time_columns_to_tz.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import text  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402

EVENT_TIME_COLUMNS: list[tuple[str, str]] = [
    ("users", "created_at"),
    ("users", "updated_at"),
    ("drivers", "created_at"),
    ("vehicles", "created_at"),
    ("vehicles", "updated_at"),
    ("vehicle_logs", "entry_time"),
    ("vehicle_logs", "exit_time"),
    ("vehicle_logs", "created_at"),
    ("parking_zones", "created_at"),
    ("parking_zones", "updated_at"),
    ("parking_spaces", "created_at"),
    ("alerts", "created_at"),
    ("alerts", "updated_at"),
    ("alerts", "resolved_at"),
    ("notifications", "created_at"),
    ("notifications", "read_at"),
    ("reservations", "reservation_date"),
    ("reservations", "expiry_time"),
    ("reservations", "created_at"),
    ("zone_occupancy_history", "recorded_at"),
    ("audit_logs", "timestamp"),
    ("vehicle_unlink_events", "unlinked_at"),
]

# (trigger_name, table_it_lives_on, recreate_sql)
# Discovered via information_schema + pg_proc. Drop order matters when
# one trigger's function is shared â€” dropping the trigger is enough; the
# function itself is left in place.
TRIGGERS_TO_RECREATE: list[tuple[str, str, str]] = [
    (
        "trigger_update_zone_stats_after_space_update",
        "parking_spaces",
        """
        CREATE TRIGGER trigger_update_zone_stats_after_space_update
        AFTER UPDATE ON parking_spaces
        FOR EACH ROW
        WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION update_zone_statistics();
        """,
    ),
    (
        "trigger_update_zone_stats_after_space_insert",
        "parking_spaces",
        """
        CREATE TRIGGER trigger_update_zone_stats_after_space_insert
        AFTER INSERT ON parking_spaces
        FOR EACH ROW
        EXECUTE FUNCTION update_zone_statistics();
        """,
    ),
    (
        "trigger_record_occupancy",
        "parking_zones",
        """
        CREATE TRIGGER trigger_record_occupancy
        AFTER UPDATE ON parking_zones
        FOR EACH ROW
        WHEN (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
        EXECUTE FUNCTION record_zone_occupancy();
        """,
    ),
    (
        "trigger_log_vehicle_activity",
        "vehicle_logs",
        """
        CREATE TRIGGER trigger_log_vehicle_activity
        AFTER INSERT ON vehicle_logs
        FOR EACH ROW
        EXECUTE FUNCTION update_vehicle_last_activity();
        """,
    ),
    (
        "trigger_calculate_log_duration",
        "vehicle_logs",
        """
        CREATE TRIGGER trigger_calculate_log_duration
        BEFORE INSERT OR UPDATE ON vehicle_logs
        FOR EACH ROW
        EXECUTE FUNCTION calculate_vehicle_log_duration();
        """,
    ),
]


def column_is_tz_aware(db, table, column) -> bool:
    row = db.execute(
        text(
            """
            SELECT data_type FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :t AND column_name = :c
            """
        ),
        {"t": table, "c": column},
    ).first()
    return row is not None and row.data_type == "timestamp with time zone"


def trigger_exists(db, name) -> bool:
    return db.execute(
        text("SELECT 1 FROM information_schema.triggers WHERE trigger_name = :n"),
        {"n": name},
    ).first() is not None


def main() -> int:
    dropped_triggers: list[str] = []
    created_triggers: list[str] = []
    changed = skipped = missing = 0

    with SessionLocal() as db:
        # Force the session to UTC so the AT TIME ZONE conversion
        # interprets the existing naive values as UTC (which is what
        # every Python writer used).
        db.execute(text("SET TIME ZONE 'UTC'"))

        for trigger_name, table, _ in TRIGGERS_TO_RECREATE:
            if not trigger_exists(db, trigger_name):
                print(f"[trigger-skip] {trigger_name} (does not exist)")
                continue
            print(f"[trigger-drop] {trigger_name} ON {table}")
            db.execute(text(f"DROP TRIGGER {trigger_name} ON {table}"))
            dropped_triggers.append(trigger_name)

        for table, column in EVENT_TIME_COLUMNS:
            exists = db.execute(
                text(
                    """
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = :t AND column_name = :c
                    """
                ),
                {"t": table, "c": column},
            ).first()
            if not exists:
                print(f"[skip-missing] {table}.{column}")
                missing += 1
                continue
            if column_is_tz_aware(db, table, column):
                print(f"[already-tz]   {table}.{column}")
                skipped += 1
                continue
            print(f"[convert]      {table}.{column}")
            db.execute(
                text(
                    f"ALTER TABLE {table} "
                    f"ALTER COLUMN {column} TYPE TIMESTAMP WITH TIME ZONE "
                    f"USING {column} AT TIME ZONE 'UTC'"
                )
            )
            changed += 1

        for trigger_name, _, recreate_sql in TRIGGERS_TO_RECREATE:
            if trigger_name not in dropped_triggers:
                continue
            if trigger_exists(db, trigger_name):
                print(f"[trigger-skip] {trigger_name} (already exists)")
                continue
            print(f"[trigger-make] {trigger_name}")
            db.execute(text(recreate_sql))
            created_triggers.append(trigger_name)

        db.commit()

    print()
    print("Summary")
    print("-------")
    print(f"  columns converted     : {changed}")
    print(f"  columns already tz    : {skipped}")
    print(f"  columns missing       : {missing}")
    print(f"  triggers dropped      : {dropped_triggers or 'none'}")
    print(f"  triggers recreated    : {created_triggers or 'none'}")
    print()
    print("Event-time columns are now TIMESTAMP WITH TIME ZONE (UTC).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

