"""
Grad-CAM (Gradient-weighted Class Activation Mapping) for Explainability
Generates visual explanations showing which regions the model focused on
"""
import torch
import torch.nn.functional as F
import cv2
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from typing import Tuple, Dict, Optional
from pathlib import Path


class GradCAM:
    """
    Grad-CAM implementation for visual explanations
    
    Highlights regions in the fundus image that influenced the model's prediction
    """
    
    def __init__(self, model, target_layer):
        """
        Initialize Grad-CAM
        
        Args:
            model: PyTorch model
            target_layer: Layer to compute gradients from (typically last conv layer)
        """
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        self._register_hooks()
    
    def _register_hooks(self):
        """Register forward and backward hooks"""
        def forward_hook(module, input, output):
            self.activations = output.detach()
        
        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()
        
        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)
    
    def generate_cam(self, input_tensor: torch.Tensor, target_class: int) -> np.ndarray:
        """
        Generate Class Activation Map
        
        Args:
            input_tensor: Preprocessed input image tensor
            target_class: Target class to generate CAM for
            
        Returns:
            CAM heatmap as numpy array
        """
        # Forward pass
        output = self.model(input_tensor)
        
        # Zero gradients
        self.model.zero_grad()
        
        # Backward pass for target class
        class_score = output[0, target_class]
        class_score.backward()
        
        # Calculate weights
        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        
        # Generate CAM
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)
        cam = F.relu(cam)  # Apply ReLU
        
        # Normalize
        cam = cam.squeeze().cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        
        return cam
    
    def generate_heatmap_overlay(
        self, 
        original_image_path: str, 
        cam: np.ndarray,
        alpha: float = 0.5
    ) -> np.ndarray:
        """
        Create heatmap overlay on original image
        
        Args:
            original_image_path: Path to original image
            cam: Class activation map
            alpha: Transparency of overlay (0-1)
            
        Returns:
            Overlay image as numpy array
        """
        # Load original image
        original = cv2.imread(original_image_path)
        original = cv2.cvtColor(original, cv2.COLOR_BGR2RGB)
        h, w = original.shape[:2]
        
        # Resize CAM to match original image size
        cam_resized = cv2.resize(cam, (w, h))
        
        # Convert CAM to heatmap
        heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Create overlay
        overlay = cv2.addWeighted(original, 1-alpha, heatmap, alpha, 0)
        
        return overlay


