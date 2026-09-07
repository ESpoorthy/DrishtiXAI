"""
User model for authentication and role-based access control
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
import enum
from ..db.base import Base


class UserRole(str, enum.Enum):
    """User roles in the system"""
    HEALTH_WORKER = "health_worker"
    CLINICIAN = "clinician"
    ADMIN = "admin"


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.HEALTH_WORKER)
    is_active = Column(Boolean, default=True)
    facility_name = Column(String, nullable=True)  # Health facility/clinic name
    language_preference = Column(String, default="en")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
