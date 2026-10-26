import os
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
from typing import Dict, List, Tuple
from app.ml.categories import CATEGORIES

def generate_waste_sample(category: str, width: int = 224, height: int = 224, seed: int = None) -> Image.Image:
    """
    Synthesize visually distinct, category-characteristic waste images
    reflecting real geometric, color, textural, and compositional signatures.
    """
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)

    # Base background (neutral tabletop / floor / recycling bin environment)
    bg_lum = random.randint(215, 245)
    bg_noise = np.random.randint(-10, 10, (height, width, 3), dtype=np.int16)
    base_bg = np.clip(np.full((height, width, 3), bg_lum, dtype=np.int16) + bg_noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(base_bg)
    draw = ImageDraw.Draw(img)

    cx, cy = width // 2 + random.randint(-15, 15), height // 2 + random.randint(-15, 15)

    if category == "plastic":
        # Plastic water / soda bottle with cap and transparent body
        body_color = random.choice([(180, 220, 245), (200, 235, 250), (190, 210, 225)])
        cap_color = random.choice([(15, 95, 210), (220, 30, 30), (30, 180, 50)])
        # Bottle body
        draw.rounded_rectangle([cx - 40, cy - 60, cx + 40, cy + 70], radius=18, fill=body_color, outline=(120, 160, 190), width=2)
        # Specular shine
        draw.line([cx - 20, cy - 50, cx - 20, cy + 55], fill=(255, 255, 255), width=4)
        # Bottle neck & cap
        draw.rectangle([cx - 15, cy - 80, cx + 15, cy - 60], fill=body_color, outline=(120, 160, 190), width=2)
        draw.rectangle([cx - 18, cy - 90, cx + 18, cy - 78], fill=cap_color)
        # Plastic ribbed lines
        for y_rib in range(cy - 20, cy + 40, 15):
            draw.line([cx - 35, y_rib, cx + 35, y_rib], fill=(150, 190, 220), width=1)

    elif category == "paper_cardboard":
        # Brown corrugated cardboard box with tape and shipping label
        box_brown = (195, 150, 105)
        tape_yellow = (210, 185, 120)
        draw.rectangle([cx - 65, cy - 55, cx + 65, cy + 65], fill=box_brown, outline=(140, 100, 60), width=3)
        # Cardboard seam tape
        draw.rectangle([cx - 65, cy - 5, cx + 65, cy + 12], fill=tape_yellow, outline=(160, 130, 80), width=1)
        # Shipping barcode label
        draw.rectangle([cx - 45, cy + 25, cx + 5, cy + 50], fill=(245, 245, 245), outline=(150, 150, 150), width=1)
        for x_bar in range(cx - 40, cx, 4):
            draw.line([x_bar, cy + 30, x_bar, cy + 45], fill=(30, 30, 30), width=random.choice([1, 2]))

    elif category == "glass":
        # Green / amber glass bottle or jar with thick specular highlights
        glass_tint = random.choice([(45, 120, 75), (145, 85, 30), (70, 130, 130)])
        draw.rounded_rectangle([cx - 35, cy - 50, cx + 35, cy + 70], radius=12, fill=glass_tint, outline=(30, 70, 40), width=3)
        draw.rectangle([cx - 14, cy - 75, cx + 14, cy - 50], fill=glass_tint, outline=(30, 70, 40), width=2)
        # Glass lip
        draw.ellipse([cx - 16, cy - 82, cx + 16, cy - 72], fill=glass_tint, outline=(30, 70, 40), width=2)
        # Strong glass glare reflection
        draw.line([cx - 22, cy - 40, cx - 22, cy + 50], fill=(220, 255, 230), width=3)
        draw.line([cx + 22, cy - 35, cx + 22, cy + 45], fill=(160, 220, 180), width=2)

    elif category == "metal":
        # Aluminum beverage can with pull tab
        can_color = random.choice([(210, 215, 220), (220, 40, 40), (25, 60, 190)])
        draw.rounded_rectangle([cx - 36, cy - 55, cx + 36, cy + 65], radius=10, fill=can_color, outline=(100, 100, 105), width=2)
        # Metallic sheen gradient
        draw.line([cx - 12, cy - 50, cx - 12, cy + 60], fill=(255, 255, 255), width=5)
        # Top bevel rim & pull tab
        draw.ellipse([cx - 32, cy - 65, cx + 32, cy - 45], fill=(180, 185, 190), outline=(90, 95, 100), width=2)
        draw.ellipse([cx - 8, cy - 58, cx + 8, cy - 50], fill=(120, 125, 130), outline=(50, 50, 50), width=1)

    elif category == "organic_food":
        # Apple / fruit with stem, leaf, and organic coloration
        draw.ellipse([cx - 45, cy - 40, cx + 10, cy + 45], fill=(200, 35, 30))
        draw.ellipse([cx - 10, cy - 40, cx + 45, cy + 45], fill=(215, 45, 35))
        # Apple indentation & stem
        draw.ellipse([cx - 15, cy - 44, cx + 15, cy - 36], fill=(140, 20, 20))
        draw.line([cx, cy - 40, cx + 8, cy - 60], fill=(85, 55, 25), width=3)
        # Leaf
        draw.polygon([(cx + 8, cy - 58), (cx + 25, cy - 70), (cx + 30, cy - 55), (cx + 10, cy - 55)], fill=(65, 150, 45))

    elif category == "general_residual":
        # Wrinkled snack pouch / mixed composite trash
        points = [
            (cx - 50, cy - 45), (cx - 10, cy - 55), (cx + 45, cy - 40),
            (cx + 55, cy + 10), (cx + 40, cy + 55), (cx - 15, cy + 60),
            (cx - 55, cy + 35), (cx - 45, cy - 10)
        ]
        draw.polygon(points, fill=(120, 115, 125), outline=(70, 65, 75), width=2)
        # Wrinkle lines
        draw.line([cx - 30, cy - 20, cx + 25, cy + 15], fill=(200, 200, 210), width=2)
        draw.line([cx - 10, cy + 10, cx + 35, cy - 15], fill=(60, 60, 70), width=2)
        draw.line([cx - 35, cy + 20, cx + 15, cy + 40], fill=(180, 175, 185), width=2)

    elif category == "e_waste":
        # Green PCB circuit board with IC chip, copper traces, and gold contact fingers
        pcb_green = (25, 95, 45)
        draw.rectangle([cx - 60, cy - 50, cx + 60, cy + 50], fill=pcb_green, outline=(15, 60, 30), width=2)
        # Integrated Circuit (IC chip) in center
        draw.rectangle([cx - 20, cy - 20, cx + 20, cy + 20], fill=(20, 20, 20), outline=(50, 50, 50), width=1)
        # IC pins
        for y_pin in range(cy - 16, cy + 18, 5):
            draw.line([cx - 28, y_pin, cx - 20, y_pin], fill=(210, 180, 60), width=1)
            draw.line([cx + 20, y_pin, cx + 28, y_pin], fill=(210, 180, 60), width=1)
        # Copper traces
        for trace_offset in [-40, -32, 32, 40]:
            draw.line([cx + trace_offset, cy - 45, cx + trace_offset, cy - 15], fill=(200, 160, 50), width=2)
            draw.ellipse([cx + trace_offset - 3, cy - 15 - 3, cx + trace_offset + 3, cy - 15 + 3], fill=(210, 180, 60))

    elif category == "batteries":
        # AA / cylindrical battery with positive nub, negative base, and charge band
        draw.rectangle([cx - 24, cy - 55, cx + 24, cy + 55], fill=(35, 35, 40), outline=(15, 15, 20), width=2)
        # Gold/copper band (Duracell style)
        draw.rectangle([cx - 23, cy - 54, cx + 23, cy - 15], fill=(215, 140, 35))
        # Positive terminal nub
        draw.rectangle([cx - 8, cy - 64, cx + 8, cy - 55], fill=(190, 195, 200), outline=(100, 100, 100), width=1)
        # Plus symbol
        draw.line([cx - 5, cy - 35, cx + 5, cy - 35], fill=(240, 240, 240), width=2)
        draw.line([cx, cy - 40, cx, cy - 30], fill=(240, 240, 240), width=2)

    elif category == "textile":
        # Folded garment / T-shirt silhouette with fabric texture
        draw.polygon([
            (cx - 30, cy - 50), (cx + 30, cy - 50),
            (cx + 60, cy - 25), (cx + 45, cy - 5),
            (cx + 35, cy - 15), (cx + 35, cy + 55),
            (cx - 35, cy + 55), (cx - 35, cy - 15),
            (cx - 45, cy - 5), (cx - 60, cy - 25)
        ], fill=(70, 110, 160), outline=(40, 70, 110), width=2)
        # Collar curve
        draw.arc([cx - 15, cy - 58, cx + 15, cy - 42], 0, 180, fill=(35, 60, 95), width=2)
        # Stitch lines
        draw.line([cx - 30, cy + 45, cx + 30, cy + 45], fill=(120, 150, 190), width=1)

    elif category == "hazardous":
        # Chemical / paint canister with prominent warning hazard diamond
        draw.rounded_rectangle([cx - 42, cy - 45, cx + 42, cy + 60], radius=8, fill=(235, 235, 230), outline=(120, 120, 120), width=2)
        # Metal handle / cap
        draw.rectangle([cx - 18, cy - 58, cx + 18, cy - 45], fill=(160, 40, 30))
        # Yellow/red hazard diamond
        hw = 24
        draw.polygon([
            (cx, cy - 10 - hw), (cx + hw, cy - 10),
            (cx, cy - 10 + hw), (cx - hw, cy - 10)
        ], fill=(245, 175, 25), outline=(190, 30, 20), width=2)
        # Exclamation / hazard mark
        draw.line([cx, cy - 18, cx, cy - 8], fill=(20, 20, 20), width=3)
        draw.ellipse([cx - 2, cy - 4, cx + 2, cy], fill=(20, 20, 20))

    # Apply subtle realistic camera blur and noise
    if random.random() > 0.5:
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.3, 0.7)))

    return img

