# ⚠️ BACKEND RESTART REQUIRED

## New Routes Added

I've added the following new endpoints that require a server restart:

### New GET Endpoints:
1. ✅ `GET /api/users/me/profile` - Get user profile in Goal Quiz format
2. ✅ `GET /api/users/me/goals` - Get current goals and computed targets

### Existing Endpoints (already working):
3. ✅ `PATCH /api/users/me/profile` - Update profile
4. ✅ `PUT /api/users/me/goals` - Update goals & compute targets
5. ✅ `GET /api/users/me/summary?window=7d|30d` - Get summary

## How to Restart

### Option 1: Stop and Start
```bash
# If running in terminal, press Ctrl+C to stop
# Then start again:
cd backend
npm start
```

### Option 2: If using PM2
```bash
pm2 restart fitness-api
# or
pm2 restart all
```

### Option 3: Kill the process
```powershell
# Find Node.js processes
Get-Process node | Stop-Process -Force

# Then start again
cd backend
npm start
```

## Verify It's Working

After restarting, test the endpoints:

```bash
# Should return 401 (not 404) when not authenticated
curl http://localhost:5000/api/users/me/profile

# Check all routes are loaded
curl http://localhost:5000/health
```

## Current Error

You're seeing:
```
ERROR [API] Request failed for /users/me/summary?window=7d: [Error: Route not found]
```

This happens because the backend server is still running the OLD code without the new GET handlers I just added.

**Solution: Restart the backend server!**

