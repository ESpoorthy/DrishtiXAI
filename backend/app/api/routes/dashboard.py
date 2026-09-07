"""
Dashboard and Analytics routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict
from datetime import datetime, timedelta

from ...db import get_db
from ...models.screening import Screening, ScreeningStatus
from ...models.patient import Patient
from ...models.user import User
from ..dependencies import get_current_user, require_clinician

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/statistics")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict:
    """
    Get dashboard statistics
    
    Returns:
        - Total screenings
        - Today's screenings
        - High-risk cases
        - Urgent referrals
        - Poor quality images
        - Pending reviews
        - AI/clinician agreement stats
    """
    # Base query
    query = db.query(Screening)
    
    # Filter by facility for non-admin
    if current_user.role != "admin" and current_user.facility_name:
        query = query.filter(Screening.facility_name == current_user.facility_name)
    
    # Total screenings
    total_screenings = query.count()
    
    # Today's screenings
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_screenings = query.filter(Screening.created_at >= today_start).count()
    
    # High-risk cases (severity >= 3)
    high_risk_cases = query.filter(Screening.predicted_severity >= 3).count()
    
    # Urgent referrals
    urgent_referrals = query.filter(Screening.referral_priority == "urgent").count()
    
    # Poor quality images
    poor_quality = query.filter(Screening.image_quality == "poor").count()
    
    # Pending reviews (analyzed but not reviewed)
    pending_reviews = query.filter(
        Screening.status == ScreeningStatus.ANALYZED,
        Screening.requires_human_review == True
    ).count()
    
    # Clinician reviewed count
    reviewed = query.filter(Screening.status == ScreeningStatus.CLINICIAN_REVIEWED).count()
    
    # Agreement rate (when clinician reviewed)
    reviewed_screenings = query.filter(
        Screening.status == ScreeningStatus.CLINICIAN_REVIEWED
    ).all()
    
    agreement_count = sum(1 for s in reviewed_screenings if s.clinician_agrees)
    agreement_rate = (agreement_count / len(reviewed_screenings) * 100) if reviewed_screenings else 0
    
    # Severity distribution
    severity_dist = {
        "no_dr": query.filter(Screening.predicted_severity == 0).count(),
        "mild": query.filter(Screening.predicted_severity == 1).count(),
        "moderate": query.filter(Screening.predicted_severity == 2).count(),
        "severe": query.filter(Screening.predicted_severity == 3).count(),
        "proliferative": query.filter(Screening.predicted_severity == 4).count(),
    }
    
    return {
        "total_screenings": total_screenings,
        "today_screenings": today_screenings,
        "high_risk_cases": high_risk_cases,
        "urgent_referrals": urgent_referrals,
        "poor_quality_images": poor_quality,
        "pending_reviews": pending_reviews,
        "reviewed_count": reviewed,
        "agreement_rate": round(agreement_rate, 1),
        "severity_distribution": severity_dist
    }


@router.get("/recent-screenings")
def get_recent_screenings(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent screenings for quick overview"""
    query = db.query(Screening)
    
    # Filter by facility
    if current_user.role != "admin" and current_user.facility_name:
        query = query.filter(Screening.facility_name == current_user.facility_name)
    
    screenings = query.order_by(Screening.created_at.desc()).limit(limit).all()
    
    result = []
    for screening in screenings:
        patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()
        result.append({
            "screening_id": screening.id,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_id": patient.patient_id if patient else "Unknown",
            "eye_side": screening.eye_side,
            "date": screening.screening_date,
            "severity": screening.predicted_severity,
            "confidence": screening.prediction_confidence,
            "referral_priority": screening.referral_priority,
            "status": screening.status.value,
            "requires_review": screening.requires_human_review
        })
    
    return result


@router.get("/high-priority-cases")
def get_high_priority_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician)
):
    """Get cases requiring urgent attention (for clinician dashboard)"""
    query = db.query(Screening)
    
    # Filter by facility
    if current_user.role != "admin" and current_user.facility_name:
        query = query.filter(Screening.facility_name == current_user.facility_name)
    
    # Get urgent cases not yet reviewed
    urgent_cases = query.filter(
        and_(
            Screening.referral_priority == "urgent",
            Screening.status != ScreeningStatus.CLINICIAN_REVIEWED
        )
    ).order_by(Screening.created_at.desc()).all()
    
    # Get cases requiring human review
    review_required = query.filter(
        and_(
            Screening.requires_human_review == True,
            Screening.status != ScreeningStatus.CLINICIAN_REVIEWED
        )
    ).order_by(Screening.created_at.desc()).all()
    
    result = []
    seen_ids = set()
    
    # Combine and deduplicate
    for screening in urgent_cases + review_required:
        if screening.id not in seen_ids:
            seen_ids.add(screening.id)
            patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()
            result.append({
                "screening_id": screening.id,
                "patient_name": patient.full_name if patient else "Unknown",
                "patient_id": patient.patient_id if patient else "Unknown",
                "age": patient.age if patient else None,
                "eye_side": screening.eye_side,
                "date": screening.screening_date,
                "severity": screening.predicted_severity,
                "confidence": screening.prediction_confidence,
                "referral_priority": screening.referral_priority,
                "requires_review": screening.requires_human_review,
                "reason": "Urgent referral" if screening.referral_priority == "urgent" else "Low confidence"
            })
    
    return result


@router.get("/model-performance")
def get_model_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician)
):
    """
    Get model performance metrics
    
    Note: Real metrics require ground truth labels
    This provides operational metrics based on available data
    """
    query = db.query(Screening)
    
    # Filter by facility
    if current_user.role != "admin" and current_user.facility_name:
        query = query.filter(Screening.facility_name == current_user.facility_name)
    
    total = query.count()
    
    # Confidence distribution
    avg_confidence = db.query(func.avg(Screening.prediction_confidence)).filter(
        Screening.prediction_confidence.isnot(None)
    ).scalar()
    
    high_confidence = query.filter(Screening.prediction_confidence >= 0.8).count()
    medium_confidence = query.filter(
        and_(
            Screening.prediction_confidence >= 0.6,
            Screening.prediction_confidence < 0.8
        )
    ).count()
    low_confidence = query.filter(Screening.prediction_confidence < 0.6).count()
    
    # Quality metrics
    good_quality = query.filter(Screening.image_quality == "good").count()
    acceptable_quality = query.filter(Screening.image_quality == "acceptable").count()
    poor_quality = query.filter(Screening.image_quality == "poor").count()
    
    # Clinician agreement (when reviewed)
    reviewed = query.filter(Screening.status == ScreeningStatus.CLINICIAN_REVIEWED).all()
    agreement_count = sum(1 for s in reviewed if s.clinician_agrees)
    
    return {
        "total_predictions": total,
        "average_confidence": round(avg_confidence, 3) if avg_confidence else 0,
        "confidence_distribution": {
            "high": high_confidence,
            "medium": medium_confidence,
            "low": low_confidence
        },
        "quality_distribution": {
            "good": good_quality,
            "acceptable": acceptable_quality,
            "poor": poor_quality
        },
        "clinician_review": {
            "reviewed": len(reviewed),
            "agreed": agreement_count,
            "disagreed": len(reviewed) - agreement_count,
            "agreement_rate": round((agreement_count / len(reviewed) * 100), 1) if reviewed else 0
        },
        "note": "Full performance metrics require validated ground truth dataset"
    }
