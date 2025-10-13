Write-Host "Setting up Git for Background Agent..." -ForegroundColor Green

# Add Git to PATH if not already there
$env:PATH += ";C:\Program Files\Git\bin"

# Check if Git is available
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git not found in PATH, trying to find it..." -ForegroundColor Yellow
    if (Test-Path "C:\Program Files\Git\bin\git.exe") {
        Write-Host "Found Git at C:\Program Files\Git\bin\git.exe" -ForegroundColor Green
        $env:PATH += ";C:\Program Files\Git\bin"
    } else {
        Write-Host "Git not found. Please install Git first." -ForegroundColor Red
        Read-Host "Press Enter to continue"
        exit 1
    }
}

# Configure Git user if not already set
git config --global user.name "Fitness App Developer"
git config --global user.email "developer@fitnessapp.com"

# Check repository status
Write-Host "`nChecking repository status..." -ForegroundColor Cyan
git status

Write-Host "`nGit setup complete! Background agent can now use Git commands." -ForegroundColor Green
Write-Host "`nAvailable commands:" -ForegroundColor Yellow
Write-Host "  git status" -ForegroundColor White
Write-Host "  git checkout -b feature/backend-setup" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'feat(backend): add new feature'" -ForegroundColor White
Write-Host "  git checkout develop" -ForegroundColor White
Write-Host "  git merge feature/backend-setup" -ForegroundColor White

Read-Host "`nPress Enter to continue"

