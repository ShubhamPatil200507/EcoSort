"""
EcoSort FastAPI Backend Local Development Server Runner.
Provides a standalone entrypoint to launch the Uvicorn ASGI server.
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
