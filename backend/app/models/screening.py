"""
Screening model for storing DR screening results
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum, Boolean, ForeignKey
from sqlalchemy.sql import func
import enum
from ..db.base import Base


class EyeSide(str, enum.Enum):
    """Which eye was screened"""
    LEFT = "left"
    RIGHT = "right"


class ImageQuality(str, enum.Enum):
    """Image quality assessment result"""
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    POOR = "poor"


class DRSeverity(int, enum.Enum):
    """Diabetic retinopathy severity levels (standard clinical classification)"""
    NO_DR = 0
    MILD_NPDR = 1
    MODERATE_NPDR = 2
    SEVERE_NPDR = 3
    PROLIFERATIVE_DR = 4


class ReferralPriority(str, enum.Enum):
    """Referral priority for clinical decision support"""
    ROUTINE = "routine"
    PRIORITY = "priority"
    URGENT = "urgent"


class ScreeningStatus(str, enum.Enum):
    """Status of the screening workflow"""
    IMAGE_UPLOADED = "image_uploaded"
    QUALITY_CHECK_FAILED = "quality_check_failed"
    ANALYZED = "analyzed"
    CLINICIAN_REVIEWED = "clinician_reviewed"
    PENDING_SYNC = "pending_sync"


class Screening(Base):
    """
    Screening model - stores the complete screening workflow and results
    This is the core data model for the AI screening pipeline
    """
    __tablename__ = "screenings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Patient and screening metadata
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    eye_side = Column(Enum(EyeSide), nullable=False)
    screening_date = Column(DateTime(timezone=True), server_default=func.now())
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    facility_name = Column(String, nullable=True)
    
    # Image information
    image_path = Column(String, nullable=False)
    image_filename = Column(String, nullable=False)
    
    # Image quality assessment
    image_quality = Column(Enum(ImageQuality), nullable=True)
    quality_score = Column(Float, nullable=True)  # 0.0 to 1.0
    quality_issues = Column(Text, nullable=True)  # JSON string of detected issues
    quality_guidance = Column(Text, nullable=True)  # Guidance for recapture
    
    # AI prediction results
    predicted_severity = Column(Integer, nullable=True)  # 0-4 corresponding to DRSeverity
    prediction_confidence = Column(Float, nullable=True)  # 0.0 to 1.0
    class_probabilities = Column(Text, nullable=True)  # JSON string of all class probabilities
    
    # Model information
    model_version = Column(String, nullable=True)
    is_demo_mode = Column(Boolean, default=True)  # CRITICAL: Mark if prediction is demo
    
    # Explainability
    has_explanation = Column(Boolean, default=False)
    explanation_path = Column(String, nullable=True)  # Path to heatmap image
    attention_regions = Column(Text, nullable=True)  # JSON: regions model focused on
    explanation_summary = Column(Text, nullable=True)  # Human-readable explanation
    
    # Referral decision support
    referral_priority = Column(Enum(ReferralPriority), nullable=True)
    referral_reasoning = Column(Text, nullable=True)
    requires_human_review = Column(Boolean, default=False)
    
    # Clinical review
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_date = Column(DateTime(timezone=True), nullable=True)
    clinician_agrees = Column(Boolean, nullable=True)  # Did clinician agree with AI?
    clinician_severity = Column(Integer, nullable=True)  # Clinician's assessment
    clinician_notes = Column(Text, nullable=True)
    final_referral_priority = Column(Enum(ReferralPriority), nullable=True)
    
    # Workflow status
    status = Column(Enum(ScreeningStatus), nullable=False, default=ScreeningStatus.IMAGE_UPLOADED)
    
    # Offline/sync
    is_synced = Column(Boolean, default=True)
    created_offline = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Screening {self.id}: Patient {self.patient_id} - {self.status}>"
