"""
Multi-Disease Risk Scoring Engine
Computes a composite risk score from DR, Glaucoma, Cataract results
plus patient clinical factors.

Score architecture
──────────────────
Component                        Max Points
─────────────────────────────────────────────
DR severity contribution              40
Glaucoma severity contribution        30
Cataract severity contribution        20
Patient clinical risk factors         30
Image quality penalty                 −10 max
─────────────────────────────────────────────
Maximum possible raw score           120
Normalised to 0–100

Risk categories
───────────────
  LOW    :  0 – 34
  MEDIUM : 35 – 64
  HIGH   : 65 – 100

IMPORTANT: This score is for DECISION SUPPORT only.
           It is NOT a medical risk calculator.
           Clinical judgement must always be applied.
"""
from typing import Dict, Optional


# ── Weights per disease ─────────────────────────────────────────────

DR_SEVERITY_POINTS = {0: 0, 1: 10, 2: 22, 3: 35, 4: 40}
GLAUCOMA_SEVERITY_POINTS = {0: 0, 1: 10, 2: 20, 3: 30}
CATARACT_SEVERITY_POINTS = {0: 0, 1: 7, 2: 14, 3: 20}

# ── Risk thresholds ─────────────────────────────────────────────────

RISK_LOW_MAX    = 34
RISK_MEDIUM_MAX = 64


