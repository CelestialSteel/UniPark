"""Drivers Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_driver_user, get_admin_user
from app.models import Driver, User, UserRole
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


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
    
    return {
        "driver_id": str(driver.id),
        "user_id": str(driver.user_id),
        "email": current_user.email,
        "name": f"{current_user.first_name} {current_user.last_name}",
        "student_id": driver.student_id,
        "faculty_id": driver.faculty_id,
        "staff_id": driver.staff_id,
        "license_number": driver.license_number,
        "license_expiry": driver.license_expiry.isoformat() if driver.license_expiry else None,
        "department": driver.department,
        "active_vehicles": len([v for v in driver.vehicles if v.is_active])
    }


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
