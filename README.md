# 🏋️ FitAI - AI-Powered Fitness App

A comprehensive fitness tracking application with AI-powered food recognition, workout planning, and progress tracking.

## 🚀 Quick Start (< 15 minutes)

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud)
- Expo CLI (`npm install -g @expo/cli`)
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd fitness-app-new
npm install
cd backend && npm install
```

### 2. Environment Configuration

#### Backend Configuration
The backend uses environment variables for configuration. The app will work with defaults, but for full functionality:

1. **Copy example file**: The backend will use `backend/env.example` as reference
2. **Optional: Set up AI services** (for enhanced features):
   - OpenAI API key (for advanced AI features)
   - Google Vision API key (for image recognition)
   - Nutritionix API keys (for nutrition data)
   - Clarifai API key (for food recognition)

#### Frontend Configuration
Do not hardcode base URLs. Set `EXPO_PUBLIC_API_URL` and the app will read it via `app.config.js`:

```bash
# Windows PowerShell (session)
$env:EXPO_PUBLIC_API_URL = "http://localhost:5000/api"
# macOS/Linux
export EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

At runtime the app logs the resolved base URL. In CI, we fail if `http://localhost` or raw IPs are found in runtime code.

### 3. Start the Application

#### Option A: Full Stack (Recommended)
```bash
# Terminal 1: Start backend
npm run backend:start

# Terminal 2: Start frontend
npm start
```

#### Option B: Backend Only (for testing)
```bash
cd backend
npm start
```

### 4. Verify Setup
```bash
# Run smoke test to verify backend connectivity
npm run smoke-test

# Expected output:
# ✅ Backend Health Check
# ✅ AI Service Health Check
# ✅ Authentication Endpoints
# ✅ All tests passed!
```

## 🌐 Environment Variables

### Frontend (environment)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` | Yes |
| `NODE_ENV` | Environment name | `development` | No |

### Backend Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `5000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `MONGODB_URI` | MongoDB connection | `mongodb://localhost:27017/fitness_app` | Yes |
| `JWT_SECRET` | JWT secret key | Generated | Yes |
| `CORS_ORIGIN` | CORS origins | `http://localhost:19006,http://localhost:3000` | No |

#### AI Service Keys (Optional)
| Variable | Service | Free Tier | Notes |
|----------|---------|-----------|-------|
| `NUTRITIONIX_APP_ID` | Nutritionix | ✅ Yes | Food database |
| `NUTRITIONIX_APP_KEY` | Nutritionix | ✅ Yes | Food database |
| `CLARIFAI_API_KEY` | Clarifai | ✅ 1000/month | Food recognition |
| `GOOGLE_VISION_API_KEY` | Google Vision | 💰 Paid | Image recognition |
| `CALORIE_MAMA_API_KEY` | Calorie Mama | 💰 Paid | Premium food AI |
| `OPENAI_API_KEY` | OpenAI | 💰 Paid | Advanced AI features |

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── routes/          # API endpoints
│   ├── auth.js      # Authentication
│   ├── users.js     # User management
│   ├── workouts.js  # Workout management
│   ├── nutrition.js # Nutrition tracking
│   ├── progress.js  # Progress tracking
│   ├── social.js    # Social features
│   ├── analytics.js # Analytics
│   ├── ai.js        # AI services
│   └── upload.js    # File uploads
├── models/          # Database models
├── services/        # Business logic
├── middleware/      # Express middleware
└── tests/          # Backend tests
```

### Frontend (React Native/Expo)
```
src/
├── screens/        # App screens
├── components/     # Reusable components
├── services/       # API services
├── store/         # Redux store
├── navigation/    # Navigation config
└── config/        # App configuration
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### Workouts
- `GET /api/workouts` - List workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts/:id` - Get workout details
- `PUT /api/workouts/:id` - Update workout
- `DELETE /api/workouts/:id` - Delete workout

### Nutrition
- `POST /api/nutrition/log` - Log food
- `GET /api/nutrition/history` - Get nutrition history
- `GET /api/nutrition/goals` - Get nutrition goals
- `PUT /api/nutrition/goals` - Update goals

### AI Features
- `POST /api/ai/scan-food` - Food recognition
- `POST /api/ai/scan-barcode` - Barcode scanning
- `GET /api/ai/demo/food` - Demo food data
- `GET /api/ai/demo/barcode` - Demo barcode data
- `GET /api/ai/health` - AI service health

### Health Check
- `GET /health` - Server health check

## 🧪 Testing

### Backend Tests
```bash
npm run test:backend          # Run all backend tests
npm run test:backend:watch    # Watch mode
npm run test:backend:coverage # With coverage
```

### Frontend Tests
```bash
npm test              # Run frontend tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Smoke Tests
```bash
npm run smoke-test    # Test backend connectivity
```

### E2E Tests (Coming Soon)
```bash
npm run test:e2e      # End-to-end tests
```

## 🚀 Deployment

### Development
```bash
# Start development servers
npm run backend:dev   # Backend with hot reload
npm start            # Frontend with Expo
```

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
expo build:web       # Web build
expo build:android   # Android build
expo build:ios       # iOS build
```

### Docker Deployment
```bash
docker-compose up --build
```

## 🔒 Security Features

- JWT-based authentication
- Rate limiting
- CORS protection
- Input validation
- Helmet security headers
- Environment variable protection

## 🤝 Development Workflow

### Adding New Features

1. **Backend Endpoint**:
   ```bash
   # Create route in backend/routes/
   # Add model if needed in backend/models/
   # Add tests in backend/tests/
   ```

2. **Frontend Integration**:
   ```bash
   # Add API service method in src/services/
   # Create/update Redux slice in src/store/slices/
   # Update UI components
   ```

3. **Testing**:
   ```bash
   npm run smoke-test    # Verify backend integration
   npm test             # Run all tests
   ```

### Commit Guidelines
- `feat:` New features
- `fix:` Bug fixes
- `chore:` Maintenance
- `test:` Test updates
- `docs:` Documentation

## 📈 Performance

### Backend Optimizations
- MongoDB connection pooling
- Request rate limiting
- Compression middleware
- Efficient database queries

### Frontend Optimizations
- Redux state management
- Component memoization
- Image optimization
- Lazy loading

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   ```bash
   npm run smoke-test  # Check backend connectivity
   # Verify MongoDB is running
   # Check PORT and CORS_ORIGIN settings
   ```

2. **AI Services Not Working**
   ```bash
   # Check AI service health
   curl http://localhost:5000/api/ai/health
   # Verify API keys are set
   ```

3. **Frontend Build Issues**
   ```bash
   npx expo install --fix  # Fix dependency issues
   npm run test           # Check for test failures
   ```

### Debug Mode
Set `DEBUG_MODE=true` in environment for detailed logging.

## 📞 Support

- 📖 [Full API Documentation](docs/endpoint-coverage.md)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

## 🎯 Success Criteria

✅ Building and running the app shows live data from the backend  
✅ No mock libraries in runtime code  
✅ All user-facing screens backed by real API calls  
✅ Smoke test and E2E tests pass  
✅ New developers can get live data in < 15 minutes  

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0
