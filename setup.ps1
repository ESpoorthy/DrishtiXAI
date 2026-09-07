# DrishtiXAI Setup Script for Windows
# Run this script in PowerShell to set up the development environment

Write-Host '========================================' -ForegroundColor Cyan
Write-Host '  DrishtiXAI Setup Script' -ForegroundColor Cyan
Write-Host '  Smart India Hackathon 2026' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# Check if Python is installed
Write-Host 'Checking Python installation...' -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Checkmark $pythonVersion found" -ForegroundColor Green
} catch {
    Write-Host 'X Python not found! Please install Python 3.9+ from python.org' -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
Write-Host 'Checking Node.js installation...' -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Checkmark Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host 'X Node.js not found! Please install Node.js 18+ from nodejs.org' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' Setting up Backend' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

# Setup backend
Set-Location backend

Write-Host 'Creating Python virtual environment...' -ForegroundColor Yellow
python -m venv venv

Write-Host 'Activating virtual environment...' -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

Write-Host 'Installing Python dependencies...' -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt

Write-Host 'Setting up environment variables...' -ForegroundColor Yellow
if (!(Test-Path '.env')) {
    Copy-Item '../.env.example' '.env'
    Write-Host 'Checkmark Created .env file from .env.example' -ForegroundColor Green
    Write-Host 'Warning Please edit .env and change default passwords!' -ForegroundColor Yellow
} else {
    Write-Host 'Checkmark .env file already exists' -ForegroundColor Green
}

Write-Host 'Creating necessary directories...' -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path '../data/uploads' | Out-Null
New-Item -ItemType Directory -Force -Path '../logs' | Out-Null
New-Item -ItemType Directory -Force -Path '../models' | Out-Null

Write-Host 'Checkmark Backend setup complete!' -ForegroundColor Green

Set-Location ..

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ' Setting up Frontend' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan

Set-Location frontend

Write-Host 'Installing Node.js dependencies...' -ForegroundColor Yellow
npm install

Write-Host 'Setting up environment variables...' -ForegroundColor Yellow
if (!(Test-Path '.env.local')) {
    'NEXT_PUBLIC_API_URL=http://localhost:8000' | Out-File -FilePath '.env.local' -Encoding UTF8
    'NEXT_PUBLIC_APP_NAME=DrishtiXAI' | Add-Content -Path '.env.local' -Encoding UTF8
    'NEXT_PUBLIC_DEFAULT_LANGUAGE=en' | Add-Content -Path '.env.local' -Encoding UTF8
    Write-Host 'Checkmark Created .env.local file' -ForegroundColor Green
} else {
    Write-Host 'Checkmark .env.local file already exists' -ForegroundColor Green
}

Write-Host 'Checkmark Frontend setup complete!' -ForegroundColor Green

Set-Location ..

Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host ' Setup Complete!' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Next steps:' -ForegroundColor Cyan
Write-Host '1. Review and edit backend/.env (IMPORTANT: Change passwords!)' -ForegroundColor White
Write-Host '2. Start the backend:' -ForegroundColor White
Write-Host '   cd backend' -ForegroundColor Gray
Write-Host '   .\venv\Scripts\Activate.ps1' -ForegroundColor Gray
Write-Host '   python -m uvicorn app.main:app --reload' -ForegroundColor Gray
Write-Host ''
Write-Host '3. In a new terminal, start the frontend:' -ForegroundColor White
Write-Host '   cd frontend' -ForegroundColor Gray
Write-Host '   npm run dev' -ForegroundColor Gray
Write-Host ''
Write-Host '4. Open http://localhost:3000 in your browser' -ForegroundColor White
Write-Host ''
Write-Host 'Default login credentials:' -ForegroundColor Yellow
Write-Host '  Username: admin' -ForegroundColor Gray
Write-Host '  Password: change-me-in-production' -ForegroundColor Gray
Write-Host '  (Please change in production!)' -ForegroundColor Red
Write-Host ''
Write-Host 'Warning IMPORTANT: This is a DEMO/RESEARCH PROTOTYPE' -ForegroundColor Yellow
Write-Host '  Not for clinical use without proper validation!' -ForegroundColor Yellow
Write-Host ''
