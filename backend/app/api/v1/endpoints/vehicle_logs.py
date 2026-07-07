"""Vehicle Logs Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_security_user
from app.schemas import VehicleEntryRequest, VehicleExitRequest, VehicleLogResponse
from app.models import Vehicle, VehicleLog, ParkingSpace, ParkingZone, User, UserRole, ParkingSpaceStatus
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _normalize(value: str) -> str:
    return (value or "").strip().upper()


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def serialize_log(log: VehicleLog) -> dict:
    """Convert a vehicle log into the frontend display shape."""
    plate = None
    if log.vehicle is not None:
        plate = log.vehicle.registration_number
    elif log.guest_registration:
        plate = log.guest_registration

    driver_name = None
    if log.driver and log.driver.user:
        driver_name = (
            f"{log.driver.user.first_name or ''} {log.driver.user.last_name or ''}"
        ).strip() or log.driver.user.email
    elif log.guest_name:
        driver_name = log.guest_name

    return {
        "id": str(log.id),
        "vehicle_id": str(log.vehicle_id) if log.vehicle_id else None,
        "driver_id": str(log.driver_id) if log.driver_id else None,
        "parking_space_id": str(log.parking_space_id) if log.parking_space_id else None,
        "parking_zone_id": str(log.parking_zone_id),
        "status": log.status,
        "entry_time": _as_utc(log.entry_time),
        "exit_time": _as_utc(log.exit_time),
        "duration_minutes": log.duration_minutes,
        "vehicle_registration": plate,
        "driver_name": driver_name,
        "parking_zone_name": log.parking_zone.zone_name if log.parking_zone else None,
        "parking_zone_code": log.parking_zone.zone_code if log.parking_zone else None,
        "guest_registration": log.guest_registration,
        "guest_name": log.guest_name,
        "guest_group": log.guest_group,
        "created_at": _as_utc(log.created_at),
    }


@router.get("", response_model=list[VehicleLogResponse])
async def list_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    """List vehicle logs for admin/security dashboards."""

    query = db.query(VehicleLog)

    if current_user.role == UserRole.DRIVER:
        from app.models import Driver
        driver = db.query(Driver).filter(
            Driver.user_id == current_user.id).first()
        if driver:
            query = query.filter(VehicleLog.driver_id == driver.id)

    logs = query.order_by(VehicleLog.entry_time.desc()
                          ).offset(skip).limit(limit).all()

    return [serialize_log(log) for log in logs]


@router.get("/active", response_model=list[VehicleLogResponse])
async def list_active_logs(
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db),
    limit: int = 200,
):
    """List every vehicle currently on campus (security only).

    Used by the Log Exit tab so the security guard can see who's parked
    inside and clear them out one by one. Includes both registered
    vehicles and visitor entries.
    """
    logs = (
        db.query(VehicleLog)
        .filter(VehicleLog.status == "entered", VehicleLog.exit_time.is_(None))
        .order_by(VehicleLog.entry_time.desc())
        .limit(limit)
        .all()
    )
    return [serialize_log(log) for log in logs]


@router.post("/entry", response_model=VehicleLogResponse, status_code=status.HTTP_201_CREATED)
async def log_vehicle_entry(
    request: VehicleEntryRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Log vehicle entry (security only).

    Two flows are supported:
      * **Registered vehicle** — ``registration_number`` is provided and the
        vehicle is already linked to a driver. The driver's profile and
        active session will pick this up automatically.
      * **Visitor** — ``guest_registration`` (and optionally ``guest_name`` /
        ``guest_group``) is provided because the plate is not yet in the
        system. The log is persisted with no FK to vehicles/drivers.

    In both cases the zone's ``occupied_spaces`` counter is incremented by 1
    so the Admin / Security / Driver dashboards immediately reflect the new
    load.
    """
    # Resolve plate + driver
    plate = _normalize(
        request.registration_number) if request.registration_number else None
    guest_plate = _normalize(
        request.guest_registration) if request.guest_registration else None

    if not plate and not guest_plate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Either registration_number or guest_registration must be provided."
            ),
        )
    if plate and guest_plate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Provide only one of registration_number or guest_registration."
            ),
        )

    vehicle = None
    if plate:
        vehicle = (
            db.query(Vehicle)
            .filter(
                Vehicle.registration_number == plate,
                Vehicle.is_active == True,
            )
            .first()
        )
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Vehicle {plate} is not registered. "
                    "Use the 'Register Vehicle' tab to link it to a driver first, "
                    "or check it in as a visitor by providing guest_registration."
                ),
            )

    # Verify zone
    zone = (
        db.query(ParkingZone)
        .filter(ParkingZone.id == request.parking_zone_id)
        .first()
    )
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found",
        )
    if zone.status == "cordoned" or zone.status == "maintenance":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Zone {zone.zone_name} is {zone.status.value if hasattr(zone.status, 'value') else zone.status} "
                "and cannot accept new entries."
            ),
        )

    # Reject duplicate active session (one vehicle can only be inside once)
    if vehicle:
        existing_active = (
            db.query(VehicleLog)
            .filter(
                VehicleLog.vehicle_id == vehicle.id,
                VehicleLog.status == "entered",
                VehicleLog.exit_time.is_(None),
            )
            .first()
        )
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Vehicle {plate} already has an active entry on "
                    f"{existing_active.entry_time.isoformat()}. "
                    "Log the existing entry out first."
                ),
            )
    elif guest_plate:
        existing_active = (
            db.query(VehicleLog)
            .filter(
                VehicleLog.guest_registration == guest_plate,
                VehicleLog.status == "entered",
                VehicleLog.exit_time.is_(None),
            )
            .first()
        )
        if existing_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Visitor plate {guest_plate} already has an active entry."
                ),
            )

    # Optional parking space: if the security guard didn't pick a specific
    # bay, we auto-pick the next available one in the zone so the
    # zone-occupancy counter (read from `parking_spaces.status='occupied'`
    # by the admin dashboard) ticks up correctly.
    parking_space_id = None
    if request.parking_space_id:
        space = db.query(ParkingSpace).filter(
            ParkingSpace.id == request.parking_space_id
        ).first()
        if not space:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parking space not found",
            )
        if space.status != ParkingSpaceStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Space not available (status: {space.status})",
            )
        parking_space_id = space.id

    # Bump the zone's live `occupied_spaces` counter. The zone is
    # shared across all entries, so we keep a single integer counter
    # in addition to per-space bookkeeping. This is the value the admin
    # dashboard reads.
    if (zone.occupied_spaces or 0) >= zone.total_spaces:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Zone {zone.zone_name} is at full capacity "
                f"({zone.occupied_spaces}/{zone.total_spaces})."
            ),
        )
    zone.occupied_spaces = (zone.occupied_spaces or 0) + 1

    # Create entry log
    log_entry = VehicleLog(
        vehicle_id=vehicle.id if vehicle else None,
        driver_id=vehicle.driver_id if vehicle else None,
        parking_space_id=parking_space_id,
        parking_zone_id=zone.id,
        status="entered",
        entry_time=datetime.utcnow(),
        recorded_by_user_id=current_user.id,
        guest_registration=guest_plate,
        guest_name=(request.guest_name or "").strip() or None,
        guest_group=(request.guest_group or "").strip() or None,
    )

    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    db.refresh(zone)
    # Reload relationships so the serializer can read them.
    db.refresh(log_entry, attribute_names=[
               "vehicle", "driver", "parking_zone"])

    # Notify driver via email and DB notification
    if vehicle and vehicle.driver and vehicle.driver.user:
        try:
            from app.services.notification_service import NotificationService
            await NotificationService.notify_vehicle_entry(
                db=db,
                user=vehicle.driver.user,
                registration_number=plate,
                zone=zone
            )
        except Exception as e:
            logger.error(f"Failed to send vehicle entry notification: {e}")

    logger.info(
        "Vehicle entry logged: %s into %s (occupied now %s/%s) by %s",
        plate or guest_plate,
        zone.zone_name,
        zone.occupied_spaces,
        zone.total_spaces,
        current_user.email,
    )

    return serialize_log(log_entry)


