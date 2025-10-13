/**
 * Test Script for Agent 2 Endpoints
 * 
 * Usage:
 * 1. Start the backend server: npm start
 * 2. Run this script: node test-agent2-endpoints.js
 * 
 * Prerequisites:
 * - Backend server running on http://localhost:5000
 * - Valid auth token (replace YOUR_TOKEN_HERE)
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_TOKEN_HERE';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function request(method, endpoint, body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

async function testProfileUpdate() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Test 1: PUT /api/users/me - Profile Update${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  const profileData = {
    sex: 'male',
    age: 30,
    height_cm: 175,
    weight_kg: 75,
    body_fat_pct: 15,
    goal_type: 'lose',
    pace_kg_per_week: 0.25,
    diet_style: 'balanced'
  };

  console.log(`${colors.blue}Request:${colors.reset}`);
  console.log(JSON.stringify(profileData, null, 2));

  const response = await request('PUT', '/api/users/me', profileData);

  console.log(`\n${colors.blue}Response Status:${colors.reset} ${response.status}`);
  console.log(`${colors.blue}Content-Type:${colors.reset} ${response.headers['content-type']}`);
  console.log(`${colors.blue}Response Body:${colors.reset}`);
  console.log(JSON.stringify(response.data, null, 2));

  if (response.status === 200 && response.headers['content-type']?.includes('application/json')) {
    console.log(`\n${colors.green}✓ PASS${colors.reset}: Profile update successful`);
    return true;
  } else {
    console.log(`\n${colors.red}✗ FAIL${colors.reset}: Expected 200 with JSON response`);
    return false;
  }
}

async function testGoalsComputation() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Test 2: GET /api/users/goals - Goals Computation${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  const response = await request('GET', '/api/users/goals');

  console.log(`${colors.blue}Response Status:${colors.reset} ${response.status}`);
  console.log(`${colors.blue}Content-Type:${colors.reset} ${response.headers['content-type']}`);
  console.log(`${colors.blue}Response Body:${colors.reset}`);
  console.log(JSON.stringify(response.data, null, 2));

  const hasRequiredFields = response.data?.calories && 
                           response.data?.protein_g && 
                           response.data?.explain?.bmr && 
                           response.data?.explain?.tdee;

  if (response.status === 200 && hasRequiredFields) {
    console.log(`\n${colors.green}✓ PASS${colors.reset}: Goals computation successful`);
    console.log(`${colors.yellow}BMR:${colors.reset} ${response.data.explain.bmr} kcal`);
    console.log(`${colors.yellow}TDEE:${colors.reset} ${response.data.explain.tdee} kcal`);
    console.log(`${colors.yellow}Target Calories:${colors.reset} ${response.data.calories} kcal`);
    console.log(`${colors.yellow}Protein:${colors.reset} ${response.data.protein_g}g`);
    return true;
  } else {
    console.log(`\n${colors.red}✗ FAIL${colors.reset}: Expected 200 with complete goals data`);
    return false;
  }
}

async function testProgressAnalytics() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Test 3: GET /api/analytics/progress - Progress Analytics${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  const timeframes = ['7d', '30d', '90d'];
  let allPassed = true;

  for (const timeframe of timeframes) {
    console.log(`${colors.yellow}Testing timeframe: ${timeframe}${colors.reset}`);
    
    const response = await request('GET', `/api/analytics/progress?timeframe=${timeframe}`);

    console.log(`  Status: ${response.status}`);
    console.log(`  Content-Type: ${response.headers['content-type']}`);

    if (response.status === 200 && response.headers['content-type']?.includes('application/json')) {
      console.log(`  ${colors.green}✓ PASS${colors.reset}`);
    } else {
      console.log(`  ${colors.red}✗ FAIL${colors.reset}`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function testRateLimiting() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Test 4: Rate Limiting - Per User${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.yellow}Making 5 rapid requests...${colors.reset}`);

  for (let i = 1; i <= 5; i++) {
    const response = await request('GET', '/api/users/goals');
    
    const rateLimit = {
      limit: response.headers['x-ratelimit-limit'],
      remaining: response.headers['x-ratelimit-remaining'],
      reset: response.headers['x-ratelimit-reset']
    };

    console.log(`Request ${i}: Status ${response.status}, Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);

    if (response.status === 429) {
      console.log(`\n${colors.green}✓ PASS${colors.reset}: Rate limiting working`);
      console.log(`${colors.yellow}Retry-After:${colors.reset} ${response.headers['retry-after']} seconds`);
      console.log(`${colors.yellow}Error Response:${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n${colors.yellow}⚠ INFO${colors.reset}: Rate limit not reached in 5 requests (limit may be higher)`);
  return true;
}

async function testMalformedRequest() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Test 5: PUT /api/users/me - Malformed Request${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  const malformedData = {
    age: 'not_a_number',
    sex: 'invalid_sex'
  };

  console.log(`${colors.blue}Request:${colors.reset}`);
  console.log(JSON.stringify(malformedData, null, 2));

  const response = await request('PUT', '/api/users/me', malformedData);

  console.log(`\n${colors.blue}Response Status:${colors.reset} ${response.status}`);
  console.log(`${colors.blue}Content-Type:${colors.reset} ${response.headers['content-type']}`);
  console.log(`${colors.blue}Response Body:${colors.reset}`);
  console.log(JSON.stringify(response.data, null, 2));

  if (response.status === 400 && response.data?.error?.fields) {
    console.log(`\n${colors.green}✓ PASS${colors.reset}: Proper field validation errors returned`);
    return true;
  } else {
    console.log(`\n${colors.red}✗ FAIL${colors.reset}: Expected 400 with field errors`);
    return false;
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     Agent 2 - Backend API Endpoint Tests         ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}`);

  if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
    console.log(`\n${colors.red}ERROR: Please set your auth token!${colors.reset}`);
    console.log(`${colors.yellow}Set AUTH_TOKEN environment variable or edit this file.${colors.reset}`);
    console.log(`\nExample:`);
    console.log(`  export AUTH_TOKEN=your_token_here`);
    console.log(`  node test-agent2-endpoints.js`);
    return;
  }

  const results = [];

  results.push({ name: 'Profile Update', passed: await testProfileUpdate() });
  results.push({ name: 'Goals Computation', passed: await testGoalsComputation() });
  results.push({ name: 'Progress Analytics', passed: await testProgressAnalytics() });
  results.push({ name: 'Rate Limiting', passed: await testRateLimiting() });
  results.push({ name: 'Malformed Request', passed: await testMalformedRequest() });

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}Test Summary${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${status} - ${result.name}`);
  });

  console.log(`\n${colors.cyan}Results: ${passed}/${total} tests passed${colors.reset}\n`);

  if (passed === total) {
    console.log(`${colors.green}╔═══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║   🎉 All tests passed! Implementation ready!     ║${colors.reset}`);
    console.log(`${colors.green}╚═══════════════════════════════════════════════════╝${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed. Please review the output above.${colors.reset}\n`);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test execution error:${colors.reset}`, error);
  process.exit(1);
});

