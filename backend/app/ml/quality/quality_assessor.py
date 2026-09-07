"""
Image Quality Assessment Module
Evaluates fundus image quality before DR prediction
"""
import cv2
import numpy as np
from typing import Tuple, List, Dict
from pathlib import Path


class ImageQualityAssessor:
    """
    Assesses fundus image quality to determine if it's suitable for screening
    
    Checks for:
    - Blur/focus issues
    - Illumination problems
    - Contrast issues
    - Field of view coverage
    """
    
    def __init__(self, quality_threshold: float = 0.6):
        """
        Initialize quality assessor
        
        Args:
            quality_threshold: Minimum quality score to be considered acceptable (0.0-1.0)
        """
        self.quality_threshold = quality_threshold
        
    def assess_quality(self, image_path: str) -> Dict:
        """
        Comprehensive image quality assessment
        
        Args:
            image_path: Path to the fundus image
            
        Returns:
            Dictionary with quality assessment results
        """
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            return {
                "quality": "poor",
                "quality_score": 0.0,
                "issues": ["Cannot read image file"],
                "guidance": "Please check image file format and integrity.",
                "can_proceed": False
            }
        
        issues = []
        scores = []
        
        # Check 1: Blur detection
        blur_score, is_blurry = self._check_blur(image)
        scores.append(blur_score)
        if is_blurry:
            issues.append("Image appears blurred")
        
        # Check 2: Illumination
        illumination_score, illumination_issue = self._check_illumination(image)
        scores.append(illumination_score)
        if illumination_issue:
            issues.append(illumination_issue)
        
        # Check 3: Contrast
        contrast_score, low_contrast = self._check_contrast(image)
        scores.append(contrast_score)
        if low_contrast:
            issues.append("Low image contrast")
        
        # Check 4: Field of view coverage
        coverage_score, poor_coverage = self._check_coverage(image)
        scores.append(coverage_score)
        if poor_coverage:
            issues.append("Incomplete retinal field of view")
        
        # Calculate overall quality score (weighted average)
        overall_score = np.mean(scores)
        
        # Determine quality category
        if overall_score >= 0.75:
            quality = "good"
            can_proceed = True
            guidance = None
        elif overall_score >= self.quality_threshold:
            quality = "acceptable"
            can_proceed = True
            guidance = "Image quality is acceptable but could be improved for better analysis."
        else:
            quality = "poor"
            can_proceed = False
            guidance = self._generate_guidance(issues)
        
        return {
            "quality": quality,
            "quality_score": float(overall_score),
            "issues": issues,
            "guidance": guidance,
            "can_proceed": can_proceed
        }
    
    def _check_blur(self, image: np.ndarray) -> Tuple[float, bool]:
        """
        Check if image is blurry using Laplacian variance
        
        Returns:
            (score, is_blurry)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Normalize score (empirical thresholds for fundus images)
        # Typically, variance < 100 indicates blur
        if laplacian_var < 50:
            score = 0.3
            is_blurry = True
        elif laplacian_var < 100:
            score = 0.6
            is_blurry = True
        else:
            score = min(1.0, laplacian_var / 200)
            is_blurry = False
        
        return score, is_blurry
    
    def _check_illumination(self, image: np.ndarray) -> Tuple[float, str]:
        """
        Check illumination quality
        
        Returns:
            (score, issue_description)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mean_brightness = np.mean(gray)
        
        if mean_brightness < 50:
            return 0.4, "Image is too dark"
        elif mean_brightness < 80:
            return 0.6, "Image illumination is suboptimal"
        elif mean_brightness > 200:
            return 0.5, "Image is overexposed"
        elif mean_brightness > 180:
            return 0.7, "Image brightness is high"
        else:
            return 1.0, None
    
    def _check_contrast(self, image: np.ndarray) -> Tuple[float, bool]:
        """
        Check image contrast
        
        Returns:
            (score, has_low_contrast)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        contrast = gray.std()
        
        if contrast < 30:
            return 0.4, True
        elif contrast < 50:
            return 0.7, False
        else:
            return 1.0, False
    
    def _check_coverage(self, image: np.ndarray) -> Tuple[float, bool]:
        """
        Check if retinal field of view is adequately captured
        Simple heuristic based on non-black pixel ratio
        
        Returns:
            (score, has_poor_coverage)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Count non-black pixels (threshold at 20 to handle noise)
        non_black = np.sum(gray > 20)
        total_pixels = gray.shape[0] * gray.shape[1]
        coverage_ratio = non_black / total_pixels
        
        if coverage_ratio < 0.3:
            return 0.3, True
        elif coverage_ratio < 0.5:
            return 0.6, True
        else:
            return min(1.0, coverage_ratio + 0.2), False
    
    def _generate_guidance(self, issues: List[str]) -> str:
        """
        Generate user-friendly guidance for recapture based on detected issues
        """
        guidance_map = {
            "Image appears blurred": "Keep the camera steady and ensure proper focus before capturing.",
            "Image is too dark": "Increase illumination or adjust camera settings for better brightness.",
            "Image is overexposed": "Reduce illumination or adjust camera settings to avoid overexposure.",
            "Low image contrast": "Adjust camera settings or lighting to improve image contrast.",
            "Incomplete retinal field of view": "Reposition the camera to capture the complete retinal field.",
            "Image brightness is high": "Consider reducing illumination slightly for optimal image quality."
        }
        
        guidance_parts = []
        for issue in issues:
            if issue in guidance_map:
                guidance_parts.append(guidance_map[issue])
            else:
                guidance_parts.append(f"Address: {issue}")
        
        if guidance_parts:
            return " ".join(guidance_parts)
        else:
            return "Image quality is insufficient. Please recapture with proper technique and lighting."