@router.post("/exit", response_model=VehicleLogResponse)
async def log_vehicle_exit(
    request: VehicleExitRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Log vehicle exit (security only).

    Accepts either a real plate (``registration_number``) or a visitor plate
    (``guest_registration``). The matching active log is closed, the
    duration is computed, any assigned parking space is released, and the
    zone's ``occupied_spaces`` counter is decremented by 1.
    """
    plate = _normalize(
        request.registration_number) if request.registration_number else None
    guest_plate = _normalize(
        request.guest_registration) if request.guest_registration else None

    if not plate and not guest_plate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Either registration_number or guest_registration must be provided."
            ),
        )

    vehicle = None
    if plate:
        vehicle = db.query(Vehicle).filter(
            Vehicle.registration_number == plate
        ).first()
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle {plate} not found",
            )

    if vehicle:
        entry_log = (
            db.query(VehicleLog)
            .filter(
                VehicleLog.vehicle_id == vehicle.id,
                VehicleLog.status == "entered",
                VehicleLog.exit_time.is_(None),
            )
            .order_by(VehicleLog.entry_time.desc())
            .first()
        )
    else:
        entry_log = (
            db.query(VehicleLog)
            .filter(
                VehicleLog.guest_registration == guest_plate,
                VehicleLog.status == "entered",
                VehicleLog.exit_time.is_(None),
            )
            .order_by(VehicleLog.entry_time.desc())
            .first()
        )

    if not entry_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No active entry found for "
                f"{'plate ' + plate if plate else 'visitor ' + guest_plate}."
            ),
        )

    # Update entry log with exit
    entry_log.exit_time = datetime.utcnow()
    entry_log.status = "exited"

    # Calculate duration
    if entry_log.entry_time:
        duration = (entry_log.exit_time -
                    entry_log.entry_time).total_seconds() / 60
        entry_log.duration_minutes = int(duration)

    # Release the parking space (if one was assigned) — this is what
    # frees up the bay.
    if entry_log.parking_space_id:
        space = db.query(ParkingSpace).filter(
            ParkingSpace.id == entry_log.parking_space_id
        ).first()
        if space:
            space.status = ParkingSpaceStatus.AVAILABLE
            space.currently_occupied_by_vehicle_id = None

    # Decrement the zone's live `occupied_spaces` counter so the admin
    # dashboard reflects the freed slot.
    if entry_log.parking_zone_id:
        zone = db.query(ParkingZone).filter(
            ParkingZone.id == entry_log.parking_zone_id
        ).first()
        if zone and (zone.occupied_spaces or 0) > 0:
            zone.occupied_spaces = (zone.occupied_spaces or 0) - 1

    db.commit()
    db.refresh(entry_log)
    db.refresh(entry_log, attribute_names=[
               "vehicle", "driver", "parking_zone"])

    # Notify driver via email and DB notification
    if entry_log.vehicle and entry_log.vehicle.driver and entry_log.vehicle.driver.user:
        try:
            from app.services.notification_service import NotificationService
            await NotificationService.notify_vehicle_exit(
                db=db,
                user=entry_log.vehicle.driver.user,
                registration_number=plate,
                duration_minutes=entry_log.duration_minutes or 0
            )
        except Exception as e:
            logger.error(f"Failed to send vehicle exit notification: {e}")

    logger.info(
        "Vehicle exit logged: %s out of zone %s (occupied now %s/%s) by %s",
        plate or guest_plate,
        entry_log.parking_zone_id,
        zone.occupied_spaces if zone else None,
        zone.total_spaces if zone else None,
        current_user.email,
    )

    return serialize_log(entry_log)


@router.get("/driver/{driver_id}", response_model=list[VehicleLogResponse])
async def get_driver_logs(
    driver_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get vehicle entry/exit logs for driver"""

    logs = db.query(VehicleLog).filter(
        VehicleLog.driver_id == driver_id
    ).order_by(VehicleLog.entry_time.desc()).offset(skip).limit(limit).all()

    return [serialize_log(log) for log in logs]


@router.get("/{log_id}", response_model=VehicleLogResponse)
async def get_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get vehicle log details"""

    log = db.query(VehicleLog).filter(VehicleLog.id == log_id).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log not found"
        )

    return serialize_log(log)