class ExplainabilityEngine:
    """
    High-level explainability engine for DR predictions
    Handles both real model explanations and demo mode
    """
    
    def __init__(self, model=None, demo_mode: bool = True):
        """
        Initialize explainability engine
        
        Args:
            model: PyTorch model (optional)
            demo_mode: If True, generates synthetic explanations
        """
        self.demo_mode = demo_mode
        self.model = model
        
        if not demo_mode and model is not None:
            # Get last convolutional layer for Grad-CAM
            target_layer = self._get_target_layer(model)
            self.gradcam = GradCAM(model, target_layer)
        else:
            self.gradcam = None
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def _get_target_layer(self, model):
        """Get the last convolutional layer from model"""
        # For EfficientNet, target the last layer of features
        return model.features[-1]
    
    def generate_explanation(
        self, 
        image_path: str, 
        predicted_class: int,
        severity_label: str,
        save_path: Optional[str] = None
    ) -> Dict:
        """
        Generate visual explanation for prediction
        
        Args:
            image_path: Path to fundus image
            predicted_class: Predicted class index
            severity_label: Severity label string
            save_path: Optional path to save explanation image
            
        Returns:
            Dictionary with explanation results
        """
        if self.demo_mode:
            return self._generate_demo_explanation(
                image_path, predicted_class, severity_label, save_path
            )
        else:
            return self._generate_real_explanation(
                image_path, predicted_class, severity_label, save_path
            )
    
    def _generate_real_explanation(
        self, 
        image_path: str, 
        predicted_class: int,
        severity_label: str,
        save_path: Optional[str] = None
    ) -> Dict:
        """Generate real Grad-CAM explanation"""
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0)
        
        # Generate CAM
        cam = self.gradcam.generate_cam(image_tensor, predicted_class)
        
        # Create overlay
        overlay = self.gradcam.generate_heatmap_overlay(image_path, cam, alpha=0.5)
        
        # Save if path provided
        if save_path:
            Image.fromarray(overlay).save(save_path)
        
        # Identify attention regions
        attention_regions = self._identify_attention_regions(cam)
        
        # Generate summary
        summary = self._generate_explanation_summary(
            severity_label, attention_regions, predicted_class
        )
        
        return {
            "has_explanation": True,
            "explanation_path": save_path,
            "attention_regions": attention_regions,
            "summary": summary
        }
    
    def _generate_demo_explanation(
        self, 
        image_path: str, 
        predicted_class: int,
        severity_label: str,
        save_path: Optional[str] = None
    ) -> Dict:
        """
        Generate synthetic explanation for demo mode
        
        IMPORTANT: This is for demonstration only
        """
        # Load original image
        original = cv2.imread(image_path)
        original = cv2.cvtColor(original, cv2.COLOR_BGR2RGB)
        h, w = original.shape[:2]
        
        # Create synthetic attention map (centered with some randomness)
        cam = self._create_synthetic_attention(h, w, predicted_class)
        
        # Create heatmap
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Create overlay
        overlay = cv2.addWeighted(original, 0.5, heatmap, 0.5, 0)
        
        # Save if path provided
        if save_path:
            Image.fromarray(overlay).save(save_path)
        
        # Generate demo attention regions
        attention_regions = self._generate_demo_attention_regions(predicted_class)
        
        # Generate summary
        summary = self._generate_explanation_summary(
            severity_label, attention_regions, predicted_class
        )
        
        return {
            "has_explanation": True,
            "explanation_path": save_path,
            "attention_regions": attention_regions,
            "summary": summary
        }
    
    def _create_synthetic_attention(self, h: int, w: int, severity: int) -> np.ndarray:
        """Create synthetic attention map for demo"""
        cam = np.zeros((h, w), dtype=np.float32)
        
        # More severe cases have more distributed attention
        num_regions = min(severity + 1, 3)
        
        for _ in range(num_regions):
            # Random center
            cx = np.random.randint(w // 4, 3 * w // 4)
            cy = np.random.randint(h // 4, 3 * h // 4)
            
            # Create Gaussian blob
            y, x = np.ogrid[:h, :w]
            radius = min(h, w) // 6
            mask = ((x - cx) ** 2 + (y - cy) ** 2) <= radius ** 2
            cam[mask] += np.random.uniform(0.5, 1.0)
        
        # Normalize
        cam = np.clip(cam, 0, 1)
        return cam
    
    def _identify_attention_regions(self, cam: np.ndarray) -> list:
        """Identify high-attention regions from CAM"""
        # Find regions with attention > 0.7
        threshold = 0.7
        high_attention = cam > threshold
        
        regions = []
        if high_attention.sum() > (cam.size * 0.05):  # At least 5% of image
            regions.append("Central retinal regions")
        if high_attention.sum() > (cam.size * 0.15):
            regions.append("Multiple vascular regions")
        if high_attention.sum() > (cam.size * 0.25):
            regions.append("Widespread retinal abnormalities")
        
        return regions if regions else ["Localized retinal regions"]
    
    def _generate_demo_attention_regions(self, severity: int) -> list:
        """Generate demo attention regions based on severity"""
        if severity == 0:
            return ["General retinal regions"]
        elif severity == 1:
            return ["Minor vascular regions"]
        elif severity == 2:
            return ["Multiple retinal regions with vascular changes"]
        elif severity == 3:
            return ["Widespread retinal regions", "Abnormal vascular patterns"]
        else:  # severity == 4
            return [
                "Extensive retinal regions",
                "Severe vascular abnormalities",
                "Proliferative changes"
            ]
    
    def _generate_explanation_summary(
        self, 
        severity_label: str, 
        attention_regions: list,
        severity: int
    ) -> str:
        """Generate human-readable explanation summary"""
        if severity == 0:
            base = "The model analyzed the retinal image and found patterns consistent with normal retinal appearance."
        else:
            base = f"The model identified patterns associated with {severity_label}."
        
        regions_text = " ".join(attention_regions)
        
        explanation = (
            f"{base} The model's attention was primarily focused on {regions_text.lower()} "
            "while generating this prediction. "
            "These highlighted regions influenced the model output. "
            "This visualization shows model attention, not confirmed clinical findings."
        )
        
        return explanation
