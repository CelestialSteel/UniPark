"""Create or fetch a security guard account for local testing.

Usage:
    python scripts/create_security_guard.py
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

from app.core.database import SessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import User, UserRole  # noqa: E402

# --- credentials you can sign in with on the security dashboard -----------------
GUARD_EMAIL = "guard@unipark.ac.ke"
GUARD_PASSWORD = "Guard@2026"
GUARD_FIRST = "Main"
GUARD_LAST = "Gate Guard"
GUARD_PHONE = "+254 700 000 111"


def main() -> int:
    with SessionLocal() as db:
        existing = db.query(User).filter(User.email == GUARD_EMAIL).first()
        if existing is not None:
            print(
                "Found existing security user — making sure it is active and a 'security' role.")
            existing.is_active = True
            if existing.role != UserRole.SECURITY:
                existing.role = UserRole.SECURITY
            # Refresh the password so the credentials below are guaranteed to work.
            existing.password_hash = hash_password(GUARD_PASSWORD)
            db.commit()
            db.refresh(existing)
            user = existing
        else:
            user = User(
                id=uuid.uuid4(),
                email=GUARD_EMAIL,
                password_hash=hash_password(GUARD_PASSWORD),
                role=UserRole.SECURITY,
                first_name=GUARD_FIRST,
                last_name=GUARD_LAST,
                phone_number=GUARD_PHONE,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Quick sanity check that the role column accepts the enum text.
        result = db.execute(
            text(
                "SELECT id, email, role, first_name, last_name, is_active "
                "FROM users WHERE id = :uid"
            ),
            {"uid": str(user.id)},
        ).first()

    print()
    print("=" * 64)
    print(" Security guard account ready")
    print("=" * 64)
    print(f" User ID : {result.id}")
    print(f" Email   : {result.email}")
    print(f" Password: {GUARD_PASSWORD}")
    print(f" Role    : {result.role}")
    print(f" Name    : {result.first_name} {result.last_name}")
    print(f" Active  : {result.is_active}")
    print()
    print(" Sign in at /login and select the 'Guard' role.")
    print("=" * 64)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
