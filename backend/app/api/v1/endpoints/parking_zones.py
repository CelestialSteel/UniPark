"""Parking Zones Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.schemas import (
    ParkingZoneCreateRequest, ParkingZoneUpdateRequest, ParkingZoneResponse,
    ZoneOccupancyResponse
)
from app.models import ParkingZone, User, ParkingSpace, ZoneStatus
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[ParkingZoneResponse])
async def list_zones(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """List all active parking zones"""
    zones = db.query(ParkingZone).filter(
        ParkingZone.status != ZoneStatus.MAINTENANCE
    ).offset(skip).limit(limit).all()
    return zones


@router.get("/occupancy", response_model=list[ZoneOccupancyResponse])
async def get_zones_occupancy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get occupancy status for all zones.

    The `occupied_spaces` counter is maintained by the /api/v1/logs/entry
    and /api/v1/logs/exit endpoints, so the values returned here always
    reflect the live state.
    """
    zones = db.query(ParkingZone).all()

    result = []
    for zone in zones:
        occupied = zone.occupied_spaces or 0
        available = max(0, zone.total_spaces - occupied - zone.reserved_spaces -
                        zone.cordoned_spaces - zone.maintenance_spaces)
        occupancy_pct = (occupied / zone.total_spaces *
                         100) if zone.total_spaces > 0 else 0

        result.append(ZoneOccupancyResponse(
            zone_id=str(zone.id),
            zone_name=zone.zone_name,
            zone_code=zone.zone_code,
            total_spaces=zone.total_spaces,
            occupied_spaces=occupied,
            available_spaces=available,
            reserved_spaces=zone.reserved_spaces,
            cordoned_spaces=zone.cordoned_spaces,
            maintenance_spaces=zone.maintenance_spaces,
            occupancy_percentage=round(occupancy_pct, 2)
        ))

    return result


@router.get("/{zone_id}", response_model=ParkingZoneResponse)
async def get_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get parking zone details"""
    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )

    return zone


@router.post("", response_model=ParkingZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_zone(
    request: ParkingZoneCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create new parking zone (admin only)"""

    # Check if zone code already exists
    existing_zone = db.query(ParkingZone).filter(
        ParkingZone.zone_code == request.zone_code
    ).first()

    if existing_zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zone code already exists"
        )

    new_zone = ParkingZone(
        zone_name=request.zone_name,
        zone_code=request.zone_code,
        description=request.description,
        location=request.location,
        total_spaces=request.total_spaces,
        created_by_user_id=current_user.id
    )

    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)

    logger.info(f"Zone created: {new_zone.zone_name} ({new_zone.zone_code})")

    return new_zone


@router.patch("/{zone_id}", response_model=ParkingZoneResponse)
async def update_zone(
    zone_id: str,
    request: ParkingZoneUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update parking zone (admin only)"""

    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )

    # Update fields if provided
    if request.zone_name:
        zone.zone_name = request.zone_name
    if request.description is not None:
        zone.description = request.description
    if request.location:
        zone.location = request.location
    if request.total_spaces:
        zone.total_spaces = request.total_spaces
    if request.status:
        zone.status = request.status

    db.commit()
    db.refresh(zone)

    logger.info(f"Zone updated: {zone.zone_name}")

    return zone


@router.post("/{zone_id}/cordone", response_model=ParkingZoneResponse)
async def cordone_zone(
    zone_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Cordone entire parking zone (admin only)"""

    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )

    zone.status = ZoneStatus.CORDONED

    # Mark all spaces in zone as cordoned
    spaces = db.query(ParkingSpace).filter(
        ParkingSpace.zone_id == zone_id).all()
    for space in spaces:
        if space.status != "occupied":
            space.status = "cordoned"
            space.cordoned_reason = "Zone cordoned"

    db.commit()
    db.refresh(zone)

    logger.info(f"Zone cordoned: {zone.zone_name}")

    return zone


@router.post("/{zone_id}/release", response_model=ParkingZoneResponse)
async def release_zone(
    zone_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Release cordoned parking zone (admin only)"""

    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )

    zone.status = ZoneStatus.ACTIVE

    # Mark all cordoned spaces as available
    spaces = db.query(ParkingSpace).filter(
        ParkingSpace.zone_id == zone_id,
        ParkingSpace.status == "cordoned"
    ).all()
    for space in spaces:
        space.status = "available"
        space.cordoned_reason = None

    db.commit()
    db.refresh(zone)

    logger.info(f"Zone released: {zone.zone_name}")

    return zone


@router.post("/{zone_id}/reserve", response_model=dict, status_code=status.HTTP_201_CREATED)
async def bulk_reserve_zone_spaces(
    zone_id: str,
    event_name: str,
    num_spaces: int = 5,
    event_date: str = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Bulk-reserve N available spaces in a zone for an event (admin only).

    Returns a summary of the reservation with an aggregated ID list.
    """
    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking zone not found")

    available_spaces = (
        db.query(ParkingSpace)
        .filter(ParkingSpace.zone_id == zone_id, ParkingSpace.status == "available")
        .limit(num_spaces)
        .all()
    )

    if len(available_spaces) < num_spaces:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {len(available_spaces)} spaces available (requested {num_spaces})"
        )

    space_ids = []
    for space in available_spaces:
        space.status = "reserved"
        space.cordoned_reason = event_name  # reuse cordoned_reason as event label
        space_ids.append(str(space.id))

    zone.reserved_spaces = (zone.reserved_spaces or 0) + num_spaces

    db.commit()
    db.refresh(zone)

    logger.info(f"Bulk reserved {num_spaces} spaces in {zone.zone_name} for '{event_name}'")

    from datetime import date as _date
    return {
        "id": f"res-{zone_id}-{event_name[:8]}",
        "zone": zone.zone_name,
        "zone_id": zone_id,
        "event": event_name,
        "date": event_date or str(_date.today()),
        "spaces": num_spaces,
        "space_ids": space_ids,
        "status": "Approved",
    }
