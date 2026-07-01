"""Infringements Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user, get_security_user
from app.schemas import InfringementCreateRequest, InfringementUpdateRequest, InfringementResponse
from app.models import Infringement, Vehicle, User, UserRole, Notification, NotificationType
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def serialize_infringement(infringement: Infringement) -> dict:
    """Convert an infringement into the frontend display shape."""
    return {
        "id": infringement.id,
        "vehicle_id": infringement.vehicle_id,
        "driver_id": infringement.driver_id,
        "parking_zone_id": infringement.parking_zone_id,
        "infringement_type": infringement.infringement_type,
        "description": infringement.description,
        "severity": infringement.severity,
        "fine_amount": infringement.fine_amount,
        "status": infringement.status,
        "resolution_notes": infringement.resolution_notes,
        "reported_at": infringement.reported_at,
        "processed_at": infringement.processed_at,
        "vehicle_registration": infringement.vehicle.registration_number if infringement.vehicle else None,
        "driver_name": (
            f"{infringement.driver.user.first_name} {infringement.driver.user.last_name}".strip()
            if infringement.driver and infringement.driver.user else None
        ),
        "parking_zone_name": infringement.parking_zone.zone_name if infringement.parking_zone else None,
        "parking_zone_code": infringement.parking_zone.zone_code if infringement.parking_zone else None,
    }


@router.get("", response_model=list[InfringementResponse])
async def list_infringements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
    status_filter: str = None
):
    """List infringements"""
    
    query = db.query(Infringement)
    
    # Drivers can only see their own infringements
    if current_user.role == UserRole.DRIVER:
        from app.models import Driver
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if driver:
            query = query.filter(Infringement.driver_id == driver.id)
    
    if status_filter:
        query = query.filter(Infringement.status == status_filter)
    
    infringements = query.order_by(Infringement.reported_at.desc()).offset(skip).limit(limit).all()
    return [serialize_infringement(infringement) for infringement in infringements]


@router.get("/{infringement_id}", response_model=InfringementResponse)
async def get_infringement(
    infringement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get infringement details"""
    
    infringement = db.query(Infringement).filter(Infringement.id == infringement_id).first()
    
    if not infringement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Infringement not found"
        )
    
    # Drivers can only view their own infringements
    if current_user.role == UserRole.DRIVER:
        from app.models import Driver
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or infringement.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this infringement"
            )
    
    return serialize_infringement(infringement)


@router.post("", response_model=InfringementResponse, status_code=status.HTTP_201_CREATED)
async def report_infringement(
    request: InfringementCreateRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Report infringement (security only)"""
    
    # Verify vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == request.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    infringement = Infringement(
        vehicle_id=request.vehicle_id,
        driver_id=vehicle.driver_id,
        parking_zone_id=request.parking_zone_id,
        infringement_type=request.infringement_type,
        description=request.description,
        severity=request.severity,
        fine_amount=request.fine_amount,
        reported_by_user_id=current_user.id
    )
    
    db.add(infringement)
    db.flush()  # Get the ID without committing
    
    # Create notification for driver
    driver = vehicle.driver
    notification = Notification(
        recipient_user_id=driver.user_id,
        notification_type=NotificationType.INFRINGEMENT,
        title="Parking Infringement Reported",
        message=f"An infringement has been reported for your vehicle {vehicle.registration_number}: {request.infringement_type}",
        related_infringement_id=infringement.id
    )
    
    db.add(notification)
    db.commit()
    db.refresh(infringement)
    
    logger.info(f"Infringement reported: {infringement.infringement_type} for {vehicle.registration_number}")
    
    return serialize_infringement(infringement)


@router.patch("/{infringement_id}", response_model=InfringementResponse)
async def process_infringement(
    infringement_id: str,
    request: InfringementUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Process infringement (admin only)"""
    
    infringement = db.query(Infringement).filter(Infringement.id == infringement_id).first()
    
    if not infringement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Infringement not found"
        )
    
    infringement.status = request.status
    infringement.processed_by_user_id = current_user.id
    infringement.processed_at = datetime.utcnow()
    infringement.resolution_notes = request.resolution_notes
    
    db.commit()
    db.refresh(infringement)
    
    # Create notification for driver
    driver = infringement.driver
    status_message = request.status.value
    notification = Notification(
        recipient_user_id=driver.user_id,
        notification_type=NotificationType.INFRINGEMENT,
        title="Infringement Status Updated",
        message=f"Your infringement has been {status_message}. Reason: {request.resolution_notes}",
        related_infringement_id=infringement.id
    )
    
    db.add(notification)
    db.commit()
    
    logger.info(f"Infringement processed: {infringement_id} - {request.status}")
    
    return infringement


@router.get("/vehicle/{vehicle_id}/active", response_model=list[InfringementResponse])
async def get_vehicle_active_infringements(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active infringements for vehicle"""
    
    infringements = db.query(Infringement).filter(
        Infringement.vehicle_id == vehicle_id,
        Infringement.status.in_(["reported", "under_review"])
    ).order_by(Infringement.reported_at.desc()).all()
    
    return [serialize_infringement(infringement) for infringement in infringements]
