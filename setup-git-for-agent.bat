@echo off
echo Setting up Git for Background Agent...

REM Add Git to PATH if not already there
set PATH=%PATH%;C:\Program Files\Git\bin

REM Check if Git is available
git --version
if %errorlevel% neq 0 (
    echo Git not found in PATH, trying to find it...
    if exist "C:\Program Files\Git\bin\git.exe" (
        echo Found Git at C:\Program Files\Git\bin\git.exe
        set PATH=%PATH%;C:\Program Files\Git\bin
    ) else (
        echo Git not found. Please install Git first.
        pause
        exit /b 1
    )
)

REM Configure Git user if not already set
git config --global user.name "Fitness App Developer"
git config --global user.email "developer@fitnessapp.com"

REM Check repository status
echo.
echo Checking repository status...
git status

echo.
echo Git setup complete! Background agent can now use Git commands.
echo.
echo Available commands:
echo   git status
echo   git checkout -b feature/backend-setup
echo   git add .
echo   git commit -m "feat(backend): add new feature"
echo   git checkout develop
echo   git merge feature/backend-setup
echo.
pause
