@echo off
echo ========================================================
echo Starting EcoSort Full-Stack Application (AI + Web UI)
echo ========================================================
start "EcoSort Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"
start "EcoSort Frontend (Vite)" cmd /k "cd frontend && npm run dev -- --open"
echo.
echo Both servers are launching!
echo [Web UI]        : http://localhost:5173
echo [API Docs]      : http://127.0.0.1:8001/docs
echo ========================================================
