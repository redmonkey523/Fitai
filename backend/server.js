const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Fail fast in production if cloud storage is not configured
if (process.env.NODE_ENV === 'production') {
  const hasCloud = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  if (!hasCloud) {
    console.error('Missing Cloudinary env in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
    process.exit(1);
  }
}

// Import routes with resilient per-route error handling
const createUnavailableRouter = (name) => {
  const router = express.Router();
  router.get('/', (req, res) => res.status(503).json({ success: false, message: `${name} route unavailable` }));
  return router;
};

const safeLoadRoute = (path, name) => {
  try {
    return require(path);
  } catch (error) {
    console.error(`Failed to load ${name} routes from ${path}: ${error.message}`);
    return createUnavailableRouter(name);
  }
};

const authRoutes = safeLoadRoute('./routes/auth', 'auth');
const userRoutes = safeLoadRoute('./routes/users', 'users');
const workoutRoutes = safeLoadRoute('./routes/workouts', 'workouts');
const nutritionRoutes = safeLoadRoute('./routes/nutrition', 'nutrition');
const progressRoutes = safeLoadRoute('./routes/progress', 'progress');
const socialRoutes = safeLoadRoute('./routes/social', 'social');
const analyticsRoutes = safeLoadRoute('./routes/analytics', 'analytics');
const aiRoutes = safeLoadRoute('./routes/ai', 'ai');
const sleepRoutes = safeLoadRoute('./routes/sleep', 'sleep');
const recipesRoutes = safeLoadRoute('./routes/recipes', 'recipes');
const mealPlansRoutes = safeLoadRoute('./routes/mealPlans', 'mealPlans');
const groceryListRoutes = safeLoadRoute('./routes/groceryList', 'groceryList');

// Import middleware with error handling
let authenticateToken, errorHandler, userRateLimiters;

try {
  const authMiddleware = require('./middleware/auth');
  authenticateToken = authMiddleware.authenticateToken;
  const errorHandlerModule = require('./middleware/errorHandler');
  errorHandler = errorHandlerModule.errorHandler;
  userRateLimiters = require('./middleware/userRateLimit');
} catch (error) {
  console.error('Error loading middleware:', error.message);
  // Create basic middleware for development
  authenticateToken = (req, res, next) => next();
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  };
  userRateLimiters = {
    standardUserRateLimiter: (req, res, next) => next(),
    aggressiveUserRateLimiter: (req, res, next) => next(),
    lenientUserRateLimiter: (req, res, next) => next()
  };
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || "http://localhost:19006",
    methods: ["GET", "POST"]
  }
});

// Database connection with fallback
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness_app';
console.log('Attempting to connect to MongoDB at:', mongoUri);

let isMongoConnected = false;

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  isMongoConnected = true;
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('🔄 Continuing with in-memory storage for development...');
  console.log('📝 To fix this:');
  console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
  console.log('   2. Start MongoDB service: net start MongoDB');
  console.log('   3. Or use Docker: docker run -d -p 27017:27017 mongo');
  console.log('   4. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
  isMongoConnected = false;
});

// Expose MongoDB connection status
app.get('/api/db-status', (req, res) => {
  res.json({
    mongodb: isMongoConnected,
    message: isMongoConnected ? 'MongoDB connected' : 'Using in-memory storage'
  });
});

// Security middleware
// Allow loading uploaded media from a different origin (e.g., app on :19006 loading from backend :5000)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());

// CORS configuration (dev-friendly) – must be BEFORE anything that may reject the request
const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || []).map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Always allow non-browser / same-origin requests
    if (!origin) return callback(null, true);
    // Allow any localhost / 127.0.0.1 / LAN IP for dev convenience
    if (/^(http:\/\/|https:\/\/)localhost:\d+/.test(origin) || /^(http:\/\/|https:\/\/)127\.0\.0\.1:\d+/.test(origin) || /^(http:\/\/|https:\/\/)192\.168\.\d+\.\d+:\d+/.test(origin)) {
      return callback(null, true);
    }
    // Allow explicitly whitelisted origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed for this origin'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Handle preflight requests quickly
app.options('*', cors());

// Rate limiting – needs to come AFTER CORS so preflight receives headers
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 100 : 1000), // 1000 in dev, 100 in prod
  message: JSON.stringify({ success: false, message: 'Too many requests from this IP, please try again later.' }),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});