def create_dataset_and_samples(
    train_per_class: int = 50,
    val_per_class: int = 15,
    test_per_class: int = 15,
    output_dir: str = "backend/data"
) -> Dict[str, str]:
    """
    Generate reproducible train, val, and test dataset splits with representative images.
    """
    out_path = Path(output_dir)
    train_dir = out_path / "dataset" / "train"
    val_dir = out_path / "dataset" / "val"
    test_dir = out_path / "dataset" / "test"
    samples_dir = out_path / "sample_images"

    for d in [train_dir, val_dir, test_dir, samples_dir]:
        d.mkdir(parents=True, exist_ok=True)

    seed_counter = 42

    for category in CATEGORIES:
        for split_dir, count in [(train_dir, train_per_class), (val_dir, val_per_class), (test_dir, test_per_class)]:
            cat_dir = split_dir / category
            cat_dir.mkdir(parents=True, exist_ok=True)
            for i in range(count):
                img = generate_waste_sample(category, seed=seed_counter)
                seed_counter += 1
                img.save(cat_dir / f"{category}_{i:03d}.jpg", quality=92)

        # Also save one representative high-quality showcase sample for the frontend UI gallery
        showcase_img = generate_waste_sample(category, width=320, height=320, seed=1000 + CATEGORIES.index(category))
        showcase_img.save(samples_dir / f"{category}.jpg", quality=95)

    # Save a deliberately blank/unclear image to test reject logic
    blank_arr = np.full((224, 224, 3), 240, dtype=np.uint8)
    Image.fromarray(blank_arr).save(samples_dir / "unclear_blank.jpg", quality=90)

    print(f"Generated dataset in {out_path / 'dataset'} ({len(CATEGORIES) * (train_per_class + val_per_class + test_per_class)} total images)")
    print(f"Showcase sample images saved in {samples_dir}")

    return {
        "train_dir": str(train_dir),
        "val_dir": str(val_dir),
        "test_dir": str(test_dir),
        "samples_dir": str(samples_dir)
    }

if __name__ == "__main__":
    create_dataset_and_samples()
