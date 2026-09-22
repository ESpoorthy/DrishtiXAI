"""
Dashboard and Analytics routes — extended for multi-disease screening.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, List
from datetime import datetime, timedelta

from ...db import get_db
from ...models.screening import Screening, ScreeningStatus
from ...models.patient import Patient
from ...models.user import User
from ...models.audit import AuditLog
from ..dependencies import get_current_user, require_clinician, require_admin

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _facility_query(db: Session, current_user: User):
    """Base query filtered by facility for non-admin users."""
    q = db.query(Screening)
    if current_user.role != "admin" and current_user.facility_name:
        q = q.filter(Screening.facility_name == current_user.facility_name)
    return q


@router.get("/statistics")
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict:
    """
    Dashboard statistics — total, today's, risk distribution,
    multi-disease counts, quality, referral, and agreement stats.
    """
    query = _facility_query(db, current_user)

    total_screenings  = query.count()
    today_start       = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_screenings  = query.filter(Screening.created_at >= today_start).count()
    high_risk_cases   = query.filter(Screening.risk_category == "high").count()
    medium_risk_cases = query.filter(Screening.risk_category == "medium").count()
    low_risk_cases    = query.filter(Screening.risk_category == "low").count()
    urgent_referrals  = query.filter(Screening.referral_priority == "urgent").count()
    poor_quality      = query.filter(Screening.image_quality == "poor").count()
    pending_reviews   = query.filter(
        Screening.status == ScreeningStatus.ANALYZED,
        Screening.requires_human_review == True
    ).count()
    reviewed          = query.filter(Screening.status == ScreeningStatus.CLINICIAN_REVIEWED).count()

    # Agreement rate
    reviewed_list = query.filter(Screening.status == ScreeningStatus.CLINICIAN_REVIEWED).all()
    agree_count   = sum(1 for s in reviewed_list if s.clinician_agrees)
    agreement_rate = (agree_count / len(reviewed_list) * 100) if reviewed_list else 0

    # DR severity distribution
    severity_dist = {
        "no_dr":        query.filter(Screening.predicted_severity == 0).count(),
        "mild":         query.filter(Screening.predicted_severity == 1).count(),
        "moderate":     query.filter(Screening.predicted_severity == 2).count(),
        "severe":       query.filter(Screening.predicted_severity == 3).count(),
        "proliferative":query.filter(Screening.predicted_severity == 4).count(),
    }

    # Glaucoma distribution
    glaucoma_dist = {
        "none":    query.filter(Screening.glaucoma_severity == 0).count(),
        "suspect": query.filter(Screening.glaucoma_severity == 1).count(),
        "probable":query.filter(Screening.glaucoma_severity == 2).count(),
        "advanced":query.filter(Screening.glaucoma_severity == 3).count(),
    }

    # Cataract distribution
    cataract_dist = {
        "none":     query.filter(Screening.cataract_severity == 0).count(),
        "trace":    query.filter(Screening.cataract_severity == 1).count(),
        "moderate": query.filter(Screening.cataract_severity == 2).count(),
        "dense":    query.filter(Screening.cataract_severity == 3).count(),
    }

    # Weekly trend (last 7 days)
    weekly_trend = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end   = day_start + timedelta(days=1)
        cnt = query.filter(
            Screening.created_at >= day_start,
            Screening.created_at < day_end,
        ).count()
        weekly_trend.append({
            "date":  day_start.strftime("%a"),
            "count": cnt,
        })

    return {
        "total_screenings":   total_screenings,
        "today_screenings":   today_screenings,
        "high_risk_cases":    high_risk_cases,
        "medium_risk_cases":  medium_risk_cases,
        "low_risk_cases":     low_risk_cases,
        "urgent_referrals":   urgent_referrals,
        "poor_quality_images":poor_quality,
        "pending_reviews":    pending_reviews,
        "reviewed_count":     reviewed,
        "agreement_rate":     round(agreement_rate, 1),
        "severity_distribution": severity_dist,
        "glaucoma_distribution": glaucoma_dist,
        "cataract_distribution": cataract_dist,
        "weekly_trend":          weekly_trend,
    }


@router.get("/recent-screenings")
def get_recent_screenings(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recent screenings with multi-disease summary."""
    query = _facility_query(db, current_user)
    screenings = query.order_by(Screening.created_at.desc()).limit(limit).all()

    result = []
    for s in screenings:
        patient = db.query(Patient).filter(Patient.id == s.patient_id).first()
        result.append({
            "screening_id":      s.id,
            "patient_name":      patient.full_name if patient else "Unknown",
            "patient_id":        patient.patient_id if patient else "Unknown",
            "eye_side":          s.eye_side,
            "date":              s.screening_date,
            "dr_severity":       s.predicted_severity,
            "glaucoma_severity": s.glaucoma_severity,
            "cataract_severity": s.cataract_severity,
            "risk_score":        s.risk_score,
            "risk_category":     s.risk_category,
            "confidence":        s.prediction_confidence,
            "referral_priority": s.referral_priority,
            "status":            s.status.value,
            "requires_review":   s.requires_human_review,
        })
    return result


