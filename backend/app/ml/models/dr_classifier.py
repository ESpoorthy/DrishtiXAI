"""
Diabetic Retinopathy Classification Model
Supports both real trained models and demo mode
"""
import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from typing import Dict, Tuple
from pathlib import Path
import random


class DRClassifier:
    """
    DR Classification Model
    
    Uses EfficientNet architecture (suitable for medical imaging and resource-constrained deployment)
    Supports DEMO MODE for hackathon demonstration without trained weights
    """
    
    # DR severity class labels
    CLASS_LABELS = {
        0: "No DR",
        1: "Mild NPDR",
        2: "Moderate NPDR",
        3: "Severe NPDR",
        4: "Proliferative DR"
    }
    
    def __init__(self, model_path: str = None, demo_mode: bool = True):
        """
        Initialize DR classifier
        
        Args:
            model_path: Path to trained model weights (optional)
            demo_mode: If True, uses synthetic predictions for demonstration
        """
        self.demo_mode = demo_mode
        self.model_path = model_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        if not demo_mode and model_path and Path(model_path).exists():
            self._load_model(model_path)
        else:
            self.demo_mode = True  # Force demo mode if model doesn't exist
            self.model = None
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def _load_model(self, model_path: str):
        """Load trained model from checkpoint"""
        # Initialize EfficientNet-B0 architecture
        self.model = models.efficientnet_b0(weights=None)
        
        # Modify final layer for 5-class classification
        num_features = self.model.classifier[1].in_features
        self.model.classifier[1] = nn.Linear(num_features, 5)
        
        # Load weights
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        
        self.model.to(self.device)
        self.model.eval()
    
    def predict(self, image_path: str) -> Dict:
        """
        Predict DR severity from fundus image
        
        Args:
            image_path: Path to fundus image
            
        Returns:
            Dictionary with prediction results
        """
        if self.demo_mode:
            return self._demo_predict(image_path)
        else:
            return self._real_predict(image_path)
    
    def _real_predict(self, image_path: str) -> Dict:
        """Real model prediction (when trained model is available)"""
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        # Predict
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1).item()
            confidence = probabilities[0][predicted_class].item()
        
        # Get all class probabilities
        class_probs = {
            self.CLASS_LABELS[i]: float(probabilities[0][i].item())
            for i in range(5)
        }
        
        return {
            "severity": predicted_class,
            "severity_label": self.CLASS_LABELS[predicted_class],
            "confidence": confidence,
            "class_probabilities": class_probs,
            "requires_human_review": confidence < 0.7  # Low confidence threshold
        }
    
    def _demo_predict(self, image_path: str) -> Dict:
        """
        Demo mode prediction - generates realistic synthetic predictions
        
        IMPORTANT: This is for demonstration only and should NEVER be used clinically
        """
        # Use image filename as seed for consistent demo results
        filename = Path(image_path).stem
        seed = hash(filename) % 10000
        random.seed(seed)
        np.random.seed(seed)
        
        # Generate weighted random prediction (more likely to predict lower severities)
        severity_weights = [0.40, 0.25, 0.20, 0.10, 0.05]  # Realistic distribution
        predicted_class = random.choices(range(5), weights=severity_weights, k=1)[0]
        
        # Generate realistic confidence (typically 70-95%)
        base_confidence = random.uniform(0.70, 0.95)
        
        # Lower confidence for moderate/severe cases (more uncertain)
        if predicted_class >= 2:
            base_confidence = random.uniform(0.65, 0.90)
        
        confidence = base_confidence
        
        # Generate class probabilities that sum to 1.0
        class_probs = {}
        remaining_prob = 1.0 - confidence
        
        for i in range(5):
            if i == predicted_class:
                class_probs[self.CLASS_LABELS[i]] = confidence
            else:
                # Distribute remaining probability
                if remaining_prob > 0:
                    prob = random.uniform(0, remaining_prob / 4)
                    class_probs[self.CLASS_LABELS[i]] = prob
                else:
                    class_probs[self.CLASS_LABELS[i]] = 0.0
        
        # Normalize to ensure sum = 1.0
        total = sum(class_probs.values())
        class_probs = {k: v/total for k, v in class_probs.items()}
        
        return {
            "severity": predicted_class,
            "severity_label": self.CLASS_LABELS[predicted_class],
            "confidence": float(confidence),
            "class_probabilities": class_probs,
            "requires_human_review": confidence < 0.7
        }
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            "architecture": "EfficientNet-B0",
            "num_classes": 5,
            "class_labels": self.CLASS_LABELS,
            "demo_mode": self.demo_mode,
            "device": str(self.device)
        }
