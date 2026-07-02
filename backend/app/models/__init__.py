"""SQLAlchemy ORM Models"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, Enum, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid
import enum

Base = declarative_base()


def enum_values(enum_class):
    """Store enum values in PostgreSQL instead of Python enum member names."""
    return [member.value for member in enum_class]


class UserRole(str, enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    SECURITY = "security"
    DRIVER = "driver"


class ParkingSpaceStatus(str, enum.Enum):
    """Parking space status"""
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    CORDONED = "cordoned"


class ZoneStatus(str, enum.Enum):
    """Parking zone status"""
    ACTIVE = "active"
    CORDONED = "cordoned"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"


class VehicleEntryStatus(str, enum.Enum):
    """Vehicle entry/exit status"""
    ENTERED = "entered"
    EXITED = "exited"
    DENIED = "denied"


class NotificationType(str, enum.Enum):
    """Notification type"""
    ALERT = "alert"
    SYSTEM = "system"
    RESERVATION = "reservation"


class User(Base):
    """User model"""
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_role", "role"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, values_callable=enum_values), nullable=False, default=UserRole.DRIVER)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone_number = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    vehicles_registered = relationship("Vehicle", foreign_keys="Vehicle.registered_by_user_id")
    notifications = relationship("Notification", back_populates="recipient_user")
    created_zones = relationship("ParkingZone", foreign_keys="ParkingZone.created_by_user_id")
    created_spaces = relationship("ParkingSpace", foreign_keys="ParkingSpace.created_by_user_id")


class Driver(Base):
    """Driver profile model"""
    __tablename__ = "drivers"
    __table_args__ = (
        Index("idx_drivers_user_id", "user_id"),
        Index("idx_drivers_student_id", "student_id"),
        Index("idx_drivers_license_number", "license_number"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    student_id = Column(String(50), nullable=True, unique=True)
    faculty_id = Column(String(50), nullable=True, unique=True)
    staff_id = Column(String(50), nullable=True, unique=True)
    license_number = Column(String(50), nullable=True)
    license_expiry = Column(DateTime, nullable=True)
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="driver_profile")
    vehicles = relationship("Vehicle", back_populates="driver")
    vehicle_logs = relationship("VehicleLog", back_populates="driver")


class Vehicle(Base):
    """Vehicle model"""
    __tablename__ = "vehicles"
    __table_args__ = (
        Index("idx_vehicles_registration_number", "registration_number"),
        Index("idx_vehicles_driver_id", "driver_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="CASCADE"))
    registration_number = Column(String(50), nullable=False, unique=True)
    make = Column(String(100))
    model = Column(String(100))
    color = Column(String(50))
    vehicle_type = Column(String(50))
    registered_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    driver = relationship("Driver", back_populates="vehicles")
    vehicle_logs = relationship("VehicleLog", back_populates="vehicle")


class ParkingZone(Base):
    """Parking zone model"""
    __tablename__ = "parking_zones"
    __table_args__ = (
        Index("idx_zones_zone_code", "zone_code"),
        Index("idx_zones_status", "status"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_name = Column(String(100), nullable=False)
    zone_code = Column(String(20), nullable=False, unique=True)
    description = Column(Text)
    location = Column(String(200))
    total_spaces = Column(Integer, nullable=False)
    reserved_spaces = Column(Integer, default=0)
    cordoned_spaces = Column(Integer, default=0)
    maintenance_spaces = Column(Integer, default=0)
    status = Column(Enum(ZoneStatus, values_callable=enum_values), default=ZoneStatus.ACTIVE)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    spaces = relationship("ParkingSpace", back_populates="zone", cascade="all, delete-orphan")
    vehicle_logs = relationship("VehicleLog", back_populates="parking_zone")
    alerts = relationship("Alert", back_populates="parking_zone")
    occupancy_history = relationship("ZoneOccupancyHistory", back_populates="parking_zone")


class ParkingSpace(Base):
    """Parking space model"""
    __tablename__ = "parking_spaces"
    __table_args__ = (
        Index("idx_spaces_zone_id", "zone_id"),
        Index("idx_spaces_status", "status"),
        Index("idx_spaces_zone_space", "zone_id", "space_number"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("parking_zones.id", ondelete="CASCADE"))
    space_number = Column(String(20), nullable=False)
    status = Column(Enum(ParkingSpaceStatus, values_callable=enum_values), default=ParkingSpaceStatus.AVAILABLE)
    reserved_for_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    currently_occupied_by_vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    cordoned_reason = Column(Text)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    zone = relationship("ParkingZone", back_populates="spaces")
    vehicle_logs = relationship("VehicleLog", back_populates="parking_space")


class VehicleLog(Base):
    """Vehicle entry/exit log"""
    __tablename__ = "vehicle_logs"
    __table_args__ = (
        Index("idx_logs_vehicle_id", "vehicle_id"),
        Index("idx_logs_driver_id", "driver_id"),
        Index("idx_logs_entry_time", "entry_time"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"))
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"))
    parking_space_id = Column(UUID(as_uuid=True), ForeignKey("parking_spaces.id"), nullable=True)
    parking_zone_id = Column(UUID(as_uuid=True), ForeignKey("parking_zones.id"))
    status = Column(Enum(VehicleEntryStatus, values_callable=enum_values), default=VehicleEntryStatus.ENTERED)
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    recorded_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="vehicle_logs")
    driver = relationship("Driver", back_populates="vehicle_logs")
    parking_space = relationship("ParkingSpace", back_populates="vehicle_logs")
    parking_zone = relationship("ParkingZone", back_populates="vehicle_logs")


class Alert(Base):
    """Zone alert model"""
    __tablename__ = "alerts"
    __table_args__ = (
        Index("idx_alerts_zone_id", "parking_zone_id"),
        Index("idx_alerts_active", "is_active"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parking_zone_id = Column(UUID(as_uuid=True), ForeignKey("parking_zones.id"))
    alert_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20))  # low, medium, high
    is_active = Column(Boolean, default=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_notes = Column(Text)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    resolved_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parking_zone = relationship("ParkingZone", back_populates="alerts")


class Notification(Base):
    """User notification model"""
    __tablename__ = "notifications"
    __table_args__ = (
        Index("idx_notifications_recipient_id", "recipient_user_id"),
        Index("idx_notifications_read", "is_read"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    notification_type = Column(Enum(NotificationType, values_callable=enum_values), default=NotificationType.SYSTEM)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    recipient_user = relationship("User", back_populates="notifications")


class Reservation(Base):
    """Parking space reservation model"""
    __tablename__ = "reservations"
    __table_args__ = (
        Index("idx_reservations_driver_id", "driver_id"),
        Index("idx_reservations_space_id", "parking_space_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"))
    parking_space_id = Column(UUID(as_uuid=True), ForeignKey("parking_spaces.id"))
    reservation_date = Column(DateTime, nullable=False)
    expiry_time = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ZoneOccupancyHistory(Base):
    """Zone occupancy history tracking"""
    __tablename__ = "zone_occupancy_history"
    __table_args__ = (
        Index("idx_occupancy_zone_id", "parking_zone_id"),
        Index("idx_occupancy_timestamp", "recorded_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parking_zone_id = Column(UUID(as_uuid=True), ForeignKey("parking_zones.id"))
    total_spaces = Column(Integer)
    occupied_spaces = Column(Integer)
    available_spaces = Column(Integer)
    occupancy_percentage = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parking_zone = relationship("ParkingZone", back_populates="occupancy_history")


class AuditLog(Base):
    """System audit log model"""
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_user_id", "user_id"),
        Index("idx_audit_timestamp", "timestamp"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    changes = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
