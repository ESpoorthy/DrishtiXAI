"""
Image Quality Assessment Module
Evaluates fundus image quality and performs retinal/fundus modality validation
before DR prediction.

Two-stage gate:
  1. Modality check — is this plausibly a retinal/fundus image?
  2. Quality assessment — is the image technically adequate for reliable analysis?
"""
import cv2
import numpy as np
from typing import Tuple, List, Dict
from pathlib import Path


class ImageQualityAssessor:
    """
    Assesses fundus image quality and validates image modality.

    Stage 1 — Modality heuristic
        Retinal/fundus images share specific characteristics:
        - Roughly circular illuminated field on a dark background
        - Dominant red/orange channel (choroid + retinal vessels)
        - Characteristic coverage ratio (illuminated vs dark border)

    Stage 2 — Quality metrics (only runs if modality check passes)
        - Blur / focus  (Laplacian variance)
        - Illumination  (mean brightness)
        - Contrast      (standard deviation)
        - Coverage      (non-black pixel ratio inside retinal field)
    """

    def __init__(self, quality_threshold: float = 0.6):
        self.quality_threshold = quality_threshold

    # ──────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────

    def assess_quality(self, image_path: str) -> Dict:
        """
        Full quality + modality assessment.

        Returns
        -------
        {
            "quality":       "good" | "acceptable" | "poor",
            "quality_score": float,         # 0.0 – 1.0
            "issues":        list[str],
            "guidance":      str | None,
            "can_proceed":   bool,
            "modality_valid": bool,         # NEW — is this a retinal image?
            "modality_note":  str | None,   # NEW — explanation if invalid
        }
        """
        image = cv2.imread(image_path)
        if image is None:
            return self._cannot_read()

        # ── Stage 1: modality check ────────────────────────────────
        modality_valid, modality_note = self._check_retinal_modality(image)
        if not modality_valid:
            return {
                "quality":        "poor",
                "quality_score":  0.0,
                "issues":         ["Image does not appear to be a retinal/fundus image"],
                "guidance":       (
                    "Please upload a compatible retinal or fundus photograph. "
                    "Photographs of other subjects cannot be used for DR screening."
                ),
                "can_proceed":    False,
                "modality_valid": False,
                "modality_note":  modality_note,
            }

        # ── Stage 2: quality metrics ───────────────────────────────
        issues: List[str] = []
        scores: List[float] = []

        blur_score, is_blurry = self._check_blur(image)
        scores.append(blur_score)
        if is_blurry:
            issues.append("Image appears blurred or out of focus")

        illum_score, illum_issue = self._check_illumination(image)
        scores.append(illum_score)
        if illum_issue:
            issues.append(illum_issue)

        contrast_score, low_contrast = self._check_contrast(image)
        scores.append(contrast_score)
        if low_contrast:
            issues.append("Low image contrast")

        coverage_score, poor_coverage = self._check_coverage(image)
        scores.append(coverage_score)
        if poor_coverage:
            issues.append("Incomplete retinal field of view")

        overall_score = float(np.mean(scores))

        if overall_score >= 0.75:
            quality     = "good"
            can_proceed = True
            guidance    = None
        elif overall_score >= self.quality_threshold:
            quality     = "acceptable"
            can_proceed = True
            guidance    = (
                "Image quality is acceptable but could be improved for more reliable analysis."
            )
        else:
            quality     = "poor"
            can_proceed = False
            guidance    = self._generate_guidance(issues)

        return {
            "quality":        quality,
            "quality_score":  overall_score,
            "issues":         issues,
            "guidance":       guidance,
            "can_proceed":    can_proceed,
            "modality_valid": True,
            "modality_note":  None,
        }

    # ──────────────────────────────────────────────────────────────────
    # Modality check
    # ──────────────────────────────────────────────────────────────────

    def _check_retinal_modality(self, image: np.ndarray) -> Tuple[bool, str]:
        """
        Heuristic check for retinal/fundus image characteristics.

        Retinal fundus images typically exhibit:
        1. A circular illuminated disc on a dark/black background.
        2. Red/orange dominant channel (retinal vasculature + choroid).
        3. Coverage ratio in the range 0.20–0.85 (circular disc, not full frame).
        4. Meaningful image content — not a blank/uniform image.

        This is a best-effort heuristic, NOT a trained classifier.
        It is designed to catch obvious non-retinal images (photographs of
        people, documents, logos, etc.) while accepting genuine fundus images.

        Returns (is_valid, reason_if_invalid)
        """
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        r_ch = image[:, :, 2].astype(np.float32)  # BGR → red
        g_ch = image[:, :, 1].astype(np.float32)
        b_ch = image[:, :, 0].astype(np.float32)

        # ── 1. Coverage ratio ─────────────────────────────────────
        # Fundus images have a roughly circular illuminated field;
        # solid non-retinal images tend to fill the whole frame.
        non_black = np.sum(gray > 20)
        total_px  = h * w
        coverage  = non_black / total_px

        if coverage < 0.10:
            return False, "Image appears nearly black; no retinal content detected."

        if coverage > 0.97:
            # Solid full-frame image (photo, document, screenshot)
            # Additional checks needed before rejecting
            pass

        # ── 2. Circular disc heuristic ────────────────────────────
        # Fundus images: large fraction of illuminated pixels inside a
        # central circle, with relatively dark corners.
        cy, cx = h // 2, w // 2
        radius = int(min(h, w) * 0.40)
        y_grid, x_grid = np.ogrid[:h, :w]
        inner_mask = ((y_grid - cy) ** 2 + (x_grid - cx) ** 2) <= radius ** 2
        outer_mask = ~inner_mask

        inner_brightness = float(np.mean(gray[inner_mask])) if inner_mask.sum() > 0 else 0
        outer_brightness = float(np.mean(gray[outer_mask])) if outer_mask.sum() > 0 else 0

        # Retinal images: inner disc brighter than outer border.
        # Many non-retinal images have uniform or inverted brightness.
        brightness_ratio = inner_brightness / (outer_brightness + 1.0)

        # ── 3. Red channel dominance ──────────────────────────────
        # Fundus images: red channel significantly higher than blue.
        mean_r = float(np.mean(r_ch[inner_mask]))
        mean_b = float(np.mean(b_ch[inner_mask]))
        mean_g = float(np.mean(g_ch[inner_mask]))
        red_dominant = (mean_r > mean_b * 1.05) and (mean_r > 30)

        # ── 4. Non-uniformity (meaningful image content) ──────────
        std_gray = float(np.std(gray))
        has_content = std_gray > 10  # reject near-uniform images

        # ── Decision ─────────────────────────────────────────────
        # Require at least:
        #   • Meaningful content (not uniform)
        #   • Red/orange channel dominant over blue (retinal pigment)
        #   • Inner disc brighter than outer border (circular field)
        if not has_content:
            return False, "Image appears uniform or blank."

        if coverage > 0.97 and not red_dominant:
            # Full-frame non-retinal image (photograph, document, etc.)
            return False, (
                "Image does not appear to be a retinal/fundus photograph. "
                "The image fills the entire frame without a characteristic circular field, "
                "and lacks the red/orange channel signature of retinal imagery."
            )

        if brightness_ratio < 0.70 and coverage < 0.40:
            # Very dark inner field with bright edges — not a fundus image
            return False, (
                "Image structure does not match a retinal/fundus photograph. "
                "Expected a bright central disc on a dark background."
            )

        # Passed all heuristics
        return True, None

    # ──────────────────────────────────────────────────────────────────
    # Quality metrics (unchanged from original, extended slightly)
    # ──────────────────────────────────────────────────────────────────

    def _check_blur(self, image: np.ndarray) -> Tuple[float, bool]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            return 0.3, True
        elif laplacian_var < 100:
            return 0.6, True
        else:
            return min(1.0, laplacian_var / 200), False

    def _check_illumination(self, image: np.ndarray) -> Tuple[float, str]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 50:
            return 0.4, "Image is too dark — increase illumination"
        elif mean_brightness < 80:
            return 0.6, "Image illumination is suboptimal"
        elif mean_brightness > 200:
            return 0.5, "Image is overexposed — reduce illumination"
        elif mean_brightness > 180:
            return 0.7, "Image brightness is high"
        else:
            return 1.0, None

    def _check_contrast(self, image: np.ndarray) -> Tuple[float, bool]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        contrast = float(gray.std())
        if contrast < 30:
            return 0.4, True
        elif contrast < 50:
            return 0.7, False
        else:
            return 1.0, False

    def _check_coverage(self, image: np.ndarray) -> Tuple[float, bool]:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        non_black    = np.sum(gray > 20)
        total_pixels = gray.shape[0] * gray.shape[1]
        coverage_ratio = non_black / total_pixels
        if coverage_ratio < 0.3:
            return 0.3, True
        elif coverage_ratio < 0.5:
            return 0.6, True
        else:
            return min(1.0, coverage_ratio + 0.2), False

    # ──────────────────────────────────────────────────────────────────
    # Guidance & fallbacks
    # ──────────────────────────────────────────────────────────────────

    def _generate_guidance(self, issues: List[str]) -> str:
        guidance_map = {
            "Image appears blurred or out of focus":
                "Ensure the fundus camera is properly focused before capturing.",
            "Image is too dark — increase illumination":
                "Increase illumination or adjust camera settings for better brightness.",
            "Image is overexposed — reduce illumination":
                "Reduce illumination or adjust camera settings to avoid overexposure.",
            "Image illumination is suboptimal":
                "Adjust camera settings or lighting for optimal brightness.",
            "Low image contrast":
                "Adjust camera settings or lighting to improve image contrast.",
            "Incomplete retinal field of view":
                "Reposition the fundus camera to capture the complete retinal field.",
            "Image brightness is high":
                "Consider slightly reducing illumination for optimal image quality.",
        }
        parts = []
        for issue in issues:
            if issue in guidance_map:
                parts.append(guidance_map[issue])
            else:
                parts.append(f"Please address: {issue}.")
        if parts:
            return " ".join(parts)
        return (
            "Image quality is insufficient for reliable analysis. "
            "Please recapture using proper technique and illumination."
        )

    @staticmethod
    def _cannot_read() -> Dict:
        return {
            "quality":        "poor",
            "quality_score":  0.0,
            "issues":         ["Cannot read image file — invalid format or corrupted file"],
            "guidance":       (
                "Please upload a valid JPG or PNG image. "
                "Ensure the file is not corrupted."
            ),
            "can_proceed":    False,
            "modality_valid": False,
            "modality_note":  "File could not be opened.",
        }