app.use('/api/', limiter);

// Body parsing middleware
// Use raw body for webhook signature validation
app.use('/api/media/webhook/cloudinary', express.raw({ type: '*/*', limit: '2mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    database: {
      mongodb: isMongoConnected,
      status: isMongoConnected ? 'connected' : 'using in-memory storage'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRateLimiters.standardUserRateLimiter, userRoutes);
app.use('/api/workouts', authenticateToken, userRateLimiters.standardUserRateLimiter, workoutRoutes);
app.use('/api/nutrition', authenticateToken, userRateLimiters.standardUserRateLimiter, nutritionRoutes);
app.use('/api/progress', authenticateToken, userRateLimiters.standardUserRateLimiter, progressRoutes);
app.use('/api/social', authenticateToken, userRateLimiters.standardUserRateLimiter, socialRoutes);
app.use('/api/analytics', authenticateToken, userRateLimiters.lenientUserRateLimiter, analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/nutrition/recipes', authenticateToken, userRateLimiters.standardUserRateLimiter, recipesRoutes);
app.use('/api/nutrition/meal-plans', authenticateToken, userRateLimiters.standardUserRateLimiter, mealPlansRoutes);
app.use('/api/nutrition/grocery-list', authenticateToken, userRateLimiters.standardUserRateLimiter, groceryListRoutes);
try {
  const uploadRoutes = require('./routes/upload');
  // Upload routes already authenticate internally; mount without extra auth wrapper
  app.use('/api/upload', uploadRoutes);
  // Serve uploaded files from a stable public path
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
} catch (e) {
  console.warn('Upload routes not loaded:', e.message);
}
try {
  const plansRoutes = require('./routes/plans');
  app.use('/api/plans', authenticateToken, plansRoutes);
} catch (e) {
  console.warn('Plans routes not loaded:', e.message);
}
try {
  const mealsRoutes = require('./routes/meals');
  app.use('/api/meals', authenticateToken, mealsRoutes);
} catch (e) {
  console.warn('Meals routes not loaded:', e.message);
}
try {
  const discoverRoutes = require('./routes/discover');
  app.use('/api/discover', authenticateToken, discoverRoutes);
} catch (e) {
  console.warn('Discover routes not loaded:', e.message);
}
try {
  const coachesRoutes = require('./routes/coaches');
  app.use('/api/coaches', authenticateToken, coachesRoutes);
} catch (e) {
  console.warn('Coaches routes not loaded:', e.message);
}
try {
  const creatorRoutes = require('./routes/creators');
  app.use('/api/creators', authenticateToken, creatorRoutes);
} catch (e) {
  console.warn('Creators routes not loaded:', e.message);
}
try {
  const legacyCreatorRoutes = require('./routes/creator');
  app.use('/api/creator', authenticateToken, legacyCreatorRoutes);
} catch (e) {
  console.warn('Legacy creator routes not loaded:', e.message);
}
try {
  const commerceRoutes = require('./routes/commerce');
  app.use('/api/commerce', authenticateToken, commerceRoutes);
} catch (e) {
  console.warn('Commerce routes not loaded:', e.message);
}
try {
  const mediaRoutes = require('./routes/media');
  app.use('/api/media', authenticateToken, mediaRoutes);
} catch (e) {
  console.warn('Media routes not loaded:', e.message);
}
try {
  const notificationsRoutes = require('./routes/notifications');
  app.use('/api/notifications', authenticateToken, notificationsRoutes);
} catch (e) {
  console.warn('Notifications routes not loaded:', e.message);
}

// Start cleanup job
try {
  const { startUploadCleanupJob } = require('./services/uploadCleanup');
  startUploadCleanupJob();
} catch (e) {
  console.warn('Cleanup job not started:', e.message);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  // Handle workout progress updates
  socket.on('workout-progress', (data) => {
    socket.broadcast.to(`user-${data.userId}`).emit('workout-update', data);
  });
  
  // Handle social interactions
  socket.on('social-activity', (data) => {
    socket.broadcast.emit('social-feed-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = parseInt(process.env.PORT, 10) || 5000;

server.listen(PORT, () => {
  console.log(`wServer running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port or set PORT env variable to a different number.`);
    process.exit(1);
  } else {
    throw err;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

module.exports = { app, server, io };
