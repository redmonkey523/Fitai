# Goal Quiz Backend - Deployment Checklist

## Pre-Deployment Testing

### 1. Run Unit Tests
```bash
cd backend
npm test -- targetComputation.test.js
```

**Expected**: All computation tests pass

### 2. Manual Endpoint Testing

Start the server:
```bash
cd backend
npm start
```

In another terminal, run the manual test script:
```bash
node test-goal-endpoints.js
```

**Expected**:
- ✅ All endpoints return JSON (not HTML)
- ✅ Content-Type is `application/json` on all responses
- ✅ Error responses follow `{error: {code, message}}` format
- ✅ Target computation produces valid results
- ✅ Summary aggregation works correctly

### 3. Manual cURL Tests

Test profile update:
```bash
# Get auth token first (register or login)
TOKEN="your-jwt-token"

# PATCH profile
curl -X PATCH http://localhost:5000/api/users/me/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weight": {"value": 80, "unit": "kg"}, "bodyFatPercentage": 18}'
```

Test goals update:
```bash
curl -X PUT http://localhost:5000/api/users/me/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"primary": "lose", "pace_kg_per_week": -0.5, "diet_style": "high_protein"}'
```

Test summary:
```bash
curl http://localhost:5000/api/users/me/summary?window=7d \
  -H "Authorization: Bearer $TOKEN"
```

Test error handling:
```bash
# Should return 401 with JSON error
curl -v http://localhost:5000/api/users/me/summary

# Should return 400 with JSON error
curl -X PUT http://localhost:5000/api/users/me/goals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"primary": "invalid"}'
```

**Expected**:
- All responses have `Content-Type: application/json; charset=utf-8`
- No HTML in any response
- Error responses follow spec format
- 429 responses include `Retry-After` header

## Environment Configuration

### Required Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/fitness_app

# Authentication
JWT_SECRET=your-strong-secret-key-here

# Server
PORT=5000
NODE_ENV=production

# CORS (comma-separated origins)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cloudinary (optional for profile pictures)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Production-Specific Settings

1. **MongoDB Atlas**: Use connection string with retry writes
2. **JWT Secret**: Generate with `openssl rand -base64 32`
3. **CORS**: Whitelist only production domains
4. **Rate Limiting**: Adjust based on expected traffic
5. **Logging**: Consider external logging service (Loggly, DataDog, etc.)

## Database Migration

### Add new fields to existing users

```javascript
// Run this migration script once
const mongoose = require('mongoose');
const User = require('./models/User');

async function migrateUsers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({});
  
  for (const user of users) {
    // Initialize goalQuiz if not present
    if (!user.goalQuiz) {
      user.goalQuiz = {
        primary: null,
        pace_kg_per_week: 0,
        diet_style: 'balanced'
      };
    }
    
    // Initialize targets with defaults if not present
    if (!user.targets) {
      user.targets = {
        calories: 2000,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 65,
        fiber_g: 30,
        water_cups: 10,
        bmr: 1600,
        tdee: 2000,
        formula: 'mifflin_st_jeor'
      };
    }
    
    await user.save();
  }
  
  console.log(`Migrated ${users.length} users`);
  await mongoose.connection.close();
}

migrateUsers().catch(console.error);
```

## Deployment Steps

### 1. Code Deployment

```bash
# Pull latest code
git pull origin main

# Install dependencies
cd backend
npm install --production

# Run tests
npm test

# Start server with PM2 (recommended)
pm2 start server.js --name fitness-api
pm2 save
```

### 2. Verify Deployment

```bash
# Check health endpoint
curl https://api.yourdomain.com/health

# Check database status
curl https://api.yourdomain.com/api/db-status

# Test goal endpoint (with valid token)
curl https://api.yourdomain.com/api/users/me/goals \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Monitor

```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs fitness-api

# Check for errors
pm2 logs fitness-api --err
```

## Performance Monitoring

### Key Metrics to Track

1. **Response Times**
   - `/api/users/me/profile`: < 100ms
   - `/api/users/me/goals`: < 200ms (includes computation)
   - `/api/users/me/summary`: < 500ms (aggregation-heavy)

2. **Error Rates**
   - 400 errors: < 5% (user input errors)
   - 500 errors: < 0.1% (server errors - investigate immediately)

3. **Database Queries**
   - Summary endpoint: ~4-6 queries
   - Consider adding indexes if slow:
     - Progress: `{user: 1, type: 1, date: -1}`
     - Workout: `{user: 1, 'session.completed': 1, 'session.completedAt': -1}`
     - Nutrition: `{userId: 1, consumedAt: -1}`

## Rollback Plan

If issues are detected after deployment:

```bash
# Stop current version
pm2 stop fitness-api

# Checkout previous version
git checkout <previous-commit-hash>

# Install dependencies
npm install --production

# Start server
pm2 start server.js --name fitness-api

# Verify
curl https://api.yourdomain.com/health
```

## Documentation Updates

After deployment:

1. ✅ Update API documentation with OpenAPI spec
2. ✅ Notify frontend team of new endpoints
3. ✅ Share example requests/responses
4. ✅ Document any breaking changes
5. ✅ Update version number in package.json

## Security Checklist

- [ ] JWT_SECRET is strong and unique (32+ chars)
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled and tuned
- [ ] MongoDB connection uses SSL/TLS
- [ ] No sensitive data in logs
- [ ] Error messages don't leak implementation details
- [ ] All user inputs are validated
- [ ] Authentication required on all protected endpoints

## Post-Deployment Validation

### Week 1 Monitoring

- [ ] Check error logs daily
- [ ] Monitor response times
- [ ] Verify no 500 errors
- [ ] Check database query performance
- [ ] Validate computation accuracy with sample users

### Week 2-4 Optimization

- [ ] Analyze slow queries
- [ ] Add caching if needed
- [ ] Optimize aggregation pipelines
- [ ] Consider read replicas for summary endpoint

## Support

### Common Issues

**Issue**: Summary endpoint is slow
**Solution**: Add database indexes, implement caching

**Issue**: Rate limiting too aggressive
**Solution**: Adjust `RATE_LIMIT_MAX_REQUESTS` or whitelist dev IPs

**Issue**: Computation seems incorrect
**Solution**: Verify user profile data (height/weight units)

### Contact

For deployment issues:
- Check logs: `pm2 logs fitness-api`
- Check health: `curl /health`
- Review this checklist
- Refer to `GOAL_QUIZ_IMPLEMENTATION.md`

