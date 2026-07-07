"""Alerts Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_admin_user, get_security_user
from app.schemas import AlertCreateRequest, AlertResponse
from app.models import Alert, ParkingZone, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=list[AlertResponse])
async def list_active_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    zone_id: str = None
):
    """List active alerts"""
    
    query = db.query(Alert).filter(Alert.is_active == True)
    
    if zone_id:
        query = query.filter(Alert.parking_zone_id == zone_id)
    
    alerts = query.order_by(Alert.created_at.desc()).all()
    return alerts


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get alert details"""
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    return alert


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    request: AlertCreateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create alert for zone (admin or security)"""
    
    zone = db.query(ParkingZone).filter(ParkingZone.id == request.parking_zone_id).first()
    
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )
    
    alert = Alert(
        parking_zone_id=request.parking_zone_id,
        alert_type=request.alert_type,
        message=request.message,
        severity=request.severity,
        created_by_user_id=current_user.id
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    logger.info(f"Alert created: {alert.alert_type} for zone {zone.zone_name}")
    
    # Broadcast alert to all active drivers via email and DB notifications
    try:
        from app.services.notification_service import NotificationService
        await NotificationService.notify_alert_broadcast(
            db=db,
            zone=zone,
            alert_type=alert.alert_type,
            alert_message=alert.message,
            zone_context=request.zone_context
        )
    except Exception as e:
        logger.error(f"Failed to broadcast alert notification: {e}")
        
    return alert


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: str,
    resolution_notes: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Resolve alert (admin only)"""
    
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.is_active = False
    alert.resolved_at = datetime.utcnow()
    alert.resolved_notes = resolution_notes
    alert.resolved_by_user_id = current_user.id
    
    db.commit()
    db.refresh(alert)
    
    logger.info(f"Alert resolved: {alert_id}")
    
    return alert


@router.get("/zone/{zone_id}/history", response_model=list[AlertResponse])
async def get_zone_alert_history(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get alert history for zone"""
    
    zone = db.query(ParkingZone).filter(ParkingZone.id == zone_id).first()
    
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking zone not found"
        )
    
    alerts = db.query(Alert).filter(
        Alert.parking_zone_id == zone_id
    ).order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
    
    return alerts
