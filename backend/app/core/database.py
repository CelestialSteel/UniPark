"""Database Connection and Session Management"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()

# Create database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,
    connect_args={
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000"  # 30 seconds
    }
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)


@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Set PostgreSQL statement timeout on connection"""
    try:
        cursor = dbapi_conn.cursor()
        cursor.execute("SET statement_timeout=30000")  # 30 seconds
        cursor.close()
    except Exception as e:
        logger.warning(f"Failed to set statement timeout: {e}")


def get_db() -> Session:
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    try:
        # Import all models to ensure they are registered
        from app.models import (
            User, Driver, Vehicle, ParkingZone, ParkingSpace,
            VehicleLog, Alert, Infringement, Notification,
            Reservation, ZoneOccupancyHistory, AuditLog
        )
        
        # Create all tables
        from app.models import Base
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
