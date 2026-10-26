import httpx
import logging
from typing import Optional, List, Dict, Any
from app.config import settings
from app.schemas import GeocodeResult

logger = logging.getLogger("ecosort.geocoding")

# Offline fallback table for fast lookup and zero-network resilience
OFFLINE_LOCATIONS: Dict[str, Dict[str, Any]] = {
    # Mumbai
    "400001": {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 18.9322, "lon": 72.8354, "address": "Fort, Mumbai, Maharashtra 400001"},
    "400053": {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.1319, "lon": 72.8164, "address": "Andheri West, Mumbai, Maharashtra 400053"},
    "400701": {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.1418, "lon": 73.0084, "address": "Rabale, Navi Mumbai, Maharashtra 400701"},
    "mumbai": {"city": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.0760, "lon": 72.8777, "address": "Mumbai, Maharashtra, India"},
    
    # Bengaluru
    "560001": {"city": "Bengaluru", "state": "Karnataka", "country": "India", "lat": 12.9784, "lon": 77.5956, "address": "MG Road, Bengaluru, Karnataka 560001"},
    "560038": {"city": "Bengaluru", "state": "Karnataka", "country": "India", "lat": 12.9719, "lon": 77.6412, "address": "Indiranagar, Bengaluru, Karnataka 560038"},
    "bengaluru": {"city": "Bengaluru", "state": "Karnataka", "country": "India", "lat": 12.9716, "lon": 77.5946, "address": "Bengaluru, Karnataka, India"},
    "bangalore": {"city": "Bengaluru", "state": "Karnataka", "country": "India", "lat": 12.9716, "lon": 77.5946, "address": "Bengaluru, Karnataka, India"},

    # Delhi
    "110001": {"city": "Delhi", "state": "Delhi", "country": "India", "lat": 28.6328, "lon": 77.2197, "address": "Connaught Place, New Delhi 110001"},
    "110020": {"city": "Delhi", "state": "Delhi", "country": "India", "lat": 28.5355, "lon": 77.2732, "address": "Okhla, New Delhi 110020"},
    "delhi": {"city": "Delhi", "state": "Delhi", "country": "India", "lat": 28.6139, "lon": 77.2090, "address": "New Delhi, Delhi, India"},

    # New York
    "10001": {"city": "New York", "state": "NY", "country": "United States", "lat": 40.7505, "lon": -73.9934, "address": "Manhattan, New York, NY 10001"},
    "11214": {"city": "New York", "state": "NY", "country": "United States", "lat": 40.5985, "lon": -73.9982, "address": "Bensonhurst, Brooklyn, NY 11214"},
    "new york": {"city": "New York", "state": "NY", "country": "United States", "lat": 40.7128, "lon": -74.0060, "address": "New York City, NY, USA"},
    "nyc": {"city": "New York", "state": "NY", "country": "United States", "lat": 40.7128, "lon": -74.0060, "address": "New York City, NY, USA"},

    # London
    "sw1a": {"city": "London", "state": "Greater London", "country": "United Kingdom", "lat": 51.5014, "lon": -0.1419, "address": "Westminster, London SW1A 1AA, UK"},
    "sw18": {"city": "London", "state": "Greater London", "country": "United Kingdom", "lat": 51.4627, "lon": -0.1912, "address": "Wandsworth, London SW18, UK"},
    "london": {"city": "London", "state": "Greater London", "country": "United Kingdom", "lat": 51.5074, "lon": -0.1278, "address": "London, England, UK"},

    # San Francisco
    "94102": {"city": "San Francisco", "state": "CA", "country": "United States", "lat": 37.7792, "lon": -122.4191, "address": "Civic Center, San Francisco, CA 94102"},
    "san francisco": {"city": "San Francisco", "state": "CA", "country": "United States", "lat": 37.7749, "lon": -122.4194, "address": "San Francisco, CA, USA"},

    # Berlin
    "10115": {"city": "Berlin", "state": "Berlin", "country": "Germany", "lat": 52.5323, "lon": 13.3846, "address": "Mitte, 10115 Berlin, Germany"},
    "berlin": {"city": "Berlin", "state": "Berlin", "country": "Germany", "lat": 52.5200, "lon": 13.4050, "address": "Berlin, Germany"}
}

# In-memory cache for queries
_GEOCODE_CACHE: Dict[str, Any] = {}

