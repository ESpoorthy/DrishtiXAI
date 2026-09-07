"""
Core configuration settings for DrishtiXAI
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "DrishtiXAI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./drishti_dev.db"
    
    # Storage
    UPLOAD_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png"]
    
    # ML Models
    MODEL_PATH: str = "./models"
    DEMO_MODE: bool = True
    MODEL_VERSION: str = "v1.0.0-demo"
    CONFIDENCE_THRESHOLD: float = 0.7
    QUALITY_THRESHOLD: float = 0.6
    
    # Referral thresholds
    URGENT_REFERRAL_SEVERITY: int = 3  # Severe NPDR or higher
    PRIORITY_REFERRAL_SEVERITY: int = 2  # Moderate NPDR or higher
    LOW_CONFIDENCE_THRESHOLD: float = 0.6  # Below this requires human review
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"
    
    # Offline/Sync
    ENABLE_OFFLINE_MODE: bool = True
    SYNC_INTERVAL_MS: int = 60000
    
    # Admin defaults (CHANGE IN PRODUCTION!)
    ADMIN_EMAIL: str = "admin@drishti.local"
    ADMIN_PASSWORD: str = "change-me-in-production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
