from fastapi import APIRouter, Query
from typing import List

from app.schemas import GeocodeResult
from app.geospatial.geocoding import GeocodingService

router = APIRouter(tags=["Geocoding"])

@router.get("/geocoding/reverse", response_model=GeocodeResult)
async def reverse_geocode_coordinates(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
):
    return await GeocodingService.reverse_geocode(lat, lon)

@router.get("/geocoding/search", response_model=List[GeocodeResult])
async def search_locations(
    query: str = Query(..., min_length=2)
):
    return await GeocodingService.search_location(query)
