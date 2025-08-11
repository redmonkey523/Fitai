#!/usr/bin/env node

/**
 * Real Backend Smoke Test
 * Tests that the app connects to the real backend and all major endpoints work
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api`;

console.log('🚀 Starting Real Backend Smoke Test...');
console.log(`🌐 Testing against: ${API_BASE_URL}`);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to run a test
async function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await testFn();
    console.log(`✅ PASS: ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
  }
}

// Test functions
async function testHealthCheck() {
  const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.status) {
    throw new Error('Health check response missing status field');
  }
  console.log(`   Server uptime: ${Math.round(response.data.uptime)}s`);
}

async function testAIHealthCheck() {
  const response = await axios.get(`${API_URL}/ai/health`, { timeout: 5000 });
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  const services = response.data.data?.services || response.data.services || {};
  console.log(`   AI services available: ${Object.keys(services).length}`);
}

async function testAuthEndpoints() {
  // Test registration endpoint (without actually registering)
  try {
    await axios.post(`${API_URL}/auth/register`, {});
  } catch (error) {
    // We expect a 400 error for missing data, not a 404 or 500
    if (error.response?.status === 400) {
      console.log('   Registration endpoint responds correctly to invalid data');
    } else {
      throw new Error(`Unexpected auth register response: ${error.response?.status}`);
    }
  }
}

async function testWorkoutEndpoints() {
  // Test workouts endpoint (should require auth)
  try {
    await axios.get(`${API_URL}/workouts`);
    throw new Error('Workouts endpoint should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   Workouts endpoint correctly requires authentication');
    } else {
      throw new Error(`Unexpected workouts response: ${error.response?.status}`);
    }
  }
}

async function testNutritionEndpoints() {
  // Test nutrition endpoints (should require auth)
  try {
    await axios.get(`${API_URL}/nutrition/history`);
    throw new Error('Nutrition endpoint should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('   Nutrition endpoint correctly requires authentication');
    } else {
      throw new Error(`Unexpected nutrition response: ${error.response?.status}`);
    }
  }
}

async function testAIEndpoints() {
  // Test AI demo endpoints
  const response = await axios.get(`${API_URL}/ai/demo/food`, { timeout: 10000 });
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  const data = response.data.data || response.data;
  if (!data.name) {
    throw new Error('AI demo response missing food name');
  }
  console.log(`   Demo food: ${data.name}`);
}

// Main test runner
async function runSmokeTests() {
  console.log('=' .repeat(60));
  
  // Core health checks
  await runTest('Backend Health Check', testHealthCheck);
  await runTest('AI Service Health Check', testAIHealthCheck);
  
  // API endpoint tests
  await runTest('Authentication Endpoints', testAuthEndpoints);
  await runTest('Workout Endpoints (Auth Required)', testWorkoutEndpoints);
  await runTest('Nutrition Endpoints (Auth Required)', testNutritionEndpoints);
  await runTest('AI Demo Endpoints', testAIEndpoints);
  
  // Results summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SMOKE TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => console.log(`   • ${test.name}: ${test.error}`));
  }
  
  console.log('\n🎯 NEXT STEPS:');
  if (results.failed === 0) {
    console.log('   ✅ All tests passed! Your backend is ready for production.');
    console.log('   🚀 You can now run the frontend app with confidence.');
  } else {
    console.log('   🔧 Fix the failing tests before deploying to production.');
    console.log('   📖 Check the backend logs for more details.');
  }
  
  console.log('\n🌐 Backend URL Configuration:');
  console.log(`   Current: ${API_BASE_URL}`);
  console.log('   To change: Set API_BASE_URL environment variable');
  console.log('   Example: API_BASE_URL=https://api.yourdomain.com npm run smoke-test');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled error during smoke test:', error.message);
  process.exit(1);
});

// Run the tests
runSmokeTests().catch((error) => {
  console.error('\n💥 Smoke test failed:', error.message);
  process.exit(1);
});
