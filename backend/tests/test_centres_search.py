import pytest
import asyncio
from app.geospatial.distance import haversine_distance_km, format_distance
from app.geospatial.provider import VerifiedDirectoryProvider

def test_haversine_distance():
    # Mumbai to Navi Mumbai (approx 15-20km)
    d = haversine_distance_km(19.0760, 72.8777, 19.1418, 73.0084)
    assert 10.0 <= d <= 25.0

def test_distance_formatting():
    assert format_distance(0.45) == "450 m away"
    assert format_distance(12.34) == "12.3 km away"

@pytest.mark.asyncio
async def test_verified_centres_filtering():
    provider = VerifiedDirectoryProvider()
    # Query Mumbai coordinates: lat 19.1, lon 72.85
    centres = await provider.get_nearby_centres(
        lat=19.10,
        lon=72.85,
        radius_km=30.0,
        category="e_waste"
    )
    assert len(centres) > 0
    for c in centres:
        assert "e_waste" in c.accepted_categories
        assert c.distance_km <= 30.0
        assert c.directions_url is not None

@pytest.mark.asyncio
async def test_empty_results_on_remote_coordinates():
    provider = VerifiedDirectoryProvider()
    # Point in middle of the Pacific Ocean
    centres = await provider.get_nearby_centres(
        lat=0.0,
        lon=-160.0,
        radius_km=10.0
    )
    assert len(centres) == 0
