"""
Cataract Detection Classifier — Phase 2 Module
Analyses retinal/anterior segment images for cataract indicators.

PHASE 2 STATUS: This is a functional stub with pixel-heuristic demo mode.
Real model weights for cataract detection are not yet trained.
When real weights become available, set DEMO_MODE=False and provide model path.

Cataract indicators visible in fundus images:
  - Reduced fundus visibility / hazy red reflex
  - Decreased image contrast and saturation
  - Uniform grey veil over image (posterior sub-capsular / nuclear cataract)
  - Loss of vascular detail due to media opacity

Severity levels:
  0 — No cataract indicators detected
  1 — Possible/trace media opacity — early cataract suspect
  2 — Moderate opacity — significant visual impact likely
  3 — Dense opacity — severe cataract, likely vision-threatening

IMPORTANT: All results are DECISION SUPPORT — NOT DIAGNOSTIC.
           Not for clinical use. Research prototype only.
"""
import cv2
import numpy as np
from typing import Dict
from pathlib import Path

try:
    import torch
    import torch.nn as nn
    import torchvision.models as models
    import torchvision.transforms as transforms
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False
    torch = None       # type: ignore
    nn = None          # type: ignore
    models = None      # type: ignore
    transforms = None  # type: ignore


class CataractClassifier:
    """
    Cataract detection classifier — Phase 2.

    Demo mode: heuristic analysis of image clarity and media opacity proxies.
    Real mode: EfficientNet-B0 fine-tuned on cataract fundus dataset.

    Returns severity 0–3 with confidence and safe clinical language.
    """

    PHASE = "2"
    IS_PHASE2 = True  # Flag so callers can mark Phase 2 status in UI

    CLASS_LABELS = {
        0: "No Cataract Indicators",
        1: "Possible Trace Opacity",
        2: "Moderate Opacity",
        3: "Dense Opacity",
    }

    SCREENING_MESSAGES = {
        0: "No supported cataract-related opacity detected in this image",
        1: "Possible early media opacity detected — clinical review recommended",
        2: "Moderate media opacity detected — slit-lamp examination recommended",
        3: "Dense media opacity detected — urgent ophthalmologist referral recommended",
    }

    OPACITY_GUIDANCE = {
        0: "Image clarity within expected range",
        1: "Slight reduction in image clarity — possible early lens opacity",
        2: "Significant reduction in clarity — likely affects visual acuity",
        3: "Severe media opacity — likely significant vision impairment",
    }

    def __init__(self, model_path: str = None, demo_mode: bool = True):
        self.demo_mode  = demo_mode
        self.model_path = model_path
        self.device     = (
            torch.device("cuda" if torch.cuda.is_available() else "cpu")
            if _TORCH_AVAILABLE else None
        )
        self.model = None

        if not demo_mode and model_path and Path(model_path).exists() and _TORCH_AVAILABLE:
            self._load_model(model_path)
        else:
            self.demo_mode = True

        if _TORCH_AVAILABLE:
            self.transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ])

    # ──────────────────────────────────────────────────────────────────
    # Model loading (real mode — Phase 2)
    # ──────────────────────────────────────────────────────────────────

    def _load_model(self, model_path: str) -> None:
        """Load EfficientNet-B0 with 4-class cataract head."""
        self.model = models.efficientnet_b0(weights=None)
        num_features = self.model.classifier[1].in_features
        self.model.classifier[1] = nn.Linear(num_features, 4)
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint.get("model_state_dict", checkpoint))
        self.model.to(self.device)
        self.model.eval()

    # ──────────────────────────────────────────────────────────────────
    # Public predict
    # ──────────────────────────────────────────────────────────────────

    def predict(self, image_path: str) -> Dict:
        """Run cataract classification on a fundus/anterior segment image."""
        if self.demo_mode:
            return self._image_based_predict(image_path)
        return self._real_predict(image_path)

    # ──────────────────────────────────────────────────────────────────
    # Real model inference (Phase 2)
    # ──────────────────────────────────────────────────────────────────

    def _real_predict(self, image_path: str) -> Dict:
        from PIL import Image
        image  = Image.open(image_path).convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(tensor)
            probs   = torch.softmax(outputs, dim=1)
            pred    = torch.argmax(probs, dim=1).item()
            conf    = probs[0][pred].item()

        class_probs = {self.CLASS_LABELS[i]: float(probs[0][i].item()) for i in range(4)}
        return self._build_result(pred, conf, class_probs)

    # ──────────────────────────────────────────────────────────────────
    # Image-content-based demo prediction
    # ──────────────────────────────────────────────────────────────────

    def _image_based_predict(self, image_path: str) -> Dict:
        """
        Pixel-level cataract proxies (image quality / clarity metrics):

        1. Contrast loss — cataracts scatter light → reduced dynamic range
        2. Colour saturation loss — veiling glare desaturates image
        3. High-frequency detail loss — Laplacian energy decreases with opacity
        4. Grey-veil score — nuclear/PSC cataracts add uniform grey component
        5. Red channel dominance loss — normal fundus is red-dominant;
           cataractous media reduces this dominance

        IMPORTANT: These are image quality proxies, NOT trained cataract features.
        """
        img = cv2.imread(image_path)
        if img is None:
            return self._build_result(0, 0.55, self._uniform_probs(0, 0.55))

        # Keep gray as uint8 for OpenCV operations, float32 only for numpy math
        gray_u8  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)          # uint8
        gray     = gray_u8.astype(np.float32)
        hsv      = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
        r_ch     = img[:, :, 2].astype(np.float32)
        b_ch     = img[:, :, 0].astype(np.float32)

        # ── Feature 1: Contrast (std of grayscale) ───────────────────
        contrast = float(np.std(gray)) / 128.0  # normal ≈ 0.3–0.6

        # ── Feature 2: Saturation mean ───────────────────────────────
        saturation = float(np.mean(hsv[:, :, 1])) / 255.0  # 0–1, normal >0.25

        # ── Feature 3: High-frequency detail (Laplacian energy) ──────
        # Use uint8 input → CV_64F output (supported combination)
        lap = cv2.Laplacian(gray_u8, cv2.CV_64F)
        lap_energy = min(float(np.var(lap)) / 500.0, 1.0)  # normalised

        # ── Feature 4: Grey-veil (low saturation + mid brightness) ───
        mean_brightness = float(np.mean(gray)) / 255.0
        grey_veil = max(0.0, (0.5 - saturation) * (1.0 - abs(mean_brightness - 0.5) * 2))

        # ── Feature 5: Red dominance ratio ───────────────────────────
        mean_r = float(np.mean(r_ch))
        mean_b = float(np.mean(b_ch))
        red_dom = max(0.0, (mean_r - mean_b) / (mean_r + mean_b + 1.0))

        # ── Opacity score: lower clarity → higher opacity ─────────────
        # Inverse of quality features
        opacity_score = (
            max(0, 0.5 - contrast)   * 2.5 +   # low contrast
            max(0, 0.3 - saturation) * 3.0 +   # low saturation
            max(0, 0.5 - lap_energy) * 2.0 +   # blurry
            grey_veil                * 2.0 +   # grey veil
            max(0, 0.2 - red_dom)    * 1.5     # red dominance lost
        )

        # ── Map score → severity ──────────────────────────────────────
        # Thresholds raised — a clear, well-lit fundus image should score 0
        if opacity_score < 0.55:
            severity = 0
        elif opacity_score < 1.10:
            severity = 1
        elif opacity_score < 1.80:
            severity = 2
        else:
            severity = 3

        # ── Confidence ────────────────────────────────────────────────
        boundaries = [0.20, 0.50, 0.85]
        min_dist   = min(abs(opacity_score - b) for b in boundaries)
        confidence = 0.60 + min(min_dist / 0.12, 1.0) * 0.28

        class_probs = self._build_softmax_probs(severity, confidence)
        return self._build_result(severity, round(confidence, 3), class_probs)

    # ──────────────────────────────────────────────────────────────────
    # Result builder
    # ──────────────────────────────────────────────────────────────────

    def _build_result(self, severity: int, confidence: float,
                      class_probs: Dict[str, float]) -> Dict:
        return {
            "severity":              severity,
            "severity_label":        self.CLASS_LABELS[severity],
            "screening_message":     self.SCREENING_MESSAGES[severity],
            "opacity_guidance":      self.OPACITY_GUIDANCE[severity],
            "confidence":            float(confidence),
            "class_probabilities":   class_probs,
            "requires_human_review": confidence < 0.70 or severity >= 2,
            "is_phase2":             True,
        }

    def _build_softmax_probs(self, predicted: int, confidence: float) -> Dict[str, float]:
        probs     = [0.0] * 4
        remaining = 1.0 - confidence
        probs[predicted] = confidence
        weights = [(i, 1.0 / (abs(i - predicted) ** 2 + 1))
                   for i in range(4) if i != predicted]
        total_w = sum(w for _, w in weights)
        for i, w in weights:
            probs[i] = remaining * (w / total_w)
        total = sum(probs)
        probs = [p / total for p in probs]
        return {self.CLASS_LABELS[i]: round(probs[i], 4) for i in range(4)}

    def _uniform_probs(self, predicted: int, confidence: float) -> Dict[str, float]:
        return self._build_softmax_probs(predicted, confidence)

    def get_model_info(self) -> Dict:
        return {
            "architecture": "EfficientNet-B0",
            "num_classes":  4,
            "class_labels": self.CLASS_LABELS,
            "demo_mode":    self.demo_mode,
            "phase":        self.PHASE,
            "status":       "Phase 2 — functional stub, awaiting real model weights",
        }
