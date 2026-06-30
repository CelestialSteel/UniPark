"""Logging configuration"""
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from app.core.config import get_settings

settings = get_settings()

# Create logs directory if it doesn't exist
log_dir = Path(settings.LOG_DIR)
log_dir.mkdir(exist_ok=True)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))

# Remove existing handlers to avoid duplicates
root_logger.handlers.clear()

# Create formatters
detailed_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

simple_formatter = logging.Formatter(
    '%(levelname)s: %(message)s'
)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
console_handler.setFormatter(simple_formatter)
root_logger.addHandler(console_handler)

# File handler with rotation
file_handler = RotatingFileHandler(
    log_dir / settings.LOG_FILE,
    maxBytes=settings.LOG_MAX_SIZE,
    backupCount=settings.LOG_BACKUP_COUNT
)
file_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
file_handler.setFormatter(detailed_formatter)
root_logger.addHandler(file_handler)

# Configure specific loggers to reduce noise
for noisy_logger in ["sqlalchemy.engine", "sqlalchemy.pool", "uvicorn.access"]:
    logging.getLogger(noisy_logger).setLevel(logging.WARNING)

# Get app logger
logger = logging.getLogger(__name__)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return logging.getLogger(name)
