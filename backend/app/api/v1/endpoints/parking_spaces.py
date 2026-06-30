"""Parking Spaces Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user
from app.schemas import ParkingSpaceResponse, ParkingSpaceCreateRequest, CordonSpaceRequest
from app.models import ParkingSpace, ParkingZone, User
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/zone/{zone_id}", response_model=list[ParkingSpaceResponse])
async def list_spaces_in_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: str = None
):
    """List parking spaces in a zone"""
    
    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )
    
    query = db.query(ParkingSpace).filter(ParkingSpace.zone_id == zone_id)
    
    if status_filter:
        query = query.filter(ParkingSpace.status == status_filter)
    
    spaces = query.order_by(ParkingSpace.space_number).all()
    return spaces


@router.get("/{space_id}", response_model=ParkingSpaceResponse)
async def get_space(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get parking space details"""
    space = db.query(ParkingSpace).filter(ParkingSpace.id == space_id).first()
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking space not found"
        )
    
    return space


@router.post("", response_model=ParkingSpaceResponse, status_code=status.HTTP_201_CREATED)
async def create_space(
    request: ParkingSpaceCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create parking space (admin only)"""
    
    zone = db.query(ParkingZone).filter(ParkingZone.id == request.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )
    
    # Check if space number already exists in zone
    existing_space = db.query(ParkingSpace).filter(
        ParkingSpace.zone_id == request.zone_id,
        ParkingSpace.space_number == request.space_number
    ).first()
    
    if existing_space:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Space number already exists in this zone"
        )
    
    new_space = ParkingSpace(
        zone_id=request.zone_id,
        space_number=request.space_number,
        status=request.status,
        created_by_user_id=current_user.id
    )
    
    db.add(new_space)
    db.commit()
    db.refresh(new_space)
    
    logger.info(f"Space created: {new_space.space_number} in zone {zone.zone_name}")
    
    return new_space


@router.post("/{space_id}/reserve", response_model=ParkingSpaceResponse)
async def reserve_space(
    space_id: str,
    driver_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Reserve parking space for driver (admin only)"""
    
    space = db.query(ParkingSpace).filter(ParkingSpace.id == space_id).first()
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking space not found"
        )
    
    if space.status != "available":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Space is not available (status: {space.status})"
        )
    
    space.status = "reserved"
    space.reserved_for_user_id = driver_id
    
    db.commit()
    db.refresh(space)
    
    logger.info(f"Space reserved: {space.space_number}")
    
    return space


@router.post("/{space_id}/cordone", response_model=ParkingSpaceResponse)
async def cordone_space(
    space_id: str,
    request: CordonSpaceRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Cordone parking space (admin only)"""
    
    space = db.query(ParkingSpace).filter(ParkingSpace.id == space_id).first()
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking space not found"
        )
    
    if space.status == "occupied":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cordone occupied space"
        )
    
    space.status = "cordoned"
    space.cordoned_reason = request.reason
    
    db.commit()
    db.refresh(space)
    
    logger.info(f"Space cordoned: {space.space_number}")
    
    return space


@router.post("/{space_id}/release", response_model=ParkingSpaceResponse)
async def release_space(
    space_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Release cordoned space (admin only)"""
    
    space = db.query(ParkingSpace).filter(ParkingSpace.id == space_id).first()
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking space not found"
        )
    
    space.status = "available"
    space.cordoned_reason = None
    space.reserved_for_user_id = None
    
    db.commit()
    db.refresh(space)
    
    logger.info(f"Space released: {space.space_number}")
    
    return space