class RiskScoringEngine:
    """
    Computes composite multi-disease risk score and category.

    Usage
    -----
    engine = RiskScoringEngine()
    result = engine.compute(
        dr_severity=2,
        dr_confidence=0.82,
        glaucoma_severity=1,
        glaucoma_confidence=0.71,
        cataract_severity=0,
        cataract_confidence=0.78,
        image_quality="acceptable",
        quality_score=0.68,
        patient_factors={
            "has_diabetes": "yes",
            "diabetes_duration_years": 12,
            "has_hypertension": "yes",
            "age": 58,
            "previous_eye_exam": "no",
            "family_history_glaucoma": "yes",
        }
    )
    """

    # ──────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────

    def compute(
        self,
        dr_severity:          int   = 0,
        dr_confidence:        float = 1.0,
        glaucoma_severity:    int   = 0,
        glaucoma_confidence:  float = 1.0,
        cataract_severity:    int   = 0,
        cataract_confidence:  float = 1.0,
        image_quality:        str   = "good",
        quality_score:        float = 1.0,
        patient_factors:      Optional[Dict] = None,
    ) -> Dict:
        """
        Compute composite risk score.

        Returns
        -------
        {
          "raw_score":       float,       # 0–120 before normalisation
          "score":           int,         # 0–100 normalised
          "category":        "low" | "medium" | "high",
          "category_label":  str,
          "breakdown":       dict,        # component scores
          "confidence_penalty": float,    # applied for low-confidence predictions
          "recommendation":  str,
          "factors_present": list[str],
        }
        """
        patient_factors = patient_factors or {}
        factors_present = []

        # ── Disease contribution ──────────────────────────────────────
        dr_raw       = DR_SEVERITY_POINTS.get(dr_severity, 0)
        glaucoma_raw = GLAUCOMA_SEVERITY_POINTS.get(glaucoma_severity, 0)
        cataract_raw = CATARACT_SEVERITY_POINTS.get(cataract_severity, 0)

        # Scale down by confidence (low confidence → reduce contribution)
        dr_pts       = dr_raw       * self._confidence_weight(dr_confidence)
        glaucoma_pts = glaucoma_raw * self._confidence_weight(glaucoma_confidence)
        cataract_pts = cataract_raw * self._confidence_weight(cataract_confidence)

        if dr_severity > 0:
            factors_present.append(f"DR severity {dr_severity} ({int(dr_confidence*100)}% confidence)")
        if glaucoma_severity > 0:
            factors_present.append(f"Glaucoma severity {glaucoma_severity} ({int(glaucoma_confidence*100)}% confidence)")
        if cataract_severity > 0:
            factors_present.append(f"Cataract severity {cataract_severity} ({int(cataract_confidence*100)}% confidence)")

        # ── Patient clinical factors (max 30 points) ─────────────────
        clinical_pts = 0.0

        # Diabetes
        has_diabetes = str(patient_factors.get("has_diabetes", "unknown")).lower()
        if has_diabetes in ("yes", "true", "1"):
            clinical_pts += 6
            factors_present.append("Known diabetes")

        # Diabetes duration
        duration = float(patient_factors.get("diabetes_duration_years") or 0)
        if duration >= 15:
            clinical_pts += 8
            factors_present.append(f"Long-standing diabetes ({int(duration)} years)")
        elif duration >= 10:
            clinical_pts += 5
            factors_present.append(f"Diabetes duration {int(duration)} years")
        elif duration >= 5:
            clinical_pts += 2

        # Hypertension
        hypertension = str(patient_factors.get("has_hypertension", "unknown")).lower()
        if hypertension in ("yes", "true", "1"):
            clinical_pts += 5
            factors_present.append("Hypertension")

        # Age (risk increases for elderly)
        age = int(patient_factors.get("age") or 0)
        if age >= 70:
            clinical_pts += 5
            factors_present.append(f"Age ≥70 ({age})")
        elif age >= 60:
            clinical_pts += 3
            factors_present.append(f"Age ≥60 ({age})")
        elif age >= 50:
            clinical_pts += 1

        # No previous eye exam
        prev_exam = str(patient_factors.get("previous_eye_exam", "unknown")).lower()
        if prev_exam in ("no", "false", "0"):
            clinical_pts += 3
            factors_present.append("No previous eye examination")

        # Family history of glaucoma
        fam_glaucoma = str(patient_factors.get("family_history_glaucoma", "unknown")).lower()
        if fam_glaucoma in ("yes", "true", "1"):
            clinical_pts += 3
            factors_present.append("Family history of glaucoma")

        clinical_pts = min(clinical_pts, 30.0)

        # ── Image quality penalty ─────────────────────────────────────
        quality_penalty = 0.0
        if image_quality == "poor":
            quality_penalty = 10.0
        elif image_quality == "acceptable" and quality_score < 0.65:
            quality_penalty = 5.0

        # ── Raw total ─────────────────────────────────────────────────
        raw_score = dr_pts + glaucoma_pts + cataract_pts + clinical_pts - quality_penalty
        raw_score = max(0.0, raw_score)

        # ── Normalise to 0–100 (max theoretical raw = 120) ───────────
        normalised = min(100, int(round(raw_score / 120.0 * 100)))

        # ── Category ──────────────────────────────────────────────────
        if normalised <= RISK_LOW_MAX:
            category       = "low"
            category_label = "Low Risk"
        elif normalised <= RISK_MEDIUM_MAX:
            category       = "medium"
            category_label = "Medium Risk"
        else:
            category       = "high"
            category_label = "High Risk"

        # ── Recommendation text ───────────────────────────────────────
        recommendation = self._get_recommendation(
            category, dr_severity, glaucoma_severity, cataract_severity
        )

        return {
            "raw_score":        round(raw_score, 1),
            "score":            normalised,
            "category":         category,
            "category_label":   category_label,
            "breakdown": {
                "dr_points":        round(dr_pts, 1),
                "glaucoma_points":  round(glaucoma_pts, 1),
                "cataract_points":  round(cataract_pts, 1),
                "clinical_points":  round(clinical_pts, 1),
                "quality_penalty":  round(quality_penalty, 1),
            },
            "recommendation":   recommendation,
            "factors_present":  factors_present,
        }

    # ──────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────

    @staticmethod
    def _confidence_weight(confidence: float) -> float:
        """
        Scale disease contribution by confidence.
        confidence ≥ 0.80 → full weight (1.0)
        confidence 0.60–0.79 → partial weight
        confidence < 0.60  → reduced weight (0.5)
        """
        if confidence >= 0.80:
            return 1.0
        elif confidence >= 0.60:
            return 0.5 + (confidence - 0.60) * 2.5
        else:
            return 0.5

    @staticmethod
    def _get_recommendation(
        category: str,
        dr_severity: int,
        glaucoma_severity: int,
        cataract_severity: int,
    ) -> str:
        """Generate safe, non-diagnostic recommendation text."""

        parts = []

        if category == "high":
            parts.append(
                "This screening indicates a HIGH risk profile. "
                "Prompt ophthalmologist referral is strongly recommended."
            )
        elif category == "medium":
            parts.append(
                "This screening indicates a MEDIUM risk profile. "
                "An ophthalmologist appointment within the next few weeks is recommended."
            )
        else:
            parts.append(
                "This screening indicates a LOW risk profile at this time. "
                "Routine follow-up as clinically advised is recommended."
            )

        # Disease-specific additions
        disease_notes = []
        if dr_severity >= 3:
            disease_notes.append("severe diabetic retinopathy changes")
        elif dr_severity >= 1:
            disease_notes.append("diabetic retinopathy indicators")

        if glaucoma_severity >= 2:
            disease_notes.append("significant glaucoma-related optic disc changes")
        elif glaucoma_severity == 1:
            disease_notes.append("possible early glaucoma indicators")

        if cataract_severity >= 2:
            disease_notes.append("significant lens opacity")
        elif cataract_severity == 1:
            disease_notes.append("possible early cataract changes")

        if disease_notes:
            note_str = " and ".join(disease_notes)
            parts.append(
                f"Screening detected {note_str}. "
                "Clinical evaluation is required to confirm these findings."
            )

        parts.append(
            "This score is generated by an AI screening system "
            "and is NOT a clinical diagnosis. A qualified clinician must evaluate all results."
        )

        return " ".join(parts)
