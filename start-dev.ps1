# Development Startup Script for Fitness App
# This script starts both the backend and frontend servers

Write-Host "🚀 Starting Fitness App Development Environment" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if backend exists
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: backend folder not found." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if backend node_modules exists
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

Write-Host "✅ Dependencies ready!" -ForegroundColor Green
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-Path "backend/.env")) {
    Write-Host "📝 Creating backend/.env file..." -ForegroundColor Yellow
    @"
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (optional - will use in-memory DB if not configured)
# MONGODB_URI=mongodb://localhost:27017/fitness_app

# JWT Secrets (change these in production!)
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:19006,http://localhost:19000,http://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760

# Optional: Email Configuration (for password reset, etc.)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Optional: Cloud Storage (Cloudinary for production)
# CLOUDINARY_CLOUD_NAME=your-cloud-name
# CLOUDINARY_API_KEY=your-api-key
# CLOUDINARY_API_SECRET=your-api-secret
"@ | Out-File -FilePath "backend/.env" -Encoding UTF8
    Write-Host "✅ Created backend/.env with default development settings" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  📌 Backend will start on: http://localhost:5000" -ForegroundColor White
Write-Host "  📌 Frontend will start on: http://localhost:19006 (web)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Keep this window open! Press Ctrl+C to stop both servers." -ForegroundColor Yellow
Write-Host ""

# Start backend in background
Write-Host "🔧 Starting backend server..." -ForegroundColor Magenta
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    npm run dev 2>&1
}

# Wait a few seconds for backend to start
Start-Sleep -Seconds 3

# Check if backend started successfully
$backendOutput = Receive-Job -Job $backendJob
if ($backendOutput -match "error|failed|cannot find module") {
    Write-Host "❌ Backend failed to start!" -ForegroundColor Red
    Write-Host "Output:" -ForegroundColor Red
    Write-Host $backendOutput -ForegroundColor Red
    Stop-Job -Job $backendJob
    Remove-Job -Job $backendJob
    exit 1
}

Write-Host "✅ Backend server started!" -ForegroundColor Green

# Start frontend
Write-Host "🎨 Starting frontend (Expo)..." -ForegroundColor Magenta
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Press 'w' for web browser" -ForegroundColor White
Write-Host "  Press 'a' for Android emulator" -ForegroundColor White
Write-Host "  Press 'i' for iOS simulator" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Cleanup function
$cleanup = {
    Write-Host ""
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped. Goodbye!" -ForegroundColor Green
}

# Register cleanup on Ctrl+C
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $cleanup

# Start frontend (this will block until Ctrl+C)
try {
    npm start
} finally {
    & $cleanup
}


