from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List

from app.config import settings
from app.schemas import NearbyCentresResponse, CentreRecord
from app.geospatial.provider import get_geo_provider
from app.geospatial.geocoding import GeocodingService
from app.geospatial.centres_db import VERIFIED_COLLECTION_CENTRES
from app.geospatial.distance import haversine_distance_km, format_distance, generate_directions_url

router = APIRouter(tags=["Centres"])

@router.get("/centres/nearby", response_model=NearbyCentresResponse)
async def get_nearby_centres(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude"),
    radius: float = Query(15.0, ge=1.0, le=100.0, description="Search radius in kilometers"),
    category: Optional[str] = Query(None, description="Waste category filter"),
    facility_type: Optional[str] = Query(None, description="Facility type filter")
):
    provider = get_geo_provider()
    centres = await provider.get_nearby_centres(
        lat=lat,
        lon=lon,
        radius_km=radius,
        category=category,
        facility_type=facility_type
    )

    return NearbyCentresResponse(
        query_lat=lat,
        query_lon=lon,
        radius_km=radius,
        waste_category=category,
        facility_type_filter=facility_type,
        total_found=len(centres),
        centres=centres,
        provider_used=settings.GEO_PROVIDER,
        is_demo=settings.DEMO_MODE
    )

@router.get("/centres/search", response_model=NearbyCentresResponse)
async def search_centres_by_location(
    query: str = Query(..., min_length=2, description="City name or PIN code"),
    radius: float = Query(15.0, ge=1.0, le=100.0),
    category: Optional[str] = Query(None)
):
    geocode_results = await GeocodingService.search_location(query)
    if not geocode_results:
        # If geocoding fails, return empty result gracefully
        return NearbyCentresResponse(
            query_lat=0.0,
            query_lon=0.0,
            radius_km=radius,
            waste_category=category,
            total_found=0,
            centres=[],
            provider_used=settings.GEO_PROVIDER,
            is_demo=settings.DEMO_MODE
        )

    best_match = geocode_results[0]
    provider = get_geo_provider()
    centres = await provider.get_nearby_centres(
        lat=best_match.latitude,
        lon=best_match.longitude,
        radius_km=radius,
        category=category
    )

    return NearbyCentresResponse(
        query_lat=best_match.latitude,
        query_lon=best_match.longitude,
        radius_km=radius,
        waste_category=category,
        total_found=len(centres),
        centres=centres,
        provider_used=settings.GEO_PROVIDER,
        is_demo=settings.DEMO_MODE
    )

@router.get("/centres/directory", response_model=List[CentreRecord])
async def get_all_directory_centres(
    category: Optional[str] = Query(None)
):
    """
    Returns full verified directory of collection centres for directory browsing.
    """
    results: List[CentreRecord] = []
    for item in VERIFIED_COLLECTION_CENTRES:
        if category and category.lower() != "all":
            accepted = [c.lower() for c in item.get("accepted_categories", [])]
            if category.lower() not in accepted:
                continue

        results.append(CentreRecord(
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
            distance_km=None,
            distance_text=None,
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
        ))
    return results
