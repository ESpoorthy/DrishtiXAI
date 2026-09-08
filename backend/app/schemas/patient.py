"""
Pydantic schemas for patient-related API operations
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class PatientCreate(BaseModel):
    """Schema for creating/registering a new patient"""
    patient_id: str
    full_name: str
    age: int
    gender: str
    phone: Optional[str] = None
    village_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    has_diabetes: Optional[str] = None
    diabetes_duration_years: Optional[int] = None
    has_hypertension: Optional[str] = None
    previous_eye_exam: Optional[str] = None


class PatientResponse(BaseModel):
    """Schema for patient response"""
    id: int
    patient_id: str
    full_name: str
    age: int
    gender: str
    phone: Optional[str] = None
    village_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    has_diabetes: Optional[str] = None
    diabetes_duration_years: Optional[int] = None
    has_hypertension: Optional[str] = None
    previous_eye_exam: Optional[str] = None
    registered_by: int
    facility_name: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

