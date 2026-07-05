"""Security utilities for authentication and encryption"""
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    
    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    except Exception as e:
        logger.error(f"Failed to create access token: {e}")
        raise


def create_refresh_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    try:
        encoded_jwt = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    except Exception as e:
        logger.error(f"Failed to create refresh token: {e}")
        raise


def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"Invalid token: {e}")
        raise


def verify_token_type(token: str, expected_type: str) -> dict:
    """Decode token and verify it's the expected type"""
    payload = decode_token(token)
    
    if payload.get("type") != expected_type:
        logger.warning(f"Invalid token type. Expected {expected_type}, got {payload.get('type')}")
        raise ValueError(f"Invalid token type")
    
    return payload


def get_user_id_from_token(token: str) -> str:
    """Extract user ID from token"""
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("No user ID in token")
        return user_id
    except JWTError:
        raise


def create_password_reset_token(user_id: str) -> str:
    """Create a short-lived password-reset JWT (type: 'password_reset')"""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": user_id, "type": "password_reset", "exp": expire}
    try:
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    except Exception as e:
        logger.error(f"Failed to create password reset token: {e}")
        raise


def verify_password_reset_token(token: str) -> str:
    """Decode a password-reset JWT and return the user_id string.

    Raises jose.JWTError on any validation failure (expired, bad signature,
    wrong type), so callers can catch a single exception type.
    """
    from jose import JWTError as _JWTError
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except Exception as e:
        logger.warning(f"Password reset token validation failed: {e}")
        raise _JWTError(str(e))

    if payload.get("type") != "password_reset":
        logger.warning("Password reset token has wrong type")
        raise _JWTError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise _JWTError("Token missing subject")

    return user_id
