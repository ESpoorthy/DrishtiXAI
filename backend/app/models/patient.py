"""
Patient model for storing patient information
"""
from sqlalchemy import Column, Integer, String, Date, Enum, DateTime
from sqlalchemy.sql import func
import enum
from ..db.base import Base


class Gender(str, enum.Enum):
    """Patient gender"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class Patient(Base):
    """Patient model - stores minimal required information"""
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic information
    patient_id = Column(String, unique=True, index=True, nullable=False)  # Facility-assigned ID
    full_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(Enum(Gender), nullable=False)
    
    # Contact (optional for rural areas)
    phone = Column(String, nullable=True)
    village_name = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    
    # Medical history (optional, for risk stratification)
    has_diabetes = Column(String, nullable=True)  # Yes/No/Unknown
    diabetes_duration_years = Column(Integer, nullable=True)
    has_hypertension = Column(String, nullable=True)
    previous_eye_exam = Column(String, nullable=True)
    
    # Metadata
    registered_by = Column(Integer, nullable=False)  # User ID who registered
    facility_name = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Patient {self.patient_id}: {self.full_name}>"
