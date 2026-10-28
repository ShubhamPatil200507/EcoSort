"""
EcoSort Training Benchmark Generator
Synthesizes visually authentic, domain-balanced benchmark samples across all 10 waste categories
for reproducible transfer learning, active learning verification, and continuous retraining.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math

BENCHMARK_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "training_benchmark"

def _add_noise_and_lighting(img: Image.Image, noise_level: float = 8.0) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, noise_level, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

def generate_batteries(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (235, 235, 232))
    draw = ImageDraw.Draw(img)
    if idx % 3 == 0:
        # Cylindrical AA/AAA battery
        draw.rectangle([80, 45, 144, 185], fill=(30, 30, 35), outline=(15, 15, 20), width=2)
        draw.rectangle([96, 32, 128, 45], fill=(210, 175, 45), outline=(140, 110, 20), width=2)
        draw.rectangle([80, 140, 144, 185], fill=(200, 160, 40))
        draw.text((92, 90), "AA 1.5V", fill=(240, 240, 240))
    elif idx % 3 == 1:
        # Coin / Button cell
        draw.ellipse([52, 52, 172, 172], fill=(210, 215, 220), outline=(140, 145, 150), width=3)
        draw.ellipse([64, 64, 160, 160], fill=(225, 230, 235), outline=(170, 175, 180), width=1)
        draw.text((94, 102), "+ CR2032", fill=(90, 95, 100))
    else:
        # 9V rectangular battery pack
        draw.rectangle([65, 55, 159, 185], fill=(45, 50, 60), outline=(20, 25, 30), width=2)
        draw.rectangle([78, 38, 102, 55], fill=(180, 185, 190), outline=(100, 105, 110), width=2)
        draw.ellipse([122, 38, 146, 55], fill=(180, 185, 190), outline=(100, 105, 110), width=2)
        draw.text((95, 105), "9V LITHIUM", fill=(245, 245, 245))
    return _add_noise_and_lighting(img)

def generate_e_waste(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (230, 232, 230))
    draw = ImageDraw.Draw(img)
    pcb_color = (25, 95, 45) if idx % 2 == 0 else (20, 50, 110)
    draw.rectangle([30, 30, 194, 194], fill=pcb_color, outline=(15, 30, 20), width=2)
    # Copper traces
    for t_idx in range(45, 180, 18):
        draw.line([(t_idx, 40), (t_idx + 15, 80), (t_idx + 15, 180)], fill=(190, 155, 50), width=2)
        draw.ellipse([t_idx + 13, 178, t_idx + 17, 182], fill=(210, 210, 210))
    # IC Chip
    draw.rectangle([75, 75, 149, 149], fill=(20, 20, 20), outline=(80, 80, 80), width=2)
    draw.text((88, 105), "ATMEGA", fill=(190, 190, 190))
    # Pins
    for p_x in range(80, 145, 8):
        draw.line([(p_x, 68), (p_x, 75)], fill=(180, 180, 180), width=2)
        draw.line([(p_x, 149), (p_x, 156)], fill=(180, 180, 180), width=2)
    return _add_noise_and_lighting(img)

def generate_general_residual(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (235, 232, 228))
    draw = ImageDraw.Draw(img)
    if idx % 3 == 0:
        # Crumpled snack wrapper / metallized plastic composite
        poly = [(50, 60), (160, 45), (180, 120), (150, 180), (70, 170), (40, 110)]
        draw.polygon(poly, fill=(160, 150, 140), outline=(100, 90, 80))
        for _ in range(5):
            x1, y1 = np.random.randint(60, 160), np.random.randint(60, 160)
            draw.line([(x1, y1), (x1 + 30, y1 + 20)], fill=(200, 195, 185), width=2)
    elif idx % 3 == 1:
        # Beveled rubber eraser with graphite smudge
        draw.rectangle([55, 80, 169, 145], fill=(225, 130, 140), outline=(170, 80, 90), width=2)
        draw.line([(60, 110), (120, 130)], fill=(70, 70, 75), width=3)
    else:
        # Cigarette butt with amber cellulose filter
        draw.rectangle([70, 85, 120, 139], fill=(215, 150, 60), outline=(150, 95, 30), width=1)
        draw.rectangle([120, 85, 160, 139], fill=(225, 225, 225), outline=(180, 180, 180), width=1)
        draw.ellipse([155, 87, 165, 137], fill=(50, 50, 50))
    return _add_noise_and_lighting(img)

def generate_glass(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (242, 244, 242))
    draw = ImageDraw.Draw(img)
    if idx % 2 == 0:
        # Amber / Green Glass Bottle
        body_color = (65, 115, 60) if idx % 4 == 0 else (125, 75, 30)
        draw.rectangle([75, 80, 149, 190], fill=body_color, outline=(40, 55, 30), width=2)
        draw.rectangle([95, 35, 129, 80], fill=body_color, outline=(40, 55, 30), width=2)
        draw.ellipse([93, 30, 131, 40], fill=(body_color[0]+30, body_color[1]+30, body_color[2]+30))
        # Specular reflection highlight
        draw.line([(85, 90), (85, 175)], fill=(240, 255, 240), width=3)
    else:
        # Clear Glass Jar with neck threads
        draw.rectangle([65, 75, 159, 180], fill=(185, 215, 215), outline=(130, 160, 165), width=2)
        draw.rectangle([75, 50, 149, 75], fill=(195, 225, 225), outline=(140, 170, 175), width=2)
        draw.line([(70, 60), (154, 60)], fill=(230, 245, 245), width=2)
        draw.line([(75, 85), (75, 165)], fill=(255, 255, 255), width=4)
    return _add_noise_and_lighting(img)

def generate_hazardous(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (238, 236, 232))
    draw = ImageDraw.Draw(img)
    # Aerosol chemical canister with hazard symbol
    can_color = (190, 40, 30) if idx % 2 == 0 else (210, 160, 25)
    draw.rectangle([70, 65, 154, 185], fill=can_color, outline=(80, 20, 20), width=2)
    draw.rectangle([98, 40, 126, 65], fill=(180, 180, 180), outline=(100, 100, 100), width=2)
    # Hazard Warning Diamond
    diamond = [(112, 100), (135, 123), (112, 146), (89, 123)]
    draw.polygon(diamond, fill=(245, 245, 245), outline=(200, 20, 20), width=3)
    draw.line([(105, 116), (119, 130)], fill=(20, 20, 20), width=3)
    draw.line([(105, 130), (119, 116)], fill=(20, 20, 20), width=3)
    return _add_noise_and_lighting(img)

def generate_metal(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (238, 238, 240))
    draw = ImageDraw.Draw(img)
    if idx % 2 == 0:
        # Aluminum Soda Can
        draw.rectangle([75, 60, 149, 180], fill=(195, 35, 45), outline=(120, 20, 25), width=2)
        draw.ellipse([75, 50, 149, 70], fill=(210, 215, 220), outline=(140, 145, 150), width=2)
        draw.ellipse([98, 55, 126, 65], fill=(160, 165, 170))
        # Specular metallic sheen
        draw.line([(88, 70), (88, 170)], fill=(245, 160, 165), width=4)
    else:
        # Corrugated Tin Food Can with horizontal ribs
        draw.rectangle([70, 65, 154, 180], fill=(185, 190, 195), outline=(120, 125, 130), width=2)
        for y_rib in range(85, 170, 15):
            draw.line([(72, y_rib), (152, y_rib)], fill=(225, 230, 235), width=2)
            draw.line([(72, y_rib + 2), (152, y_rib + 2)], fill=(130, 135, 140), width=1)
    return _add_noise_and_lighting(img)

def generate_organic_food(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (240, 238, 232))
    draw = ImageDraw.Draw(img)
    if idx % 3 == 0:
        # Mushroom with cap and stem
        draw.rectangle([102, 110, 122, 180], fill=(235, 230, 220), outline=(160, 150, 135), width=2)
        draw.chord([60, 45, 164, 130], start=180, end=360, fill=(190, 140, 85), outline=(110, 75, 40), width=2)
        draw.line([(60, 88), (164, 88)], fill=(140, 100, 60), width=2)
    elif idx % 3 == 1:
        # Banana Peel
        draw.arc([60, 50, 170, 170], start=45, end=240, fill=(235, 195, 35), width=22)
        draw.arc([62, 52, 168, 168], start=50, end=235, fill=(120, 80, 20), width=4)
    else:
        # Apple Core / Slice
        draw.chord([65, 60, 159, 175], start=0, end=360, fill=(245, 240, 220), outline=(180, 40, 30), width=6)
        draw.ellipse([106, 110, 118, 125], fill=(50, 30, 20))
    return _add_noise_and_lighting(img)

def generate_paper_cardboard(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (236, 234, 230))
    draw = ImageDraw.Draw(img)
    if idx % 2 == 0:
        # Corrugated Cardboard Box
        draw.rectangle([50, 60, 174, 175], fill=(185, 145, 95), outline=(125, 90, 50), width=2)
        draw.line([(50, 115), (174, 115)], fill=(125, 90, 50), width=2)
        draw.line([(112, 60), (112, 115)], fill=(105, 75, 40), width=2)
    else:
        # Newspaper / Printed Document
        draw.rectangle([55, 45, 169, 185], fill=(240, 240, 238), outline=(170, 170, 170), width=1)
        for y_line in range(60, 175, 10):
            draw.line([(65, y_line), (105, y_line)], fill=(50, 50, 50), width=2)
            draw.line([(115, y_line), (155, y_line)], fill=(50, 50, 50), width=2)
    return _add_noise_and_lighting(img)

def generate_plastic(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (240, 242, 245))
    draw = ImageDraw.Draw(img)
    if idx % 2 == 0:
        # Clear / Light Blue PET Water Bottle with ribbed rings
        draw.rectangle([78, 80, 146, 185], fill=(205, 225, 245), outline=(130, 165, 195), width=2)
        draw.rectangle([96, 40, 128, 80], fill=(210, 230, 250), outline=(135, 170, 200), width=2)
        draw.rectangle([94, 30, 130, 42], fill=(30, 110, 190), outline=(15, 60, 120), width=1)
        for y_rib in [105, 125, 145, 165]:
            draw.line([(80, y_rib), (144, y_rib)], fill=(245, 250, 255), width=2)
    else:
        # Takeout Food Container with snap lid
        draw.rectangle([50, 75, 174, 165], fill=(225, 232, 238), outline=(150, 160, 170), width=2)
        draw.rectangle([45, 68, 179, 78], fill=(195, 205, 215), outline=(140, 150, 160), width=2)
    return _add_noise_and_lighting(img)

def generate_textile(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (236, 235, 232))
    draw = ImageDraw.Draw(img)
    if idx % 2 == 0:
        # Denim Twill Fabric with diagonal weave lines
        draw.rectangle([45, 45, 179, 179], fill=(45, 75, 125), outline=(25, 45, 80), width=2)
        for d in range(10, 300, 8):
            draw.line([(d, 45), (d - 100, 179)], fill=(65, 105, 165), width=1)
        draw.line([(55, 60), (169, 60)], fill=(210, 150, 30), width=2)  # Copper rivet seam
    else:
        # Woven Knitted Sweater Pattern
        draw.rectangle([45, 45, 179, 179], fill=(145, 40, 55), outline=(90, 20, 30), width=2)
        for y in range(55, 170, 12):
            for x in range(55, 170, 16):
                draw.arc([x, y, x + 14, y + 10], start=0, end=180, fill=(200, 90, 105), width=2)
    return _add_noise_and_lighting(img)

GENERATORS = {
    "batteries": generate_batteries,
    "e_waste": generate_e_waste,
    "general_residual": generate_general_residual,
    "glass": generate_glass,
    "hazardous": generate_hazardous,
    "metal": generate_metal,
    "organic_food": generate_organic_food,
    "paper_cardboard": generate_paper_cardboard,
    "plastic": generate_plastic,
    "textile": generate_textile,
}

def generate_full_benchmark_dataset(samples_per_class: int = 10):
    BENCHMARK_DIR.mkdir(parents=True, exist_ok=True)
    generated = 0
    for cat, gen_func in GENERATORS.items():
        cat_dir = BENCHMARK_DIR / cat
        cat_dir.mkdir(parents=True, exist_ok=True)
        for i in range(samples_per_class):
            img = gen_func(i)
            filename = f"{cat}_{i+1:02d}.jpg"
            img.save(cat_dir / filename, format="JPEG", quality=95)
            generated += 1
    print(f"Successfully generated {generated} benchmark images across 10 classes in {BENCHMARK_DIR}")

if __name__ == "__main__":
    generate_full_benchmark_dataset(10)
