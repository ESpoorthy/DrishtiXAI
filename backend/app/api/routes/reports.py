"""
Report generation routes — PDF patient screening reports.

Generates a multi-page PDF for a completed screening using ReportLab.
The PDF embeds:
  - Patient demographics
  - DR, Glaucoma, Cataract results
  - Risk score summary
  - Referral recommendation
  - Clinician review (if done)
  - A mandatory clinical disclaimer
"""
import io
import json
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ...db import get_db
from ...models.screening import Screening, ScreeningStatus
from ...models.patient import Patient
from ...models.user import User
from ..dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

# ── ReportLab colours ────────────────────────────────────────────────────────

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor, white, black
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, Image as RLImage, PageBreak,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    from reportlab.lib import colors
    _RL_AVAILABLE = True
except ImportError:
    _RL_AVAILABLE = False

TEAL      = "#0f766e"
TEAL_LIGHT = "#ccfbf1"
AMBER     = "#b45309"
AMBER_LIGHT = "#fef3c7"
RED       = "#b91c1c"
RED_LIGHT = "#fee2e2"
GREEN     = "#15803d"
GREEN_LIGHT = "#dcfce7"
SLATE_900 = "#0f172a"
SLATE_600 = "#475569"
SLATE_200 = "#e2e8f0"
SLATE_50  = "#f8fafc"


def _priority_color(p: Optional[str]) -> str:
    if p == "urgent":   return RED
    if p == "priority": return AMBER
    return GREEN


def _severity_color(s: Optional[int]) -> str:
    if s is None: return SLATE_600
    if s == 0:    return GREEN
    if s <= 2:    return AMBER
    return RED


def _risk_color(cat: Optional[str]) -> str:
    if cat == "high":   return RED
    if cat == "medium": return AMBER
    return GREEN


DR_LABELS = {0: "No DR", 1: "Mild NPDR", 2: "Moderate NPDR", 3: "Severe NPDR", 4: "Proliferative DR"}
GLAUCOMA_LABELS = {0: "None", 1: "Suspect", 2: "Probable", 3: "Advanced"}
CATARACT_LABELS = {0: "None", 1: "Trace", 2: "Moderate", 3: "Dense"}


