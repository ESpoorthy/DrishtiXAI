"""
Screening Service
Orchestrates the complete DR screening pipeline
"""
import os
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

from ..ml.quality import ImageQualityAssessor
from ..ml.models import DRClassifier
from ..ml.xai import ExplainabilityEngine
from .referral_engine import ReferralEngine
from ..core.config import settings


class ScreeningService:
    """
    Complete DR screening pipeline orchestrator
    
    Pipeline:
    1. Image Quality Assessment
    2. DR Classification (if quality sufficient)
    3. Explainability Generation
    4. Referral Prioritization
    """
    
    def __init__(self):
        """Initialize screening service with all components"""
        # Initialize components
        self.quality_assessor = ImageQualityAssessor(
            quality_threshold=settings.QUALITY_THRESHOLD
        )
        
        self.classifier = DRClassifier(
            model_path=None,  # Use demo mode by default
            demo_mode=settings.DEMO_MODE
        )
        
        self.explainability = ExplainabilityEngine(
            model=self.classifier.model,
            demo_mode=settings.DEMO_MODE
        )
        
        self.referral_engine = ReferralEngine(
            urgent_severity_threshold=settings.URGENT_REFERRAL_SEVERITY,
            priority_severity_threshold=settings.PRIORITY_REFERRAL_SEVERITY,
            low_confidence_threshold=settings.LOW_CONFIDENCE_THRESHOLD
        )
    
    def process_screening(
        self,
        image_path: str,
        patient_risk_factors: Optional[Dict] = None
    ) -> Dict:
        """
        Process complete screening pipeline
        
        Args:
            image_path: Path to fundus image
            patient_risk_factors: Optional patient risk information
            
        Returns:
            Dictionary with complete screening results
        """
        # Step 1: Image Quality Assessment (includes modality check)
        quality_result = self.quality_assessor.assess_quality(image_path)

        # If quality/modality check failed, stop here
        if not quality_result["can_proceed"]:
            modality_valid = quality_result.get("modality_valid", True)
            if not modality_valid:
                reasoning = (
                    "This image does not appear to be a compatible retinal/fundus photograph. "
                    "Please upload a suitable fundus image for DR screening."
                )
            else:
                reasoning = (
                    "Image quality is insufficient for reliable analysis. "
                    "Please upload a clearer retinal image."
                )
            return {
                "status": "quality_check_failed",
                "quality": quality_result,
                "prediction": None,
                "explanation": None,
                "referral": {
                    "priority": "priority",
                    "reasoning": reasoning,
                    "requires_human_review": True,
                },
                "model_version": settings.MODEL_VERSION,
                "is_demo_mode": settings.DEMO_MODE,
            }
        
        # Step 2: DR Classification
        prediction_result = self.classifier.predict(image_path)
        
        # Step 3: Generate Explanation
        explanation_path = self._get_explanation_path(image_path)
        explanation_result = self.explainability.generate_explanation(
            image_path=image_path,
            predicted_class=prediction_result["severity"],
            severity_label=prediction_result["severity_label"],
            save_path=explanation_path
        )
        
        # Step 4: Referral Prioritization
        referral_result = self.referral_engine.determine_referral_priority(
            severity=prediction_result["severity"],
            confidence=prediction_result["confidence"],
            image_quality=quality_result["quality"],
            quality_score=quality_result["quality_score"],
            patient_risk_factors=patient_risk_factors
        )
        
        # Compile complete result
        return {
            "status": "analyzed",
            "quality": quality_result,
            "prediction": prediction_result,
            "explanation": explanation_result,
            "referral": referral_result,
            "model_version": settings.MODEL_VERSION,
            "is_demo_mode": settings.DEMO_MODE,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _get_explanation_path(self, image_path: str) -> str:
        """
        Generate path for explanation heatmap image
        
        Args:
            image_path: Original image path
            
        Returns:
            Path where explanation should be saved
        """
        image_path_obj = Path(image_path)
        filename = image_path_obj.stem
        explanation_filename = f"{filename}_explanation.jpg"
        
        # Save in same directory as original
        explanation_path = image_path_obj.parent / explanation_filename
        
        return str(explanation_path)
    
    def get_patient_friendly_summary(
        self,
        prediction_severity: int,
        referral_priority: str
    ) -> str:
        """
        Generate patient-friendly summary
        
        Args:
            prediction_severity: Predicted severity level
            referral_priority: Referral priority
            
        Returns:
            Simple message for patients/health workers
        """
        return self.referral_engine.get_patient_friendly_message(
            referral_priority, prediction_severity
        )
