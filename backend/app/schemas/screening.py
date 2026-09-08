"""
Pydantic schemas for screening-related API operations
"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, List


class ScreeningCreate(BaseModel):
    """Schema for creating a new screening."""
    patient_id: int
    eye_side: str  # "left" or "right"


class ImageQualityResult(BaseModel):
    """Schema for image quality assessment result."""
    quality: str  # "good", "acceptable", "poor"
    quality_score: float
    issues: List[str]
    guidance: Optional[str] = None
    can_proceed: bool


class PredictionResult(BaseModel):
    """Schema for AI prediction result."""
    severity: int  # 0-4
    severity_label: str
    confidence: float
    class_probabilities: Dict[str, float]
    model_version: str
    is_demo_mode: bool
    requires_human_review: bool

    model_config = ConfigDict(protected_namespaces=())


class ExplanationResult(BaseModel):
    """Schema for explainability result."""
    has_explanation: bool
    explanation_image_url: Optional[str] = None
    attention_regions: Optional[List[str]] = None
    summary: str


class ReferralResult(BaseModel):
    """Schema for referral decision support."""
    priority: str  # "routine", "priority", "urgent"
    reasoning: str


class ScreeningResponse(BaseModel):
    """Schema for complete screening response."""
    id: int
    patient_id: int
    eye_side: str
    screening_date: datetime
    performed_by: int
    image_filename: str
    image_path: Optional[str] = None  # stored path for URL construction

    # Quality
    image_quality: Optional[str] = None
    quality_score: Optional[float] = None
    quality_issues: Optional[str] = None
    quality_guidance: Optional[str] = None

    # Prediction
    predicted_severity: Optional[int] = None
    prediction_confidence: Optional[float] = None
    class_probabilities: Optional[str] = None
    model_version: Optional[str] = None
    is_demo_mode: bool

    # Explainability
    has_explanation: bool
    explanation_summary: Optional[str] = None

    # Referral
    referral_priority: Optional[str] = None
    referral_reasoning: Optional[str] = None
    requires_human_review: bool

    # Clinical review
    reviewed_by: Optional[int] = None
    review_date: Optional[datetime] = None
    clinician_agrees: Optional[bool] = None
    clinician_severity: Optional[int] = None
    clinician_notes: Optional[str] = None
    final_referral_priority: Optional[str] = None

    # Status
    status: str
    is_synced: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True,
        protected_namespaces=(),  # allow model_version field name
    )


class ClinicianReview(BaseModel):
    """Schema for clinician review submission."""
    clinician_agrees: bool
    clinician_severity: Optional[int] = None
    clinician_notes: Optional[str] = None
    final_referral_priority: str