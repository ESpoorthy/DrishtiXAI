"""
Referral Prioritization Engine
Decision support system for determining referral priority
"""
from typing import Dict, Optional


class ReferralEngine:
    """
    Referral prioritization engine for DR screening
    
    Combines multiple factors to recommend referral priority:
    - Predicted DR severity
    - Model confidence
    - Image quality
    - Patient risk factors (optional)
    
    IMPORTANT: This is decision support, not medical diagnosis
    """
    
    def __init__(
        self,
        urgent_severity_threshold: int = 3,
        priority_severity_threshold: int = 2,
        low_confidence_threshold: float = 0.6
    ):
        """
        Initialize referral engine
        
        Args:
            urgent_severity_threshold: Severity level requiring urgent referral (default: 3 = Severe NPDR)
            priority_severity_threshold: Severity level requiring priority referral (default: 2 = Moderate NPDR)
            low_confidence_threshold: Confidence below which human review is required
        """
        self.urgent_severity_threshold = urgent_severity_threshold
        self.priority_severity_threshold = priority_severity_threshold
        self.low_confidence_threshold = low_confidence_threshold
    
    def determine_referral_priority(
        self,
        severity: int,
        confidence: float,
        image_quality: str,
        quality_score: float,
        patient_risk_factors: Optional[Dict] = None
    ) -> Dict:
        """
        Determine referral priority based on multiple factors
        
        Args:
            severity: Predicted DR severity (0-4)
            confidence: Model confidence (0.0-1.0)
            image_quality: Image quality category ("good", "acceptable", "poor")
            quality_score: Image quality score (0.0-1.0)
            patient_risk_factors: Optional dict with patient risk information
            
        Returns:
            Dictionary with referral priority and reasoning
        """
        # If image quality is poor, cannot make reliable referral decision
        if image_quality == "poor":
            return {
                "priority": "priority",
                "reasoning": (
                    "Image quality is insufficient for reliable screening. "
                    "Priority referral recommended for clinical assessment."
                ),
                "requires_human_review": True
            }
        
        # If confidence is low, require human review
        if confidence < self.low_confidence_threshold:
            return {
                "priority": "priority",
                "reasoning": (
                    f"Model confidence is low ({confidence:.1%}). "
                    "Priority referral and clinical review recommended."
                ),
                "requires_human_review": True
            }
        
        # Base referral priority on severity
        if severity >= self.urgent_severity_threshold:
            # Severe NPDR or Proliferative DR
            priority = "urgent"
            reasoning = (
                f"Screening suggests severe diabetic retinopathy changes "
                f"(confidence: {confidence:.1%}). "
                "Urgent ophthalmologist review recommended to assess need for immediate intervention."
            )
            requires_review = False
        elif severity >= self.priority_severity_threshold:
            # Moderate NPDR
            priority = "priority"
            reasoning = (
                f"Screening suggests moderate diabetic retinopathy changes "
                f"(confidence: {confidence:.1%}). "
                "Priority ophthalmologist referral recommended for comprehensive examination."
            )
            requires_review = False
        elif severity == 1:
            # Mild NPDR
            priority = "routine"
            reasoning = (
                f"Screening suggests mild diabetic retinopathy changes "
                f"(confidence: {confidence:.1%}). "
                "Routine ophthalmologist referral recommended for monitoring."
            )
            requires_review = False
        else:
            # No DR
            priority = "routine"
            reasoning = (
                f"No significant diabetic retinopathy changes detected "
                f"(confidence: {confidence:.1%}). "
                "Routine annual screening recommended as per guidelines."
            )
            requires_review = False
        
        # Consider patient risk factors if provided
        if patient_risk_factors:
            priority, reasoning = self._adjust_for_risk_factors(
                priority, reasoning, patient_risk_factors, severity
            )
        
        # Low quality even if acceptable might warrant review
        if image_quality == "acceptable" and quality_score < 0.7:
            requires_review = True
            reasoning += " Clinical review recommended due to suboptimal image quality."
        
        return {
            "priority": priority,
            "reasoning": reasoning,
            "requires_human_review": requires_review
        }
    
    def _adjust_for_risk_factors(
        self,
        priority: str,
        reasoning: str,
        risk_factors: Dict,
        severity: int
    ) -> tuple:
        """
        Adjust referral priority based on patient risk factors
        
        Args:
            priority: Current priority level
            reasoning: Current reasoning
            risk_factors: Patient risk factors
            severity: Predicted severity
            
        Returns:
            (adjusted_priority, adjusted_reasoning)
        """
        high_risk = False
        risk_notes = []
        
        # Long-standing diabetes
        if risk_factors.get("diabetes_duration_years", 0) > 10:
            high_risk = True
            risk_notes.append("long-standing diabetes (>10 years)")
        
        # Hypertension
        if risk_factors.get("has_hypertension") == "yes":
            high_risk = True
            risk_notes.append("concurrent hypertension")
        
        # No previous eye examination
        if risk_factors.get("previous_eye_exam") == "no":
            high_risk = True
            risk_notes.append("no previous eye examination")
        
        # Upgrade priority if high-risk patient
        if high_risk and severity > 0:
            if priority == "routine":
                priority = "priority"
            elif priority == "priority":
                priority = "urgent"
            
            risk_text = " and ".join(risk_notes)
            reasoning += f" Patient has additional risk factors: {risk_text}."
        
        return priority, reasoning
    
    def get_patient_friendly_message(self, priority: str, severity: int) -> str:
        """
        Generate patient-friendly message about screening result
        
        Args:
            priority: Referral priority
            severity: DR severity level
            
        Returns:
            Simple, clear message for patients
        """
        if severity == 0:
            return (
                "The screening did not find significant changes in your eyes. "
                "Continue regular check-ups as recommended by your doctor."
            )
        elif severity == 1:
            return (
                "The screening found minor changes that need an eye specialist's review. "
                "Please schedule an appointment with an ophthalmologist."
            )
        elif severity == 2:
            return (
                "The screening found changes that require an eye specialist's examination soon. "
                "Please schedule an ophthalmologist appointment within the next few weeks."
            )
        elif severity >= 3:
            return (
                "The screening found significant changes that need urgent attention. "
                "Please see an ophthalmologist as soon as possible."
            )
        
        return "Please consult with your healthcare provider about the screening results."
