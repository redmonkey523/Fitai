# Test Authentication System
Write-Host "🧪 Testing Authentication System..." -ForegroundColor Cyan
Write-Host "Server should be running on http://localhost:5000" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 10
    Write-Host "✅ Health Check PASSED" -ForegroundColor Green
    Write-Host "   MongoDB Status: $($health.database.status)" -ForegroundColor White
} catch {
    Write-Host "❌ Health Check FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: User Registration
Write-Host "`n2. Testing User Registration..." -ForegroundColor Green
$registrationData = @{
    email = "testuser$(Get-Random)@example.com"
    password = "testpassword123"
    firstName = "Test"
    lastName = "User"
    username = "testuser$(Get-Random)"
    dateOfBirth = "1990-01-01T00:00:00.000Z"
    gender = "prefer_not_to_say"
    height = @{ value = 170; unit = "cm" }
    weight = @{ value = 70; unit = "kg" }
    fitnessLevel = "beginner"
    goals = @("general_fitness")
}

try {
    $body = $registrationData | ConvertTo-Json -Depth 3
    $registerResult = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
    Write-Host "✅ Registration PASSED" -ForegroundColor Green
    Write-Host "   User ID: $($registerResult.data.user._id)" -ForegroundColor White
    Write-Host "   Token received: $($registerResult.data.token -ne $null)" -ForegroundColor White
    
    # Store for login test
    $testEmail = $registrationData.email
    $testPassword = $registrationData.password
    $userToken = $registerResult.data.token
    
} catch {
    Write-Host "❌ Registration FAILED: $($_.Exception.Message)" -ForegroundColor Red
    $testEmail = $null
}

# Test 3: User Login
if ($testEmail) {
    Write-Host "`n3. Testing User Login..." -ForegroundColor Green
    $loginData = @{
        email = $testEmail
        password = $testPassword
    }
    
    try {
        $loginBody = $loginData | ConvertTo-Json
        $loginResult = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -TimeoutSec 10
        Write-Host "✅ Login PASSED" -ForegroundColor Green
        Write-Host "   Welcome: $($loginResult.data.user.firstName) $($loginResult.data.user.lastName)" -ForegroundColor White
    } catch {
        Write-Host "❌ Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Protected Route (with token)
if ($userToken) {
    Write-Host "`n4. Testing Protected Route..." -ForegroundColor Green
    try {
        $headers = @{ Authorization = "Bearer $userToken" }
        $meResult = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Headers $headers -TimeoutSec 10
        Write-Host "✅ Protected Route PASSED" -ForegroundColor Green
        Write-Host "   User Profile: $($meResult.email)" -ForegroundColor White
    } catch {
        Write-Host "❌ Protected Route FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Authentication Test Complete!" -ForegroundColor Cyan
Write-Host "If all tests passed, your authentication system is working perfectly!" -ForegroundColor Yellow

