"""Idempotent migration to align the `alerts` table with the SQLAlchemy
Alert model used by the rest of the codebase.

History:
    The original schema.sql created `alerts` with a single `description`
    column. The Alert ORM model, however, defines a richer table
    (`message`, `severity`, `resolved_*`) that the API and frontend
    both rely on. Attempting to insert a row through the API produced
    `psycopg.errors.UndefinedColumn: column "message" of relation
    "alerts" does not exist`.

This script:
    1. Adds the missing columns if they are not already present.
    2. Backfills `message` from `description` for any existing rows so
       we don't lose content.
    3. Is safe to re-run (uses IF NOT EXISTS / DROP COLUMN IF EXISTS
       patterns where possible).

Run:
    python scripts/migrate_alerts_table.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import text  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402

# Each tuple is (column_name, postgres_ddl)
# `message` is NOT NULL after the migration but the backfill step runs
# first so we never violate the constraint.
COLUMNS = [
    ("message",     "TEXT"),
    ("severity",    "VARCHAR(20)"),
    ("resolved_at", "TIMESTAMP"),
    ("resolved_notes", "TEXT"),
    ("resolved_by_user_id", "UUID REFERENCES users(id)"),
]


def column_exists(db, table: str, column: str) -> bool:
    row = db.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = :t AND column_name = :c"
        ),
        {"t": table, "c": column},
    ).first()
    return row is not None


def main() -> int:
    with SessionLocal() as db:
        print("Before migration columns:")
        for r in db.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'alerts' ORDER BY ordinal_position"
            )
        ).fetchall():
            print("  -", r.column_name)

        # 1. Add each missing column.
        for col_name, col_type in COLUMNS:
            if column_exists(db, "alerts", col_name):
                print(f"[skip] column '{col_name}' already exists")
                continue
            print(f"[add]  column '{col_name}' ({col_type})")
            db.execute(
                text(f"ALTER TABLE alerts ADD COLUMN {col_name} {col_type}")
            )

        # 2. Backfill: copy existing `description` rows into `message`
        #    so legacy alerts aren't blank after the migration.
        if column_exists(db, "alerts", "description"):
            backfilled = db.execute(
                text(
                    "UPDATE alerts SET message = description "
                    "WHERE message IS NULL AND description IS NOT NULL"
                )
            ).rowcount
            if backfilled:
                print(f"[backfill] copied {backfilled} description -> message")
            else:
                print("[backfill] no rows needed updating")

        db.commit()

        # 3. Drop the now-redundant `description` column if it's still
        #    there. We only do this if no rows have a non-null message,
        #    i.e. the backfill was complete.
        if column_exists(db, "alerts", "description"):
            leftover = db.execute(
                text(
                    "SELECT COUNT(*) FROM alerts "
                    "WHERE message IS NULL AND description IS NOT NULL"
                )
            ).scalar()
            if leftover == 0:
                print("[drop]  removing redundant 'description' column")
                db.execute(text("ALTER TABLE alerts DROP COLUMN description"))
                db.commit()
            else:
                print(
                    f"[keep]  'description' column kept — {leftover} rows "
                    "still depend on it (manual review needed)"
                )

        print()
        print("After migration columns:")
        for r in db.execute(
            text(
                "SELECT column_name, data_type FROM information_schema.columns "
                "WHERE table_name = 'alerts' ORDER BY ordinal_position"
            )
        ).fetchall():
            print(f"  - {r.column_name} ({r.data_type})")

    print()
    print("Alerts table migration complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
