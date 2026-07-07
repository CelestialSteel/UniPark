# -*- coding: utf-8 -*-
"""Notification Service to handle DB insertion and email dispatch"""
import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

EAT = ZoneInfo("Africa/Nairobi")
from sqlalchemy.orm import Session
from fastapi.concurrency import run_in_threadpool
from app.models import Notification, NotificationType, User, UserRole, ParkingSpace, ParkingZone
from app.core.email import send_notification_email
from uuid import UUID

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def create_db_notification(
        db: Session,
        recipient_user_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str
    ) -> Notification:
        """Create and save a notification in the database."""
        notification = Notification(
            recipient_user_id=recipient_user_id,
            notification_type=notification_type,
            title=title,
            message=message
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    async def notify_user(
        db: Session,
        recipient_user: User,
        notification_type: NotificationType,
        title: str,
        message: str
    ) -> None:
        """Create a notification in DB and dispatch email asynchronously."""
        # 1. Create DB entry
        NotificationService.create_db_notification(
            db=db,
            recipient_user_id=recipient_user.id,
            notification_type=notification_type,
            title=title,
            message=message
        )

        # 2. Dispatch Email
        if recipient_user.email:
            try:
                await run_in_threadpool(
                    send_notification_email,
                    recipient_user.email,
                    f"UniPark Notification â€” {title}",
                    title,
                    message
                )
            except Exception as e:
                logger.error(
                    f"Failed to dispatch email to {recipient_user.email}: {e}")

    @staticmethod
    async def notify_reservation(
        db: Session,
        driver_user_id: str,
        space: ParkingSpace,
        zone: ParkingZone
    ) -> None:
        """Notify driver that a parking space has been reserved for them."""
        # Find driver user
        user = db.query(User).filter(User.id == driver_user_id).first()
        if not user:
            logger.warning(
                f"No user found for reservation notification: {driver_user_id}")
            return

        title = "Parking Space Reserved"
        message = (
            f"Hello {user.first_name or 'Driver'},\n\n"
            f"An administrator has reserved a parking space for you.\n\n"
            f" Parking Zone: {zone.zone_name} (Code: {zone.zone_code})\n"
            f" Space Number: {space.space_number}\n\n"
            f"Please proceed to your reserved spot upon arrival."
        )

        await NotificationService.notify_user(
            db=db,
            recipient_user=user,
            notification_type=NotificationType.RESERVATION,
            title=title,
            message=message
        )

    @staticmethod
    async def notify_alert_broadcast(
        db: Session,
        zone: ParkingZone,
        alert_type: str,
        alert_message: str,
        zone_context: str | None = None
    ) -> None:
        """Broadcast alert to all active drivers on campus.

        The alert's title is what the admin typed as ``alert_type`` and the
        body is what the admin typed as ``message``. If the admin included
        the zone name inline we keep that as-is. If not (``zone_context``
        was supplied by the API) we prepend a one-line context so the
        driver knows which zone the alert refers to.
        """
        drivers = db.query(User).filter(
            User.role == UserRole.DRIVER, User.is_active == True
        ).all()

        title = alert_type
        message = alert_message
        if zone_context:
            message = f"{zone_context}\n\n{message}"

        for driver in drivers:
            await NotificationService.notify_user(
                db=db,
                recipient_user=driver,
                notification_type=NotificationType.ALERT,
                title=title,
                message=message
            )

    @staticmethod
    async def notify_vehicle_entry(
        db: Session,
        user: User,
        registration_number: str,
        zone: ParkingZone
    ) -> None:
        """Notify driver that their registered vehicle has entered the campus."""
        title = "Vehicle Entry Logged"
        message = (
            f"Hello {user.first_name or 'Driver'},\n\n"
            f"Your registered vehicle (Plate: {registration_number}) has entered the campus.\n\n"
            f"  • Zone: {zone.zone_name}\n"
            f"  • Time: {datetime.now(EAT).strftime('%Y-%m-%d %H:%M:%S')} EAT\n\n"
            f"Drive safely!"
        )

        await NotificationService.notify_user(
            db=db,
            recipient_user=user,
            notification_type=NotificationType.SYSTEM,
            title=title,
            message=message
        )

    @staticmethod
    async def notify_vehicle_exit(
        db: Session,
        user: User,
        registration_number: str,
        duration_minutes: int
    ) -> None:
        """Notify driver that their vehicle has exited the campus."""
        title = "Vehicle Exit Logged"
        message = (
            f"Hello {user.first_name or 'Driver'},\n\n"
            f"Your vehicle (Plate: {registration_number}) has exited the campus.\n\n"
            f"  • Duration: {duration_minutes} minutes\n"
            f"  • Time: {datetime.now(EAT).strftime('%Y-%m-%d %H:%M:%S')} EAT\n\n"
            f"Thank you for using UniPark!"
        )

        await NotificationService.notify_user(
            db=db,
            recipient_user=user,
            notification_type=NotificationType.SYSTEM,
            title=title,
            message=message
        )