class GeocodingService:
    @staticmethod
    async def reverse_geocode(lat: float, lon: float) -> GeocodeResult:
        cache_key = f"rev_{round(lat, 3)}_{round(lon, 3)}"
        if cache_key in _GEOCODE_CACHE:
            return _GEOCODE_CACHE[cache_key]

        # Check offline nearest if within ~15km
        for key, info in OFFLINE_LOCATIONS.items():
            if abs(info["lat"] - lat) < 0.1 and abs(info["lon"] - lon) < 0.1:
                res = GeocodeResult(
                    latitude=lat,
                    longitude=lon,
                    formatted_address=info["address"],
                    city=info["city"],
                    state=info.get("state"),
                    pin_code=key if key.isdigit() else None,
                    country=info.get("country")
                )
                _GEOCODE_CACHE[cache_key] = res
                return res

        # Call OpenStreetMap Nominatim
        try:
            url = f"{settings.NOMINATIM_URL}/reverse"
            params = {
                "format": "jsonv2",
                "lat": lat,
                "lon": lon,
                "zoom": 14,
                "addressdetails": 1
            }
            headers = {"User-Agent": "EcoSort-SmartWasteSorter/1.0 (sustainability-research)"}
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    addr = data.get("address", {})
                    city = (
                        addr.get("city") or
                        addr.get("town") or
                        addr.get("suburb") or
                        addr.get("county") or
                        "Current Location"
                    )
                    res = GeocodeResult(
                        latitude=lat,
                        longitude=lon,
                        formatted_address=data.get("display_name", f"{lat:.4f}, {lon:.4f}"),
                        city=city,
                        state=addr.get("state"),
                        pin_code=addr.get("postcode"),
                        country=addr.get("country")
                    )
                    _GEOCODE_CACHE[cache_key] = res
                    return res
        except Exception as e:
            logger.warning(f"Reverse geocode lookup failed: {e}")

        # Fallback
        res = GeocodeResult(
            latitude=lat,
            longitude=lon,
            formatted_address=f"Location ({lat:.4f}, {lon:.4f})",
            city="Selected Area",
            country=None
        )
        return res

    @staticmethod
    async def search_location(query: str) -> List[GeocodeResult]:
        clean_q = query.strip().lower()
        if not clean_q:
            return []

        # 1. Check offline table first
        results: List[GeocodeResult] = []
        if clean_q in OFFLINE_LOCATIONS:
            info = OFFLINE_LOCATIONS[clean_q]
            results.append(GeocodeResult(
                latitude=info["lat"],
                longitude=info["lon"],
                formatted_address=info["address"],
                city=info["city"],
                state=info.get("state"),
                pin_code=clean_q if clean_q.isdigit() else None,
                country=info.get("country")
            ))
            return results

        # Check partial match in offline table
        for key, info in OFFLINE_LOCATIONS.items():
            if clean_q in key or clean_q in info["city"].lower() or clean_q in info["address"].lower():
                results.append(GeocodeResult(
                    latitude=info["lat"],
                    longitude=info["lon"],
                    formatted_address=info["address"],
                    city=info["city"],
                    state=info.get("state"),
                    pin_code=key if key.isdigit() else None,
                    country=info.get("country")
                ))
                if len(results) >= 3:
                    return results

        # 2. Query OSM Nominatim
        try:
            url = f"{settings.NOMINATIM_URL}/search"
            params = {
                "q": query,
                "format": "jsonv2",
                "limit": 5,
                "addressdetails": 1
            }
            headers = {"User-Agent": "EcoSort-SmartWasteSorter/1.0 (sustainability-research)"}
            async with httpx.AsyncClient(timeout=3.5) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data:
                        addr = item.get("address", {})
                        city = (
                            addr.get("city") or
                            addr.get("town") or
                            addr.get("suburb") or
                            addr.get("county") or
                            query.title()
                        )
                        results.append(GeocodeResult(
                            latitude=float(item["lat"]),
                            longitude=float(item["lon"]),
                            formatted_address=item.get("display_name", ""),
                            city=city,
                            state=addr.get("state"),
                            pin_code=addr.get("postcode"),
                            country=addr.get("country")
                        ))
                    if results:
                        return results
        except Exception as e:
            logger.warning(f"Forward geocode search failed: {e}")

        return results
