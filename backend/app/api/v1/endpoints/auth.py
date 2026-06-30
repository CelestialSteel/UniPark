"""Authentication Endpoints"""
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.security import hash_password, create_access_token, create_refresh_token, decode_token, verify_password
from app.core.dependencies import get_current_user
from app.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.models import User, Driver, UserRole
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


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
        driver = Driver(user_id=user.id)
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


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """Login user and return tokens"""
    
    # Find user by email
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
    
    logger.info(f"User logged in: {user.email}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800  # 30 minutes
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: dict,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    
    refresh_token_str = request.get("refresh_token")
    
    if not refresh_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token required"
        )
    
    try:
        payload = decode_token(refresh_token_str)
        
        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            raise ValueError("Not a refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid refresh token")
        
        # Verify user exists and is active
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        logger.info(f"Token refreshed for user: {user.email}")
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,  # Return same refresh token
            "token_type": "bearer",
            "expires_in": 1800
        }
    
    except Exception as e:
        logger.warning(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Logout user (client-side token discard)"""
    
    logger.info(f"User logged out: {current_user.email}")
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    
    return current_user
