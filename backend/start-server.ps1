# Start Backend Server Script
Write-Host "`n🚀 Starting Fitness App Backend Server...`n" -ForegroundColor Cyan

# Check if MongoDB is needed
if (!(Test-Path .env)) {
    Write-Host "⚠️  No .env file found. Creating from example..." -ForegroundColor Yellow
    if (Test-Path env.example) {
        Copy-Item env.example .env
        Write-Host "✅ Created .env file. You may need to configure it." -ForegroundColor Green
    }
}

Write-Host "Starting server on port 5000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

# Start the server
node server.js

