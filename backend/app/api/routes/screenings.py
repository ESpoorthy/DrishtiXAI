"""
Screening routes - Core DR screening API
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import json
import logging
from datetime import datetime

from ...db import get_db
from ...models.screening import Screening, ScreeningStatus
from ...models.patient import Patient
from ...models.user import User
from ...models.audit import AuditLog
from ...schemas.screening import ScreeningResponse, ClinicianReview
from ...services.screening_service import ScreeningService
from ...utils import allowed_file, save_upload_file, get_upload_path
from ..dependencies import get_current_user, require_health_worker, require_clinician

router = APIRouter(prefix="/screenings", tags=["Screenings"])

# Initialize screening service
screening_service = ScreeningService()


@router.post("", response_model=ScreeningResponse, status_code=status.HTTP_201_CREATED)
async def create_screening(
    patient_id: int = Form(...),
    eye_side: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_health_worker)
):
    """
    Create new screening with image upload
    
    Uploads fundus image and creates screening record
    """
    # Validate patient exists
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
    
    # Validate eye side
    if eye_side not in ["left", "right"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Eye side must be 'left' or 'right'"
        )
    
    # Validate file
    if not allowed_file(image.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Allowed: .jpg, .jpeg, .png"
        )
    
    # Save image
    image_path = get_upload_path(image.filename, current_user.id)
    await save_upload_file(image, image_path)
    
    # Create screening record
    screening = Screening(
        patient_id=patient_id,
        eye_side=eye_side,
        performed_by=current_user.id,
        facility_name=current_user.facility_name,
        image_path=image_path,
        image_filename=image.filename,
        status=ScreeningStatus.IMAGE_UPLOADED
    )
    
    db.add(screening)
    db.commit()
    db.refresh(screening)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role.value,
        action="screening_created",
        screening_id=screening.id,
        patient_id=patient_id,
        details=json.dumps({"eye_side": eye_side, "image": image.filename})
    )
    db.add(audit)
    db.commit()
    
    return screening


@router.post("/{screening_id}/analyze", response_model=ScreeningResponse)
def analyze_screening(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run AI analysis on screening
    
    Executes complete pipeline: quality check, DR prediction, explainability, referral
    """
    # Get screening
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    # Get patient for risk factors
    patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()
    
    # Prepare patient risk factors
    risk_factors = None
    if patient:
        risk_factors = {
            "has_diabetes": patient.has_diabetes,
            "diabetes_duration_years": patient.diabetes_duration_years,
            "has_hypertension": patient.has_hypertension,
            "previous_eye_exam": patient.previous_eye_exam
        }
    
    # Run screening pipeline
    try:
        result = screening_service.process_screening(
            image_path=screening.image_path,
            patient_risk_factors=risk_factors
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(
            "Screening analysis failed for screening_id=%s: %s", screening_id, str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis could not be completed. Please try again."
        )
    
    # Update screening with results
    screening.image_quality = result["quality"]["quality"]
    screening.quality_score = result["quality"]["quality_score"]
    screening.quality_issues = json.dumps(result["quality"]["issues"])
    screening.quality_guidance = result["quality"].get("guidance")
    
    if result["prediction"]:
        screening.predicted_severity = result["prediction"]["severity"]
        screening.prediction_confidence = result["prediction"]["confidence"]
        screening.class_probabilities = json.dumps(result["prediction"]["class_probabilities"])
        screening.requires_human_review = result["prediction"]["requires_human_review"]
    
    screening.model_version = result["model_version"]
    screening.is_demo_mode = result["is_demo_mode"]
    
    if result["explanation"]:
        screening.has_explanation = result["explanation"]["has_explanation"]
        screening.explanation_path = result["explanation"].get("explanation_path")
        screening.attention_regions = json.dumps(result["explanation"].get("attention_regions", []))
        screening.explanation_summary = result["explanation"]["summary"]
    
    if result["referral"]:
        screening.referral_priority = result["referral"]["priority"]
        screening.referral_reasoning = result["referral"]["reasoning"]
        if "requires_human_review" in result["referral"]:
            screening.requires_human_review = result["referral"]["requires_human_review"]
    
    # Update status
    if result["status"] == "quality_check_failed":
        screening.status = ScreeningStatus.QUALITY_CHECK_FAILED
    else:
        screening.status = ScreeningStatus.ANALYZED
    
    db.commit()
    db.refresh(screening)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role.value,
        action="screening_analyzed",
        screening_id=screening.id,
        patient_id=screening.patient_id,
        model_version=result["model_version"],
        details=json.dumps({
            "severity": result["prediction"]["severity"] if result["prediction"] else None,
            "confidence": result["prediction"]["confidence"] if result["prediction"] else None,
            "quality": result["quality"]["quality"]
        })
    )
    db.add(audit)
    db.commit()
    
    return screening


@router.post("/{screening_id}/review", response_model=ScreeningResponse)
def clinician_review(
    screening_id: int,
    review: ClinicianReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician)
):
    """
    Submit clinician review of screening
    
    Clinicians can agree/disagree with AI and provide final assessment
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    # Update with clinician review
    screening.reviewed_by = current_user.id
    screening.review_date = datetime.utcnow()
    screening.clinician_agrees = review.clinician_agrees
    screening.clinician_severity = review.clinician_severity
    screening.clinician_notes = review.clinician_notes
    screening.final_referral_priority = review.final_referral_priority
    screening.status = ScreeningStatus.CLINICIAN_REVIEWED
    
    db.commit()
    db.refresh(screening)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        user_role=current_user.role.value,
        action="clinician_review",
        screening_id=screening.id,
        patient_id=screening.patient_id,
        details=json.dumps({
            "agrees_with_ai": review.clinician_agrees,
            "clinician_severity": review.clinician_severity,
            "final_priority": review.final_referral_priority
        })
    )
    db.add(audit)
    db.commit()
    
    return screening


@router.get("", response_model=List[ScreeningResponse])
def list_screenings(
    skip: int = 0,
    limit: int = 100,
    patient_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List screenings with optional filters
    """
    query = db.query(Screening)
    
    # Filter by facility for non-admin
    if current_user.role != "admin" and current_user.facility_name:
        query = query.filter(Screening.facility_name == current_user.facility_name)
    
    # Apply filters
    if patient_id:
        query = query.filter(Screening.patient_id == patient_id)
    
    if status:
        query = query.filter(Screening.status == status)
    
    # Order by most recent first
    query = query.order_by(Screening.created_at.desc())
    
    screenings = query.offset(skip).limit(limit).all()
    return screenings


@router.get("/{screening_id}", response_model=ScreeningResponse)
def get_screening(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get screening details
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    # Check access
    if (current_user.role != "admin" and 
        current_user.facility_name and
        screening.facility_name != current_user.facility_name):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return screening


@router.get("/{screening_id}/image")
def get_screening_image(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get original screening image
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    # Check access
    if (current_user.role != "admin" and 
        current_user.facility_name and
        screening.facility_name != current_user.facility_name):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    image_path = Path(screening.image_path)
    if not image_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found"
        )
    
    return FileResponse(image_path)


@router.get("/{screening_id}/explanation")
def get_explanation_image(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get explanation heatmap image
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screening not found"
        )
    
    # Check access
    if (current_user.role != "admin" and 
        current_user.facility_name and
        screening.facility_name != current_user.facility_name):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    if not screening.explanation_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Explanation not available"
        )
    
    explanation_path = Path(screening.explanation_path)
    if not explanation_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Explanation image not found"
        )
    
    return FileResponse(explanation_path)
