import httpx
import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

from app.config import settings
from app.schemas import CentreRecord, NearbyCentresResponse
from app.geospatial.distance import haversine_distance_km, format_distance, generate_directions_url
from app.geospatial.centres_db import VERIFIED_COLLECTION_CENTRES
from app.rules.set_theory import WasteSetEngine
from app.rules.predicates import Predicates

logger = logging.getLogger("ecosort.geospatial")

class BaseGeoProvider(ABC):
    @abstractmethod
    async def get_nearby_centres(
        self,
        lat: float,
        lon: float,
        radius_km: float,
        category: Optional[str] = None,
        facility_type: Optional[str] = None
    ) -> List[CentreRecord]:
        pass

class VerifiedDirectoryProvider(BaseGeoProvider):
    """
    Retrieves and ranks centres from the verified and authorized
    municipal/state directory database.
    """
    async def get_nearby_centres(
        self,
        lat: float,
        lon: float,
        radius_km: float,
        category: Optional[str] = None,
        facility_type: Optional[str] = None
    ) -> List[CentreRecord]:
        results: List[CentreRecord] = []

        for item in VERIFIED_COLLECTION_CENTRES:
            # Discrete Set Theory & Predicate compatibility filter: {category} ∩ accepted != ∅
            if category and category.lower() != "all":
                accepted_set = set(c.lower() for c in item.get("accepted_categories", []))
                if not WasteSetEngine.is_compatible_centre(accepted_set, category.lower()):
                    continue

            # Facility type filter
            if facility_type and facility_type.lower() not in item.get("facility_type", "").lower():
                continue

            dist = haversine_distance_km(lat, lon, item["latitude"], item["longitude"])
            if dist <= radius_km:
                record = CentreRecord(
                    id=item["id"],
                    facility_id=item.get("facility_id", item["id"]),
                    name=item["name"],
                    facility_type=item["facility_type"],
                    address=item["address"],
                    full_address=item.get("full_address", item["address"]),
                    city=item["city"],
                    pin_code=item.get("pin_code"),
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    coordinates_source=item.get("coordinates_source", "OpenStreetMap / Municipal GeoJSON"),
                    distance_km=dist,
                    distance_text=format_distance(dist),
                    accepted_categories=item.get("accepted_categories", []),
                    accepted_subtypes=item.get("accepted_subtypes", []),
                    authorisation_status=item.get("authorisation_status"),
                    authorisation_source=item.get("authorisation_source"),
                    expiry_date=item.get("expiry_date"),
                    phone=item.get("phone"),
                    email=item.get("email"),
                    website=item.get("website"),
                    source_url=item.get("source_url", item.get("website")),
                    last_verified_date=item.get("last_verified_date"),
                    data_status=item.get("data_status", "verified"),
                    verification_status=item.get("verification_status", "THIRD_PARTY_DIRECTORY"),
                    verification_notes=item.get("verification_notes", ""),
                    operating_hours=item.get("operating_hours"),
                    source=item.get("source", "Verified Public Municipal Registry"),
                    directions_url=generate_directions_url(item["latitude"], item["longitude"], item["name"])
                )
                results.append(record)

        # Sort nearest first
        results.sort(key=lambda r: r.distance_km if r.distance_km is not None else 999999)
        return results

