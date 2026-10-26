import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.ml.classifier import get_classifier
from app.api import (
    routes_health,
    routes_classify,
    routes_recommendations,
    routes_centres,
    routes_geocoding,
    routes_feedback,
    routes_batch_research
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    # Pre-warm ML classifier
    _ = get_classifier()
    print("ML Classifier initialized.")
    yield
    print(f"Shutting down {settings.APP_NAME}...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Waste Classification & Geospatial Disposal Recommendation Platform",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount sample images statically for frontend showcase
sample_images_path = Path(__file__).resolve().parent.parent / "data" / "sample_images"
if sample_images_path.exists():
    app.mount("/static/samples", StaticFiles(directory=str(sample_images_path)), name="samples")

# Include Routers
app.include_router(routes_health.router, prefix=settings.API_PREFIX)
app.include_router(routes_classify.router, prefix=settings.API_PREFIX)
app.include_router(routes_recommendations.router, prefix=settings.API_PREFIX)
app.include_router(routes_centres.router, prefix=settings.API_PREFIX)
app.include_router(routes_geocoding.router, prefix=settings.API_PREFIX)
app.include_router(routes_feedback.router, prefix=settings.API_PREFIX)
app.include_router(routes_batch_research.router, prefix=settings.API_PREFIX)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "An internal service error occurred. Please try again.",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else "Internal server error"
        }
    )

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api_prefix": settings.API_PREFIX,
        "status": "online"
    }
