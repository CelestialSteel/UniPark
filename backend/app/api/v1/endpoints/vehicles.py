"""Vehicles Endpoints"""
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_driver_user, get_security_user, get_admin_or_security_user
from app.schemas import VehicleResponse, VehicleCreateRequest, LinkVehicleRequest, UnlinkVehicleRequest, AdminLinkVehicleRequest
from app.models import Vehicle, Driver, User, UserRole, VehicleUnlinkEvent
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _normalize_plate(value: str) -> str:
    """Uppercase + trim — registration plates are case-insensitive."""
    return (value or "").strip().upper()


def _serialize_directory_entry(vehicle: Vehicle) -> dict:
    """Vehicle shape used by the security dashboard's Authorized Directory."""
    driver = vehicle.driver
    user = driver.user if driver else None
    full_name = (
        f"{user.first_name or ''} {user.last_name or ''}".strip()
        if user else ""
    ) or (user.email if user else "Unknown Driver")

    # Map a driver's primary ID type to a friendly label.
    if driver and driver.student_id:
        id_label, id_value = "Student", driver.student_id
    elif driver and driver.faculty_id:
        id_label, id_value = "Lecturer", driver.faculty_id
    elif driver and driver.staff_id:
        id_label, id_value = "Staff", driver.staff_id
    else:
        id_label, id_value = "Driver", "—"

    return {
        "id": str(vehicle.id),
        "plate": vehicle.registration_number,
        "name": full_name,
        "email": user.email if user else None,
        "phone": user.phone_number if user else None,
        "idNumber": id_value,
        "idLabel": id_label,
        "department": driver.department if driver else None,
        "role": id_label,  # student / faculty / staff mirrors what the UI used to show
        "is_primary": vehicle.is_primary,
        "is_active": vehicle.is_active,
        "created_at": vehicle.created_at.isoformat() if vehicle.created_at else None,
    }


def _find_driver_by_admission(db: Session, admission_id: str) -> Optional[Driver]:
    """Look up a driver by student / faculty / staff ID.

    Admission numbers in this system can be either a numeric student ID
    (e.g. ``184066``) or a prefixed staff/faculty code (e.g. ``SU-4009``).
    We check all three columns and return the first match.
    """
    if not admission_id:
        return None
    needle = admission_id.strip()
    return (
        db.query(Driver)
        .filter(
            (Driver.student_id == needle)
            | (Driver.faculty_id == needle)
            | (Driver.staff_id == needle)
        )
        .first()
    )


