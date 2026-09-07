"""
ML Pipeline component tests
"""
import pytest
import numpy as np
from PIL import Image
import tempfile
import os

from app.ml.quality import ImageQualityAssessor
from app.ml.models import DRClassifier
from app.services.referral_engine import ReferralEngine


class TestImageQualityAssessor:
    """Test image quality assessment"""
    
    @pytest.fixture
    def quality_assessor(self):
        """Create quality assessor instance"""
        return ImageQualityAssessor(quality_threshold=0.6)
    
    @pytest.fixture
    def test_image(self):
        """Create a test image"""
        # Create a simple test image
        img = Image.new('RGB', (512, 512), color='gray')
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            img.save(f.name)
            yield f.name
        os.unlink(f.name)
    
    def test_assess_valid_image(self, quality_assessor, test_image):
        """Test quality assessment on valid image"""
        result = quality_assessor.assess_quality(test_image)
        
        assert "quality" in result
        assert "quality_score" in result
        assert "issues" in result
        assert "can_proceed" in result
        
        assert result["quality"] in ["good", "acceptable", "poor"]
        assert 0 <= result["quality_score"] <= 1
        assert isinstance(result["issues"], list)
        assert isinstance(result["can_proceed"], bool)
    
    def test_assess_nonexistent_image(self, quality_assessor):
        """Test quality assessment handles missing file"""
        result = quality_assessor.assess_quality("nonexistent.jpg")
        
        assert result["quality"] == "poor"
        assert result["can_proceed"] is False
        assert "Cannot read image file" in result["issues"]


class TestDRClassifier:
    """Test DR classification model"""
    
    @pytest.fixture
    def classifier(self):
        """Create classifier in demo mode"""
        return DRClassifier(demo_mode=True)
    
    @pytest.fixture
    def test_image(self):
        """Create a test image"""
        img = Image.new('RGB', (224, 224), color='blue')
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            img.save(f.name)
            yield f.name
        os.unlink(f.name)
    
    def test_predict_demo_mode(self, classifier, test_image):
        """Test prediction in demo mode"""
        result = classifier.predict(test_image)
        
        assert "severity" in result
        assert "severity_label" in result
        assert "confidence" in result
        assert "class_probabilities" in result
        assert "requires_human_review" in result
        
        # Severity should be 0-4
        assert 0 <= result["severity"] <= 4
        
        # Confidence should be 0-1
        assert 0 <= result["confidence"] <= 1
        
        # Should have 5 class probabilities
        assert len(result["class_probabilities"]) == 5
        
        # Probabilities should sum to ~1
        prob_sum = sum(result["class_probabilities"].values())
        assert 0.99 <= prob_sum <= 1.01
    
    def test_model_info(self, classifier):
        """Test getting model information"""
        info = classifier.get_model_info()
        
        assert "architecture" in info
        assert "num_classes" in info
        assert "demo_mode" in info
        assert info["num_classes"] == 5
        assert info["demo_mode"] is True


class TestReferralEngine:
    """Test referral prioritization logic"""
    
    @pytest.fixture
    def referral_engine(self):
        """Create referral engine instance"""
        return ReferralEngine(
            urgent_severity_threshold=3,
            priority_severity_threshold=2,
            low_confidence_threshold=0.6
        )
    
    def test_urgent_referral_high_severity(self, referral_engine):
        """Test urgent referral for high severity"""
        result = referral_engine.determine_referral_priority(
            severity=4,  # Proliferative DR
            confidence=0.9,
            image_quality="good",
            quality_score=0.9
        )
        
        assert result["priority"] == "urgent"
        assert "requires_human_review" in result
    
    def test_priority_referral_moderate_severity(self, referral_engine):
        """Test priority referral for moderate severity"""
        result = referral_engine.determine_referral_priority(
            severity=2,  # Moderate NPDR
            confidence=0.85,
            image_quality="good",
            quality_score=0.85
        )
        
        assert result["priority"] == "priority"
    
    def test_routine_referral_no_dr(self, referral_engine):
        """Test routine referral for no DR"""
        result = referral_engine.determine_referral_priority(
            severity=0,  # No DR
            confidence=0.95,
            image_quality="good",
            quality_score=0.95
        )
        
        assert result["priority"] == "routine"
    
    def test_low_confidence_requires_review(self, referral_engine):
        """Test low confidence triggers human review"""
        result = referral_engine.determine_referral_priority(
            severity=1,
            confidence=0.5,  # Low confidence
            image_quality="good",
            quality_score=0.8
        )
        
        assert result["requires_human_review"] is True
        assert result["priority"] in ["priority", "urgent"]
    
    def test_poor_quality_requires_review(self, referral_engine):
        """Test poor quality triggers human review"""
        result = referral_engine.determine_referral_priority(
            severity=0,
            confidence=0.9,
            image_quality="poor",
            quality_score=0.3
        )
        
        assert result["requires_human_review"] is True
        assert result["priority"] == "priority"
    
    def test_risk_factors_upgrade_priority(self, referral_engine):
        """Test risk factors upgrade referral priority"""
        risk_factors = {
            "diabetes_duration_years": 15,
            "has_hypertension": "yes",
            "previous_eye_exam": "no"
        }
        
        result = referral_engine.determine_referral_priority(
            severity=1,  # Mild NPDR
            confidence=0.85,
            image_quality="good",
            quality_score=0.85,
            patient_risk_factors=risk_factors
        )
        
        # Should be upgraded from routine
        assert result["priority"] in ["priority", "urgent"]
    
    def test_patient_friendly_message(self, referral_engine):
        """Test patient-friendly message generation"""
        message = referral_engine.get_patient_friendly_message("urgent", 4)
        
        assert isinstance(message, str)
        assert len(message) > 0
        assert "specialist" in message.lower() or "doctor" in message.lower()
