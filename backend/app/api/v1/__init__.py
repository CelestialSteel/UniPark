"""API v1 Router Configuration"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, drivers, vehicles, parking_zones,
    parking_spaces, vehicle_logs, alerts, notifications
)

# Create main API router
api_router = APIRouter(prefix="/api/v1", tags=["API v1"])

# Include routers with prefixes and tags
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(drivers.router, prefix="/drivers", tags=["Drivers"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["Vehicles"])
api_router.include_router(parking_zones.router, prefix="/zones", tags=["Parking Zones"])
api_router.include_router(parking_spaces.router, prefix="/spaces", tags=["Parking Spaces"])
api_router.include_router(vehicle_logs.router, prefix="/logs", tags=["Vehicle Logs"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
