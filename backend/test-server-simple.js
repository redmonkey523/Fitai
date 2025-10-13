const express = require('express');
const app = express();

console.log('Testing server setup...');

// Test basic express setup
app.get('/test', (req, res) => {
  res.json({ message: 'Basic server working' });
});

// Test route imports one by one
console.log('Testing route imports...');

try {
  console.log('1. Testing auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✓ Auth routes loaded');
} catch (error) {
  console.log('✗ Auth routes error:', error.message);
}

try {
  console.log('2. Testing user routes...');
  const userRoutes = require('./routes/users');
  console.log('✓ User routes loaded');
} catch (error) {
  console.log('✗ User routes error:', error.message);
}

try {
  console.log('3. Testing workout routes...');
  const workoutRoutes = require('./routes/workouts');
  console.log('✓ Workout routes loaded');
} catch (error) {
  console.log('✗ Workout routes error:', error.message);
}

try {
  console.log('4. Testing nutrition routes...');
  const nutritionRoutes = require('./routes/nutrition');
  console.log('✓ Nutrition routes loaded');
} catch (error) {
  console.log('✗ Nutrition routes error:', error.message);
}

try {
  console.log('5. Testing progress routes...');
  const progressRoutes = require('./routes/progress');
  console.log('✓ Progress routes loaded');
} catch (error) {
  console.log('✗ Progress routes error:', error.message);
}

try {
  console.log('6. Testing social routes...');
  const socialRoutes = require('./routes/social');
  console.log('✓ Social routes loaded');
} catch (error) {
  console.log('✗ Social routes error:', error.message);
}

try {
  console.log('7. Testing analytics routes...');
  const analyticsRoutes = require('./routes/analytics');
  console.log('✓ Analytics routes loaded');
} catch (error) {
  console.log('✗ Analytics routes error:', error.message);
}

// Test middleware imports
console.log('\nTesting middleware imports...');

try {
  console.log('1. Testing auth middleware...');
  const authMiddleware = require('./middleware/auth');
  console.log('✓ Auth middleware loaded');
} catch (error) {
  console.log('✗ Auth middleware error:', error.message);
}

try {
  console.log('2. Testing error handler...');
  const errorHandler = require('./middleware/errorHandler');
  console.log('✓ Error handler loaded');
} catch (error) {
  console.log('✗ Error handler error:', error.message);
}

console.log('\nAll tests completed. Starting server...');

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
