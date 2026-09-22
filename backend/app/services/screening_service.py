"""
Screening Service — Multi-Disease Pipeline
Orchestrates DR + Glaucoma + Cataract (Phase 2) + Risk Scoring.

Pipeline
────────
1. Image Quality Assessment (includes modality check)
2. DR Classification
3. Glaucoma Classification
4. Cataract Classification (Phase 2)
5. Explainability (Grad-CAM on DR result)
6. Risk Score Computation
7. Referral Prioritisation
"""
import os
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

from ..ml.quality import ImageQualityAssessor
from ..ml.models import DRClassifier
from ..ml.models.glaucoma_classifier import GlaucomaClassifier
from ..ml.models.cataract_classifier import CataractClassifier
from ..ml.xai import ExplainabilityEngine
from .referral_engine import ReferralEngine
from .risk_scoring import RiskScoringEngine
from ..core.config import settings


class ScreeningService:
    """
    Complete multi-disease screening pipeline orchestrator.

    All classifiers run in demo mode unless real weights are supplied.
    Results are for research / decision-support only — NOT clinical use.
    """

    def __init__(self):
        self.quality_assessor = ImageQualityAssessor(
            quality_threshold=settings.QUALITY_THRESHOLD
        )

        self.dr_classifier = DRClassifier(
            model_path=None,
            demo_mode=settings.DEMO_MODE
        )

        self.glaucoma_classifier = GlaucomaClassifier(
            model_path=None,
            demo_mode=settings.DEMO_MODE
        )

        self.cataract_classifier = CataractClassifier(
            model_path=None,
            demo_mode=settings.DEMO_MODE
        )

        self.explainability = ExplainabilityEngine(
            model=self.dr_classifier.model,
            demo_mode=settings.DEMO_MODE
        )

        self.referral_engine = ReferralEngine(
            urgent_severity_threshold=settings.URGENT_REFERRAL_SEVERITY,
            priority_severity_threshold=settings.PRIORITY_REFERRAL_SEVERITY,
            low_confidence_threshold=settings.LOW_CONFIDENCE_THRESHOLD
        )

        self.risk_engine = RiskScoringEngine()

    # ──────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────

    def process_screening(
        self,
        image_path: str,
        patient_risk_factors: Optional[Dict] = None
    ) -> Dict:
        """
        Run the full multi-disease screening pipeline.

        Returns
        -------
        {
          "status":             "analyzed" | "quality_check_failed",
          "quality":            {...},
          "prediction":         {...},      # DR result
          "glaucoma":           {...},      # Glaucoma result
          "cataract":           {...},      # Cataract (Phase 2) result
          "explanation":        {...},
          "risk_score":         {...},
          "referral":           {...},
          "model_version":      str,
          "is_demo_mode":       bool,
          "timestamp":          str,
        }
        """
        # ── Step 1: Quality & modality check ─────────────────────────
        quality_result = self.quality_assessor.assess_quality(image_path)

        if not quality_result["can_proceed"]:
            modality_valid = quality_result.get("modality_valid", True)
            reasoning = (
                "This image does not appear to be a compatible retinal/fundus photograph. "
                "Please upload a suitable fundus image for screening."
                if not modality_valid
                else "Image quality is insufficient for reliable analysis. "
                     "Please upload a clearer retinal image."
            )
            return {
                "status":        "quality_check_failed",
                "quality":       quality_result,
                "prediction":    None,
                "glaucoma":      None,
                "cataract":      None,
                "explanation":   None,
                "risk_score":    None,
                "referral": {
                    "priority":              "priority",
                    "reasoning":             reasoning,
                    "requires_human_review": True,
                },
                "model_version": settings.MODEL_VERSION,
                "is_demo_mode":  settings.DEMO_MODE,
            }

        # ── Step 2: DR Classification ─────────────────────────────────
        dr_result = self.dr_classifier.predict(image_path)

        # ── Step 3: Glaucoma Classification ──────────────────────────
        glaucoma_result = self.glaucoma_classifier.predict(image_path)

        # ── Step 4: Cataract Classification (Phase 2) ────────────────
        cataract_result = self.cataract_classifier.predict(image_path)

        # ── Step 5: Explainability (Grad-CAM on DR) ───────────────────
        explanation_path = self._get_explanation_path(image_path)
        explanation_result = self.explainability.generate_explanation(
            image_path=image_path,
            predicted_class=dr_result["severity"],
            severity_label=dr_result["severity_label"],
            save_path=explanation_path
        )

        # ── Step 6: Risk Scoring ──────────────────────────────────────
        patient_factors = patient_risk_factors or {}
        risk_result = self.risk_engine.compute(
            dr_severity=dr_result["severity"],
            dr_confidence=dr_result["confidence"],
            glaucoma_severity=glaucoma_result["severity"],
            glaucoma_confidence=glaucoma_result["confidence"],
            cataract_severity=cataract_result["severity"],
            cataract_confidence=cataract_result["confidence"],
            image_quality=quality_result["quality"],
            quality_score=quality_result["quality_score"],
            patient_factors=patient_factors,
        )

        # ── Step 7: Referral Prioritisation (based on DR + risk) ─────
        # Upgrade referral if glaucoma is significant
        referral_result = self.referral_engine.determine_referral_priority(
            severity=dr_result["severity"],
            confidence=dr_result["confidence"],
            image_quality=quality_result["quality"],
            quality_score=quality_result["quality_score"],
            patient_risk_factors=patient_risk_factors
        )

        # Upgrade referral priority if glaucoma or cataract are severe
        referral_result = self._upgrade_referral_for_multi_disease(
            referral_result, glaucoma_result, cataract_result, risk_result
        )

        return {
            "status":        "analyzed",
            "quality":       quality_result,
            "prediction":    dr_result,
            "glaucoma":      glaucoma_result,
            "cataract":      cataract_result,
            "explanation":   explanation_result,
            "risk_score":    risk_result,
            "referral":      referral_result,
            "model_version": settings.MODEL_VERSION,
            "is_demo_mode":  settings.DEMO_MODE,
            "timestamp":     datetime.utcnow().isoformat(),
        }

    # ──────────────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────────────

    def _get_explanation_path(self, image_path: str) -> str:
        p = Path(image_path)
        return str(p.parent / f"{p.stem}_explanation.jpg")

    def _upgrade_referral_for_multi_disease(
        self,
        referral: Dict,
        glaucoma: Dict,
        cataract: Dict,
        risk: Dict,
    ) -> Dict:
        """
        Potentially upgrade referral priority based on multi-disease findings.
        Uses safe clinical language throughout.
        """
        current = referral["priority"]
        notes = []

        # Glaucoma severity ≥ 2 → at minimum priority
        if glaucoma["severity"] >= 2:
            if current == "routine":
                current = "priority"
            notes.append(
                f"Possible glaucoma indicators detected "
                f"({glaucoma['severity_label']}, "
                f"confidence {glaucoma['confidence']:.0%})."
            )

        # Glaucoma severity 3 → urgent
        if glaucoma["severity"] >= 3:
            current = "urgent"

        # Cataract severity ≥ 2 → bump routine → priority
        if cataract["severity"] >= 2 and current == "routine":
            current = "priority"
            notes.append(
                f"Possible cataract-related opacity detected "
                f"({cataract['severity_label']}, Phase 2 module)."
            )

        # High risk score → minimum priority referral
        if risk["category"] == "high" and current == "routine":
            current = "priority"
            notes.append("Overall composite risk score is HIGH.")

        if notes:
            extra = " Additionally: " + " ".join(notes)
            referral = dict(referral)  # copy
            referral["reasoning"] = referral["reasoning"] + extra
            referral["priority"]  = current
            referral["requires_human_review"] = (
                referral["requires_human_review"] or
                glaucoma["severity"] >= 2 or
                cataract["severity"] >= 2
            )

        return referral

    def get_patient_friendly_summary(
        self,
        prediction_severity: int,
        referral_priority: str
    ) -> str:
        return self.referral_engine.get_patient_friendly_message(
            referral_priority, prediction_severity
        )

    # Legacy alias kept for backwards compatibility
    @property
    def classifier(self):
        return self.dr_classifier
