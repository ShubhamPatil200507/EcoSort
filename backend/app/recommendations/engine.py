from typing import Dict, Any, Optional
from app.schemas import DisposalRecommendation
from app.ml.categories import CATEGORY_METADATA

DISPOSAL_RULES: Dict[str, Dict[str, Any]] = {
    "e_waste": {
        "primary_action": "Do NOT put in household trash. Hand over to an authorized E-Waste collection centre or manufacturer take-back programme.",
        "recommended_disposal_route": "Authorized E-Waste Collection Facility or Manufacturer Drop-Off Point",
        "preparation_steps": [
            "Perform a factory reset or securely wipe all personal data from phones, laptops, and drives.",
            "Remove external SIM cards and memory cards.",
            "Gather bundled cables, chargers, and power bricks together.",
            "Do NOT attempt to dismantle the device, unscrew casing, or salvage circuit components manually."
        ],
        "safety_precautions": [
            "Hazard: Toxic heavy metals (lead, cadmium, brominated flame retardants) and sharp exposed PCB edges.",
            "Never expose electronics to open flame, water immersion, or high-impact crushing.",
            "If the internal battery is swollen, leaking, or smoking, isolate in a non-combustible container (e.g., metal bucket with sand) immediately."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": True,
        "facility_types_needed": ["Authorized E-Waste Recycler", "Electronics Take-Back Kiosk", "Municipal E-Waste Depot"],
        "environmental_impact": "Recovers precious gold, silver, copper, and palladium while preventing toxic lead and cadmium from leaching into groundwater.",
        "disclaimer": "E-waste regulations vary by municipality (e.g., WEEE directive in Europe, E-Waste Management Rules in India). Check local municipal schedules."
    },
    "batteries": {
        "primary_action": "Do NOT dispose of in household bins or curbside recycling. Drop off at a dedicated battery recycling kiosk or hazardous depot.",
        "recommended_disposal_route": "Dedicated Battery Collection Drop-Box or Hazardous Waste Facility",
        "preparation_steps": [
            "Place clear electrical or masking tape over the positive (+) and negative (-) terminals of button cells, 9V, and lithium batteries to prevent short circuits.",
            "Store in a cool, dry, non-conductive plastic bag until drop-off.",
            "Keep different battery chemistries (alkaline, lithium-ion, lead-acid) loosely segregated if possible."
        ],
        "safety_precautions": [
            "Severe Fire Hazard: Lithium-ion batteries can experience thermal runaway and catch fire if punctured, crushed, or shorted.",
            "Never puncture, incinerate, cut, or submerge batteries in water.",
            "Do NOT touch leaking battery fluid (electrolyte/acid); handle with heavy rubber gloves."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": True,
        "facility_types_needed": ["Battery Recycling Station", "Electronics Retail Drop-Off", "Municipal Hazardous Depot"],
        "environmental_impact": "Prevents catastrophic garbage truck and landfill fires; recovers nickel, cobalt, and lithium for new clean energy storage.",
        "disclaimer": "Many supermarkets, electronics retailers, and municipal offices offer free battery collection boxes."
    },
    "plastic": {
        "primary_action": "Rinse, dry, and place in curbside dry recyclables or take to a certified plastic recovery facility.",
        "recommended_disposal_route": "Curbside Clean Plastics Recycling Bin or Material Recovery Facility (MRF)",
        "preparation_steps": [
            "Empty all liquids and scrape off food residue.",
            "Rinse briefly with greywater and allow to dry (food contamination rejects entire batches).",
            "Crush bottles to save bin space and screw caps back on (most modern reclaimers accept caps-on).",
            "Inspect the triangular resin identification code (#1 PET, #2 HDPE, #5 PP are widely accepted; #3 PVC, #6 PS, and #7 OTHER require specialized facilities)."
        ],
        "safety_precautions": [
            "Plastic containers that held pesticides, engine oil, or industrial solvents MUST be treated as hazardous waste.",
            "Do NOT burn plastics — burning releases highly carcinogenic dioxins and furans."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": False,
        "facility_types_needed": ["Municipal Dry Waste Sorting Centre", "Plastics Reclaimer", "Curbside Recycling"],
        "environmental_impact": "Conserves crude petroleum, reduces greenhouse gas emissions, and prevents plastic microfragmentation in marine ecosystems.",
        "disclaimer": "Municipal capabilities differ significantly by plastic resin code. If your area only collects #1 and #2, deposit #5 at specialized drop-offs."
    },
    "paper_cardboard": {
        "primary_action": "Keep dry, flatten boxes, and place in clean paper recycling bin.",
        "recommended_disposal_route": "Curbside Paper & Cardboard Recycling or Municipal Paper Bank",
        "preparation_steps": [
            "Flatten cardboard boxes completely to maximize transport efficiency.",
            "Remove excessive plastic packing tape, bubble wrap, and polystyrene foam inserts.",
            "Separate food-stained paper (e.g., greasy pizza box bottoms) from clean cardboard — grease ruins the paper pulping slurry.",
            "Staples and small window envelopes are generally acceptable in modern pulping mills."
        ],
        "safety_precautions": [
            "Paper must be kept completely dry. Wet or mildewed paper cannot be mechanically recycled and will rot."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": False,
        "facility_types_needed": ["Paper Recycling Mill", "Municipal Dry Waste Centre", "Curbside Paper Bin"],
        "environmental_impact": "Saves virgin forest timber, cuts water usage by 60% compared to virgin paper production, and reduces landfill methane.",
        "disclaimer": "Thermal receipt paper (coated with BPA) and wax-coated drink cartons should follow local municipal paper guidelines."
    },
    "glass": {
        "primary_action": "Rinse clean and deposit into glass recycling container (color-separated if required).",
        "recommended_disposal_route": "Dedicated Glass Bottle Bank or Curbside Glass Collection",
        "preparation_steps": [
            "Rinse out contents to deter pests and odors.",
            "Remove metal or plastic caps and lids (recycle them in their respective metal/plastic streams).",
            "If sorting by color (clear/flint, green, amber/brown), place in the appropriate color-coded bin.",
            "If broken, wrap carefully in thick newspaper or cardboard before handling."
        ],
        "safety_precautions": [
            "Puncture/Cut Hazard: Never handle broken glass shards with bare hands; use sturdy puncture-resistant gloves or a dustpan.",
            "Do NOT mix drinking glasses, mirrors, Pyrex cookware, ceramics, or window panes with container glass — their differing melting temperatures ruin batches."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": False,
        "facility_types_needed": ["Glass Bottle Bank", "Cullet Processing Centre", "Municipal Glass Drop-Off"],
        "environmental_impact": "Glass is 100% infinitely recyclable with zero loss in purity or quality; recycling cullet reduces kiln energy and carbon emissions.",
        "disclaimer": "Some municipalities ban curbside glass due to breakage damaging sorting machines. Use designated glass drop-off banks if applicable."
    },
    "metal": {
        "primary_action": "Rinse cans, keep dry, and recycle in clean metal/scrap bins.",
        "recommended_disposal_route": "Metal Recycling Bin, Scrap Dealer, or Municipal Scrap Depot",
        "preparation_steps": [
            "Rinse beverage cans and food tins to eliminate residues.",
            "Tuck the lid inside the can or leave it attached to avoid sharp cutting hazards.",
            "Crush aluminum beverage cans to save volume.",
            "Ensure aerosol cans are completely depleted before recycling."
        ],
        "safety_precautions": [
            "Cut Hazard: Sharp tin lids and jagged metal edges can cause lacerations.",
            "Never puncture, heat, or compact pressurized aerosol cans containing residual propellant."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": False,
        "facility_types_needed": ["Scrap Metal Yard", "Material Recovery Facility", "Municipal Metal Drop-Off"],
        "environmental_impact": "Recycling aluminum requires 95% less energy than smelting bauxite ore from scratch, saving immense carbon emissions.",
        "disclaimer": "Large scrap metal objects (bicycles, appliances, structural parts) should be brought directly to a local scrap metal processor."
    },
    "organic_food": {
        "primary_action": "Divert into a home composter, vermicompost bin, or municipal green/wet waste collection.",
        "recommended_disposal_route": "Compost Bin, Anaerobic Digester, or Municipal Wet Waste Route",
        "preparation_steps": [
            "Remove all plastic produce stickers, twist ties, rubber bands, and non-biodegradable packaging.",
            "Chop large fruit peels, melon rinds, or vegetable stalks into smaller 2-inch chunks for faster decomposition.",
            "If using municipal compost, check whether meat bones, cooked oil, and dairy are permitted in your local brown bin."
        ],
        "safety_precautions": [
            "Do NOT leave open organic waste indoors unattended to avoid fruit fly swarms, rodents, and pathogenic bacterial growth.",
            "Do NOT add pet feces or diseased garden plants to food-grade vegetable garden compost."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": False,
        "facility_types_needed": ["Municipal Wet Waste Composting Unit", "Community Compost Hub", "Biogas Digester"],
        "environmental_impact": "Prevents anaerobic landfill decomposition which produces methane (a greenhouse gas 28x more potent than CO2). Generates nutrient-rich soil humus.",
        "disclaimer": "Home composters should balance green nitrogen-rich scraps with brown carbon-rich materials (dry leaves, shredded plain cardboard)."
    },
    "general_residual": {
        "primary_action": "Bag securely and place in the non-recyclable residual municipal waste bin.",
        "recommended_disposal_route": "Residual Municipal Waste Bin (Landfill / Waste-to-Energy)",
        "preparation_steps": [
            "Verify that no recyclable components (metals, dry clean paper, batteries) are accidentally mixed in.",
            "Tie garbage bags securely to prevent windblown litter.",
            "Wrap sharp non-recyclables (e.g., broken ceramics, pens) to protect sanitation workers."
        ],
        "safety_precautions": [
            "Never put batteries, electronics, chemicals, or medical sharps into regular residual waste.",
            "Sanitary waste (diapers, pads) should be wrapped securely in newspaper or biodegradable bags before disposal."
        ],
        "separate_from_regular_trash": False,
        "specialized_facility_required": False,
        "facility_types_needed": ["Municipal Residual Waste Landfill", "Waste-to-Energy Plant"],
        "environmental_impact": "This waste goes to landfill or thermal treatment. Aim to reduce, reuse, and substitute single-use items wherever possible.",
        "disclaimer": "Check if your municipality has specific collection days for general black/grey bin residual waste."
    },
    "textile": {
        "primary_action": "Donate if wearable; drop off at a clothing bank or textile recycler if worn/torn.",
        "recommended_disposal_route": "Charity Donation Drop-Box or Dedicated Textile Recycling Bank",
        "preparation_steps": [
            "Wash and dry garments thoroughly before donation or recycling.",
            "Tie shoes together in pairs by their laces.",
            "Separate gently-used wearable clothing (for thrift/donation) from torn/stained rags (for industrial wiping cloths or fiber shredding)."
        ],
        "safety_precautions": [
            "Do NOT donate or recycle wet or moldy textiles; mildew can ruin an entire textile donation bin.",
            "Check pockets for keys, money, or sensitive items."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": False,
        "facility_types_needed": ["Textile Bank", "Charity Thrift Store Drop-Off", "Industrial Fiber Recycler"],
        "environmental_impact": "Extends garment life, conserves thousands of liters of freshwater per garment, and diverts synthetic polyester fibers from landfills.",
        "disclaimer": "Many high-street clothing retailers offer take-back bins with shopping vouchers for used textiles."
    },
    "hazardous": {
        "primary_action": "Strictly isolate. Bring to an authorized hazardous waste collection centre or scheduled household hazardous waste (HHW) day.",
        "recommended_disposal_route": "Municipal Household Hazardous Waste (HHW) Depot or ChemClear Facility",
        "preparation_steps": [
            "Keep chemicals in their original manufacturer containers with readable warning labels.",
            "Ensure lids and caps are tightly sealed.",
            "Transport upright in a sturdy cardboard box or plastic bin lined with absorbent material (e.g., kitty litter or rags) to catch leaks.",
            "NEVER mix different chemical products — mixing bleach and ammonia creates lethal chloramine gas."
        ],
        "safety_precautions": [
            "DANGER: Corrosive, flammable, or toxic. Never pour down sinks, toilets, storm drains, or onto the soil.",
            "Work in a well-ventilated area and wear protective gloves and eyewear when handling leaky containers.",
            "Keep out of reach of children and pets."
        ],
        "separate_from_regular_trash": True,
        "specialized_facility_required": True,
        "facility_types_needed": ["Authorized Hazardous Waste Depot", "Scheduled HHW Municipal Collection", "Chemical Treatment Facility"],
        "environmental_impact": "Prevents toxic chemicals, heavy metals, and persistent organic pollutants from contaminating municipal water supplies and soil biomes.",
        "disclaimer": "Most municipal councils provide free hazardous waste drop-off days for residential quantities. Commercial quantities require licensed hazardous haulers."
    }
}

class RecommendationEngine:
    """
    Rule-based recommendation engine synthesizing ML classification results
    with comprehensive safety precautions, preparation checklists,
    and verified disposal routes.
    """
    @staticmethod
    def get_recommendation(
        category: str,
        subtype: Optional[str] = None
    ) -> DisposalRecommendation:
        norm_category = category.lower().strip()
        rule = DISPOSAL_RULES.get(norm_category)

        if not rule:
            # Fallback to general residual
            rule = DISPOSAL_RULES["general_residual"]
            norm_category = "general_residual"

        meta = CATEGORY_METADATA.get(norm_category, {})
        display_name = meta.get("display_name", norm_category.replace("_", " ").title())

        return DisposalRecommendation(
            category=norm_category,
            display_name=display_name,
            subtype=subtype,
            primary_action=rule["primary_action"],
            recommended_disposal_route=rule["recommended_disposal_route"],
            preparation_steps=rule["preparation_steps"],
            safety_precautions=rule["safety_precautions"],
            separate_from_regular_trash=rule["separate_from_regular_trash"],
            specialized_facility_required=rule["specialized_facility_required"],
            facility_types_needed=rule["facility_types_needed"],
            environmental_impact=rule["environmental_impact"],
            disclaimer=rule["disclaimer"]
        )

def get_recommendation(category: str, subtype: Optional[str] = None) -> DisposalRecommendation:
    return RecommendationEngine.get_recommendation(category, subtype)
