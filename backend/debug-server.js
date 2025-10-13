const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:19006",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: "http://localhost:19006",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Test basic middleware
const basicMiddleware = (req, res, next) => next();
app.use('/test', basicMiddleware);

console.log('Testing route imports...');

// Test each route import individually
try {
  console.log('Testing auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✓ Auth routes loaded successfully');
  app.use('/api/auth', authRoutes);
} catch (error) {
  console.error('✗ Auth routes failed:', error.message);
}

try {
  console.log('Testing user routes...');
  const userRoutes = require('./routes/users');
  console.log('✓ User routes loaded successfully');
  // Don't add middleware yet, just test import
} catch (error) {
  console.error('✗ User routes failed:', error.message);
}

try {
  console.log('Testing workout routes...');
  const workoutRoutes = require('./routes/workouts');
  console.log('✓ Workout routes loaded successfully');
  // Don't add middleware yet, just test import
} catch (error) {
  console.error('✗ Workout routes failed:', error.message);
}

try {
  console.log('Testing nutrition routes...');
  const nutritionRoutes = require('./routes/nutrition');
  console.log('✓ Nutrition routes loaded successfully');
  // Don't add middleware yet, just test import
} catch (error) {
  console.error('✗ Nutrition routes failed:', error.message);
}

try {
  console.log('Testing progress routes...');
  const progressRoutes = require('./routes/progress');
  console.log('✓ Progress routes loaded successfully');
  // Don't add middleware yet, just test import
} catch (error) {
  console.error('✗ Progress routes failed:', error.message);
}

try {
  console.log('Testing social routes...');
  const socialRoutes = require('./routes/social');
  console.log('✓ Social routes loaded successfully');
  // Don't add middleware yet, just test import
} catch (error) {
  console.error('✗ Social routes failed:', error.message);
}

try {
  console.log('Testing analytics routes...');
  const analyticsRoutes = require('./routes/analytics');
  console.log('✓ Analytics routes loaded successfully');
  // Don't add middleware yet, just test import
} catch (error) {
  console.error('✗ Analytics routes failed:', error.message);
}

// Test middleware imports
try {
  console.log('Testing auth middleware...');
  const authMiddleware = require('./middleware/auth');
  console.log('✓ Auth middleware loaded successfully');
} catch (error) {
  console.error('✗ Auth middleware failed:', error.message);
}

try {
  console.log('Testing error handler middleware...');
  const errorHandler = require('./middleware/errorHandler');
  console.log('✓ Error handler loaded successfully');
} catch (error) {
  console.error('✗ Error handler failed:', error.message);
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
