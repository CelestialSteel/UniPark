"""Pydantic schemas for request/response validation"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


# ==================== AUTH SCHEMAS ====================

class UserRegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str = Field(..., min_length=8,
                          description="Password must be at least 8 characters")
    role: str = Field(default="driver",
                      description="Role: admin, security, or driver")
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    phone_number: Optional[str] = None
    student_or_lecturer_id: Optional[str] = None
    is_lecturer: bool = False

    @field_validator("email")
    @classmethod
    def _validate_organisational_email(cls, value: str) -> str:
        """Restrict sign-ups to the official organisational domain.

        Strathmore staff and students must register with a ``strathmore.edu``
        address. Anything else is rejected with a clear, user-facing message.
        """
        if not value:
            return value
        if not value.lower().endswith("@strathmore.edu"):
            raise ValueError(
                "Please use your organizational email address (must end with @strathmore.edu)."
            )
        return value

    @field_validator("student_or_lecturer_id")
    @classmethod
    def _trim_identifier(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        trimmed = value.strip()
        return trimmed or None


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# ==================== USER SCHEMAS ====================

class UserResponse(BaseModel):
    """User response"""
    id: UUID
    email: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PasswordUpdateRequest(BaseModel):
    """Change password request"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)


class DriverProfileUpdateRequest(BaseModel):
    """Update driver profile request"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    department: Optional[str] = None
    student_id: Optional[str] = None
    faculty_id: Optional[str] = None
    staff_id: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[datetime] = None


class DriverVehicleResponse(BaseModel):
    """Driver vehicle response"""
    id: UUID
    driver_id: UUID
    registration_number: str
    make: str
    model: str
    color: Optional[str] = None
    vehicle_type: Optional[str] = None
    is_primary: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DriverLogResponse(BaseModel):
    """Driver log response"""
    id: UUID
    vehicle_id: UUID
    driver_id: UUID
    parking_space_id: Optional[UUID] = None
    parking_zone_id: UUID
    status: str
    entry_time: datetime
    exit_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    vehicle_registration: Optional[str] = None
    parking_zone_name: Optional[str] = None
    parking_zone_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== VEHICLE SCHEMAS ====================

class VehicleCreateRequest(BaseModel):
    """Create vehicle request"""
    registration_number: str = Field(..., min_length=1)
    make: str
    model: str
    color: Optional[str] = None
    vehicle_type: Optional[str] = None


class LinkVehicleRequest(BaseModel):
    """Link vehicle to driver request"""
    registration_number: str = Field(..., min_length=1)
    is_primary: bool = False


class UnlinkVehicleRequest(BaseModel):
    """Unlink vehicle from driver request"""
    reason: str = Field(..., min_length=1, max_length=120)
    details: Optional[str] = Field(default=None, max_length=500)


class VehicleResponse(BaseModel):
    """Vehicle response"""
    id: UUID
    driver_id: UUID
    registration_number: str
    make: str
    model: str
    color: Optional[str] = None
    vehicle_type: Optional[str] = None
    is_primary: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PARKING ZONE SCHEMAS ====================

class ParkingZoneCreateRequest(BaseModel):
    """Create parking zone request"""
    zone_name: str = Field(..., min_length=1)
    zone_code: str = Field(..., min_length=1)
    description: Optional[str] = None
    location: Optional[str] = None
    total_spaces: int = Field(..., gt=0, description="Must be greater than 0")


class ParkingZoneUpdateRequest(BaseModel):
    """Update parking zone request"""
    zone_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    total_spaces: Optional[int] = Field(None, gt=0)
    status: Optional[str] = None


class ParkingZoneResponse(BaseModel):
    """Parking zone response"""
    id: UUID
    zone_name: str
    zone_code: str
    description: Optional[str] = None
    location: Optional[str] = None
    total_spaces: int
    reserved_spaces: int
    cordoned_spaces: int
    maintenance_spaces: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ZoneOccupancyResponse(BaseModel):
    """Zone occupancy response"""
    zone_id: str
    zone_name: str
    zone_code: str
    total_spaces: int
    occupied_spaces: int
    available_spaces: int
    reserved_spaces: int
    cordoned_spaces: int
    maintenance_spaces: int
    occupancy_percentage: float


# ==================== PARKING SPACE SCHEMAS ====================

class ParkingSpaceCreateRequest(BaseModel):
    """Create parking space request"""
    zone_id: UUID
    space_number: str = Field(..., min_length=1)
    status: str = "available"


class CordonSpaceRequest(BaseModel):
    """Cordone space request"""
    reason: str = Field(..., min_length=1)


class ParkingSpaceResponse(BaseModel):
    """Parking space response"""
    id: UUID
    zone_id: UUID
    space_number: str
    status: str
    reserved_for_user_id: Optional[UUID] = None
    currently_occupied_by_vehicle_id: Optional[UUID] = None
    cordoned_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== VEHICLE LOG SCHEMAS ====================

class VehicleEntryRequest(BaseModel):
    """Vehicle entry request"""
    registration_number: str = Field(..., min_length=1)
    parking_zone_id: UUID
    parking_space_id: Optional[UUID] = None


class VehicleExitRequest(BaseModel):
    """Vehicle exit request"""
    registration_number: str = Field(..., min_length=1)


class VehicleLogResponse(BaseModel):
    """Vehicle log response"""
    id: UUID
    vehicle_id: UUID
    driver_id: UUID
    parking_space_id: Optional[UUID] = None
    parking_zone_id: UUID
    status: str
    entry_time: datetime
    exit_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    vehicle_registration: Optional[str] = None
    driver_name: Optional[str] = None
    parking_zone_name: Optional[str] = None
    parking_zone_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ALERT SCHEMAS ====================

class AlertCreateRequest(BaseModel):
    """Create alert request"""
    parking_zone_id: UUID
    alert_type: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    severity: str = "medium"  # low, medium, high


class AlertResponse(BaseModel):
    """Alert response"""
    id: UUID
    parking_zone_id: UUID
    alert_type: str
    message: str
    severity: str
    is_active: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== NOTIFICATION SCHEMAS ====================

class NotificationResponse(BaseModel):
    """Notification response"""
    id: UUID
    recipient_user_id: UUID
    notification_type: str
    title: str
    message: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PAGINATION SCHEMAS ====================

class PaginationParams(BaseModel):
    """Pagination parameters"""
    skip: int = Field(0, ge=0)
    limit: int = Field(10, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    total: int
    skip: int
    limit: int
    data: List[dict]
