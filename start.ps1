Write-Host "========================================================" -ForegroundColor Green
Write-Host "Starting EcoSort Full-Stack Application (AI + Web UI)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --open"
Write-Host "`nBoth servers launched successfully!" -ForegroundColor Green
Write-Host "[Web UI]        : http://localhost:5173" -ForegroundColor Cyan
Write-Host "[API Docs]      : http://127.0.0.1:8001/docs" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green
