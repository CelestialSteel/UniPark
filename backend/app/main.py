"""FastAPI Application Entry Point"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import get_settings
from app.core.logger import logger, get_logger
from app.core.database import init_db
from app.core.csrf import CSRFMiddleware
from app.api.v1 import api_router

settings = get_settings()

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle app startup and shutdown"""

    # Startup
    logger.info("Starting UniPark API...")
    if settings.SKIP_DB_INIT:
        logger.warning("Database initialization skipped")
    else:
        try:
            init_db()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    yield

    # Shutdown
    logger.info("Shutting down UniPark API...")


# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add middleware
# Note: FastAPI applies middleware in reverse registration order (last added = outermost).
# Actual request execution order: TrustedHost → CORS → CSRF → route handler
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    # X-CSRF-Token must be in allow_headers so preflight OPTIONS doesn't block it
    allow_headers=[*settings.CORS_ALLOW_HEADERS, "X-CSRF-Token"],
    # Expose it so JS can read it from response headers if needed
    expose_headers=["X-CSRF-Token"],
)
app.add_middleware(CSRFMiddleware)

# Include API routes
app.include_router(api_router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "UniPark API",
        "version": settings.API_VERSION
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to UniPark API",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# Error handlers
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "Internal server error"
        },
    )


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting server on {settings.HOST}:{settings.PORT}")

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
