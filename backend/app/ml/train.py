import os
import json
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from pathlib import Path
from sklearn.metrics import accuracy_score, f1_score, precision_recall_fscore_support, confusion_matrix

from app.ml.categories import CATEGORIES, CLASS_TO_IDX, IDX_TO_CLASS
from app.ml.model import EcoSortMobileNet

def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    eval_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    return train_transform, eval_transform

def train_ecosort(
    data_dir: str = "backend/data/dataset",
    output_model_path: str = "backend/data/models/mobilenetv3_ecosort.pt",
    output_report_path: str = "backend/data/models/evaluation_report.json",
    epochs: int = 4,
    batch_size: int = 16,
    learning_rate: float = 8e-4
):
    print("=" * 60)
    print("EcoSort ML Pipeline: MobileNetV3 Transfer Learning Training")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    train_tf, eval_tf = get_transforms()
    train_dir = Path(data_dir) / "train"
    val_dir = Path(data_dir) / "val"
    test_dir = Path(data_dir) / "test"

    if not train_dir.exists():
        raise FileNotFoundError(f"Training dataset directory not found at: {train_dir}")

    train_dataset = datasets.ImageFolder(str(train_dir), transform=train_tf)
    val_dataset = datasets.ImageFolder(str(val_dir), transform=eval_tf)
    test_dataset = datasets.ImageFolder(str(test_dir), transform=eval_tf)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    print(f"Dataset stats: Train={len(train_dataset)}, Val={len(val_dataset)}, Test={len(test_dataset)}")
    print(f"Classes: {train_dataset.classes}")

    # Build model with pretrained weights and custom classifier
    model = EcoSortMobileNet(num_classes=len(CATEGORIES), pretrained=True)
    model.to(device)

    # Freeze earlier backbone layers for feature extraction stability, fine-tune top layers
    for param in model.backbone.features[:8].parameters():
        param.requires_grad = False

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=learning_rate,
        weight_decay=1e-4
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    start_time = time.time()
    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        scheduler.step()
        train_loss = running_loss / total
        train_acc = correct / total

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_loss = val_loss / val_total
        val_acc = val_correct / val_total

        print(f"Epoch [{epoch}/{epochs}] - Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.3%}"
              f" | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.3%}")

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            # Ensure target directory exists
            Path(output_model_path).parent.mkdir(parents=True, exist_ok=True)
            torch.save({
                "state_dict": model.state_dict(),
                "classes": CATEGORIES,
                "val_acc": val_acc,
                "epoch": epoch
            }, output_model_path)

    training_duration_s = time.time() - start_time
    print(f"\nTraining completed in {training_duration_s:.1f}s. Evaluating on Test Split...")

    # Load best model checkpoint for test evaluation
    checkpoint = torch.load(output_model_path, map_location=device)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.numpy().tolist())

    # Map indices back to category names
    class_names = [train_dataset.classes[i] for i in range(len(CATEGORIES))]

    test_accuracy = accuracy_score(all_targets, all_preds)
    macro_f1 = f1_score(all_targets, all_preds, average="macro", zero_division=0)
    precision, recall, f1, support = precision_recall_fscore_support(
        all_targets, all_preds, labels=range(len(CATEGORIES)), zero_division=0
    )
    conf_matrix = confusion_matrix(all_targets, all_preds, labels=range(len(CATEGORIES)))

    per_class_metrics = {}
    for idx, cname in enumerate(class_names):
        per_class_metrics[cname] = {
            "precision": round(float(precision[idx]), 4),
            "recall": round(float(recall[idx]), 4),
            "f1_score": round(float(f1[idx]), 4),
            "support": int(support[idx])
        }

    evaluation_report = {
        "model_architecture": "MobileNetV3-Small (Transfer Learning)",
        "dataset": "EcoSort Curated Waste Classification Benchmark",
        "total_test_samples": len(all_targets),
        "overall_accuracy": round(float(test_accuracy), 4),
        "macro_f1_score": round(float(macro_f1), 4),
        "training_duration_seconds": round(training_duration_s, 2),
        "classes": class_names,
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": conf_matrix.tolist(),
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

    Path(output_report_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_report, f, indent=2)

    print("\n" + "=" * 60)
    print(f"TEST ACCURACY: {test_accuracy:.2%}")
    print(f"MACRO F1 SCORE: {macro_f1:.4f}")
    print(f"Evaluation report saved to: {output_report_path}")
    print(f"Model saved to: {output_model_path}")
    print("=" * 60)

    return evaluation_report

if __name__ == "__main__":
    train_ecosort()