class OpenStreetMapProvider(BaseGeoProvider):
    """
    Queries OpenStreetMap Overpass API for real-world recycling amenities
    and maps them to EcoSort categories.
    """
    async def get_nearby_centres(
        self,
        lat: float,
        lon: float,
        radius_km: float,
        category: Optional[str] = None,
        facility_type: Optional[str] = None
    ) -> List[CentreRecord]:
        radius_meters = int(radius_km * 1000)
        
        # Overpass QL query for recycling & waste facilities around lat, lon
        overpass_query = f"""
        [out:json][timeout:5];
        (
          node["amenity"="recycling"](around:{radius_meters},{lat},{lon});
          node["amenity"="waste_transfer_station"](around:{radius_meters},{lat},{lon});
          node["amenity"="waste_disposal"](around:{radius_meters},{lat},{lon});
        );
        out body 25;
        """

        centres: List[CentreRecord] = []
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.post(
                    settings.OVERPASS_API_URL,
                    data={"data": overpass_query},
                    headers={"User-Agent": "EcoSort-WasteApp/1.0 (sustainability-research)"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    elements = data.get("elements", [])
                    for el in elements:
                        tags = el.get("tags", {})
                        el_lat = el.get("lat")
                        el_lon = el.get("lon")
                        if not el_lat or not el_lon:
                            continue

                        # Map OSM recycling tags to EcoSort categories
                        accepted = []
                        if tags.get("recycling:plastic") == "yes" or tags.get("recycling:plastic_bottles") == "yes":
                            accepted.append("plastic")
                        if tags.get("recycling:paper") == "yes" or tags.get("recycling:cardboard") == "yes":
                            accepted.append("paper_cardboard")
                        if tags.get("recycling:glass") == "yes" or tags.get("recycling:glass_bottles") == "yes":
                            accepted.append("glass")
                        if tags.get("recycling:cans") == "yes" or tags.get("recycling:scrap_metal") == "yes":
                            accepted.append("metal")
                        if tags.get("recycling:electrical_appliances") == "yes" or tags.get("recycling:electronic_waste") == "yes":
                            accepted.append("e_waste")
                        if tags.get("recycling:batteries") == "yes":
                            accepted.append("batteries")
                        if tags.get("recycling:clothes") == "yes":
                            accepted.append("textile")
                        if tags.get("recycling:organic") == "yes" or tags.get("recycling:green_waste") == "yes":
                            accepted.append("organic_food")
                        if tags.get("recycling:hazardous_waste") == "yes":
                            accepted.append("hazardous")

                        if not accepted:
                            accepted = ["plastic", "paper_cardboard", "glass", "metal"]

                        # Filter by category if requested
                        if category and category.lower() != "all" and category.lower() not in accepted:
                            continue

                        dist = haversine_distance_km(lat, lon, el_lat, el_lon)
                        name = tags.get("name") or tags.get("operator") or f"Public Recycling Point ({tags.get('amenity', 'recycling').replace('_', ' ').title()})"
                        street = tags.get("addr:street", "")
                        city = tags.get("addr:city", "")
                        address = f"{street}, {city}".strip(", ") or f"Near coordinates {el_lat:.4f}, {el_lon:.4f}"

                        record = CentreRecord(
                            id=f"osm-{el.get('id')}",
                            name=name,
                            facility_type=tags.get("operator_type", "Public Recycling Point"),
                            address=address,
                            city=city or "Local Area",
                            pin_code=tags.get("addr:postcode"),
                            latitude=el_lat,
                            longitude=el_lon,
                            distance_km=dist,
                            distance_text=format_distance(dist),
                            accepted_categories=accepted,
                            phone=tags.get("phone") or tags.get("contact:phone"),
                            website=tags.get("website") or tags.get("contact:website"),
                            verification_status="THIRD_PARTY_DIRECTORY",
                            verification_notes="Community-mapped recycling amenity from OpenStreetMap.",
                            operating_hours=tags.get("opening_hours"),
                            source="OpenStreetMap Community Contributors",
                            directions_url=generate_directions_url(el_lat, el_lon, name)
                        )
                        centres.append(record)
        except Exception as e:
            logger.warning(f"OSM Overpass API query failed or timed out: {e}")

        centres.sort(key=lambda r: r.distance_km if r.distance_km is not None else 999999)
        return centres

class HybridGeoProvider(BaseGeoProvider):
    """
    Combines verified municipal facilities with live OpenStreetMap amenities.
    Ensures high data integrity with graceful fallback.
    """
    def __init__(self):
        self.verified_provider = VerifiedDirectoryProvider()
        self.osm_provider = OpenStreetMapProvider()

    async def get_nearby_centres(
        self,
        lat: float,
        lon: float,
        radius_km: float,
        category: Optional[str] = None,
        facility_type: Optional[str] = None
    ) -> List[CentreRecord]:
        # Always fetch verified local directory records
        verified_results = await self.verified_provider.get_nearby_centres(
            lat, lon, radius_km, category, facility_type
        )

        # In demo mode, only return verified/sample records
        if settings.DEMO_MODE:
            return verified_results

        # Attempt to complement with OSM live query
        try:
            osm_results = await self.osm_provider.get_nearby_centres(
                lat, lon, radius_km, category, facility_type
            )
        except Exception:
            osm_results = []

        # Merge results, prioritizing verified records
        seen_names = set()
        merged: List[CentreRecord] = []

        for r in verified_results:
            seen_names.add(r.name.lower().strip())
            merged.append(r)

        for r in osm_results:
            clean_name = r.name.lower().strip()
            if clean_name not in seen_names:
                seen_names.add(clean_name)
                merged.append(r)

        merged.sort(key=lambda r: r.distance_km if r.distance_km is not None else 999999)
        return merged

def get_geo_provider() -> BaseGeoProvider:
    provider_name = settings.GEO_PROVIDER.lower()
    if provider_name == "osm":
        return OpenStreetMapProvider()
    elif provider_name == "verified_db":
        return VerifiedDirectoryProvider()
    return HybridGeoProvider()
