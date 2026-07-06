"""Create or refresh the admin account for local testing.

Mirrors scripts/create_security_guard.py for the ADMIN role.

Usage:
    python scripts/create_admin.py
"""

import sys
import uuid
from datetime import datetime
from pathlib import Path

# Make the `app` package importable regardless of where the script is run.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import text  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import User, UserRole  # noqa: E402

# --- credentials you can sign in with on the admin dashboard -----------------
ADMIN_EMAIL = "admin@unipark.ac.ke"
ADMIN_PASSWORD = "Admin@2026"
ADMIN_FIRST = "System"
ADMIN_LAST = "Administrator"
ADMIN_PHONE = "+254 700 000 000"


def main() -> int:
    with SessionLocal() as db:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if existing is not None:
            print(
                "Found existing admin user — forcing role=admin, "
                "is_active=True, and refreshing the password hash."
            )
            existing.is_active = True
            existing.role = UserRole.ADMIN
            existing.password_hash = hash_password(ADMIN_PASSWORD)
            db.commit()
            db.refresh(existing)
            user = existing
        else:
            user = User(
                id=uuid.uuid4(),
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                first_name=ADMIN_FIRST,
                last_name=ADMIN_LAST,
                phone_number=ADMIN_PHONE,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Sanity-check what was actually persisted.
        result = db.execute(
            text(
                "SELECT id, email, role, first_name, last_name, is_active "
                "FROM users WHERE id = :uid"
            ),
            {"uid": str(user.id)},
        ).first()

    print()
    print("=" * 64)
    print(" Admin account ready")
    print("=" * 64)
    print(f" User ID : {result.id}")
    print(f" Email   : {result.email}")
    print(f" Password: {ADMIN_PASSWORD}")
    print(f" Role    : {result.role}")
    print(f" Name    : {result.first_name} {result.last_name}")
    print(f" Active  : {result.is_active}")
    print()
    print(" Sign in at /login and select the 'Admin' role.")
    print("=" * 64)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
