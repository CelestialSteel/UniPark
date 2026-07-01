"""Drivers Endpoints"""
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_driver_user, get_admin_user
from app.core.security import hash_password, verify_password
from app.models import Driver, User, UserRole, Vehicle, VehicleLog, Infringement
from app.schemas import (
    DriverProfileUpdateRequest,
    PasswordUpdateRequest,
    DriverVehicleResponse,
    DriverLogResponse,
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def serialize_driver_profile(driver: Driver, current_user: User) -> dict:
    """Convert a driver profile into the frontend display shape."""
    full_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email

    return {
        "driver_id": str(driver.id),
        "user_id": str(driver.user_id),
        "email": current_user.email,
        "name": full_name,
        "phone": current_user.phone_number,
        "student_id": driver.student_id,
        "faculty_id": driver.faculty_id,
        "staff_id": driver.staff_id,
        "license_number": driver.license_number,
        "license_expiry": driver.license_expiry.isoformat() if driver.license_expiry else None,
        "department": driver.department,
        "active_vehicles": len([vehicle for vehicle in driver.vehicles if vehicle.is_active]),
        "is_active": current_user.is_active,
    }


def serialize_vehicle(vehicle: Vehicle) -> dict:
    """Convert a vehicle into the frontend display shape."""
    return {
        "id": str(vehicle.id),
        "driver_id": str(vehicle.driver_id),
        "registration_number": vehicle.registration_number,
        "make": vehicle.make,
        "model": vehicle.model,
        "color": vehicle.color,
        "vehicle_type": vehicle.vehicle_type,
        "is_primary": vehicle.is_primary,
        "is_active": vehicle.is_active,
        "created_at": vehicle.created_at,
    }


def serialize_driver_log(log: VehicleLog) -> dict:
    """Convert a driver log into the frontend display shape."""
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
        "parking_zone_name": log.parking_zone.zone_name if log.parking_zone else None,
        "parking_zone_code": log.parking_zone.zone_code if log.parking_zone else None,
        "created_at": log.created_at,
    }


@router.get("/profile", response_model=dict)
async def get_driver_profile(
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """Get driver profile"""
    
    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )
    
    return serialize_driver_profile(driver, current_user)


@router.patch("/profile", response_model=dict)
async def update_driver_profile(
    request: DriverProfileUpdateRequest,
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """Update the current driver's profile."""

    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )

    if request.first_name is not None:
        current_user.first_name = request.first_name.strip()
    if request.last_name is not None:
        current_user.last_name = request.last_name.strip()
    if request.phone_number is not None:
        current_user.phone_number = request.phone_number.strip()
    if request.department is not None:
        driver.department = request.department.strip()
    if request.student_id is not None:
        driver.student_id = request.student_id.strip() or None
    if request.faculty_id is not None:
        driver.faculty_id = request.faculty_id.strip() or None
    if request.staff_id is not None:
        driver.staff_id = request.staff_id.strip() or None
    if request.license_number is not None:
        driver.license_number = request.license_number.strip() or None
    if request.license_expiry is not None:
        driver.license_expiry = request.license_expiry

    db.commit()
    db.refresh(current_user)
    db.refresh(driver)

    logger.info(f"Driver profile updated: {current_user.email}")

    return serialize_driver_profile(driver, current_user)


@router.get("/vehicles", response_model=list[DriverVehicleResponse])
async def list_driver_vehicles(
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """List vehicles linked to the current driver."""

    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )

    vehicles = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).order_by(Vehicle.is_primary.desc(), Vehicle.created_at.desc()).all()
    return [serialize_vehicle(vehicle) for vehicle in vehicles]


@router.get("/logs", response_model=list[DriverLogResponse])
async def list_driver_logs(
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """List logs for the authenticated driver."""

    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )

    logs = (
        db.query(VehicleLog)
        .filter(VehicleLog.driver_id == driver.id)
        .order_by(VehicleLog.entry_time.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [serialize_driver_log(log) for log in logs]


@router.get("/infringements", response_model=list[dict])
async def list_driver_infringements(
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """List infringements for the authenticated driver."""

    driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()

    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )

    infringements = (
        db.query(Infringement)
        .filter(Infringement.driver_id == driver.id)
        .order_by(Infringement.reported_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        {
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
            "driver_name": f"{infringement.driver.user.first_name or ''} {infringement.driver.user.last_name or ''}".strip() if infringement.driver and infringement.driver.user else None,
            "parking_zone_name": infringement.parking_zone.zone_name if infringement.parking_zone else None,
            "parking_zone_code": infringement.parking_zone.zone_code if infringement.parking_zone else None,
        }
        for infringement in infringements
    ]


@router.patch("/password", status_code=status.HTTP_200_OK)
async def update_driver_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_driver_user),
    db: Session = Depends(get_db)
):
    """Update the current driver's password."""

    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.password_hash = hash_password(request.new_password)
    current_user.updated_at = datetime.utcnow()

    db.commit()

    logger.info(f"Driver password updated: {current_user.email}")

    return {"message": "Password updated successfully"}


@router.get("/{driver_id}", response_model=dict)
async def get_driver(
    driver_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get driver details (admin only or self)"""
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    # Only admin or the driver themselves can view
    if current_user.role != UserRole.ADMIN and driver.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this driver"
        )
    
    user = driver.user
    return {
        "driver_id": str(driver.id),
        "user_id": str(driver.user_id),
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}",
        "phone": user.phone_number,
        "student_id": driver.student_id,
        "faculty_id": driver.faculty_id,
        "staff_id": driver.staff_id,
        "license_number": driver.license_number,
        "license_expiry": driver.license_expiry.isoformat() if driver.license_expiry else None,
        "department": driver.department,
        "active_vehicles": len([v for v in driver.vehicles if v.is_active]),
        "is_active": user.is_active
    }


@router.get("", response_model=list[dict])
async def list_drivers(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """List all drivers (admin only)"""
    
    drivers = db.query(Driver).offset(skip).limit(limit).all()
    
    result = []
    for driver in drivers:
        user = driver.user
        result.append({
            "driver_id": str(driver.id),
            "user_id": str(driver.user_id),
            "email": user.email,
            "name": f"{user.first_name} {user.last_name}",
            "student_id": driver.student_id,
            "faculty_id": driver.faculty_id,
            "staff_id": driver.staff_id,
            "license_number": driver.license_number,
            "department": driver.department,
            "is_active": user.is_active
        })
    
    return result


@router.patch("/{driver_id}/suspend", status_code=status.HTTP_200_OK)
async def suspend_driver(
    driver_id: str,
    reason: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Suspend driver (admin only)"""
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    driver.user.is_active = False
    db.commit()
    
    logger.info(f"Driver suspended: {driver.user.email} - Reason: {reason}")
    
    return {"message": "Driver suspended successfully"}


@router.patch("/{driver_id}/activate", status_code=status.HTTP_200_OK)
async def activate_driver(
    driver_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Activate driver (admin only)"""
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )
    
    driver.user.is_active = True
    db.commit()
    
    logger.info(f"Driver activated: {driver.user.email}")
    
    return {"message": "Driver activated successfully"}
