"""
Pydantic schemas for user-related API operations
"""
from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    username: str
    password: str
    full_name: str
    role: str = "health_worker"
    facility_name: Optional[str] = None
    language_preference: str = "en"


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class UserResponse(BaseModel):
    """Schema for user response (excludes password)"""
    id: int
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    facility_name: Optional[str] = None
    language_preference: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str
    user: UserResponse

