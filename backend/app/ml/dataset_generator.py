"""
EcoSort Training Benchmark Generator (High-Fidelity Multi-Archetype Edition)
Synthesizes visually authentic, domain-balanced benchmark samples across all 10 waste categories
for reproducible transfer learning, active learning verification, and continuous retraining.
Each category features 5 distinct structural archetypes with photographic lighting and texture noise.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BENCHMARK_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "training_benchmark"

def _add_noise_and_lighting(img: Image.Image, noise_level: float = 7.0) -> Image.Image:
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, noise_level, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

def generate_batteries(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (235, 235, 232))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Cylindrical AA/AAA Alkaline
        draw.rectangle([80, 45, 144, 185], fill=(30, 30, 35), outline=(15, 15, 20), width=2)
        draw.rectangle([96, 32, 128, 45], fill=(210, 175, 45), outline=(140, 110, 20), width=2)
        draw.rectangle([80, 140, 144, 185], fill=(200, 160, 40))
        draw.text((92, 90), "AA 1.5V", fill=(240, 240, 240))
    elif mode == 1:
        # Coin / Button cell (CR2032)
        draw.ellipse([52, 52, 172, 172], fill=(210, 215, 220), outline=(140, 145, 150), width=3)
        draw.ellipse([64, 64, 160, 160], fill=(225, 230, 235), outline=(170, 175, 180), width=1)
        draw.text((94, 102), "+ CR2032", fill=(90, 95, 100))
    elif mode == 2:
        # 9V rectangular block with snap terminals
        draw.rectangle([65, 55, 159, 185], fill=(45, 50, 60), outline=(20, 25, 30), width=2)
        draw.rectangle([78, 38, 102, 55], fill=(180, 185, 190), outline=(100, 105, 110), width=2)
        draw.ellipse([122, 38, 146, 55], fill=(180, 185, 190), outline=(100, 105, 110), width=2)
        draw.text((95, 105), "9V LITHIUM", fill=(245, 245, 245))
    elif mode == 3:
        # Li-Po foil pouch cell with red/black lead wires
        draw.rectangle([55, 65, 169, 175], fill=(200, 205, 215), outline=(130, 135, 145), width=2)
        draw.line([(85, 65), (85, 35)], fill=(220, 40, 40), width=3)  # Red +
        draw.line([(135, 65), (135, 35)], fill=(20, 20, 20), width=3)  # Black -
        draw.text((75, 110), "3.7V 1200mAh", fill=(50, 55, 65))
    else:
        # Square power lead-acid battery
        draw.rectangle([50, 60, 174, 180], fill=(25, 30, 40), outline=(10, 15, 20), width=3)
        draw.rectangle([65, 42, 85, 60], fill=(200, 50, 50), outline=(120, 20, 20), width=2)
        draw.rectangle([139, 42, 159, 60], fill=(50, 50, 60), outline=(20, 20, 30), width=2)
        draw.text((70, 110), "SEALED 12V", fill=(220, 220, 230))
    return _add_noise_and_lighting(img)

def generate_e_waste(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (230, 232, 230))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Green PCB with IC Chip & Copper traces
        draw.rectangle([30, 30, 194, 194], fill=(25, 95, 45), outline=(15, 30, 20), width=2)
        for t_idx in range(45, 180, 18):
            draw.line([(t_idx, 40), (t_idx + 15, 80), (t_idx + 15, 180)], fill=(190, 155, 50), width=2)
            draw.ellipse([t_idx + 13, 178, t_idx + 17, 182], fill=(210, 210, 210))
        draw.rectangle([75, 75, 149, 149], fill=(20, 20, 20), outline=(80, 80, 80), width=2)
        draw.text((88, 105), "ATMEGA", fill=(190, 190, 190))
    elif mode == 1:
        # Blue microcontroller board (Arduino style)
        draw.rectangle([35, 45, 189, 179], fill=(15, 65, 145), outline=(10, 40, 95), width=2)
        draw.rectangle([35, 65, 65, 95], fill=(185, 190, 195), outline=(90, 95, 100), width=2) # USB port
        draw.rectangle([100, 95, 140, 135], fill=(25, 25, 25))
        for p in range(70, 180, 10):
            draw.rectangle([p, 48, p + 6, 56], fill=(40, 40, 40))
            draw.rectangle([p, 168, p + 6, 176], fill=(40, 40, 40))
    elif mode == 2:
        # Smartphone with screen bezel
        draw.rectangle([65, 25, 159, 199], fill=(15, 15, 20), outline=(40, 40, 45), width=3)
        draw.rectangle([72, 42, 152, 182], fill=(30, 35, 45))
        draw.ellipse([108, 30, 116, 38], fill=(60, 60, 70)) # camera
        draw.line([(85, 110), (139, 110)], fill=(100, 110, 130), width=1)
    elif mode == 3:
        # Coiled USB cable with silver connector
        draw.arc([40, 50, 184, 174], start=30, end=330, fill=(35, 35, 40), width=8)
        draw.rectangle([140, 30, 180, 55], fill=(180, 185, 190), outline=(90, 95, 100), width=2)
        draw.rectangle([180, 35, 195, 50], fill=(210, 215, 220), outline=(120, 125, 130), width=1)
    else:
        # RAM memory stick with gold fingers
        draw.rectangle([25, 85, 199, 139], fill=(35, 110, 55), outline=(20, 65, 30), width=2)
        for c in range(40, 185, 22):
            draw.rectangle([c, 92, c + 16, 116], fill=(20, 20, 20))
        for f in range(30, 195, 6):
            draw.line([(f, 130), (f, 139)], fill=(215, 175, 40), width=2)
    return _add_noise_and_lighting(img)

def generate_general_residual(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (235, 232, 228))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Crumpled snack wrapper / metallized plastic composite
        poly = [(50, 60), (160, 45), (180, 120), (150, 180), (70, 170), (40, 110)]
        draw.polygon(poly, fill=(160, 150, 140), outline=(100, 90, 80))
        for _ in range(5):
            x1, y1 = np.random.randint(60, 160), np.random.randint(60, 160)
            draw.line([(x1, y1), (x1 + 30, y1 + 20)], fill=(200, 195, 185), width=2)
    elif mode == 1:
        # Beveled rubber eraser with graphite smudge
        draw.rectangle([55, 80, 169, 145], fill=(225, 130, 140), outline=(170, 80, 90), width=2)
        draw.line([(60, 110), (120, 130)], fill=(70, 70, 75), width=3)
    elif mode == 2:
        # Cigarette butt with amber filter
        draw.rectangle([70, 85, 120, 139], fill=(215, 150, 60), outline=(150, 95, 30), width=1)
        draw.rectangle([120, 85, 160, 139], fill=(225, 225, 225), outline=(180, 180, 180), width=1)
        draw.ellipse([155, 87, 165, 137], fill=(50, 50, 50))
    elif mode == 3:
        # Band-Aid adhesive strip
        draw.rectangle([45, 90, 179, 134], fill=(215, 175, 140), outline=(165, 125, 95), width=2)
        draw.rectangle([85, 90, 139, 134], fill=(240, 235, 225), outline=(180, 175, 165), width=1)
    else:
        # Broken ceramic mug shards
        draw.polygon([(60, 50), (140, 70), (110, 150), (45, 120)], fill=(235, 235, 240), outline=(160, 160, 170), width=2)
        draw.polygon([(145, 75), (175, 120), (130, 170), (115, 155)], fill=(220, 220, 225), outline=(150, 150, 160), width=2)
    return _add_noise_and_lighting(img)

def generate_glass(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (242, 244, 242))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Amber Brown Glass Bottle
        body_color = (125, 75, 30)
        draw.rectangle([75, 80, 149, 190], fill=body_color, outline=(70, 40, 15), width=2)
        draw.rectangle([95, 35, 129, 80], fill=body_color, outline=(70, 40, 15), width=2)
        draw.line([(85, 90), (85, 175)], fill=(230, 190, 140), width=3) # Specular highlight
    elif mode == 1:
        # Green Wine Bottle
        body_color = (45, 105, 50)
        draw.rectangle([78, 80, 146, 190], fill=body_color, outline=(25, 60, 30), width=2)
        draw.rectangle([96, 30, 128, 80], fill=body_color, outline=(25, 60, 30), width=2)
        draw.line([(86, 85), (86, 175)], fill=(160, 230, 170), width=3)
    elif mode == 2:
        # Clear Glass Jar with neck threads
        draw.rectangle([65, 75, 159, 180], fill=(185, 215, 215), outline=(130, 160, 165), width=2)
        draw.rectangle([75, 50, 149, 75], fill=(195, 225, 225), outline=(140, 170, 175), width=2)
        draw.line([(70, 60), (154, 60)], fill=(230, 245, 245), width=2)
        draw.line([(75, 85), (75, 165)], fill=(255, 255, 255), width=4)
    elif mode == 3:
        # Broken sharp glass shards with refraction
        draw.polygon([(45, 60), (130, 45), (100, 170)], fill=(195, 225, 230), outline=(140, 170, 180), width=2)
        draw.polygon([(115, 65), (180, 110), (140, 175)], fill=(210, 235, 240), outline=(150, 180, 190), width=2)
        draw.line([(60, 70), (105, 150)], fill=(255, 255, 255), width=3)
    else:
        # Laboratory Beaker with volume lines
        draw.rectangle([65, 65, 159, 185], fill=(210, 230, 235), outline=(140, 165, 175), width=2)
        for y_tick in range(85, 175, 18):
            draw.line([(75, y_tick), (95, y_tick)], fill=(255, 255, 255), width=2)
    return _add_noise_and_lighting(img)

def generate_hazardous(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (238, 235, 230))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Paint can with colored drip streaks and flame hazard sign
        draw.rectangle([65, 65, 159, 185], fill=(175, 180, 185), outline=(100, 105, 110), width=2)
        draw.ellipse([65, 52, 159, 78], fill=(195, 200, 205), outline=(110, 115, 120), width=2)
        for drip_x in [85, 110, 135]:
            draw.rectangle([drip_x, 70, drip_x + 12, 130 + (drip_x % 20)], fill=(190, 40, 40))
        draw.polygon([(100, 140), (124, 140), (112, 115)], fill=(230, 150, 20))
    elif mode == 1:
        # Aerosol pesticide can with nozzle and skull icon
        draw.rectangle([75, 65, 149, 190], fill=(210, 60, 45), outline=(140, 30, 20), width=2)
        draw.rectangle([95, 38, 129, 65], fill=(225, 225, 225), outline=(150, 150, 150), width=2)
        draw.rectangle([105, 28, 119, 38], fill=(40, 40, 40))
        draw.ellipse([102, 110, 122, 130], fill=(255, 255, 255))
        draw.text((100, 145), "DANGER", fill=(255, 255, 255))
    elif mode == 2:
        # Motor oil jug with handle
        draw.rectangle([60, 70, 150, 185], fill=(45, 50, 55), outline=(20, 25, 30), width=2)
        draw.rectangle([135, 85, 165, 160], fill=(238, 235, 230), outline=(20, 25, 30), width=2) # handle hole
        draw.rectangle([75, 45, 105, 70], fill=(210, 170, 30)) # yellow cap
        draw.text((72, 115), "5W-30 OIL", fill=(220, 180, 40))
    elif mode == 3:
        # Mercury medical thermometer
        draw.rectangle([105, 25, 119, 185], fill=(230, 240, 245), outline=(150, 165, 175), width=2)
        draw.ellipse([100, 175, 124, 199], fill=(200, 30, 30)) # bulb
        draw.line([(112, 50), (112, 175)], fill=(200, 30, 30), width=2) # mercury column
        for t in range(50, 160, 10):
            draw.line([(114, t), (119, t)], fill=(60, 70, 80), width=1)
    else:
        # Medical pill blister pack
        draw.rectangle([50, 50, 174, 174], fill=(205, 215, 225), outline=(130, 145, 160), width=2)
        for r_y in [70, 110, 150]:
            for r_x in [70, 110, 150]:
                draw.ellipse([r_x - 12, r_y - 12, r_x + 12, r_y + 12], fill=(245, 250, 255), outline=(160, 175, 190), width=2)
    return _add_noise_and_lighting(img)

def generate_metal(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (232, 235, 236))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Aluminum Soda Can
        draw.rectangle([75, 60, 149, 185], fill=(185, 45, 40), outline=(110, 25, 20), width=2)
        draw.ellipse([75, 48, 149, 72], fill=(205, 210, 215), outline=(125, 130, 135), width=2)
        draw.ellipse([100, 54, 124, 66], fill=(160, 165, 170))  # Pop tab
        draw.line([(85, 75), (85, 175)], fill=(240, 130, 125), width=3)  # Highlight
    elif mode == 1:
        # Steel Corrugated Food Tin
        draw.rectangle([70, 65, 154, 180], fill=(185, 190, 195), outline=(110, 115, 120), width=2)
        for y_ridge in range(80, 170, 12):
            draw.line([(70, y_ridge), (154, y_ridge)], fill=(225, 230, 235), width=2)
            draw.line([(70, y_ridge + 3), (154, y_ridge + 3)], fill=(140, 145, 150), width=1)
    elif mode == 2:
        # Scrap Hardware (Bolts, screws, nuts)
        draw.polygon([(60, 80), (85, 65), (110, 80), (110, 110), (85, 125), (60, 110)], fill=(175, 180, 185), outline=(100, 105, 110), width=2)
        draw.ellipse([75, 85, 95, 105], fill=(232, 235, 236)) # hex nut hole
        draw.rectangle([130, 70, 145, 160], fill=(165, 170, 175), outline=(95, 100, 105), width=2) # bolt shaft
        for th in range(95, 155, 8):
            draw.line([(126, th), (149, th)], fill=(210, 215, 220), width=2)
    elif mode == 3:
        # Crumpled aluminum foil with faceted specular highlights
        poly = [(60, 70), (155, 55), (175, 125), (140, 180), (65, 165)]
        draw.polygon(poly, fill=(210, 215, 220), outline=(130, 135, 140))
        for _ in range(8):
            x1, y1 = np.random.randint(65, 155), np.random.randint(65, 155)
            draw.line([(x1, y1), (x1 + 25, y1 - 15)], fill=(255, 255, 255), width=2)
            draw.line([(x1, y1), (x1 - 15, y1 + 20)], fill=(120, 125, 130), width=1)
    else:
        # Stripped copper wire bundle
        for w in range(75, 155, 14):
            draw.line([(w, 40), (w - 20, 100), (w + 10, 180)], fill=(215, 130, 45), width=4)
            draw.line([(w + 2, 40), (w - 18, 100), (w + 12, 180)], fill=(250, 180, 95), width=1)
    return _add_noise_and_lighting(img)

def generate_organic_food(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (242, 240, 234))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # White Button / Cremini Mushroom
        draw.ellipse([65, 55, 159, 130], fill=(235, 225, 215), outline=(160, 145, 130), width=2) # Cap
        draw.rectangle([98, 115, 126, 175], fill=(220, 210, 200), outline=(150, 135, 120), width=2) # Stem
        for g_x in range(75, 150, 8):
            draw.line([(g_x, 120), (112, 115)], fill=(180, 160, 145), width=1) # Gills
    elif mode == 1:
        # Apple Core with fibrous neck & seeds
        draw.polygon([(85, 45), (139, 45), (120, 112), (139, 175), (85, 175), (104, 112)], fill=(230, 220, 185), outline=(145, 130, 95))
        draw.line([(112, 25), (112, 45)], fill=(85, 55, 25), width=3)  # Stem
        draw.ellipse([108, 95, 116, 107], fill=(50, 30, 15))  # Seed 1
        draw.ellipse([108, 118, 116, 130], fill=(50, 30, 15))  # Seed 2
    elif mode == 2:
        # Banana Peel with bruised spots
        draw.polygon([(65, 55), (160, 80), (145, 175), (110, 165), (75, 120)], fill=(235, 195, 45), outline=(150, 115, 20))
        for b_spot in [(90, 85), (125, 115), (135, 145)]:
            draw.ellipse([b_spot[0]-6, b_spot[1]-6, b_spot[0]+6, b_spot[1]+6], fill=(105, 75, 30))
    elif mode == 3:
        # Orange Citrus Peel crescent
        draw.arc([55, 55, 169, 169], start=20, end=190, fill=(240, 130, 20), width=18)
        draw.arc([60, 60, 164, 164], start=20, end=190, fill=(255, 245, 230), width=5) # white pith
    else:
        # Crusty Bread Slice Heel
        draw.rectangle([65, 65, 159, 175], fill=(230, 205, 160), outline=(140, 100, 50), width=3)
        for _ in range(8):
            px, py = np.random.randint(75, 150), np.random.randint(75, 165)
            draw.ellipse([px, py, px + 5, py + 5], fill=(200, 170, 125))
    return _add_noise_and_lighting(img)

def generate_paper_cardboard(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (240, 238, 232))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Corrugated Kraft Cardboard with exposed fluting
        draw.rectangle([50, 50, 174, 174], fill=(195, 155, 110), outline=(130, 95, 60), width=2)
        for fx in range(60, 165, 12):
            draw.line([(fx, 65), (fx + 6, 160)], fill=(160, 120, 80), width=3)
            draw.line([(fx + 6, 65), (fx + 12, 160)], fill=(215, 180, 135), width=2)
    elif mode == 1:
        # Printed Newspaper Sheet
        draw.rectangle([45, 40, 179, 184], fill=(235, 235, 235), outline=(160, 160, 160), width=2)
        draw.rectangle([55, 50, 169, 62], fill=(50, 50, 50))  # Headline
        for ny in range(72, 175, 8):
            draw.line([(55, ny), (105, ny)], fill=(90, 90, 90), width=2)
            draw.line([(115, ny), (169, ny)], fill=(90, 90, 90), width=2)
    elif mode == 2:
        # Crumpled White Paper Ball
        poly = [(65, 65), (145, 50), (175, 115), (150, 175), (75, 165), (45, 110)]
        draw.polygon(poly, fill=(245, 245, 245), outline=(180, 180, 180))
        for _ in range(6):
            cx1, cy1 = np.random.randint(65, 155), np.random.randint(65, 155)
            draw.line([(cx1, cy1), (cx1 + 25, cy1 + 15)], fill=(190, 190, 195), width=2)
    elif mode == 3:
        # Manila Mailing Envelope with address window
        draw.rectangle([45, 65, 179, 160], fill=(225, 195, 140), outline=(155, 125, 80), width=2)
        draw.polygon([(45, 65), (112, 115), (179, 65)], fill=(215, 185, 130), outline=(155, 125, 80))
        draw.rectangle([65, 110, 115, 135], fill=(245, 245, 245), outline=(170, 170, 170), width=1)
    else:
        # Molded gray pulp egg carton
        draw.rectangle([55, 55, 169, 169], fill=(175, 175, 180), outline=(115, 115, 120), width=2)
        for cy in [85, 135]:
            for cx in [85, 135]:
                draw.ellipse([cx - 15, cy - 15, cx + 15, cy + 15], fill=(150, 150, 155), outline=(100, 100, 105), width=2)
    return _add_noise_and_lighting(img)

def generate_plastic(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (236, 238, 236))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Clear PET Water Bottle with blue cap
        draw.rectangle([75, 65, 149, 185], fill=(210, 230, 240), outline=(140, 170, 190), width=2)
        draw.rectangle([95, 40, 129, 65], fill=(215, 235, 245), outline=(140, 170, 190), width=2)
        draw.rectangle([97, 28, 127, 40], fill=(35, 95, 210), outline=(20, 60, 140), width=2)  # Blue cap
        for r_y in [95, 125, 155]:
            draw.line([(75, r_y), (149, r_y)], fill=(240, 250, 255), width=3)  # Ribs
    elif mode == 1:
        # Translucent HDPE Milk Jug with handle
        draw.rectangle([65, 60, 145, 185], fill=(240, 242, 245), outline=(165, 170, 175), width=2)
        draw.rectangle([125, 75, 155, 145], fill=(236, 238, 236), outline=(165, 170, 175), width=2) # handle
        draw.rectangle([80, 42, 104, 60], fill=(220, 40, 40)) # red cap
    elif mode == 2:
        # Thin crinkled plastic shopping bag
        poly = [(60, 60), (90, 40), (120, 60), (150, 40), (170, 80), (155, 180), (70, 175)]
        draw.polygon(poly, fill=(245, 248, 250), outline=(180, 185, 190))
        for _ in range(6):
            px1, py1 = np.random.randint(70, 150), np.random.randint(60, 160)
            draw.line([(px1, py1), (px1 + 20, py1 + 30)], fill=(220, 230, 235), width=2)
    elif mode == 3:
        # Polypropylene food takeout container
        draw.rectangle([55, 75, 169, 165], fill=(248, 248, 248), outline=(175, 175, 180), width=3)
        draw.rectangle([50, 70, 174, 82], fill=(255, 255, 255), outline=(160, 160, 165), width=2) # snap lid
    else:
        # Expanded Polystyrene Foam (Styrofoam) Cup
        draw.polygon([(75, 60), (149, 60), (135, 180), (89, 180)], fill=(252, 252, 252), outline=(180, 180, 180), width=2)
        draw.ellipse([73, 52, 151, 68], fill=(255, 255, 255), outline=(175, 175, 175), width=2)
    return _add_noise_and_lighting(img)

def generate_textile(idx: int) -> Image.Image:
    img = Image.new("RGB", (224, 224), (236, 235, 232))
    draw = ImageDraw.Draw(img)
    mode = idx % 5
    if mode == 0:
        # Denim Twill Fabric with diagonal weave & copper stitch
        draw.rectangle([45, 45, 179, 179], fill=(45, 75, 125), outline=(25, 45, 80), width=2)
        for d in range(10, 300, 8):
            draw.line([(d, 45), (d - 100, 179)], fill=(65, 105, 165), width=1)
        draw.line([(55, 60), (169, 60)], fill=(210, 150, 30), width=2)
    elif mode == 1:
        # Woven Knitted Wool Sweater Pattern
        draw.rectangle([45, 45, 179, 179], fill=(145, 40, 55), outline=(90, 20, 30), width=2)
        for y in range(55, 170, 12):
            for x in range(55, 170, 16):
                draw.arc([x, y, x + 14, y + 10], start=0, end=180, fill=(200, 90, 105), width=2)
    elif mode == 2:
        # Cotton T-Shirt Collar & ribbed neckline
        draw.rectangle([50, 50, 174, 180], fill=(230, 230, 235), outline=(160, 160, 165), width=2)
        draw.arc([75, 40, 149, 100], start=0, end=180, fill=(200, 200, 205), width=8)
    elif mode == 3:
        # Polyester sports mesh jersey
        draw.rectangle([45, 45, 179, 179], fill=(30, 115, 110), outline=(15, 70, 65), width=2)
        for my in range(55, 170, 10):
            for mx in range(55, 170, 10):
                draw.point((mx, my), fill=(60, 160, 155))
    else:
        # Canvas sneaker upper with cotton shoelaces
        draw.polygon([(50, 140), (110, 80), (160, 85), (175, 160), (60, 165)], fill=(40, 45, 55), outline=(20, 25, 35))
        draw.rectangle([50, 160, 175, 175], fill=(245, 245, 245)) # rubber sole
        for lace_y in range(95, 145, 12):
            draw.line([(100, lace_y), (140, lace_y + 6)], fill=(255, 255, 255), width=2)
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

def generate_full_benchmark_dataset(samples_per_class: int = 30):
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
    generate_full_benchmark_dataset(30)
