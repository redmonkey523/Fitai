# Setup Android Environment Variables
# Run this AFTER installing Android Studio
# Right-click and "Run with PowerShell" (as Administrator)

Write-Host "`n🔧 Setting up Android environment variables...`n" -ForegroundColor Cyan

$androidHome = "$env:LOCALAPPDATA\Android\Sdk"

# Check if Android SDK exists
if (Test-Path $androidHome) {
    Write-Host "✅ Found Android SDK at: $androidHome" -ForegroundColor Green
    
    # Set ANDROID_HOME
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")
    Write-Host "✅ Set ANDROID_HOME" -ForegroundColor Green
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $platformTools = "$androidHome\platform-tools"
    $emulator = "$androidHome\emulator"
    
    if ($currentPath -notlike "*$platformTools*") {
        $newPath = "$currentPath;$platformTools;$emulator"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Host "✅ Added Android tools to PATH" -ForegroundColor Green
    } else {
        Write-Host "✅ Android tools already in PATH" -ForegroundColor Green
    }
    
    Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Close and reopen all terminals for changes to take effect!`n" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ Android SDK not found at: $androidHome" -ForegroundColor Red
    Write-Host "`nPlease install Android Studio first, then run this script again.`n" -ForegroundColor Yellow
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

