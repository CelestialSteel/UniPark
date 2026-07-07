import os
import sys
from pathlib import Path
import uuid

# Add backend directory to Python path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal
from app.models import ParkingZone, ParkingSpace, ParkingSpaceStatus, User

def main():
    with SessionLocal() as db:
        admin = db.query(User).filter(User.email == "admin@unipark.ac.ke").first()
        admin_id = admin.id if admin else None

        zones = db.query(ParkingZone).all()
        if not zones:
            print("No zones found. Skipping.")
            return

        total_spaces_created = 0
        for zone in zones:
            # Check how many spaces already exist for this zone
            existing_count = db.query(ParkingSpace).filter(ParkingSpace.zone_id == zone.id).count()
            needed = zone.total_spaces - existing_count
            
            if needed > 0:
                print(f"Creating {needed} spaces for Zone {zone.zone_name}...")
                for i in range(needed):
                    space = ParkingSpace(
                        id=uuid.uuid4(),
                        zone_id=zone.id,
                        space_number=f"{zone.zone_code}-{existing_count + i + 1}",
                        status=ParkingSpaceStatus.AVAILABLE,
                        created_by_user_id=admin_id
                    )
                    db.add(space)
                total_spaces_created += needed

        db.commit()
        print(f"Finished! Created {total_spaces_created} new parking spaces.")

if __name__ == "__main__":
    main()
