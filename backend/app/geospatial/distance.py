import math
import functools
from typing import Tuple, Optional

@functools.lru_cache(maxsize=4096)
def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth in kilometers
    using the Haversine formula.
    """
    R = 6371.0 # Earth's mean radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    # Avoid numerical precision issues beyond [-1.0, 1.0]
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return round(R * c, 2)

def format_distance(distance_km: float) -> str:
    """
    Format distance into human-friendly representation.
    """
    if distance_km < 1.0:
        meters = int(round(distance_km * 1000))
        return f"{meters} m away"
    return f"{distance_km:.1f} km away"

def generate_directions_url(lat: float, lon: float, destination_name: Optional[str] = None) -> str:
    """
    Generate standard cross-platform directions URL (Google Maps & OpenStreetMap navigation).
    """
    query = f"{lat},{lon}"
    if destination_name:
        import urllib.parse
        encoded_name = urllib.parse.quote(destination_name)
        return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lon}&destination_place_id={encoded_name}"
    return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lon}"
