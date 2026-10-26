import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_small, MobileNet_V3_Small_Weights
from typing import Optional
from app.ml.categories import CATEGORIES

class EcoSortMobileNet(nn.Module):
    """
    MobileNetV3-Small architecture adapted for 10-class waste sorting.
    Lightweight, fast inference (<15ms on CPU), and optimal for edge & web deployment.
    """
    def __init__(self, num_classes: int = len(CATEGORIES), pretrained: bool = True):
        super(EcoSortMobileNet, self).__init__()
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        self.backbone = mobilenet_v3_small(weights=weights)
        
        # Replace the final classification head
        in_features = self.backbone.classifier[0].out_features
        self.backbone.classifier[3] = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.Hardswish(inplace=True),
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(256, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.backbone(x)

def build_model(num_classes: int = len(CATEGORIES), weights_path: Optional[str] = None) -> EcoSortMobileNet:
    model = EcoSortMobileNet(num_classes=num_classes, pretrained=(weights_path is None))
    if weights_path:
        checkpoint = torch.load(weights_path, map_location=torch.device("cpu"))
        if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            model.load_state_dict(checkpoint["state_dict"])
        elif isinstance(checkpoint, dict):
            model.load_state_dict(checkpoint)
        else:
            model = checkpoint
    return model
