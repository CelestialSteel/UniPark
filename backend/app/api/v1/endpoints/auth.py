"""Authentication Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import hash_password, create_access_token, create_refresh_token, decode_token, verify_password
from app.core.dependencies import get_current_user
from app.core.config import get_settings
from app.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.models import User, Driver, UserRole
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(
    request: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """Register new user"""
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role
    try:
        role = UserRole(request.role.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be: admin, security, or driver"
        )
    
    # Create user
    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        role=role,
        first_name=request.first_name,
        last_name=request.last_name,
        phone_number=request.phone_number
    )
    
    db.add(user)
    db.flush()  # Get the user ID without committing yet
    
    # If driver role, create driver profile
    if role == UserRole.DRIVER:
        driver = Driver(
            user_id=user.id,
            license_number=f"PENDING-{user.id}",
        )
        db.add(driver)
    
    db.commit()
    db.refresh(user)
    
    logger.info(f"New user registered: {user.email} with role {role.value}")
    
    return {
        "message": "User registered successfully",
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role
    }


@router.post("/login")
async def login(
    request: UserLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Login user and set secure HttpOnly cookies"""
    
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=1800,  # 30 minutes
        secure=settings.COOKIE_SECURE,
        samesite="lax"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=604800,  # 7 days
        secure=settings.COOKIE_SECURE,
        samesite="lax"
    )
    
    logger.info(f"User logged in via cookies: {user.email}")
    
    # Return user details without token strings in body
    return {
        "id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role
    }


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token cookie"""
    
    refresh_token_str = request.cookies.get("refresh_token")
    
    if not refresh_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )
    
    try:
        payload = decode_token(refresh_token_str)
        
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid refresh token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Issue new access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=1800,
            secure=settings.COOKIE_SECURE,
            samesite="lax"
        )
        
        logger.info(f"Token refreshed via cookie for: {user.email}")
        return {"status": "refreshed"}
    
    except Exception as e:
        logger.warning(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """Logout user and delete cookies"""
    
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    logger.info(f"User logged out and cookies deleted: {current_user.email}")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user
