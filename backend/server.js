const express = require('express');
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

// Import routes with error handling
let authRoutes, userRoutes, workoutRoutes, nutritionRoutes, progressRoutes, socialRoutes, analyticsRoutes, aiRoutes;

try {
  authRoutes = require('./routes/auth');
  userRoutes = require('./routes/users');
  workoutRoutes = require('./routes/workouts');
  nutritionRoutes = require('./routes/nutrition');
  progressRoutes = require('./routes/progress');
  socialRoutes = require('./routes/social');
  analyticsRoutes = require('./routes/analytics');
  aiRoutes = require('./routes/ai');
} catch (error) {
  console.error('Error loading routes:', error.message);
  // Create basic route handlers for development
  const basicRouter = require('express').Router();
  basicRouter.get('/', (req, res) => res.json({ message: 'Route available' }));
  authRoutes = userRoutes = workoutRoutes = nutritionRoutes = progressRoutes = socialRoutes = analyticsRoutes = aiRoutes = basicRouter;
}

// Import middleware with error handling
let authenticateToken, errorHandler;

try {
  const authMiddleware = require('./middleware/auth');
  authenticateToken = authMiddleware.authenticateToken;
  const errorHandlerModule = require('./middleware/errorHandler');
  errorHandler = errorHandlerModule.errorHandler;
} catch (error) {
  console.error('Error loading middleware:', error.message);
  // Create basic middleware for development
  authenticateToken = (req, res, next) => next();
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
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
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || "http://localhost:19006",
  credentials: true
}));

// Body parsing middleware
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
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/workouts', authenticateToken, workoutRoutes);
app.use('/api/nutrition', authenticateToken, nutritionRoutes);
app.use('/api/progress', authenticateToken, progressRoutes);
app.use('/api/social', authenticateToken, socialRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/ai', aiRoutes);

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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
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
