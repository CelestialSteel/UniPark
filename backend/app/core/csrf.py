"""CSRF protection middleware (Double-Submit Cookie pattern).

How it works:
  1. On *every* response the server sets a random ``csrf_token`` cookie
     that is NOT HttpOnly so JavaScript can read it.
  2. For every state-changing request (POST/PUT/PATCH/DELETE) the client
     must echo that value back in an ``X-CSRF-Token`` header.
  3. The middleware compares cookie ↔ header.  A cross-site attacker can
     include the cookie automatically but cannot read it (SameSite + CORS),
     so they can never supply the matching header.

Endpoints excluded from CSRF enforcement (pre-auth, no cookie yet):
  - POST /api/v1/auth/login
  - POST /api/v1/auth/register
"""
import secrets
import hmac
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import get_settings

settings = get_settings()

# Methods that never mutate state – no CSRF check needed
_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Pre-auth endpoints that cannot yet hold a CSRF cookie
_CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/register",
}

CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
CSRF_TOKEN_BYTES = 32  # 256-bit token


def _new_token() -> str:
    return secrets.token_hex(CSRF_TOKEN_BYTES)


def _tokens_equal(a: str, b: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    return hmac.compare_digest(a, b)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Double-submit CSRF middleware for cookie-authenticated endpoints."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # ------------------------------------------------------------------
        # 1. Decide whether this request needs CSRF validation
        # ------------------------------------------------------------------
        needs_check = (
            request.method not in _SAFE_METHODS
            and request.url.path not in _CSRF_EXEMPT_PATHS
        )

        if needs_check:
            cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
            header_token = request.headers.get(CSRF_HEADER_NAME)

            if not cookie_token or not header_token:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF token missing"},
                )

            if not _tokens_equal(cookie_token, header_token):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF token mismatch"},
                )

        # ------------------------------------------------------------------
        # 2. Forward the request to the next handler
        # ------------------------------------------------------------------
        response: Response = await call_next(request)

        # ------------------------------------------------------------------
        # 3. Refresh / issue the CSRF cookie on every response so the
        #    client always has a fresh token available.
        #    - httponly=False  → JS must be able to read it
        #    - samesite="lax"  → browsers won't send it in cross-site POSTs
        #    - secure mirrors the auth-cookie setting
        # ------------------------------------------------------------------
        existing_token = request.cookies.get(CSRF_COOKIE_NAME)
        token = existing_token if existing_token else _new_token()

        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=token,
            httponly=False,          # JS-readable by design
            samesite="lax",
            secure=settings.COOKIE_SECURE,
            max_age=3600,            # 1 hour – refreshed on every request
            path="/",
        )

        return response
