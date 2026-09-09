"""
Referral Prioritisation Engine
Decision support system for determining referral priority.

IMPORTANT: This engine provides DECISION SUPPORT, not medical diagnosis.
All referral recommendations should be reviewed by a qualified clinician.

Three referral states:
  URGENT   — severity ≥ 3 or quality failures at high risk
  PRIORITY — severity 2, low confidence, or poor image quality
  ROUTINE  — severity 0–1 with adequate confidence

Reasoning text uses safe clinical language:
  - Does NOT prescribe treatment
  - Does NOT say "you have DR" or "you are healthy"
  - Uses "possible", "no supported abnormality detected in this image"
  - Recommends professional evaluation where appropriate
"""
from typing import Dict, Optional


class ReferralEngine:
    """
    Referral prioritisation engine for DR screening.

    Combines severity, confidence, image quality and patient risk factors
    to recommend referral priority.
    """

    def __init__(
        self,
        urgent_severity_threshold:   int   = 3,
        priority_severity_threshold: int   = 2,
        low_confidence_threshold:    float = 0.6,
    ):
        self.urgent_severity_threshold   = urgent_severity_threshold
        self.priority_severity_threshold = priority_severity_threshold
        self.low_confidence_threshold    = low_confidence_threshold

    # ──────────────────────────────────────────────────────────────────

    def determine_referral_priority(
        self,
        severity:             int,
        confidence:           float,
        image_quality:        str,
        quality_score:        float,
        patient_risk_factors: Optional[Dict] = None,
    ) -> Dict:
        """
        Determine referral priority based on multiple factors.

        Returns
        -------
        {
            "priority":              "routine" | "priority" | "urgent",
            "reasoning":             str,
            "requires_human_review": bool,
        }
        """
        # ── Poor quality → cannot make reliable referral decision ──
        if image_quality == "poor":
            return {
                "priority": "priority",
                "reasoning": (
                    "Image quality is insufficient for reliable analysis. "
                    "A clinical assessment is recommended as the AI screening "
                    "result cannot be considered reliable for this image."
                ),
                "requires_human_review": True,
            }

        # ── Low confidence → require human review ─────────────────
        if confidence < self.low_confidence_threshold:
            return {
                "priority": "priority",
                "reasoning": (
                    f"Model confidence is low ({confidence:.1%}). "
                    "The AI screening result may not be reliable for this image. "
                    "Clinical review is recommended."
                ),
                "requires_human_review": True,
            }

        # ── Base priority on severity ──────────────────────────────
        requires_review = False

        if severity >= self.urgent_severity_threshold:
            priority  = "urgent"
            reasoning = (
                f"Screening detected patterns possibly associated with severe "
                f"diabetic retinopathy changes (model confidence: {confidence:.1%}). "
                "Urgent ophthalmologist review is recommended."
            )

        elif severity >= self.priority_severity_threshold:
            priority  = "priority"
            reasoning = (
                f"Screening detected patterns possibly associated with moderate "
                f"diabetic retinopathy changes (model confidence: {confidence:.1%}). "
                "Priority ophthalmologist referral is recommended for further evaluation."
            )

        elif severity == 1:
            priority  = "routine"
            reasoning = (
                f"Screening detected patterns possibly associated with mild "
                f"diabetic retinopathy changes (model confidence: {confidence:.1%}). "
                "Routine ophthalmologist referral is recommended for monitoring."
            )

        else:
            # severity == 0 — STATE A
            priority  = "routine"
            reasoning = (
                f"No supported abnormality detected in this image "
                f"(model confidence: {confidence:.1%}). "
                "Routine follow-up as clinically appropriate is recommended."
            )

        # ── Risk factor adjustment ─────────────────────────────────
        if patient_risk_factors:
            priority, reasoning = self._adjust_for_risk_factors(
                priority, reasoning, patient_risk_factors, severity
            )

        # ── Acceptable quality but borderline → flag for review ───
        if image_quality == "acceptable" and quality_score < 0.7:
            requires_review = True
            reasoning += (
                " Clinical review is recommended due to suboptimal image quality."
            )

        return {
            "priority":              priority,
            "reasoning":             reasoning,
            "requires_human_review": requires_review,
        }

    # ──────────────────────────────────────────────────────────────────

    def _adjust_for_risk_factors(
        self,
        priority:     str,
        reasoning:    str,
        risk_factors: Dict,
        severity:     int,
    ) -> tuple:
        """Upgrade referral priority when patient has additional risk factors."""
        high_risk  = False
        risk_notes = []

        duration = risk_factors.get("diabetes_duration_years") or 0
        if duration > 10:
            high_risk = True
            risk_notes.append("long-standing diabetes (>10 years)")

        if risk_factors.get("has_hypertension") == "yes":
            high_risk = True
            risk_notes.append("concurrent hypertension")

        if risk_factors.get("previous_eye_exam") == "no":
            high_risk = True
            risk_notes.append("no previous eye examination")

        if high_risk and severity > 0:
            if priority == "routine":
                priority = "priority"
            elif priority == "priority":
                priority = "urgent"
            risk_text = " and ".join(risk_notes)
            reasoning += f" Patient has additional risk factors: {risk_text}."

        return priority, reasoning

    # ──────────────────────────────────────────────────────────────────

    def get_patient_friendly_message(self, priority: str, severity: int) -> str:
        """
        Generate a patient-friendly summary of screening result.

        Language is carefully chosen:
        - No absolute diagnostic claims
        - Encourages appropriate clinical follow-up
        - Does not alarm unnecessarily for negative results
        """
        if severity == 0:
            return (
                "The screening did not find any significant changes in the retinal images. "
                "Regular eye check-ups are still recommended as advised by your doctor."
            )
        elif severity == 1:
            return (
                "The screening found minor changes that warrant review by an eye specialist. "
                "Please schedule an appointment with an ophthalmologist."
            )
        elif severity == 2:
            return (
                "The screening found changes that need an eye specialist's examination soon. "
                "Please schedule an ophthalmologist appointment in the coming weeks."
            )
        elif severity >= 3:
            return (
                "The screening found significant changes that need prompt attention. "
                "Please see an ophthalmologist as soon as possible."
            )
        return (
            "Please consult your healthcare provider to discuss the screening result."
        )
