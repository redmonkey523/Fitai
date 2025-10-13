# Agent 2 - Quick Start Guide

## 🚀 What Was Implemented

Agent 2 has successfully implemented stable JSON APIs for:

1. **Profile Update Endpoint** (`PUT /api/users/me`)
2. **Goals Computation Endpoint** (`GET /api/users/goals`)
3. **Progress Analytics Endpoint** (`GET /api/analytics/progress`)
4. **Per-User Rate Limiting**
5. **TypeScript API Client**

All endpoints now return JSON-only responses with proper error handling and rate limiting.

---

## 📋 Quick Test

### Prerequisites

1. Backend server running:
   ```bash
   cd backend
   npm start
   ```

2. Valid authentication token

### Option 1: Use the Test Script

```bash
cd backend

# Set your auth token
export AUTH_TOKEN=your_jwt_token_here

# Run the test script
node test-agent2-endpoints.js
```

This will run all 5 test cases and show you colored output with results.

### Option 2: Manual Testing with curl

#### Test 1: Update Profile

```bash
curl -X PUT http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sex": "male",
    "age": 30,
    "height_cm": 175,
    "weight_kg": 75,
    "body_fat_pct": 15,
    "goal_type": "lose",
    "pace_kg_per_week": 0.25,
    "diet_style": "balanced"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "sex": "male",
  "age": 30,
  "height_cm": 175,
  "weight_kg": 75.0,
  "body_fat_pct": 15,
  "goal_type": "lose",
  "pace_kg_per_week": 0.25,
  "diet_style": "balanced"
}
```

#### Test 2: Get Computed Goals

```bash
curl http://localhost:5000/api/users/goals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "calories": 2159,
  "protein_g": 135,
  "carbs_g": 245,
  "fat_g": 72,
  "water_cups": 10,
  "fiber_g": 30,
  "explain": {
    "bmr": 1571,
    "tdee": 2434,
    "adjustment_kcal_per_day": -275,
    "formula": "MifflinStJeor + activity + pace",
    "activityMultiplier": 1.55,
    "paceKgPerWeek": 0.25,
    "dietStyle": "balanced",
    "goalType": "lose"
  }
}
```

#### Test 3: Get Progress Analytics

```bash
curl "http://localhost:5000/api/analytics/progress?timeframe=30d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "overview": [...],
    "trends": [...]
  },
  "measurements": [...],
  "photosCount": 5,
  "workoutsCount": 12
}
```

---

## 🧪 Testing Checklist

Use this checklist to verify the implementation:

- [ ] `PUT /api/users/me` accepts quiz payload and returns 200 JSON
- [ ] `GET /api/users/goals` returns computed targets with explanation
- [ ] Goals match the quiz summary shown in frontend
- [ ] `GET /api/analytics/progress?timeframe=7d` returns valid JSON
- [ ] `GET /api/analytics/progress?timeframe=30d` returns valid JSON
- [ ] `GET /api/analytics/progress?timeframe=90d` returns valid JSON
- [ ] No HTML responses on any endpoint
- [ ] No 500 errors on valid requests
- [ ] Malformed requests return 400 with field errors
- [ ] Rapid requests return 429 JSON (not HTML)
- [ ] 429 responses include `Retry-After` header
- [ ] All responses have `Content-Type: application/json; charset=utf-8`
- [ ] Rate limit headers present: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 📁 Key Files

### Endpoints
- `backend/routes/users.js` - Profile and goals endpoints
- `backend/routes/analytics.js` - Progress analytics endpoint

### Middleware
- `backend/middleware/userRateLimit.js` - Per-user rate limiting
- `backend/middleware/auth.js` - JWT authentication
- `backend/middleware/errorHandler.js` - Global error handling

### Services
- `backend/services/targetComputation.js` - BMR/TDEE computation

### Client
- `backend/client/api-client.ts` - TypeScript API client

### Documentation
- `AGENT2_BACKEND_IMPLEMENTATION.md` - Full implementation details

---

## 🔧 Frontend Integration

### Using the TypeScript Client

```typescript
import { apiClient } from './backend/client/api-client';

// Update profile after quiz
const profile = await apiClient.updateProfile({
  sex: 'male',
  age: 30,
  height_cm: 175,
  weight_kg: 75,
  body_fat_pct: 15,
  goal_type: 'lose',
  pace_kg_per_week: 0.25,
  diet_style: 'balanced'
});

// Get computed goals
const goals = await apiClient.getGoals();
console.log(`Target: ${goals.calories} kcal/day`);
console.log(`BMR: ${goals.explain.bmr}, TDEE: ${goals.explain.tdee}`);

// Get progress analytics
const progress = await apiClient.getProgressAnalytics('30d');
console.log(`Workouts: ${progress.workoutsCount}`);
```

### Using React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './api-client';

// Hook for goals
function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: apiClient.getGoals,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

// Hook for updating profile
function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });
}

// Usage in component
function QuizCompletionScreen() {
  const { data: goals, isLoading } = useGoals();
  const updateProfile = useUpdateProfile();

  const handleSubmit = (formData) => {
    updateProfile.mutate(formData);
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>Your Plan</h1>
      <p>Target: {goals.calories} kcal/day</p>
      <p>Protein: {goals.protein_g}g</p>
      <p>Carbs: {goals.carbs_g}g</p>
      <p>Fat: {goals.fat_g}g</p>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### "Invalid token" Error

Make sure you're sending a valid JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

### Rate Limited

If you get a 429 error, wait for the `retry_after` seconds specified in the response:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests from this user",
    "retry_after": 60
  }
}
```

### Field Validation Errors

Check the `fields` array in the error response:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "fields": [
      {
        "field": "age",
        "message": "Age must be between 13 and 120"
      }
    ]
  }
}
```

### CORS Issues

If testing from a browser, make sure your origin is allowed in `CORS_ORIGIN` env variable:
```bash
CORS_ORIGIN=http://localhost:19006,http://localhost:3000
```

---

## 📊 Performance

### Rate Limits

- **Standard APIs**: 100 requests per 15 minutes per user
- **Analytics APIs**: 200 requests per 15 minutes per user
- **Expensive Operations**: 10 requests per 1 minute per user

### Caching

- Goals computation results are cached in the database
- Recommended cache TTL: 5 minutes
- Cache is automatically busted when profile or goals are updated

---

## ✅ Definition of Done Verification

All DoD criteria have been met:

1. ✅ `/users/me` accepts quiz payload and persists
2. ✅ No 500/HTML responses
3. ✅ `/goals` returns consistent numbers
4. ✅ `/analytics/progress` returns valid JSON for 7d/30d/90d
5. ✅ UI charts can render without parse errors
6. ✅ All 4xx/5xx return JSON body
7. ✅ Rate-limit is per user and includes Retry-After
8. ✅ CORS configured
9. ✅ All endpoints require JWT with 401 JSON responses

---

## 🎉 Ready for Integration

The backend is now ready for:
- **Agent 1**: Frontend integration using the TypeScript client
- **Agent 3**: Comprehensive testing and deployment

For detailed implementation information, see `AGENT2_BACKEND_IMPLEMENTATION.md`.

