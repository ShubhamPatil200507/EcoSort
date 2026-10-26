"""
EcoSort Discrete Mathematics — Module 1: Set Theory
Implements set-theoretic models of waste streams, facility acceptance sets,
and algebraic set operations (membership, intersection, union, difference, and subsets).
"""

from typing import Set, FrozenSet, Dict, List, Any, Optional

# The Universe of Supported Waste Categories: U
WASTE_UNIVERSE: FrozenSet[str] = frozenset({
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
})

# Canonical Subsets partitioning/classifying streams
RECYCLABLE_SET: FrozenSet[str] = frozenset({
    "glass",
    "metal",
    "paper_cardboard",
    "plastic"
})

SPECIALIZED_FACILITY_SET: FrozenSet[str] = frozenset({
    "batteries",
    "e_waste",
    "hazardous"
})

COMPOSTABLE_SET: FrozenSet[str] = frozenset({
    "organic_food"
})

REUSABLE_SET: FrozenSet[str] = frozenset({
    "textile"
})

RESIDUAL_SET: FrozenSet[str] = frozenset({
    "general_residual"
})

# Subtypes Universe mapping for finer granularity
CATEGORY_SUBTYPES: Dict[str, FrozenSet[str]] = {
    "plastic": frozenset({"plastic_bottle", "plastic_container", "plastic_wrapper", "plastic_bag", "resin_pet", "resin_hdpe", "resin_pp"}),
    "paper_cardboard": frozenset({"corrugated_box", "newspaper", "office_paper", "magazine", "carton"}),
    "glass": frozenset({"glass_bottle", "glass_jar", "broken_glass", "cookware_glass"}),
    "metal": frozenset({"aluminum_can", "tin_can", "foil", "scrap_metal", "aerosol_can"}),
    "organic_food": frozenset({"fruit_vegetable_scraps", "coffee_grounds", "cooked_food", "dairy_meat", "garden_trimmings"}),
    "general_residual": frozenset({"diaper_sanitary", "composite_packaging", "cigarette_butts", "ceramic_broken"}),
    "e_waste": frozenset({"mobile_phone", "laptop_computer", "charger_cable", "printed_circuit_board", "home_appliance"}),
    "batteries": frozenset({"lithium_ion", "alkaline_aa_aaa", "lead_acid", "button_cell", "damaged_swollen_battery"}),
    "textile": frozenset({"clothing_garment", "shoes_footwear", "torn_fabric", "home_linen"}),
    "hazardous": frozenset({"paint_solvent", "chemical_cleaner", "motor_oil", "pesticide_bottle", "mercury_thermometer"})
}


class WasteSetEngine:
    """
    Formal Set Theory Engine for Waste Category Verification & Facility Compatibility.
    """

    @staticmethod
    def is_valid_category(category: str) -> bool:
        """Predicate: category in U (Universal Set)"""
        return category in WASTE_UNIVERSE

    @staticmethod
    def is_subset_of_universe(categories: Set[str]) -> bool:
        """Predicate: categories subseteq U"""
        return set(categories).issubset(WASTE_UNIVERSE)

    @staticmethod
    def is_member(category: str, category_set: Set[str]) -> bool:
        """Formal element-of relation: category in S"""
        return category in category_set

    @staticmethod
    def set_intersection(set_a: Set[str], set_b: Set[str]) -> Set[str]:
        """Binary Set Intersection: A cap B"""
        return set_a.intersection(set_b)

    @staticmethod
    def set_union(set_a: Set[str], set_b: Set[str]) -> Set[str]:
        """Binary Set Union: A cup B"""
        return set_a.union(set_b)

    @staticmethod
    def set_difference(set_a: Set[str], set_b: Set[str]) -> Set[str]:
        """Set Difference: A \ B"""
        return set_a.difference(set_b)

    @staticmethod
    def is_compatible_centre(centre_accepted_types: Set[str], target_category: str) -> bool:
        """
        Mathematical condition for facility compatibility:
        {target_category} cap centre_accepted_types != emptyset
        """
        return bool({target_category}.intersection(centre_accepted_types))

    @staticmethod
    def calculate_jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
        """
        Jaccard Index J(A, B) = |A cap B| / |A cup B|
        Quantifies stream overlap between facility profiles and multi-item waste bundles.
        """
        if not set_a and not set_b:
            return 1.0
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        return intersection / union if union > 0 else 0.0

    @staticmethod
    def partition_waste_streams(items: List[str]) -> Dict[str, List[str]]:
        """
        Partitions an arbitrary collection of waste categories into canonical disjoint or specialized partitions.
        """
        partitions: Dict[str, List[str]] = {
            "recyclables": [],
            "specialized_dropoff": [],
            "compostables": [],
            "reusables": [],
            "residuals": [],
            "unknown": []
        }
        for item in items:
            if item in RECYCLABLE_SET:
                partitions["recyclables"].append(item)
            elif item in SPECIALIZED_FACILITY_SET:
                partitions["specialized_dropoff"].append(item)
            elif item in COMPOSTABLE_SET:
                partitions["compostables"].append(item)
            elif item in REUSABLE_SET:
                partitions["reusables"].append(item)
            elif item in RESIDUAL_SET:
                partitions["residuals"].append(item)
            else:
                partitions["unknown"].append(item)
        return partitions
