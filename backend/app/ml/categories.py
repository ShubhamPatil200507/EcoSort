from typing import Dict, List, Any

# Alphabetical order matching torchvision ImageFolder conventions
CATEGORIES: List[str] = [
    "batteries",
    "e_waste",
    "general_residual",
    "glass",
    "hazardous",
    "metal",
    "organic_food",
    "paper_cardboard",
    "plastic",
    "textile"
]

CATEGORY_METADATA: Dict[str, Dict[str, Any]] = {
    "batteries": {
        "display_name": "Batteries",
        "subtypes": ["lithium_ion_battery", "alkaline_aa_aaa", "button_cell_watch_battery"],
        "color": "#dc2626", # red
        "icon": "BatteryCharging",
        "uncertainty_note": (
            "Lithium-ion batteries present severe fire risks if punctured, crushed, or exposed to moisture. "
            "Tape the battery terminals before taking to drop-off bins."
        )
    },
    "e_waste": {
        "display_name": "Electronic Waste (E-Waste)",
        "subtypes": ["smartphone_mobile", "charger_cable", "circuit_board", "computer_peripheral"],
        "color": "#7c3aed", # violet
        "icon": "Cpu",
        "uncertainty_note": (
            "E-waste contains precious metals alongside toxic heavy metals (lead, cadmium). "
            "Never dispose in household trash. Ensure personal data is erased from devices."
        )
    },
    "general_residual": {
        "display_name": "General / Residual Waste",
        "subtypes": ["sanitary_waste", "mixed_composites", "non_recyclable_wrapper"],
        "color": "#78716c", # stone
        "icon": "Trash2",
        "uncertainty_note": (
            "Multi-material packaging (metalized plastics, multilayer pouches) often cannot be mechanically recycled "
            "and goes to residual waste or waste-to-energy."
        )
    },
    "glass": {
        "display_name": "Glass",
        "subtypes": ["glass_bottle", "glass_jar", "broken_glassware"],
        "color": "#0d9488", # teal
        "icon": "Wine",
        "uncertainty_note": (
            "Heat-resistant glassware (Pyrex), mirrors, and lightbulbs have different melting points than container glass "
            "and should not be mixed into container glass recycling."
        )
    },
    "hazardous": {
        "display_name": "Hazardous Household Waste",
        "subtypes": ["paint_chemical_can", "cleaning_solvent", "pesticide_bottle", "motor_oil"],
        "color": "#ea580c", # orange
        "icon": "AlertTriangle",
        "uncertainty_note": (
            "Never mix leftover chemicals or pour them down the sink/storm drain. "
            "Keep in original labeled containers and deliver directly to authorized hazardous collection centres."
        )
    },
    "metal": {
        "display_name": "Metal & Cans",
        "subtypes": ["aluminum_can", "tin_can", "metal_lid_foil", "scrap_metal"],
        "color": "#64748b", # slate
        "icon": "Shield",
        "uncertainty_note": (
            "Aerosol cans require careful handling. Only recycle empty aerosol cans; never puncture or incinerate."
        )
    },
    "organic_food": {
        "display_name": "Organic / Food Waste",
        "subtypes": ["fruit_vegetable_peel", "food_leftovers", "coffee_grounds_tea", "garden_waste"],
        "color": "#16a34a", # green
        "icon": "Apple",
        "uncertainty_note": (
            "Meat bones, dairy, and oily foods may not be suitable for basic home compost heaps due to pests, "
            "though municipal wet-waste composters generally accept them."
        )
    },
    "paper_cardboard": {
        "display_name": "Paper & Cardboard",
        "subtypes": ["cardboard_box", "newspaper_magazine", "office_paper", "carton_packaging"],
        "color": "#d97706", # amber
        "icon": "FileText",
        "uncertainty_note": (
            "Grease-stained paper (such as pizza boxes or oil wrappers) cannot be recycled with regular paper. "
            "Ensure material is dry and clean."
        )
    },
    "plastic": {
        "display_name": "Plastic",
        "subtypes": ["plastic_bottle", "food_container", "plastic_packaging", "disposable_cutlery"],
        "color": "#0284c7", # sky blue
        "icon": "Package",
        "uncertainty_note": (
            "Visual classification cannot definitively identify the specific resin code (#1 PET, #2 HDPE, #5 PP, etc.). "
            "Always inspect the triangular recycling stamp on the bottom before recycling."
        )
    },
    "textile": {
        "display_name": "Textile & Clothing",
        "subtypes": ["garment_clothing", "fabric_scraps", "shoes_footwear"],
        "color": "#db2777", # pink
        "icon": "Shirt",
        "uncertainty_note": (
            "Wearable clothing should be donated or reused. Stained, ripped, or worn-out textiles should go to textile shredding/recycling."
        )
    }
}

CLASS_TO_IDX: Dict[str, int] = {cat: idx for idx, cat in enumerate(CATEGORIES)}
IDX_TO_CLASS: Dict[int, str] = {idx: cat for idx, cat in enumerate(CATEGORIES)}