@router.get("", response_model=list[dict])
async def list_all_vehicles(
    current_user: User = Depends(get_admin_or_security_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    plate: Optional[str] = None,
):
    """List every active vehicle in the system (security only).

    Supports an optional ``?plate=`` query param for plate-based lookup
    (used by the admin driver-lookup tab).
    """
    query = db.query(Vehicle).filter(Vehicle.is_active == True)
    if plate:
        normalized = _normalize_plate(plate)
        query = query.filter(Vehicle.registration_number.ilike(f"%{normalized}%"))
    vehicles = (
        query
        .order_by(Vehicle.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_serialize_directory_entry(v) for v in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get vehicle details"""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Drivers can only view their own vehicles
    if current_user.role == UserRole.DRIVER:
        driver = db.query(Driver).filter(
            Driver.user_id == current_user.id).first()
        if not driver or vehicle.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this vehicle"
            )

    return vehicle


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def register_vehicle(
    request: VehicleCreateRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Register new vehicle (security only)"""

    # Check if registration number already exists
    existing_vehicle = db.query(Vehicle).filter(
        Vehicle.registration_number == request.registration_number
    ).first()

    if existing_vehicle and existing_vehicle.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle registration number already exists"
        )

    # For now, require driver_id to be provided through frontend
    # In real implementation, security would search for driver
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Driver ID required. Use link endpoint instead."
    )


@router.post("/link", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
async def link_vehicle(
    request: LinkVehicleRequest,
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """Link vehicle to driver account (driver)"""

    # Get driver record
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )

    # Check if registration number already exists for another driver
    existing_vehicle = db.query(Vehicle).filter(
        Vehicle.registration_number == request.registration_number,
        Vehicle.is_active == True
    ).first()

    if existing_vehicle and existing_vehicle.driver_id != driver.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This vehicle is already registered to another driver"
        )

    # If vehicle already exists, just activate it
    if existing_vehicle:
        existing_vehicle.is_active = True
        existing_vehicle.is_primary = request.is_primary or existing_vehicle.is_primary
        db.commit()
        db.refresh(existing_vehicle)
        logger.info(f"Vehicle linked: {existing_vehicle.registration_number}")
        return existing_vehicle

    # Create new vehicle
    new_vehicle = Vehicle(
        driver_id=driver.id,
        registration_number=request.registration_number,
        make="",  # Will be updated by security
        model="",
        is_primary=request.is_primary,
        registered_by_user_id=current_user.id
    )

    # If this is first vehicle, make it primary
    existing_vehicles = db.query(Vehicle).filter(
        Vehicle.driver_id == driver.id,
        Vehicle.is_active == True
    ).count()

    if existing_vehicles == 0:
        new_vehicle.is_primary = True

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    logger.info(f"Vehicle linked: {new_vehicle.registration_number}")

    return new_vehicle


@router.post("/admin-link", response_model=dict, status_code=status.HTTP_201_CREATED)
async def admin_link_vehicle(
    request: AdminLinkVehicleRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Security-initiated vehicle-to-driver link at the gate.

    Flow:
      1. Look up the driver in the database by their admission / staff / faculty ID.
         - If no match, return 404 so the security guard can ask the driver to sign up.
      2. Look up the vehicle by registration number.
         - If it already exists and is *active* and *linked to a different driver*,
           return 409 — a car can only be linked to one driver at a time.
         - If it exists but is inactive (previously unlinked), reactivate it
           and reassign it to the new driver.
         - Otherwise create a fresh ``Vehicle`` row.
      3. If this is the driver's first active vehicle, mark it as primary.
      4. Return the resulting vehicle plus the resolved driver summary so the
         security dashboard can update its directory without a follow-up call.
    """
    plate = _normalize_plate(request.registration_number)
    admission_id = (request.admission_id or "").strip()

    # 1. Driver must exist
    driver = _find_driver_by_admission(db, admission_id)
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No driver is registered with that Admission Number. "
                "Please ask the driver to sign up first."
            ),
        )

    if not driver.user or not driver.user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This driver's account is inactive. Contact an administrator.",
        )

    # 2. Vehicle must not already be linked to a different active driver
    existing_vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.registration_number == plate)
        .first()
    )

    if existing_vehicle and existing_vehicle.is_active and existing_vehicle.driver_id != driver.id:
        existing_driver_user = (
            db.query(User).filter(
                User.id == existing_vehicle.driver.user_id).first()
            if existing_vehicle.driver else None
        )
        owner_name = ""
        if existing_driver_user:
            owner_name = (
                f"{existing_driver_user.first_name or ''} "
                f"{existing_driver_user.last_name or ''}"
            ).strip() or existing_driver_user.email
        detail = (
            f"Vehicle {plate} is already linked to another driver"
            + (f" ({owner_name})." if owner_name else ".")
            + " A car can only be linked to one driver at a time."
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )

    # 3. Re-link or create
    if existing_vehicle:
        existing_vehicle.driver_id = driver.id
        existing_vehicle.is_active = True
        existing_vehicle.registered_by_user_id = current_user.id
        vehicle = existing_vehicle
        logger.info(
            "Vehicle re-linked by security: %s -> driver %s",
            plate, driver.id,
        )
    else:
        vehicle = Vehicle(
            driver_id=driver.id,
            registration_number=plate,
            make="",
            model="",
            is_primary=request.is_primary,
            is_active=True,
            registered_by_user_id=current_user.id,
        )
        db.add(vehicle)
        db.flush()
        logger.info(
            "Vehicle linked by security: %s -> driver %s",
            plate, driver.id,
        )

    # 4. Auto-promote to primary if the driver has no other active vehicle
    other_active = (
        db.query(Vehicle)
        .filter(
            Vehicle.driver_id == driver.id,
            Vehicle.is_active == True,
            Vehicle.id != vehicle.id,
        )
        .count()
    )
    if other_active == 0:
        vehicle.is_primary = True

    db.commit()
    db.refresh(vehicle)

    return {
        "message": f"Vehicle {plate} linked successfully.",
        "vehicle": _serialize_directory_entry(vehicle),
        "driver": {
            "driver_id": str(driver.id),
            "name": (
                f"{driver.user.first_name or ''} {driver.user.last_name or ''}"
            ).strip() or driver.user.email,
            "email": driver.user.email,
            "phone": driver.user.phone_number,
            "admission_id": admission_id,
        },
    }


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """Unlink vehicle from driver account (driver)"""
    await _unlink_vehicle_from_driver(
        vehicle_id=vehicle_id,
        reason="Unlinked from driver profile",
        details=None,
        current_user=current_user,
        db=db,
    )


@router.post("/{vehicle_id}/unlink", status_code=status.HTTP_200_OK)
async def unlink_vehicle_with_reason(
    vehicle_id: str,
    request: UnlinkVehicleRequest,
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """Unlink vehicle and persist the driver-provided reason."""
    await _unlink_vehicle_from_driver(
        vehicle_id=vehicle_id,
        reason=request.reason,
        details=request.details,
        current_user=current_user,
        db=db,
    )

    return {"message": "Vehicle unlinked successfully"}


async def _unlink_vehicle_from_driver(
    vehicle_id: str,
    reason: str,
    details: str | None,
    current_user: User,
    db: Session,
):
    """Shared unlink logic for both legacy and reason-aware endpoints."""

    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    # Verify driver owns this vehicle
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    if vehicle.driver_id != driver.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to unlink this vehicle"
        )

    # Cannot unlink if it's the only active vehicle
    active_vehicles = db.query(Vehicle).filter(
        Vehicle.driver_id == driver.id,
        Vehicle.is_active == True
    ).count()

    if active_vehicles <= 1 and vehicle.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unlink primary vehicle. You must have at least one active vehicle."
        )

    # Cannot unlink if it's primary and there are other active vehicles
    if vehicle.is_primary and active_vehicles > 1:
        # Set another vehicle as primary
        next_primary = db.query(Vehicle).filter(
            Vehicle.driver_id == driver.id,
            Vehicle.is_active == True,
            Vehicle.id != vehicle_id
        ).first()
        if next_primary:
            next_primary.is_primary = True

    unlink_event = VehicleUnlinkEvent(
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        unlinked_by_user_id=current_user.id,
        reason=reason,
        details=details.strip() if details else None,
    )

    vehicle.is_active = False
    db.add(unlink_event)
    db.commit()

    logger.info(f"Vehicle unlinked: {vehicle.registration_number}")
