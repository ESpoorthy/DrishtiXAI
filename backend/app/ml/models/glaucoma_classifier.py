"""
Glaucoma Detection Classifier
Analyses retinal fundus images for glaucoma-related features.

Clinical scope:
  - Glaucoma is characterised by optic disc changes (cup-to-disc ratio),
    nerve fibre layer thinning, and parapapillary atrophy.
  - This module provides DECISION SUPPORT only — not a clinical diagnosis.

Severity levels:
  0 — No glaucoma indicators detected
  1 — Possible/suspect glaucoma — borderline features
  2 — Probable glaucoma — significant optic disc changes
  3 — Likely advanced glaucoma — severe structural changes

Demo mode analyses real image pixels for:
  - Optic disc cup-to-disc ratio proxy (bright central region vs disc region)
  - Neuroretinal rim texture (green channel variance inside disc area)
  - Parapapillary atrophy proxy (bright atrophic zones around disc)
  - Asymmetric disc pallor

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


class GlaucomaClassifier:
    """
    Glaucoma detection classifier.

    Demo mode: pixel-analysis heuristic on real image content.
    Real mode: EfficientNet-B0 trained on cup-to-disc ratio features.

    Returns severity 0–3 with confidence and safe screening messages.
    """

    CLASS_LABELS = {
        0: "No Glaucoma Indicators",
        1: "Possible Glaucoma (Suspect)",
        2: "Probable Glaucoma",
        3: "Likely Advanced Glaucoma",
    }

    SCREENING_MESSAGES = {
        0: "No supported glaucoma-related abnormality detected in this image",
        1: "Possible early glaucoma indicators detected — clinical review recommended",
        2: "Significant optic disc changes detected — priority ophthalmologist referral recommended",
        3: "Advanced glaucoma-like changes detected — urgent ophthalmologist review recommended",
    }

    # Cup-to-disc ratio reference ranges for guidance text
    CDR_GUIDANCE = {
        0: "Cup-to-disc ratio within normal range",
        1: "Cup-to-disc ratio may be borderline elevated",
        2: "Cup-to-disc ratio likely elevated (>0.7)",
        3: "Cup-to-disc ratio severely elevated — neuroretinal rim at risk",
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
            self.demo_mode = True  # force demo if weights unavailable

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
    # Model loading (real mode)
    # ──────────────────────────────────────────────────────────────────

    def _load_model(self, model_path: str) -> None:
        """Load pretrained EfficientNet-B0 with 4-class head."""
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
        """Run glaucoma classification on a fundus image."""
        if self.demo_mode:
            return self._image_based_predict(image_path)
        return self._real_predict(image_path)

    # ──────────────────────────────────────────────────────────────────
    # Real model inference
    # ──────────────────────────────────────────────────────────────────

    def _real_predict(self, image_path: str) -> Dict:
        from PIL import Image
        image = Image.open(image_path).convert("RGB")
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
        Pixel-level heuristics for glaucoma indicators:

        1. Cup-to-disc ratio proxy
           — Central bright zone (optic cup) vs surrounding disc ring
           — CDR > 0.6 is a classical glaucoma risk indicator
        2. Neuroretinal rim thinning proxy
           — Measure green channel (RNFL-sensitive) variance in disc annulus
           — Thinning → lower variance
        3. Parapapillary atrophy proxy
           — Bright crescent zones around the disc = beta-PPA
        4. Overall disc pallor
           — Glaucomatous discs show increased pallor (higher mean brightness)
        """
        img = cv2.imread(image_path)
        if img is None:
            return self._build_result(0, 0.55, self._uniform_probs(0, 0.55))

        h, w = img.shape[:2]
        gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        g_ch  = img[:, :, 1].astype(np.float32)

        # Define disc ROI — optic disc typically sits in temporal-nasal region
        # For a generic analysis we use the brightest circular region as proxy
        cy, cx = h // 2, w // 2

        # Estimate disc location as region of highest brightness
        blur = cv2.GaussianBlur(gray, (15, 15), 0)
        max_y, max_x = np.unravel_index(np.argmax(blur), blur.shape)

        # Disc radius ~15% of image shorter dimension
        disc_r = int(min(h, w) * 0.15)
        cup_r  = int(disc_r * 0.55)  # cup is roughly 55% of disc in normal eye

        y_grid, x_grid = np.ogrid[:h, :w]
        disc_mask = ((y_grid - max_y) ** 2 + (x_grid - max_x) ** 2) <= disc_r ** 2
        cup_mask  = ((y_grid - max_y) ** 2 + (x_grid - max_x) ** 2) <= cup_r  ** 2
        rim_mask  = disc_mask & ~cup_mask

        disc_px   = disc_mask.sum()
        cup_px    = cup_mask.sum()
        rim_px    = rim_mask.sum()

        # ── Feature 1: Cup brightness vs disc brightness (CDR proxy) ──
        cup_brightness  = float(np.mean(gray[cup_mask]))  if cup_px  > 0 else 0.0
        disc_brightness = float(np.mean(gray[disc_mask])) if disc_px > 0 else 0.0
        cdr_proxy = cup_brightness / (disc_brightness + 1.0)  # ≈ 0.4–0.5 normal

        # ── Feature 2: Neuroretinal rim green channel variance ──────
        # Low variance → possibly thinned/pale rim
        rim_green_var = float(np.var(g_ch[rim_mask])) if rim_px > 0 else 500.0
        # Normalise: typical range 200–1000; below 200 is suspicious
        rim_score = min(rim_green_var / 600.0, 1.0)

        # ── Feature 3: Parapapillary atrophy proxy ──────────────────
        # PPA ring: 1.1×disc_r to 1.4×disc_r from centre
        ppa_inner = int(disc_r * 1.1)
        ppa_outer = int(disc_r * 1.4)
        ppa_mask = (
            ((y_grid - max_y) ** 2 + (x_grid - max_x) ** 2) >= ppa_inner ** 2
        ) & (
            ((y_grid - max_y) ** 2 + (x_grid - max_x) ** 2) <= ppa_outer ** 2
        )
        ppa_brightness = float(np.mean(gray[ppa_mask])) if ppa_mask.sum() > 0 else 80.0
        ppa_score = max(0.0, (ppa_brightness - 100.0) / 100.0)  # high = PPA present

        # ── Composite glaucoma risk score ────────────────────────────
        # Higher score → more suspicious
        glaucoma_score = (
            max(0, cdr_proxy - 0.5) * 3.0   +   # CDR proxy contribution
            max(0, 1.0 - rim_score) * 2.5   +   # Rim thinning
            ppa_score * 1.5                      # PPA proxy
        )

        # ── Map score → severity ─────────────────────────────────────
        # GL raw score for a healthy eye: ~0.0–0.5
        # Suspect: ~0.5–1.5 | Probable: ~1.5–3.0 | Advanced: >3.0
        if glaucoma_score < 0.55:
            severity = 0
        elif glaucoma_score < 1.50:
            severity = 1
        elif glaucoma_score < 3.00:
            severity = 2
        else:
            severity = 3

        # ── Confidence: distance from nearest threshold ──────────────
        boundaries = [0.55, 1.50, 3.00]
        distances  = [abs(glaucoma_score - b) for b in boundaries]
        min_dist   = min(distances)
        confidence = 0.62 + min(min_dist / 0.12, 1.0) * 0.30

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
            "cdr_guidance":          self.CDR_GUIDANCE[severity],
            "confidence":            float(confidence),
            "class_probabilities":   class_probs,
            "requires_human_review": confidence < 0.70 or severity >= 2,
        }

    def _build_softmax_probs(self, predicted: int, confidence: float) -> Dict[str, float]:
        probs = [0.0] * 4
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
        }
