"""Notifications Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_security_user, get_admin_or_security_user
from app.schemas import NotificationResponse, ContactDriverRequest, ContactDriverResponse
from app.models import Notification, NotificationType, User, UserRole, Vehicle
from app.services.notification_service import NotificationService
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/contact-driver",
    response_model=ContactDriverResponse,
    status_code=status.HTTP_201_CREATED,
)
async def contact_driver(
    payload: ContactDriverRequest,
    current_user: User = Depends(get_security_user),
    db: Session = Depends(get_db),
):
    """Send a quick alert to the driver who owns ``registration_number``.

    Security-only. Looks the plate up in the ``vehicles`` table, follows
    the ``vehicle → driver → user`` chain, and dispatches a notification
    via :class:`NotificationService` (which also fires the email).

    The notification is stored as type ``ALERT`` so it surfaces in the
    driver's notification bell and the admin's alert log.
    """
    plate = (payload.registration_number or "").strip().upper()
    if not plate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A registration plate is required.",
        )

    # 1. Resolve plate → vehicle → driver → user
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.registration_number == plate)
        .first()
    )
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No vehicle is registered with plate {plate}. "
                "Drivers can only be contacted for plates already linked "
                "to an account."
            ),
        )

    driver = vehicle.driver
    if not driver or not driver.user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Vehicle {plate} is not linked to any driver. "
                "It may be a visitor plate or an orphaned record."
            ),
        )

    recipient = driver.user
    full_name = (
        f"{recipient.first_name or ''} {recipient.last_name or ''}"
    ).strip() or recipient.email

    # 2. Dispatch (DB notification + email) via the shared service so the
    #    driver gets the same channels as any other UniPark alert.
    title = (payload.title or "").strip()[:200]
    message = (payload.message or "").strip()[:2000]
    try:
        await NotificationService.notify_user(
            db=db,
            recipient_user=recipient,
            notification_type=NotificationType.ALERT,
            title=title,
            message=message,
        )
    except Exception as exc:
        logger.error(
            f"Failed to dispatch contact-driver notification for plate {plate}: {exc}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not deliver the notification. Please try again.",
        )

    # 3. Re-read the row we just created so we can return its id + timestamp.
    latest = (
        db.query(Notification)
        .filter(Notification.recipient_user_id == recipient.id)
        .order_by(Notification.created_at.desc())
        .first()
    )

    logger.info(
        f"Security user {current_user.email} contacted driver {recipient.email} "
        f"about plate {plate} (notification {latest.id if latest else 'n/a'})"
    )

    return ContactDriverResponse(
        notification_id=latest.id if latest else None,
        recipient_user_id=recipient.id,
        driver_name=full_name,
        driver_email=recipient.email,
        driver_phone=recipient.phone_number,
        title=title,
        message=message,
        sent_at=latest.created_at if latest else datetime.now(timezone.utc),
    )


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 10
):
    """Get user notifications"""

    query = db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id
    )

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(
        Notification.created_at.desc()).offset(skip).limit(limit).all()

    return notifications


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unread notification count"""

    count = db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return {"unread_count": count}


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notification details"""

    notification = db.query(Notification).filter(
        Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Verify user owns this notification
    if notification.recipient_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this notification"
        )

    return notification


@router.post("/{notification_id}/mark-as-read", status_code=status.HTTP_200_OK)
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""

    notification = db.query(Notification).filter(
        Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Verify user owns this notification
    if notification.recipient_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this notification"
        )

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(notification)

    logger.info(f"Notification marked as read: {notification_id}")

    return {"message": "Notification marked as read"}


@router.post("/mark-all-as-read", status_code=status.HTTP_200_OK)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""

    notifications = db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).all()

    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)

    db.commit()

    logger.info(
        f"All notifications marked as read for user: {current_user.id}")

    return {"message": f"Marked {len(notifications)} notifications as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""

    notification = db.query(Notification).filter(
        Notification.id == notification_id).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    # Verify user owns this notification
    if notification.recipient_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this notification"
        )

    db.delete(notification)
    db.commit()

    logger.info(f"Notification deleted: {notification_id}")
