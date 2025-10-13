const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const routeFiles = [
  'auth.js',
  'users.js', 
  'workouts.js',
  'nutrition.js',
  'progress.js',
  'social.js',
  'analytics.js'
];

console.log('Testing route files for syntax errors...\n');

routeFiles.forEach(file => {
  try {
    console.log(`Testing ${file}...`);
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Try to parse the file
    require(filePath);
    console.log(`✓ ${file} - No syntax errors`);
  } catch (error) {
    console.error(`✗ ${file} - Error: ${error.message}`);
    if (error.message.includes('Unexpected token')) {
      console.error(`  This is likely a syntax error in the file`);
    }
  }
});

console.log('\nTesting middleware files...\n');

const middlewareFiles = ['auth.js', 'errorHandler.js'];
const middlewareDir = path.join(__dirname, 'middleware');

middlewareFiles.forEach(file => {
  try {
    console.log(`Testing middleware/${file}...`);
    const filePath = path.join(middlewareDir, file);
    require(filePath);
    console.log(`✓ middleware/${file} - No syntax errors`);
  } catch (error) {
    console.error(`✗ middleware/${file} - Error: ${error.message}`);
  }
});

console.log('\nTesting model files...\n');

const modelFiles = ['User.js', 'Workout.js', 'Exercise.js', 'Nutrition.js', 'Progress.js'];
const modelDir = path.join(__dirname, 'models');

modelFiles.forEach(file => {
  try {
    console.log(`Testing models/${file}...`);
    const filePath = path.join(modelDir, file);
    require(filePath);
    console.log(`✓ models/${file} - No syntax errors`);
  } catch (error) {
    console.error(`✗ models/${file} - Error: ${error.message}`);
  }
});
