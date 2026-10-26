"""
EcoSort Discrete Mathematics — Module 4: First-Order Predicate Logic
Implements formal predicates:
  - Accepts(centre, category)
  - IsHazardous(category, attributes)
  - RequiresSpecialHandling(category, attributes)
  - IsWithinRadius(centre, user_coord, max_dist)
  - IsAuthorized(centre)
Also implements quantified predicates:
  - ExistsEligibleCentre(Centres, category, user_coord, radius)
  - ForAllCentresAccepting(Centres, category)
"""

from typing import Dict, Any, List, Set, Optional, Callable
from app.geospatial.distance import haversine_distance_km

class Predicates:
    """
    Collection of first-order predicates for geospatial matching and waste decision policies.
    """

    @staticmethod
    def accepts(centre: Dict[str, Any], waste_category: str) -> bool:
        """
        Predicate: Accepts(c, w)
        True iff facility c includes waste category w in its accepted_waste_types set.
        """
        accepted = set(centre.get("accepted_waste_types", []))
        return waste_category in accepted

    @staticmethod
    def is_hazardous(category: str, attributes: Optional[Dict[str, Any]] = None) -> bool:
        """
        Predicate: IsHazardous(w, a)
        True iff category is intrinsically hazardous or carries hazardous attributes (e.g. damaged battery).
        """
        if category == "hazardous":
            return True
        if attributes:
            if category == "batteries" and attributes.get("is_damaged") is True:
                return True
            if attributes.get("contains_toxic_chemicals") is True:
                return True
        return False

    @staticmethod
    def requires_special_handling(category: str, attributes: Optional[Dict[str, Any]] = None) -> bool:
        """
        Predicate: RequiresSpecialHandling(w, a)
        Evaluates whether standard household disposal is prohibited.
        """
        special_categories = {"batteries", "e_waste", "hazardous"}
        if category in special_categories:
            return True
        if attributes:
            if attributes.get("is_broken") is True and category == "glass":
                return True
            if attributes.get("food_contaminated") is True and category == "plastic":
                return True
        return False

    @staticmethod
    def is_authorized(centre: Dict[str, Any]) -> bool:
        """
        Predicate: IsAuthorized(c)
        True iff centre verification_status is OFFICIALLY_VERIFIED or has verified license.
        """
        status = centre.get("verification_status", "")
        return status in ("OFFICIALLY_VERIFIED", "MUNICIPAL_AUTHORIZED")

    @staticmethod
    def is_within_radius(
        centre: Dict[str, Any],
        user_lat: float,
        user_lon: float,
        radius_km: float
    ) -> bool:
        """
        Predicate: IsWithinRadius(c, u, r)
        Evaluates Euclidean/Haversine distance <= radius_km.
        """
        c_lat = centre.get("latitude")
        c_lon = centre.get("longitude")
        if c_lat is None or c_lon is None:
            return False
        dist = haversine_distance_km(user_lat, user_lon, c_lat, c_lon)
        return dist <= radius_km

    @staticmethod
    def filter_eligible_centres(
        centres: List[Dict[str, Any]],
        category: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        radius_km: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluates composite predicate conjunction:
        P(c) = Accepts(c, category) ∧ (IsWithinRadius(c, u, r) if location provided)
        """
        eligible = []
        for c in centres:
            if not Predicates.accepts(c, category):
                continue
            if user_lat is not None and user_lon is not None and radius_km is not None:
                if not Predicates.is_within_radius(c, user_lat, user_lon, radius_km):
                    continue
            eligible.append(c)
        return eligible

    @staticmethod
    def exists_eligible_centre(
        centres: List[Dict[str, Any]],
        category: str,
        user_lat: float,
        user_lon: float,
        radius_km: float
    ) -> bool:
        """
        Existential Quantifier: ∃c ∈ Centres, Accepts(c, w) ∧ IsWithinRadius(c, u, r)
        """
        for c in centres:
            if Predicates.accepts(c, category) and Predicates.is_within_radius(c, user_lat, user_lon, radius_km):
                return True
        return False

    @staticmethod
    def for_all_centres_authorized(centres: List[Dict[str, Any]]) -> bool:
        """
        Universal Quantifier: ∀c ∈ SampleCentres, IsAuthorized(c)
        """
        if not centres:
            return True
        return all(Predicates.is_authorized(c) for c in centres)
