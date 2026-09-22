# DrishtiXAI - Start both backend and frontend
Write-Host "Starting DrishtiXAI..." -ForegroundColor Cyan

# Start backend
Write-Host "`n[Backend] Starting FastAPI on http://localhost:8000..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "python" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" `
    -WorkingDirectory "$PSScriptRoot\backend" `
    -PassThru -NoNewWindow

# Give backend a moment to initialize
Start-Sleep -Seconds 3

# Start frontend
Write-Host "[Frontend] Starting Next.js on http://localhost:3000..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory "$PSScriptRoot\frontend" `
    -PassThru -NoNewWindow

Write-Host "`nBoth services are starting up:" -ForegroundColor Green
Write-Host "  Frontend  -> http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend   -> http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs  -> http://localhost:8000/docs" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop both services...`n" -ForegroundColor Gray

# Wait and keep script alive; kill both on exit
try {
    while ($true) { Start-Sleep -Seconds 5 }
} finally {
    Write-Host "`nStopping services..." -ForegroundColor Red
    if ($backend -and !$backend.HasExited) { Stop-Process -Id $backend.Id -Force }
    if ($frontend -and !$frontend.HasExited) { Stop-Process -Id $frontend.Id -Force }
}
