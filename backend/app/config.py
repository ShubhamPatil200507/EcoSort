import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = os.getenv("ECOSORT_APP_NAME", "EcoSort")
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_PREFIX: str = "/api"
    
    # Confidence threshold for ML predictions (0.0 - 1.0)
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))
    
    # Image constraints
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(10 * 1024 * 1024))) # 10 MB
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]
    ALLOWED_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # ML Model configuration
    MODEL_WEIGHTS_PATH: str = os.getenv(
        "MODEL_WEIGHTS_PATH", 
        str(BASE_DIR / "data" / "models" / "mobilenetv3_ecosort.pt")
    )
    EVAL_REPORT_PATH: str = os.getenv(
        "EVAL_REPORT_PATH",
        str(BASE_DIR / "data" / "models" / "evaluation_report.json")
    )
    
    # Geospatial configuration
    GEO_PROVIDER: str = os.getenv("GEO_PROVIDER", "hybrid") # hybrid, osm, verified_db
    OVERPASS_API_URL: str = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")
    NOMINATIM_URL: str = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() == "true"
    DEFAULT_SEARCH_RADIUS_KM: float = 15.0
    
    # Security and CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    def get_cors_origins(self) -> List[str]:
        env_cors = os.getenv("CORS_ORIGINS")
        if env_cors:
            return [origin.strip() for origin in env_cors.split(",") if origin.strip()]
        if self.ENVIRONMENT == "production":
            return [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            ]
        return self.CORS_ORIGINS

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
