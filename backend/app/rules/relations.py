"""
EcoSort Discrete Mathematics — Module 2: Binary Relations & Functions
Models relations between Physical Items, Waste Categories, Disposal Channels, and Facilities.
Implements relation composition, many-to-many relationship mapping, and total function mapping.
"""

from typing import Set, Dict, List, Tuple, Any, Optional
from app.rules.set_theory import WASTE_UNIVERSE

class BinaryRelation:
    """
    Formal mathematical representation of a Binary Relation R subseteq X times Y.
    Supports 1-to-many, many-to-many, inverses, and relational composition.
    """
    def __init__(self, name: str, domain_name: str, codomain_name: str):
        self.name = name
        self.domain_name = domain_name
        self.codomain_name = codomain_name
        # Internal storage: adjacency map x -> {y_1, y_2, ...}
        self._forward: Dict[str, Set[str]] = {}
        # Inverse relation R^(-1) subseteq Y times X
        self._inverse: Dict[str, Set[str]] = {}

    def add_pair(self, x: str, y: str) -> None:
        """Adds ordered pair (x, y) to the relation."""
        if x not in self._forward:
            self._forward[x] = set()
        self._forward[x].add(y)

        if y not in self._inverse:
            self._inverse[y] = set()
        self._inverse[y].add(x)

    def image(self, x: str) -> Set[str]:
        """Returns the relational image R({x}) = {y in Y | (x, y) in R}."""
        return set(self._forward.get(x, set()))

    def pre_image(self, y: str) -> Set[str]:
        """Returns the pre-image R^(-1)({y}) = {x in X | (x, y) in R}."""
        return set(self._inverse.get(y, set()))

    def compose(self, other: "BinaryRelation") -> "BinaryRelation":
        """
        Relational composition: (self circ other)
        If self is R_1 subseteq X times Y and other is R_2 subseteq Y times Z,
        then R_comp subseteq X times Z where (x, z) in R_comp iff exists y in Y: (x, y) in R_1 and (y, z) in R_2.
        """
        composed = BinaryRelation(
            name=f"{self.name}_circ_{other.name}",
            domain_name=self.domain_name,
            codomain_name=other.codomain_name
        )
        for x, y_set in self._forward.items():
            for y in y_set:
                z_set = other.image(y)
                for z in z_set:
                    composed.add_pair(x, z)
        return composed

    def get_all_pairs(self) -> List[Tuple[str, str]]:
        """Returns the list of all ordered pairs in R."""
        pairs = []
        for x, y_set in self._forward.items():
            for y in y_set:
                pairs.append((x, y))
        return pairs


# --- Concrete EcoSort Relational Mappings ---

# 1. R_cat_to_route subseteq Categories times DisposalRoutes (One-to-Many)
CATEGORY_TO_ROUTE = BinaryRelation("CategoryToRoute", "Category", "DisposalRoute")
_cat_routes = [
    ("plastic", "curbside_recycling"),
    ("plastic", "plastics_reclaimer_dropoff"),
    ("paper_cardboard", "dry_paper_recycling"),
    ("paper_cardboard", "cardboard_bale_centre"),
    ("glass", "glass_bottle_bank"),
    ("glass", "cullet_recycler"),
    ("metal", "scrap_metal_dealer"),
    ("metal", "can_curbside_recycling"),
    ("organic_food", "home_composting"),
    ("organic_food", "municipal_wet_waste_collection"),
    ("general_residual", "sanitary_landfill_stream"),
    ("general_residual", "waste_to_energy_incinerator"),
    ("e_waste", "authorized_ewaste_dismantler"),
    ("e_waste", "manufacturer_takeback_kiosk"),
    ("batteries", "dedicated_battery_bin"),
    ("batteries", "hazardous_waste_facility"),
    ("textile", "clothing_donation_centre"),
    ("textile", "industrial_textile_shredder"),
    ("hazardous", "certified_chemical_treatment_facility"),
    ("hazardous", "municipal_hazardous_depot")
]
for cat, route in _cat_routes:
    CATEGORY_TO_ROUTE.add_pair(cat, route)


# 2. R_route_to_facility subseteq DisposalRoutes times FacilityTypes (Many-to-Many)
ROUTE_TO_FACILITY = BinaryRelation("RouteToFacility", "DisposalRoute", "FacilityType")
_route_facilities = [
    ("curbside_recycling", "Municipal Dry Waste Sorting Centre"),
    ("plastics_reclaimer_dropoff", "Plastics Reclaimer"),
    ("dry_paper_recycling", "Municipal Dry Waste Sorting Centre"),
    ("cardboard_bale_centre", "Paper & Packaging Recycling Depot"),
    ("glass_bottle_bank", "Glass & Bottle Collection Point"),
    ("cullet_recycler", "Authorized Recycler"),
    ("scrap_metal_dealer", "Metal Scrap Merchant"),
    ("can_curbside_recycling", "Municipal Dry Waste Sorting Centre"),
    ("home_composting", "Decentralized Community Composter"),
    ("municipal_wet_waste_collection", "Municipal Wet Waste Composting Unit"),
    ("sanitary_landfill_stream", "Municipal Transfer Station"),
    ("waste_to_energy_incinerator", "Municipal Transfer Station"),
    ("authorized_ewaste_dismantler", "Authorized E-Waste Collection Centre"),
    ("manufacturer_takeback_kiosk", "E-Waste Drop Box"),
    ("dedicated_battery_bin", "Battery Drop-off Point"),
    ("hazardous_waste_facility", "Hazardous Waste Treatment Facility"),
    ("clothing_donation_centre", "Textile Donation & Thrift Centre"),
    ("industrial_textile_shredder", "Authorized Recycler"),
    ("certified_chemical_treatment_facility", "Hazardous Waste Treatment Facility"),
    ("municipal_hazardous_depot", "Household Hazardous Waste Depot")
]
for route, fac in _route_facilities:
    ROUTE_TO_FACILITY.add_pair(route, fac)


# Composed Relation: R_cat_to_fac = CategoryToRoute circ RouteToFacility
# Maps Category directly to compatible Facility Types via relational composition
CATEGORY_TO_FACILITY_TYPE = CATEGORY_TO_ROUTE.compose(ROUTE_TO_FACILITY)


class CategoryMappingFunction:
    """
    Formal Mathematical Function f: ML_Prediction -> Verified_Category.
    Provides total completion for partial mappings (guarantees safe output for all inputs in domain).
    """

    @staticmethod
    def map_category(raw_prediction: str) -> str:
        """
        Total Function:
        f(x) = x if x in WASTE_UNIVERSE else 'general_residual'
        """
        normalized = str(raw_prediction).strip().lower()
        if normalized in WASTE_UNIVERSE:
            return normalized
        return "general_residual"

    @staticmethod
    def get_eligible_facility_types(category: str) -> List[str]:
        """
        Evaluates the composite relational image:
        CATEGORY_TO_FACILITY_TYPE.image(category)
        """
        valid_cat = CategoryMappingFunction.map_category(category)
        return sorted(list(CATEGORY_TO_FACILITY_TYPE.image(valid_cat)))