# ──────────────────────────────────────────────────────────────────────────────
# Route
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/{screening_id}/pdf")
def generate_pdf_report(
    screening_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a PDF report for a completed screening.

    Returns a streaming PDF response suitable for direct download.
    Works even without ReportLab by falling back to a plain-text response.
    """
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screening not found")

    # Access check
    if (
        current_user.role != "admin"
        and current_user.facility_name
        and screening.facility_name != current_user.facility_name
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    if not _RL_AVAILABLE:
        # Fallback: plain-text report
        return _plaintext_report(screening, patient)

    buf = io.BytesIO()
    _build_pdf(buf, screening, patient)
    buf.seek(0)

    filename = (
        f"DrishtiXAI_Report_{patient.patient_id}_{screening.id}"
        f"_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    )

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ──────────────────────────────────────────────────────────────────────────────
# PDF builder
# ──────────────────────────────────────────────────────────────────────────────

def _build_pdf(buf: io.BytesIO, screening: Screening, patient: Patient) -> None:
    """Build the full multi-page PDF using ReportLab Platypus."""
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=22 * mm,
        title=f"DrishtiXAI Screening Report #{screening.id}",
        author="DrishtiXAI",
    )

    styles = getSampleStyleSheet()
    story  = []

    # ── Styles ───────────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "DTitle", fontSize=20, fontName="Helvetica-Bold",
        textColor=HexColor(TEAL), spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "DSubtitle", fontSize=9, fontName="Helvetica",
        textColor=HexColor(SLATE_600), spaceAfter=8,
    )
    section_style = ParagraphStyle(
        "DSec", fontSize=10, fontName="Helvetica-Bold",
        textColor=HexColor(TEAL), spaceBefore=10, spaceAfter=4,
        backColor=HexColor(TEAL_LIGHT), leftIndent=-4, rightIndent=-4,
        borderPad=4,
    )
    body_style = ParagraphStyle(
        "DBody", fontSize=9, fontName="Helvetica",
        textColor=HexColor(SLATE_900), spaceAfter=3, leading=13,
    )
    small_style = ParagraphStyle(
        "DSmall", fontSize=8, fontName="Helvetica",
        textColor=HexColor(SLATE_600), spaceAfter=2, leading=11,
    )
    disclaimer_style = ParagraphStyle(
        "DDisc", fontSize=7.5, fontName="Helvetica-Oblique",
        textColor=HexColor(AMBER), spaceAfter=2,
        backColor=HexColor(AMBER_LIGHT), leftIndent=4,
    )
    bold_style = ParagraphStyle(
        "DBold", fontSize=10, fontName="Helvetica-Bold",
        textColor=HexColor(SLATE_900), spaceAfter=2,
    )

    def section(text):
        return Paragraph(f"&nbsp;&nbsp;{text}", section_style)

    def kv(label, value, color=None):
        vc = f'<font color="{color}">' if color else ""
        vc_end = "</font>" if color else ""
        return Paragraph(
            f'<b>{label}:</b>&nbsp;&nbsp;{vc}{value}{vc_end}',
            body_style,
        )

    def spacer(h=4):
        return Spacer(1, h * mm)

    def hr():
        return HRFlowable(width="100%", thickness=0.4, color=HexColor(SLATE_200))

    # ── Header ───────────────────────────────────────────────────────────────
    story.append(Paragraph("DrishtiXAI", title_style))
    story.append(Paragraph(
        "Multi-Disease Retinal Screening Report — Research Prototype", subtitle_style
    ))
    story.append(hr())
    story.append(spacer(2))

    meta_data = [
        ["Screening ID", f"#{screening.id}",
         "Date", datetime.utcnow().strftime("%d %b %Y %H:%M UTC")],
        ["Status", screening.status.value.replace("_", " ").title(),
         "Demo Mode", "YES — Not for clinical use" if screening.is_demo_mode else "No"],
    ]
    meta_table = Table(meta_data, colWidths=[35*mm, 55*mm, 30*mm, 55*mm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME",  (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",  (0, 0), (-1, -1), 8),
        ("FONTNAME",  (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",  (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (-1, -1), HexColor(SLATE_600)),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [HexColor(SLATE_50), white]),
        ("GRID", (0, 0), (-1, -1), 0.3, HexColor(SLATE_200)),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(meta_table)
    story.append(spacer(3))

    # ── Disclaimer ───────────────────────────────────────────────────────────
    story.append(Paragraph(
        "⚠  RESEARCH PROTOTYPE — NOT FOR CLINICAL USE. "
        "All AI predictions require review by a qualified ophthalmologist. "
        "This report does not constitute a medical diagnosis.",
        disclaimer_style,
    ))
    story.append(spacer(4))

    # ── Patient information ───────────────────────────────────────────────────
    story.append(section("Patient Information"))
    story.append(spacer(2))

    pat_data = [
        ["Full Name", patient.full_name, "Patient ID", patient.patient_id],
        ["Age", f"{patient.age} years", "Gender", patient.gender.title() if patient.gender else "—"],
        ["Village", patient.village_name or "—", "District", patient.district or "—"],
        ["State", patient.state or "—", "Phone", patient.phone or "—"],
        ["Has Diabetes", patient.has_diabetes or "—",
         "Hypertension", patient.has_hypertension or "—"],
        ["Diabetes Duration", f"{patient.diabetes_duration_years} years" if patient.diabetes_duration_years else "—",
         "Prev. Eye Exam", patient.previous_eye_exam or "—"],
        ["Eye Screened", f"{screening.eye_side.upper()} EYE",
         "Facility", patient.facility_name or "—"],
    ]
    pat_table = Table(pat_data, colWidths=[35*mm, 65*mm, 35*mm, 40*mm])
    pat_table.setStyle(TableStyle([
        ("FONTNAME",  (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",  (0, 0), (-1, -1), 8.5),
        ("FONTNAME",  (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",  (2, 0), (2, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), HexColor(SLATE_600)),
        ("TEXTCOLOR", (2, 0), (2, -1), HexColor(SLATE_600)),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [HexColor(SLATE_50), white]),
        ("GRID", (0, 0), (-1, -1), 0.3, HexColor(SLATE_200)),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
    ]))
    story.append(pat_table)
    story.append(spacer(4))

    # ── Image quality ────────────────────────────────────────────────────────
    story.append(section("Image Quality Assessment"))
    story.append(spacer(2))

    q_color = (GREEN if screening.image_quality == "good"
               else AMBER if screening.image_quality == "acceptable"
               else RED)
    q_pct = f"{screening.quality_score * 100:.1f}%" if screening.quality_score is not None else "—"

    story.append(kv("Quality Grade", (screening.image_quality or "unknown").upper(), q_color))
    story.append(kv("Quality Score", q_pct))

    if screening.quality_issues:
        try:
            issues = json.loads(screening.quality_issues)
            if issues:
                story.append(Paragraph(
                    "<b>Issues detected:</b> " + "; ".join(issues), small_style
                ))
        except Exception:
            pass
    if screening.quality_guidance:
        story.append(Paragraph(f"<i>Guidance: {screening.quality_guidance}</i>", small_style))

    story.append(spacer(3))

    # ── AI Results ───────────────────────────────────────────────────────────
    story.append(section("AI Analysis Results"))
    story.append(spacer(2))

    # Disease results table
    dr_sev   = screening.predicted_severity
    gl_sev   = screening.glaucoma_severity
    cat_sev  = screening.cataract_severity
    dr_conf  = f"{screening.prediction_confidence * 100:.1f}%" if screening.prediction_confidence else "—"
    gl_conf  = f"{screening.glaucoma_confidence * 100:.1f}%" if screening.glaucoma_confidence else "—"
    cat_conf = f"{screening.cataract_confidence * 100:.1f}%" if screening.cataract_confidence else "—"

    disease_data = [
        ["Disease", "Severity", "Label", "Confidence", "Review?"],
        ["Diabetic Retinopathy",
         f"Level {dr_sev}/4" if dr_sev is not None else "—",
         DR_LABELS.get(dr_sev, "—") if dr_sev is not None else "—",
         dr_conf,
         "Yes" if screening.requires_human_review else "No"],
        ["Glaucoma",
         f"Level {gl_sev}/3" if gl_sev is not None else "—",
         GLAUCOMA_LABELS.get(gl_sev, "—") if gl_sev is not None else "—",
         gl_conf,
         "Yes" if screening.glaucoma_requires_review else "No"],
        ["Cataract (Phase 2)",
         f"Level {cat_sev}/3" if cat_sev is not None else "—",
         CATARACT_LABELS.get(cat_sev, "—") if cat_sev is not None else "—",
         cat_conf,
         "Yes" if screening.cataract_requires_review else "No"],
    ]
    disease_table = Table(disease_data, colWidths=[50*mm, 25*mm, 40*mm, 25*mm, 20*mm])
    disease_table.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), HexColor(TEAL)),
        ("TEXTCOLOR",   (0, 0), (-1, 0), white),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 8.5),
        ("FONTNAME",    (0, 1), (-1, -1), "Helvetica"),
        ("TEXTCOLOR",   (0, 1), (-1, -1), HexColor(SLATE_900)),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor(SLATE_50), white]),
        ("GRID",        (0, 0), (-1, -1), 0.3, HexColor(SLATE_200)),
        ("TOPPADDING",  (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ALIGN",       (0, 0), (-1, -1), "LEFT"),
    ]))
    story.append(disease_table)
    story.append(spacer(2))

    # Individual messages
    if screening.predicted_severity is not None:
        story.append(Paragraph(
            f"<b>DR:</b> {screening.glaucoma_message or DR_LABELS.get(dr_sev, '')}",
            small_style
        ))
    if screening.glaucoma_message:
        story.append(Paragraph(f"<b>Glaucoma:</b> {screening.glaucoma_message}", small_style))
    if screening.cataract_message:
        story.append(Paragraph(
            f"<b>Cataract (Phase 2):</b> {screening.cataract_message}", small_style
        ))

    story.append(spacer(4))

    # ── Risk score ───────────────────────────────────────────────────────────
    story.append(section("Composite Risk Score"))
    story.append(spacer(2))

    if screening.risk_score is not None:
        r_color = _risk_color(screening.risk_category)
        story.append(kv(
            "Overall Risk Score",
            f"{screening.risk_score} / 100",
            r_color
        ))
        story.append(kv(
            "Risk Category",
            (screening.risk_category or "").upper(),
            r_color
        ))

        if screening.risk_breakdown:
            try:
                bd = json.loads(screening.risk_breakdown)
                bd_text = (
                    f"DR: {bd.get('dr_points', 0):.0f}pts · "
                    f"Glaucoma: {bd.get('glaucoma_points', 0):.0f}pts · "
                    f"Cataract: {bd.get('cataract_points', 0):.0f}pts · "
                    f"Clinical: {bd.get('clinical_points', 0):.0f}pts · "
                    f"Quality penalty: −{bd.get('quality_penalty', 0):.0f}pts"
                )
                story.append(Paragraph(f"<i>Score breakdown: {bd_text}</i>", small_style))
            except Exception:
                pass

        if screening.risk_factors_present:
            try:
                factors = json.loads(screening.risk_factors_present)
                if factors:
                    story.append(Paragraph(
                        "<b>Risk factors identified:</b> " + "; ".join(factors), small_style
                    ))
            except Exception:
                pass

        if screening.risk_recommendation:
            story.append(spacer(2))
            wrapped = textwrap.fill(screening.risk_recommendation, width=110)
            story.append(Paragraph(f"<i>{wrapped}</i>", small_style))
    else:
        story.append(Paragraph("Risk score not yet calculated.", small_style))

    story.append(spacer(4))

    # ── Referral recommendation ───────────────────────────────────────────────
    story.append(section("Referral Recommendation"))
    story.append(spacer(2))

    p_color = _priority_color(screening.referral_priority)
    story.append(kv(
        "Referral Priority",
        (screening.referral_priority or "routine").upper(),
        p_color
    ))
    if screening.requires_human_review:
        story.append(Paragraph(
            "⚠  Requires clinical review before action.",
            ParagraphStyle("warn", parent=small_style, textColor=HexColor(AMBER))
        ))
    if screening.referral_reasoning:
        story.append(Paragraph(f"<i>{screening.referral_reasoning}</i>", small_style))

    story.append(spacer(4))

    # ── Explainability ────────────────────────────────────────────────────────
    if screening.has_explanation and screening.explanation_summary:
        story.append(section("AI Explanation (Grad-CAM)"))
        story.append(spacer(2))
        story.append(Paragraph(screening.explanation_summary, small_style))
        story.append(Paragraph(
            "<i>Note: Grad-CAM heatmaps show model attention regions — "
            "not confirmed clinical lesions. Warm colours indicate higher model influence.</i>",
            small_style
        ))
        story.append(spacer(3))

    # ── Clinician review ──────────────────────────────────────────────────────
    if screening.status == ScreeningStatus.CLINICIAN_REVIEWED:
        story.append(section("Clinician Review"))
        story.append(spacer(2))
        story.append(kv(
            "Agreement with AI",
            "Agrees" if screening.clinician_agrees else "Disagrees",
            GREEN if screening.clinician_agrees else RED
        ))
        if screening.clinician_severity is not None:
            story.append(kv(
                "Clinical Assessment",
                DR_LABELS.get(screening.clinician_severity, str(screening.clinician_severity)),
                _severity_color(screening.clinician_severity)
            ))
        story.append(kv(
            "Final Referral Priority",
            (screening.final_referral_priority or "routine").upper(),
            _priority_color(screening.final_referral_priority)
        ))
        if screening.clinician_notes:
            story.append(Paragraph(f"<b>Notes:</b> {screening.clinician_notes}", small_style))
        if screening.review_date:
            story.append(Paragraph(
                f"<i>Reviewed: {screening.review_date.strftime('%d %b %Y %H:%M UTC')}</i>",
                small_style
            ))
        story.append(spacer(3))

    # ── Final disclaimer ──────────────────────────────────────────────────────
    story.append(hr())
    story.append(spacer(2))
    story.append(Paragraph(
        "IMPORTANT DISCLAIMER: DrishtiXAI is a research prototype and is NOT approved for clinical "
        "diagnosis or treatment decisions. AI predictions have not been validated in a clinical trial "
        "and must not be used as the sole basis for any medical decision. All results should be "
        "reviewed and confirmed by a qualified ophthalmologist. This report was automatically "
        "generated and may contain errors.",
        disclaimer_style
    ))
    story.append(spacer(2))
    story.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')} · "
        f"DrishtiXAI v1.0 · SIH26038",
        ParagraphStyle("footer", fontSize=7, textColor=HexColor(SLATE_600))
    ))

    doc.build(story)


# ──────────────────────────────────────────────────────────────────────────────
# Plain-text fallback
# ──────────────────────────────────────────────────────────────────────────────

def _plaintext_report(screening: Screening, patient: Patient) -> StreamingResponse:
    lines = [
        "DrishtiXAI — Multi-Disease Retinal Screening Report",
        "=" * 56,
        "RESEARCH PROTOTYPE — NOT FOR CLINICAL USE",
        "",
        f"Screening ID  : #{screening.id}",
        f"Date          : {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')}",
        f"Status        : {screening.status.value}",
        f"Demo Mode     : {'YES' if screening.is_demo_mode else 'No'}",
        "",
        "── Patient Information ─────────────────────────────",
        f"Name          : {patient.full_name}",
        f"Patient ID    : {patient.patient_id}",
        f"Age / Gender  : {patient.age} / {patient.gender}",
        f"Eye Screened  : {screening.eye_side.upper()}",
        f"Village       : {patient.village_name or '—'}",
        f"District      : {patient.district or '—'}",
        "",
        "── AI Results ──────────────────────────────────────",
        f"DR Severity   : {DR_LABELS.get(screening.predicted_severity, '—')}",
        f"DR Confidence : {screening.prediction_confidence * 100:.1f}%" if screening.prediction_confidence else "DR Confidence : —",
        f"Glaucoma      : {GLAUCOMA_LABELS.get(screening.glaucoma_severity, '—')}",
        f"Cataract (P2) : {CATARACT_LABELS.get(screening.cataract_severity, '—')}",
        f"Risk Score    : {screening.risk_score}/100 ({(screening.risk_category or '').upper()})" if screening.risk_score is not None else "Risk Score    : —",
        f"Referral      : {(screening.referral_priority or 'routine').upper()}",
        "",
        "── Disclaimer ──────────────────────────────────────",
        "This report is auto-generated by a research prototype.",
        "Results must be reviewed by a qualified ophthalmologist.",
        "Not for clinical use.",
    ]
    text = "\n".join(lines)
    buf  = io.BytesIO(text.encode())
    filename = f"DrishtiXAI_Report_{patient.patient_id}_{screening.id}.txt"
    return StreamingResponse(
        buf,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
