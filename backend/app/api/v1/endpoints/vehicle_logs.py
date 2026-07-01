"""Vehicle Logs Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_security_user
from app.schemas import VehicleEntryRequest, VehicleExitRequest, VehicleLogResponse
from app.models import Vehicle, VehicleLog, ParkingSpace, ParkingZone, User, UserRole
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def serialize_log(log: VehicleLog) -> dict:
    """Convert a vehicle log into the frontend display shape."""
    return {
        "id": log.id,
        "vehicle_id": log.vehicle_id,
        "driver_id": log.driver_id,
        "parking_space_id": log.parking_space_id,
        "parking_zone_id": log.parking_zone_id,
        "status": log.status,
        "entry_time": log.entry_time,
        "exit_time": log.exit_time,
        "duration_minutes": log.duration_minutes,
        "vehicle_registration": log.vehicle.registration_number if log.vehicle else None,
        "driver_name": (
            f"{log.driver.user.first_name} {log.driver.user.last_name}".strip()
            if log.driver and log.driver.user else None
        ),
        "parking_zone_name": log.parking_zone.zone_name if log.parking_zone else None,
        "parking_zone_code": log.parking_zone.zone_code if log.parking_zone else None,
        "created_at": log.created_at,
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
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if driver:
            query = query.filter(VehicleLog.driver_id == driver.id)

    logs = query.order_by(VehicleLog.entry_time.desc()).offset(skip).limit(limit).all()

    return [serialize_log(log) for log in logs]


@router.post("/entry", response_model=VehicleLogResponse, status_code=status.HTTP_201_CREATED)
async def log_vehicle_entry(
    request: VehicleEntryRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Log vehicle entry (security only)"""
    
    # Find vehicle by registration number
    vehicle = db.query(Vehicle).filter(
        Vehicle.registration_number == request.registration_number,
        Vehicle.is_active == True
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found or inactive"
        )
    
    # Verify zone exists
    zone = db.query(ParkingZone).filter(ParkingZone.id == request.parking_zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )
    
    # Assign parking space if provided
    parking_space_id = None
    if request.parking_space_id:
        space = db.query(ParkingSpace).filter(ParkingSpace.id == request.parking_space_id).first()
        if not space:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parking space not found"
            )
        if space.status != "available":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Space not available (status: {space.status})"
            )
        parking_space_id = space.id
        space.status = "occupied"
        space.currently_occupied_by_vehicle_id = vehicle.id
    
    # Create entry log
    log_entry = VehicleLog(
        vehicle_id=vehicle.id,
        driver_id=vehicle.driver_id,
        parking_space_id=parking_space_id,
        parking_zone_id=zone.id,
        status="entered",
        entry_time=datetime.utcnow(),
        recorded_by_user_id=current_user.id
    )
    
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    
    logger.info(f"Vehicle entry logged: {vehicle.registration_number}")
    
    return log_entry


@router.post("/exit", response_model=VehicleLogResponse)
async def log_vehicle_exit(
    request: VehicleExitRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Log vehicle exit (security only)"""
    
    # Find vehicle
    vehicle = db.query(Vehicle).filter(
        Vehicle.registration_number == request.registration_number
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    # Find active entry log (entered but not exited)
    entry_log = db.query(VehicleLog).filter(
        VehicleLog.vehicle_id == vehicle.id,
        VehicleLog.status == "entered",
        VehicleLog.exit_time.is_(None)
    ).order_by(VehicleLog.entry_time.desc()).first()
    
    if not entry_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active entry found for this vehicle"
        )
    
    # Update entry log with exit
    entry_log.exit_time = datetime.utcnow()
    entry_log.status = "exited"
    
    # Calculate duration
    if entry_log.entry_time:
        duration = (entry_log.exit_time - entry_log.entry_time).total_seconds() / 60
        entry_log.duration_minutes = int(duration)
    
    # Release parking space
    if entry_log.parking_space_id:
        space = db.query(ParkingSpace).filter(
            ParkingSpace.id == entry_log.parking_space_id
        ).first()
        if space:
            space.status = "available"
            space.currently_occupied_by_vehicle_id = None
    
    db.commit()
    db.refresh(entry_log)
    
    logger.info(f"Vehicle exit logged: {vehicle.registration_number}")
    
    return entry_log


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
