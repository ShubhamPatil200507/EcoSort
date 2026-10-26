import pytest
from app.geospatial.geocoding import GeocodingService

@pytest.mark.asyncio
async def test_offline_geocoding_lookup():
    results = await GeocodingService.search_location("Mumbai")
    assert len(results) > 0
    assert "Mumbai" in results[0].city
    assert 18.0 <= results[0].latitude <= 20.0

@pytest.mark.asyncio
async def test_pin_code_search():
    results = await GeocodingService.search_location("400053")
    assert len(results) > 0
    assert results[0].city == "Mumbai"

@pytest.mark.asyncio
async def test_reverse_geocoding():
    res = await GeocodingService.reverse_geocode(19.1319, 72.8164)
    assert res.city is not None
    assert "Mumbai" in res.formatted_address or "Andheri" in res.formatted_address or res.city == "Mumbai"
