"""
Versioned Deterministic Waste Rule Engine (EcoSort v1.2.0)
Academic & Statutory Waste Stream Eligibility and Incompatibility Registry.
Implements strict separation between computer vision model predictions and
formal regulatory disposal determinations.
"""

from typing import Dict, List, Set, Any, Optional
from pydantic import BaseModel, Field

class RuleDefinition(BaseModel):
    rule_id: str
    version: str = "1.2.0"
    title: str
    category: str
    subtypes: List[str] = Field(default_factory=list)
    permitted_streams: List[str]
    ineligible_streams: List[str]
    prohibited_co_disposal: List[str] = Field(default_factory=list)
    required_warnings: List[Dict[str, str]] = Field(default_factory=list)
    jurisdiction: str = "Statutory Waste Governance (SWM / CPCB / EPA Guidelines)"
    effective_date: str = "2024-01-01"
    verification_status: str = "VERIFIED_REGULATORY"
    source: str
    mandatory_safeguards: List[str] = Field(default_factory=list)

# Comprehensive Versioned Rule Registry
VERSIONED_RULES: Dict[str, RuleDefinition] = {
    # 1. E-WASTE RULES
    "RULE-EWASTE-CIRCUIT-01": RuleDefinition(
        rule_id="RULE-EWASTE-CIRCUIT-01",
        title="Printed Circuit Boards & Microcontroller Segregation",
        category="e_waste",
        subtypes=["circuit_board", "computer_peripheral"],
        permitted_streams=["e_waste_dropoff"],
        ineligible_streams=["municipal_recycling", "organic_composting", "general_landfill"],
        prohibited_co_disposal=["general_landfill", "organic_food", "municipal_recycling"],
        required_warnings=[
            {
                "code": "WARN_TOXIC_LEAD_BROMINE",
                "severity": "CRITICAL",
                "message": "Circuit boards contain trace heavy metals (lead, bromine flame retardants). Never incinerate, crush, or place in household trash."
            }
        ],
        source="CPCB E-Waste Management Rules (Schedule I & II) & EU WEEE Directive 2012/19/EU",
        mandatory_safeguards=[
            "Keep dry and uncrushed",
            "Deliver exclusively to authorized PRO or certified e-waste dismantler"
        ]
    ),
    "RULE-EWASTE-GENERAL-02": RuleDefinition(
        rule_id="RULE-EWASTE-GENERAL-02",
        title="Consumer Electronics & Peripherals Mandate",
        category="e_waste",
        subtypes=["smartphone_mobile", "charger_cable", "computer_peripheral"],
        permitted_streams=["e_waste_dropoff"],
        ineligible_streams=["municipal_recycling", "organic_composting", "general_landfill"],
        prohibited_co_disposal=["general_landfill", "organic_food"],
        required_warnings=[
            {
                "code": "WARN_DATA_SECURITY",
                "severity": "MEDIUM",
                "message": "Ensure digital storage media is physically sanitized or factory reset prior to transfer."
            }
        ],
        source="CPCB E-Waste Rules 2022 EPR Standards",
        mandatory_safeguards=[
            "Remove detachable batteries if safely feasible",
            "Store in dry ambient conditions"
        ]
    ),

    # 2. BATTERY SAFETY RULES
    "RULE-BATTERY-FIRE-01": RuleDefinition(
        rule_id="RULE-BATTERY-FIRE-01",
        title="Electrochemical Cell Fire Prevention & Terminal Insulation",
        category="batteries",
        subtypes=["lithium_ion_battery", "alkaline_aa_aaa", "button_cell", "lead_acid_battery"],
        permitted_streams=["battery_reclamation", "specialized_hazardous"],
        ineligible_streams=["municipal_recycling", "organic_composting", "general_landfill"],
        prohibited_co_disposal=["municipal_recycling", "general_landfill", "paper_cardboard"],
        required_warnings=[
            {
                "code": "WARN_THERMAL_RUNAWAY",
                "severity": "HIGH",
                "message": "Lithium and alkaline cells can short-circuit or cause thermal runaway fires if contacts touch conductive materials."
            }
        ],
        source="EPA Universal Waste Rule 40 CFR Part 273 & Battery Waste Management Rules 2022",
        mandatory_safeguards=[
            "Cover exposed metallic terminals with non-conductive electrical tape",
            "Do not puncture, submerge in liquid, or compact"
        ]
    ),

    # 3. HAZARDOUS WASTE RULES
    "RULE-HAZARDOUS-ISOLATE-01": RuleDefinition(
        rule_id="RULE-HAZARDOUS-ISOLATE-01",
        title="Domestic Chemical & Solvent Containment",
        category="hazardous",
        subtypes=["paint_chemical_can", "cleaning_solvent", "pesticide_bottle", "motor_oil"],
        permitted_streams=["specialized_hazardous"],
        ineligible_streams=["municipal_recycling", "organic_composting", "general_landfill", "glass_deposit_reclamation"],
        prohibited_co_disposal=["municipal_recycling", "organic_food", "paper_cardboard", "general_landfill"],
        required_warnings=[
            {
                "code": "WARN_ENVIRONMENTAL_TOXICITY",
                "severity": "CRITICAL",
                "message": "Chemical residues can leach into groundwater and release toxic fumes. Requires containment."
            }
        ],
        source="Hazardous and Other Wastes (Management and Transboundary Movement) Rules 2016",
        mandatory_safeguards=[
            "Retain original product packaging with chemical warning labels",
            "Store upright in ventilated area away from heat sources"
        ]
    ),

    # 4. PLASTIC RULES
    "RULE-PLASTIC-RECYCLE-01": RuleDefinition(
        rule_id="RULE-PLASTIC-RECYCLE-01",
        title="Rigid Thermoplastic Recovery Protocol",
        category="plastic",
        subtypes=["plastic_bottle", "plastic_packaging", "food_container"],
        permitted_streams=["municipal_recycling"],
        ineligible_streams=["organic_composting", "specialized_hazardous"],
        prohibited_co_disposal=["organic_food"],
        required_warnings=[
            {
                "code": "WARN_LIQUID_CONTAMINATION",
                "severity": "LOW",
                "message": "Residual beverages or sauces spoil bales of recyclable polymers."
            }
        ],
        source="Plastic Waste Management Rules (Schedule II Minimum Recycling Standards)",
        mandatory_safeguards=[
            "Empty and rinse remaining liquids",
            "Compress container to reduce shipping volume"
        ]
    ),

    # 5. PAPER & CARDBOARD RULES
    "RULE-PAPER-DRY-01": RuleDefinition(
        rule_id="RULE-PAPER-DRY-01",
        title="Dry Cellulose & Corrugated Fiber Recovery",
        category="paper_cardboard",
        subtypes=["cardboard_box", "office_paper", "newspaper_magazine", "carton_packaging"],
        permitted_streams=["municipal_recycling"],
        ineligible_streams=["organic_composting", "specialized_hazardous"],
        prohibited_co_disposal=["organic_food", "hazardous", "batteries"],
        required_warnings=[
            {
                "code": "WARN_WET_CONTAMINATION",
                "severity": "MEDIUM",
                "message": "Moisture and grease irrevocably degrade paper fiber integrity and render paper unrecyclable."
            }
        ],
        source="IS 14256: Recyclable Paper Standards & SWM Rules 2016",
        mandatory_safeguards=[
            "Keep dry and free of food oils or grease",
            "Flatten boxes before collection"
        ]
    ),

    # 6. GLASS RULES
    "RULE-GLASS-CONTAINER-01": RuleDefinition(
        rule_id="RULE-GLASS-CONTAINER-01",
        title="Cullet & Container Glass Reclamation",
        category="glass",
        subtypes=["glass_bottle", "glass_jar", "broken_glassware"],
        permitted_streams=["glass_deposit_reclamation", "municipal_recycling"],
        ineligible_streams=["organic_composting", "specialized_hazardous"],
        prohibited_co_disposal=["organic_food"],
        required_warnings=[
            {
                "code": "WARN_SHATTER_SAFETY",
                "severity": "MEDIUM",
                "message": "Broken glass creates laceration hazards for waste handling workers."
            }
        ],
        source="Bureau of Indian Standards IS 11951: Glass Container Recycling Code",
        mandatory_safeguards=[
            "Rinse residue; do not mix heat-resistant Pyrex/ceramics with container glass"
        ]
    ),

    # 7. METAL RULES
    "RULE-METAL-CAN-01": RuleDefinition(
        rule_id="RULE-METAL-CAN-01",
        title="Non-Ferrous Aluminum & Tin Can Circularity",
        category="metal",
        subtypes=["aluminum_can", "tin_can", "scrap_metal"],
        permitted_streams=["municipal_recycling"],
        ineligible_streams=["organic_composting", "specialized_hazardous"],
        prohibited_co_disposal=["organic_food"],
        required_warnings=[],
        source="Solid Waste Management Rules 2016 (Dry Waste Stream Mandate)",
        mandatory_safeguards=[
            "Rinse beverage cans; fold lid into can body"
        ]
    ),

    # 8. ORGANIC FOOD RULES
    "RULE-ORGANIC-COMPOST-01": RuleDefinition(
        rule_id="RULE-ORGANIC-COMPOST-01",
        title="Aerobic/Anaerobic Biological Processing Mandate",
        category="organic_food",
        subtypes=["fruit_vegetable_peel", "food_leftovers", "garden_trimmings"],
        permitted_streams=["organic_composting"],
        ineligible_streams=["municipal_recycling", "e_waste_dropoff", "glass_deposit_reclamation"],
        prohibited_co_disposal=["paper_cardboard", "plastic", "batteries", "hazardous"],
        required_warnings=[
            {
                "code": "WARN_METHANE_GENERATION",
                "severity": "LOW",
                "message": "Landfilled organic matter undergoes anaerobic decomposition, emitting methane."
            }
        ],
        source="SWM Rules 2016 Rule 15 (Wet Organic Waste Separation at Source)",
        mandatory_safeguards=[
            "Deposit in green wet-waste bin or backyard composter within 24 hours"
        ]
    ),

    # 9. TEXTILE RULES
    "RULE-TEXTILE-DONATE-01": RuleDefinition(
        rule_id="RULE-TEXTILE-DONATE-01",
        title="Textile Reuse and Fiber Mechanical Reclamation",
        category="textile",
        subtypes=["garment_clothing", "shoes_footwear", "fabric_scraps"],
        permitted_streams=["textile_donation_recycling", "municipal_recycling"],
        ineligible_streams=["organic_composting", "specialized_hazardous"],
        prohibited_co_disposal=["organic_food"],
        required_warnings=[],
        source="National Circular Economy Framework on Textiles (MoEFCC)",
        mandatory_safeguards=[
            "Clean and pair garments/shoes before dropoff"
        ]
    ),

    # 10. GENERAL RESIDUAL
    "RULE-GENERAL-RESIDUAL-01": RuleDefinition(
        rule_id="RULE-GENERAL-RESIDUAL-01",
        title="Sanitary & Multi-layer Non-Recyclable Landfill Containment",
        category="general_residual",
        subtypes=["sanitary_waste", "non_recyclable_wrapper"],
        permitted_streams=["general_landfill"],
        ineligible_streams=["organic_composting", "e_waste_dropoff", "glass_deposit_reclamation"],
        prohibited_co_disposal=[],
        required_warnings=[],
        source="SWM Rules 2016 Rule 4 (Inert and Non-Recyclable Disposal)",
        mandatory_safeguards=[
            "Wrap sanitary materials securely before disposal"
        ]
    )
}

