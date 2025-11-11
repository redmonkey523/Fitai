# 🚀 Quick Start Guide - Fitness App

## TL;DR - Just Want It Running?

**Windows:**
```powershell
.\start-dev.ps1
```

**Mac/Linux:**
```bash
./start-dev.sh
```

That's it! Both scripts will:
- ✅ Install dependencies if needed
- ✅ Create `.env` file with defaults
- ✅ Start backend server on port 5000
- ✅ Start frontend/Expo
- ✅ Handle cleanup on exit

---

## Manual Setup (If Scripts Don't Work)

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- (Optional) MongoDB running locally
- (Optional) Xcode for iOS development
- (Optional) Android Studio for Android development

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure Backend

Create `backend/.env` file:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
CORS_ORIGIN=http://localhost:19006,http://localhost:19000,http://localhost:8081
```

### Step 3: Start Development Servers

**You need TWO terminal windows:**

**Terminal 1 - Backend:**
```bash
npm run backend:dev
```

**Terminal 2 - Frontend:**
```bash
npm start
```

Then choose your platform:
- Press `w` for **web** (opens in browser)
- Press `a` for **Android** (requires emulator or device)
- Press `i` for **iOS** (requires iOS simulator - Mac only)

---

## 🎯 First Time Usage

### 1. Create an Account

When the app loads:
1. Tap "Use email instead"
2. Enter your details (any email/password works in dev mode)
3. Tap "Create account"
4. ✅ You're in!

### 2. Or Use Google Sign-In

**Note:** Google Sign-In requires additional setup:
- Google Cloud Console project
- OAuth 2.0 credentials
- iOS/Android configuration

For quick testing, **use email registration** instead.

---

## 🔧 Troubleshooting

### "Cannot connect to server" or "Error aborted"

**Problem:** Backend server is not running.

**Solution:**
```bash
# Start the backend in a separate terminal
npm run backend:dev

# You should see:
# ✓ Backend server running on port 5000
```

### "Invalid credentials" when logging in

**Problem:** User doesn't exist yet.

**Solution:**
- Create a new account first using "Use email instead"
- Then login with those credentials

### Backend won't start - "Port 5000 already in use"

**Solution:**
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Or use a different port in backend/.env:
PORT=5001
```

### "Cannot find module" errors

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install
```

### MongoDB connection errors

**Don't worry!** The backend automatically falls back to an in-memory database if MongoDB is not available. Your app will still work fine for development.

To use a real MongoDB:
```env
# In backend/.env
MONGODB_URI=mongodb://localhost:27017/fitness_app
```

### iOS build fails

See [XCODE_SETUP_GUIDE.md](./XCODE_SETUP_GUIDE.md) for detailed iOS setup instructions.

---

## 📱 Platform-Specific Instructions

### Web Development (Easiest)
```bash
npm start
# Press 'w' for web
```
- Opens in browser automatically
- Hot reloading works
- No additional setup needed

### iOS Development (Mac only)
```bash
# First time setup
npm run prebuild:ios
npm run pod:install

# Then run
npm run ios
```

See [XCODE_SETUP_GUIDE.md](./XCODE_SETUP_GUIDE.md) for detailed instructions.

### Android Development
```bash
# First time setup
npm run prebuild:android

# Then run
npm run android
```

Requires Android Studio and an emulator or physical device.

---

## 🎨 Development Workflow

### File Structure
```
fitness-app-new/
├── src/                  # Frontend React Native code
│   ├── components/       # Reusable UI components
│   ├── screens/          # App screens
│   ├── services/         # API services, auth, etc.
│   ├── contexts/         # React contexts
│   └── config/           # Configuration files
├── backend/              # Node.js/Express backend
│   ├── routes/           # API route handlers
│   ├── models/           # Database models
│   ├── middleware/       # Express middleware
│   └── config/           # Backend configuration
├── ios/                  # iOS native files (after prebuild)
└── android/              # Android native files (after prebuild)
```

### Hot Reloading

- **Web:** Automatic hot reload on save
- **Mobile:** Shake device → "Reload" or press `R` in terminal

### Debugging

**Frontend:**
- Web: Browser DevTools (F12)
- iOS: Safari DevTools (Safari → Develop → Simulator)
- Android: Chrome DevTools (chrome://inspect)
- React Native Debugger recommended

**Backend:**
- Check terminal output where you ran `npm run backend:dev`
- API logs appear there
- Add `console.log()` statements as needed

---

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
npm run test:backend

# Run e2e smoke test
npm run e2e:smoke

# Check for linting errors
npm run lint
```

---

## 📦 Available Scripts

### Frontend
- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run dev:web` - Run web version
- `npm test` - Run tests
- `npm run lint` - Check code style

### Backend
- `npm run backend:dev` - Start backend in development mode
- `npm run backend:start` - Start backend in production mode
- `npm run test:backend` - Run backend tests

### Build
- `npm run prebuild:ios` - Generate iOS native files
- `npm run prebuild:android` - Generate Android native files
- `npm run pod:install` - Install iOS CocoaPods
- `npm run build:ios` - Build iOS app (EAS)
- `npm run build:android` - Build Android app (EAS)

---

## 🌐 API Base URL Configuration

The app automatically detects the correct API URL:

- **Web:** `http://localhost:5000/api`
- **iOS Simulator:** `http://localhost:5000/api`
- **Android Emulator:** `http://10.0.2.2:5000/api` or your LAN IP
- **Physical Device:** Your computer's LAN IP (auto-detected)

Check console log for:
```
🌐 API Base URL: http://192.168.1.x:5000/api
```

To override, set in `.env`:
```env
EXPO_PUBLIC_API_URL=http://your-ip:5000/api
```

---

## 🚀 Production Deployment

### Backend
1. Set production environment variables
2. Use a real MongoDB instance
3. Configure Cloudinary for file uploads
4. Deploy to Heroku, Railway, Render, or similar

### Frontend
1. Update `API_BASE_URL` to production backend
2. Build with EAS:
   ```bash
   npm run build:ios
   npm run build:android
   ```
3. Submit to App Store / Play Store

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions (if exists).

---

## 💡 Tips & Best Practices

1. **Always run backend first** before testing login/auth features
2. **Use web for quick testing** - fastest iteration cycle
3. **Check both terminal outputs** if something breaks
4. **Clear cache if weird issues:** `npm start -- --clear`
5. **Restart Expo if hot reload breaks:** Ctrl+C → `npm start`

---

## 🆘 Still Having Issues?

1. Check [LOGIN_FIX_GUIDE.md](./LOGIN_FIX_GUIDE.md) for login-specific issues
2. Check [XCODE_SETUP_GUIDE.md](./XCODE_SETUP_GUIDE.md) for iOS issues
3. Look at console logs in both terminals
4. Try the clean install:
   ```bash
   # Clean everything
   rm -rf node_modules backend/node_modules ios/Pods
   rm -rf ios/build android/build
   
   # Reinstall
   npm install
   cd backend && npm install && cd ..
   npm run pod:install  # If on Mac
   
   # Start fresh
   npm start -- --clear
   ```

---

## ✨ Features Available After Setup

- ✅ User registration & authentication
- ✅ Workout tracking
- ✅ Nutrition logging
- ✅ Progress photos
- ✅ AI food scanner (requires API keys)
- ✅ Social feed
- ✅ Analytics dashboard
- ✅ Meal planning
- ✅ Exercise library

Happy coding! 🎉

