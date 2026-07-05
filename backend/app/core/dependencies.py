"""FastAPI dependency injection for authentication and authorization"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models import User, UserRole
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT cookie or Authorization header"""
    token = None
    
    # Check cookies first
    if request.cookies.get("access_token"):
        token = request.cookies.get("access_token")
    # Fallback to Authorization Header
    elif credentials:
        token = credentials.credentials
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided"
        )
    
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is inactive"
            )
        
        return user
    
    except Exception as e:
        logger.warning(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )


async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def get_security_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require security officer role"""
    if current_user.role != UserRole.SECURITY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security officer privileges required"
        )
    return current_user


async def get_admin_or_security_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require admin or security officer role"""
    if current_user.role not in (UserRole.ADMIN, UserRole.SECURITY):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or security officer privileges required"
        )
    return current_user


async def get_driver_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Require driver role"""
    if current_user.role != UserRole.DRIVER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver privileges required"
        )
    return current_user
