"""Drivers Endpoints"""
from datetime import datetime

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_driver_user, get_admin_user, get_security_user
from app.core.security import hash_password, verify_password
from app.models import Driver, User, UserRole, Vehicle, VehicleLog
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
    full_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip(
    ) or current_user.email

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
        "id": str(log.id) if log.id is not None else None,
        "vehicle_id": str(log.vehicle_id) if log.vehicle_id else None,
        "driver_id": str(log.driver_id) if log.driver_id else None,
        "parking_space_id": str(log.parking_space_id) if log.parking_space_id else None,
        "parking_zone_id": str(log.parking_zone_id) if log.parking_zone_id else None,
        "status": log.status,
        "entry_time": log.entry_time,
        "exit_time": log.exit_time,
        "duration_minutes": log.duration_minutes,
        "vehicle_registration": plate,
        "driver_name": driver_name,
        "parking_zone_name": log.parking_zone.zone_name if log.parking_zone else None,
        "parking_zone_code": log.parking_zone.zone_code if log.parking_zone else None,
        "guest_registration": log.guest_registration,
        "guest_name": log.guest_name,
        "guest_group": log.guest_group,
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


@router.get("/by-admission/{admission_id}", response_model=dict)
async def lookup_driver_by_admission(
    admission_id: str,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db)
):
    """Look up a driver by admission / staff / faculty ID (security only).

    Used by the gate "Register Vehicle" form to confirm that the driver is
    already in the system before linking a freshly-seen plate to them.
    """
    needle = (admission_id or "").strip()
    if not needle:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admission number is required.",
        )

    driver = (
        db.query(Driver)
        .filter(
            (Driver.student_id == needle)
            | (Driver.faculty_id == needle)
            | (Driver.staff_id == needle)
        )
        .first()
    )

    if not driver or not driver.user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No driver is registered with that Admission Number. "
                "Please ask the driver to sign up first."
            ),
        )

    user = driver.user

    # Determine which column the match came from, so the UI can render the
    # right ID label (Student / Lecturer / Staff).
    if driver.student_id == needle:
        id_label = "Student"
    elif driver.faculty_id == needle:
        id_label = "Lecturer"
    elif driver.staff_id == needle:
        id_label = "Staff"
    else:
        id_label = "Driver"

    full_name = (
        f"{user.first_name or ''} {user.last_name or ''}"
    ).strip() or user.email

    return {
        "driver_id": str(driver.id),
        "user_id": str(user.id),
        "name": full_name,
        "email": user.email,
        "phone": user.phone_number,
        "department": driver.department,
        "admission_id": needle,
        "id_label": id_label,
        "is_active": user.is_active,
    }


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

    vehicles = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).order_by(
        Vehicle.is_primary.desc(), Vehicle.created_at.desc()).all()
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
