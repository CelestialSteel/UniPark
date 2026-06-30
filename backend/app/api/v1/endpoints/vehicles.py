"""Vehicles Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_driver_user, get_security_user
from app.schemas import VehicleResponse, VehicleCreateRequest, LinkVehicleRequest
from app.models import Vehicle, Driver, User, UserRole
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


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
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
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


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlink_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """Unlink vehicle from driver account (driver)"""
    
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
    
    vehicle.is_active = False
    db.commit()
    
    logger.info(f"Vehicle unlinked: {vehicle.registration_number}")
