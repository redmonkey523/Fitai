#!/usr/bin/env node
/**
 * E2E Smoke Test Suite - Fitness App
 * Tests critical user flows against real backend services
 * 
 * Usage: node scripts/e2e-smoke-test.js [API_URL]
 * Example: node scripts/e2e-smoke-test.js https://api.yourapp.com/api
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.argv[2] || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const TEST_USER = {
  email: `smoketest-${Date.now()}@test.com`,
  username: `smoketest${Date.now()}`,
  password: 'TestPassword123!',
  firstName: 'Smoke',
  lastName: 'Test',
  dateOfBirth: '1990-01-01',
  gender: 'other'
};

let authToken = null;
let userId = null;
let testWorkoutId = null;
let testMealId = null;

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logging helpers
const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  section: (msg) => console.log(`\n${COLORS.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${COLORS.reset}\n`)
};

// HTTP client
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  validateStatus: () => true // Don't throw on any status code
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test result tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, details = {}) {
  results.tests.push({ name, passed, ...details });
  if (passed) {
    results.passed++;
    log.success(`${name}`);
  } else {
    results.failed++;
    log.error(`${name}`);
    if (details.error) {
      log.error(`  Error: ${details.error}`);
    }
  }
}

function recordWarning(name, message) {
  results.warnings++;
  log.warning(`${name}: ${message}`);
}

// Assertion helpers
function assert(condition, testName, errorMsg) {
  recordTest(testName, condition, { error: condition ? null : errorMsg });
  return condition;
}

function assertStatus(response, expectedStatus, testName) {
  const passed = response.status === expectedStatus;
  recordTest(
    testName,
    passed,
    {
      expected: expectedStatus,
      actual: response.status,
      error: passed ? null : `Expected ${expectedStatus}, got ${response.status}`
    }
  );
  return passed;
}

function assertNoDemo(data, testName) {
  const hasDemoData = JSON.stringify(data).toLowerCase().includes('demo');
  const passed = !hasDemoData;
  recordTest(
    testName,
    passed,
    {
      error: passed ? null : 'Response contains "demo" - possible mock data!',
      data: hasDemoData ? data : undefined
    }
  );
  return passed;
}

// Test Suites

async function testAuthFlow() {
  log.section('Test Suite 1: Authentication Flow');

  try {
    // Test 1: Register new user
    log.info('Creating test user...');
    const registerRes = await api.post('/auth/register', TEST_USER);
    
    assertStatus(registerRes, 201, 'User registration succeeds');
    
    if (registerRes.status === 201) {
      assert(!!registerRes.data.data?.token, 'Registration returns auth token', 'Missing token');
      authToken = registerRes.data.data?.token;
      userId = registerRes.data.data?.user?._id;
    }

    // Test 2: Login with credentials
    log.info('Testing login...');
    const loginRes = await api.post('/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    assertStatus(loginRes, 200, 'User login succeeds');
    
    if (loginRes.status === 200) {
      assert(!!loginRes.data.data?.token, 'Login returns auth token', 'Missing token');
      authToken = loginRes.data.data?.token;
    }

    // Test 3: Invalid credentials
    log.info('Testing invalid login...');
    const badLoginRes = await api.post('/auth/login', {
      email: TEST_USER.email,
      password: 'wrongpassword'
    });
    
    assertStatus(badLoginRes, 401, 'Invalid credentials return 401');

    // Test 4: Get current user
    log.info('Fetching current user...');
    const meRes = await api.get('/auth/me');
    
    assertStatus(meRes, 200, 'Get current user succeeds');
    assert(meRes.data.data?.email === TEST_USER.email, 'User data matches', 'Email mismatch');

  } catch (error) {
    recordTest('Auth flow exception handling', false, { error: error.message });
  }
}

async function testWorkoutFlow() {
  log.section('Test Suite 2: Workout Flow');

  try {
    // Test 1: Create workout
    log.info('Creating workout...');
    const workout = {
      name: 'Smoke Test Workout',
      description: 'Test workout',
      exercises: [
        {
          name: 'Push-ups',
          sets: 3,
          reps: 10,
          duration: 0
        }
      ],
      duration: 30,
      difficulty: 'beginner',
      category: 'strength'
    };

    const createRes = await api.post('/workouts', workout);
    assertStatus(createRes, 201, 'Workout creation succeeds');
    
    if (createRes.status === 201) {
      testWorkoutId = createRes.data.data?._id;
      assert(!!testWorkoutId, 'Workout has ID', 'Missing workout ID');
    }

    // Test 2: Get workout list
    log.info('Fetching workout list...');
    const listRes = await api.get('/workouts');
    
    assertStatus(listRes, 200, 'Get workout list succeeds');
    assert(Array.isArray(listRes.data.data), 'Workout list is array', 'Not an array');

    // Test 3: Get workout detail
    if (testWorkoutId) {
      log.info('Fetching workout detail...');
      const detailRes = await api.get(`/workouts/${testWorkoutId}`);
      
      assertStatus(detailRes, 200, 'Get workout detail succeeds');
      assert(detailRes.data.data?.name === workout.name, 'Workout name matches', 'Name mismatch');
    }

    // Test 4: Complete workout
    if (testWorkoutId) {
      log.info('Completing workout...');
      const completeRes = await api.post(`/workouts/${testWorkoutId}/complete`);
      
      assertStatus(completeRes, 200, 'Complete workout succeeds');
    }

  } catch (error) {
    recordTest('Workout flow exception handling', false, { error: error.message });
  }
}

async function testNutritionFlow() {
  log.section('Test Suite 3: Nutrition Flow');

  try {
    // Test 1: Log meal
    log.info('Logging meal entry...');
    const meal = {
      name: 'Test Meal',
      brand: 'Test Brand',
      servingSize: { amount: 100, unit: 'g' },
      nutrition: {
        calories: 200,
        protein: 10,
        carbs: 25,
        fat: 5
      },
      mealType: 'breakfast',
      consumedAt: new Date().toISOString()
    };

    const logRes = await api.post('/nutrition/entries', meal);
    assertStatus(logRes, 201, 'Meal logging succeeds');
    
    if (logRes.status === 201) {
      testMealId = logRes.data.data?._id;
      assert(!!testMealId, 'Meal has ID', 'Missing meal ID');
    }

    // Test 2: Get nutrition history
    log.info('Fetching nutrition history...');
    const historyRes = await api.get('/nutrition/entries');
    
    assertStatus(historyRes, 200, 'Get nutrition history succeeds');
    assert(Array.isArray(historyRes.data.data), 'History is array', 'Not an array');

    // Test 3: Get nutrition goals
    log.info('Fetching nutrition goals...');
    const goalsRes = await api.get('/nutrition/goals');
    
    assertStatus(goalsRes, 200, 'Get nutrition goals succeeds');

  } catch (error) {
    recordTest('Nutrition flow exception handling', false, { error: error.message });
  }
}

async function testAIServices() {
  log.section('Test Suite 4: AI Services (CRITICAL - No Demo Data)');

  try {
    // Test 1: Verify /demo-* endpoints don't exist
    log.info('Verifying demo endpoints are removed...');
    
    const demoFoodRes = await api.post('/ai/demo-food');
    assertStatus(demoFoodRes, 404, 'Demo food endpoint returns 404 (removed)');
    
    const demoBarcodeRes = await api.post('/ai/demo-barcode');
    assertStatus(demoBarcodeRes, 404, 'Demo barcode endpoint returns 404 (removed)');

    // Test 2: Barcode scan with real API
    log.info('Testing barcode scan with real barcode...');
    const barcodeRes = await api.post('/ai/barcode-scan', {
      barcode: '3017620422003' // Nutella - exists in Open Food Facts
    });
    
    assertStatus(barcodeRes, 200, 'Barcode scan succeeds');
    
    if (barcodeRes.status === 200) {
      const productData = barcodeRes.data.data;
      assertNoDemo(productData, 'Barcode response has no demo data');
      
      // Check source is real API
      const source = productData?.source || '';
      const isRealSource = source.includes('Open Food Facts') || source.includes('Nutritionix');
      assert(isRealSource, 'Barcode source is real API', `Source: ${source}`);
      
      // Check verified flag
      if (productData?.verified) {
        log.success('  Product data is verified by real API');
      } else {
        recordWarning('Barcode verification', 'Product not verified - may be estimated data');
      }
    }

    // Test 3: AI service health check
    log.info('Checking AI service health...');
    const healthRes = await api.get('/ai/health');
    
    assertStatus(healthRes, 200, 'AI health check succeeds');
    
    if (healthRes.status === 200) {
      const services = healthRes.data.data?.services || {};
      log.info(`  Open Food Facts: ${services.openFoodFacts ? 'Available' : 'Unavailable'}`);
      log.info(`  OpenAI: ${services.openai ? 'Configured' : 'Not configured'}`);
      log.info(`  Google Vision: ${services.googleVision ? 'Configured' : 'Not configured'}`);
      
      // Verify no demo service listed
      assert(!services.demo, 'No demo service in health check', 'Demo service still listed!');
    }

  } catch (error) {
    recordTest('AI services exception handling', false, { error: error.message });
  }
}

async function testProgressFlow() {
  log.section('Test Suite 5: Progress Tracking');

  try {
    // Test 1: Log progress entry
    log.info('Logging progress entry...');
    const progress = {
      date: new Date().toISOString(),
      weight: 70,
      bodyFat: 15,
      measurements: {
        chest: 100,
        waist: 80,
        hips: 95
      }
    };

    const logRes = await api.post('/progress/entries', progress);
    assertStatus(logRes, 201, 'Progress logging succeeds');

    // Test 2: Get progress history
    log.info('Fetching progress history...');
    const historyRes = await api.get('/progress/entries');
    
    assertStatus(historyRes, 200, 'Get progress history succeeds');
    assert(Array.isArray(historyRes.data.data), 'Progress history is array', 'Not an array');

  } catch (error) {
    recordTest('Progress flow exception handling', false, { error: error.message });
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  console.log(`${COLORS.cyan}${'='.repeat(70)}`);
  console.log(`  FITNESS APP - E2E SMOKE TEST SUITE`);
  console.log(`  API: ${API_BASE_URL}`);
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(70)}${COLORS.reset}\n`);

  const startTime = Date.now();

  try {
    // Run test suites in order
    await testAuthFlow();
    await testWorkoutFlow();
    await testNutritionFlow();
    await testAIServices();
    await testProgressFlow();

  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    results.failed++;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n');
  log.section('TEST SUMMARY');
  
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`${COLORS.green}Passed: ${results.passed}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed: ${results.failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Warnings: ${results.warnings}${COLORS.reset}`);
  console.log(`Duration: ${duration}s\n`);

  // Critical checks
  if (results.failed > 0) {
    log.error('SMOKE TEST FAILED - Do not deploy to production!');
    log.error('Fix failing tests before proceeding with release.');
    console.log('\nFailed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.name}: ${t.error || 'Unknown error'}`);
      });
  } else {
    log.success('ALL SMOKE TESTS PASSED!');
    log.success('Backend is ready for deployment.');
  }

  // Warnings summary
  if (results.warnings > 0) {
    console.log('\nWarnings:');
    console.log('  Review these before production deployment.');
  }

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log.error(`Unhandled error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