@router.get("/high-priority-cases")
def get_high_priority_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    """High-risk and urgent cases requiring clinical attention."""
    query = _facility_query(db, current_user)

    urgent_cases = query.filter(
        and_(
            Screening.referral_priority == "urgent",
            Screening.status != ScreeningStatus.CLINICIAN_REVIEWED,
        )
    ).order_by(Screening.created_at.desc()).all()

    review_required = query.filter(
        and_(
            Screening.requires_human_review == True,
            Screening.status != ScreeningStatus.CLINICIAN_REVIEWED,
        )
    ).order_by(Screening.created_at.desc()).all()

    result = []
    seen   = set()
    for s in urgent_cases + review_required:
        if s.id not in seen:
            seen.add(s.id)
            patient = db.query(Patient).filter(Patient.id == s.patient_id).first()
            result.append({
                "screening_id":      s.id,
                "patient_name":      patient.full_name if patient else "Unknown",
                "patient_id":        patient.patient_id if patient else "Unknown",
                "age":               patient.age if patient else None,
                "eye_side":          s.eye_side,
                "date":              s.screening_date,
                "dr_severity":       s.predicted_severity,
                "glaucoma_severity": s.glaucoma_severity,
                "cataract_severity": s.cataract_severity,
                "risk_score":        s.risk_score,
                "risk_category":     s.risk_category,
                "confidence":        s.prediction_confidence,
                "referral_priority": s.referral_priority,
                "requires_review":   s.requires_human_review,
                "reason": (
                    "Urgent referral" if s.referral_priority == "urgent"
                    else "Clinical review required"
                ),
            })
    return result


@router.get("/model-performance")
def get_model_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clinician),
):
    """
    Operational model performance metrics.
    Full validation metrics require a ground-truth dataset.
    """
    query = _facility_query(db, current_user)
    total = query.count()

    avg_confidence = db.query(func.avg(Screening.prediction_confidence)).filter(
        Screening.prediction_confidence.isnot(None)
    ).scalar() or 0

    avg_risk_score = db.query(func.avg(Screening.risk_score)).filter(
        Screening.risk_score.isnot(None)
    ).scalar() or 0

    high_conf   = query.filter(Screening.prediction_confidence >= 0.8).count()
    med_conf    = query.filter(
        and_(Screening.prediction_confidence >= 0.6,
             Screening.prediction_confidence < 0.8)
    ).count()
    low_conf    = query.filter(Screening.prediction_confidence < 0.6).count()

    good_q       = query.filter(Screening.image_quality == "good").count()
    acceptable_q = query.filter(Screening.image_quality == "acceptable").count()
    poor_q       = query.filter(Screening.image_quality == "poor").count()

    reviewed     = query.filter(Screening.status == ScreeningStatus.CLINICIAN_REVIEWED).all()
    agree_count  = sum(1 for s in reviewed if s.clinician_agrees)

    return {
        "total_predictions":  total,
        "average_confidence": round(avg_confidence, 3),
        "average_risk_score": round(avg_risk_score, 1),
        "confidence_distribution": {
            "high": high_conf, "medium": med_conf, "low": low_conf,
        },
        "quality_distribution": {
            "good": good_q, "acceptable": acceptable_q, "poor": poor_q,
        },
        "clinician_review": {
            "reviewed":       len(reviewed),
            "agreed":         agree_count,
            "disagreed":      len(reviewed) - agree_count,
            "agreement_rate": round((agree_count / len(reviewed) * 100), 1) if reviewed else 0,
        },
        "note": "Full performance metrics require validated ground-truth dataset.",
    }


@router.get("/admin/summary")
def get_admin_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Dict:
    """
    Admin-only summary: user counts, facility breakdown, audit trail snapshot.
    """
    total_users     = db.query(User).count()
    active_users    = db.query(User).filter(User.is_active == True).count()
    total_patients  = db.query(Patient).count()
    total_screenings = db.query(Screening).count()

    # Role breakdown
    role_counts = {}
    for role in ("health_worker", "clinician", "admin"):
        role_counts[role] = db.query(User).filter(User.role == role).count()

    # Facility breakdown
    facility_rows = (
        db.query(Screening.facility_name, func.count(Screening.id))
        .group_by(Screening.facility_name)
        .order_by(func.count(Screening.id).desc())
        .limit(10)
        .all()
    )
    facility_breakdown = [
        {"facility": row[0] or "Unknown", "count": row[1]}
        for row in facility_rows
    ]

    # Recent audit actions (last 20)
    recent_audits = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(20)
        .all()
    )
    audit_list = [
        {
            "action":      a.action,
            "user_role":   a.user_role,
            "screening_id":a.screening_id,
            "timestamp":   a.timestamp.isoformat() if a.timestamp else None,
        }
        for a in recent_audits
    ]

    # High-risk patients count
    high_risk = db.query(Screening).filter(Screening.risk_category == "high").count()

    return {
        "total_users":        total_users,
        "active_users":       active_users,
        "total_patients":     total_patients,
        "total_screenings":   total_screenings,
        "high_risk_screenings": high_risk,
        "role_breakdown":     role_counts,
        "facility_breakdown": facility_breakdown,
        "recent_audit":       audit_list,
    }