class VersionedRuleEngine:
    """
    Deterministic rule evaluation engine matching items to valid disposal streams
    and enforcing statutory prohibitions.
    """
    _instance: Optional["VersionedRuleEngine"] = None

    @classmethod
    def get_instance(cls) -> "VersionedRuleEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def evaluate_item(
        self,
        category: str,
        subtype: Optional[str] = None,
        confidence: float = 1.0,
        attributes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        matched_rules: List[RuleDefinition] = []
        for r in VERSIONED_RULES.values():
            if r.category == category:
                if not subtype or not r.subtypes or subtype in r.subtypes or any(s in subtype for s in r.subtypes):
                    matched_rules.append(r)

        if not matched_rules:
            # Fallback to category-wide general rule
            for r in VERSIONED_RULES.values():
                if r.category == category:
                    matched_rules.append(r)
                    break

        if not matched_rules:
            # Unknown category requires manual review
            return {
                "eligible_streams": ["general_landfill"],
                "ineligible_streams": [],
                "rules_applied": [],
                "constraints_passed": [],
                "constraints_failed": ["NO_MATCHING_STATUTORY_RULE"],
                "warnings": [{
                    "code": "WARN_UNKNOWN_STREAM",
                    "severity": "HIGH",
                    "message": f"Category '{category}' has no registered statutory rule. Sent to manual review."
                }],
                "requires_manual_review": True,
                "review_reason": f"Unrecognized waste category: {category}",
                "prohibited_co_disposal": []
            }

        eligible: Set[str] = set()
        ineligible: Set[str] = set()
        prohibited_co_disposal: Set[str] = set()
        warnings: List[Dict[str, str]] = []
        rules_applied: List[str] = []

        for r in matched_rules:
            rules_applied.append(r.rule_id)
            eligible.update(r.permitted_streams)
            ineligible.update(r.ineligible_streams)
            prohibited_co_disposal.update(r.prohibited_co_disposal)
            warnings.extend(r.required_warnings)

        # Remove any eligible streams that are strictly forbidden
        eligible.difference_update(ineligible)
        if not eligible:
            eligible = {"general_landfill"}

        # Safety Check: If confidence is very low (< 0.60) on hazardous/batteries, require review
        requires_review = False
        review_reason = None
        if category in ["hazardous", "batteries"] and confidence < 0.70:
            requires_review = True
            review_reason = f"Low confidence ({confidence * 100:.1f}%) on high-risk category '{category}'. Requires confirmation."

        return {
            "eligible_streams": sorted(list(eligible)),
            "ineligible_streams": sorted(list(ineligible)),
            "rules_applied": rules_applied,
            "constraints_passed": ["LEGAL_CATEGORY_ELIGIBILITY_PASSED"],
            "constraints_failed": [],
            "warnings": warnings,
            "requires_manual_review": requires_review,
            "review_reason": review_reason,
            "prohibited_co_disposal": sorted(list(prohibited_co_disposal))
        }
