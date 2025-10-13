/**
 * Manual test script for Goal Quiz endpoints
 * Run with: node test-goal-endpoints.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Helper to make HTTP requests
function makeRequest(method, path, body = null, token = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Goal Quiz Endpoints\n');

  // Test 1: Register a test user
  console.log('1. Testing user registration...');
  try {
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123',
      username: `testuser${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      height: { value: 180, unit: 'cm' },
      weight: { value: 80, unit: 'kg' }
    });

    if (registerRes.status === 201 || registerRes.status === 200) {
      authToken = registerRes.body.token;
      console.log('✅ Registration successful');
      console.log(`   Content-Type: ${registerRes.headers['content-type']}`);
    } else {
      console.log('❌ Registration failed:', registerRes.body);
      return;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return;
  }

  // Test 2: PATCH /users/me/profile
  console.log('\n2. Testing PATCH /users/me/profile...');
  try {
    const profileRes = await makeRequest('PATCH', '/api/users/me/profile', {
      weight: { value: 82, unit: 'kg' },
      bodyFatPercentage: 18
    }, authToken);

    console.log(`   Status: ${profileRes.status}`);
    console.log(`   Content-Type: ${profileRes.headers['content-type']}`);
    
    if (profileRes.status === 200) {
      console.log('✅ Profile update successful');
      console.log('   Response structure:', Object.keys(profileRes.body));
      console.log('   Sample data:', JSON.stringify({
        weight_kg: profileRes.body.weight_kg,
        height_cm: profileRes.body.height_cm,
        sex: profileRes.body.sex
      }, null, 2));
    } else {
      console.log('❌ Profile update failed:', profileRes.body);
    }
  } catch (error) {
    console.log('❌ Profile update error:', error.message);
  }

  // Test 3: PUT /users/me/goals
  console.log('\n3. Testing PUT /users/me/goals...');
  try {
    const goalsRes = await makeRequest('PUT', '/api/users/me/goals', {
      primary: 'lose',
      pace_kg_per_week: -0.5,
      diet_style: 'high_protein'
    }, authToken);

    console.log(`   Status: ${goalsRes.status}`);
    console.log(`   Content-Type: ${goalsRes.headers['content-type']}`);
    
    if (goalsRes.status === 200) {
      console.log('✅ Goals update successful');
      console.log('   Goals:', JSON.stringify(goalsRes.body.goals, null, 2));
      console.log('   Targets:', JSON.stringify(goalsRes.body.targets, null, 2));
      
      // Verify targets structure
      const required = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'water_cups', 'bmr', 'tdee', 'formula'];
      const missing = required.filter(key => !(key in goalsRes.body.targets));
      if (missing.length === 0) {
        console.log('✅ All target fields present');
      } else {
        console.log('❌ Missing target fields:', missing);
      }
    } else {
      console.log('❌ Goals update failed:', goalsRes.body);
    }
  } catch (error) {
    console.log('❌ Goals update error:', error.message);
  }

  // Test 4: GET /users/me/summary
  console.log('\n4. Testing GET /users/me/summary...');
  try {
    const summaryRes = await makeRequest('GET', '/api/users/me/summary?window=7d', null, authToken);

    console.log(`   Status: ${summaryRes.status}`);
    console.log(`   Content-Type: ${summaryRes.headers['content-type']}`);
    
    if (summaryRes.status === 200) {
      console.log('✅ Summary retrieval successful');
      console.log('   Response structure:', Object.keys(summaryRes.body));
      
      // Verify summary structure
      const required = ['weightTrend', 'workoutsByDay', 'streakDays', 'nutritionCompliance', 'steps', 'hydrationCups', 'targets'];
      const missing = required.filter(key => !(key in summaryRes.body));
      if (missing.length === 0) {
        console.log('✅ All summary fields present');
      } else {
        console.log('❌ Missing summary fields:', missing);
      }

      console.log(`   Weight trend entries: ${summaryRes.body.weightTrend?.length || 0}`);
      console.log(`   Streak days: ${summaryRes.body.streakDays}`);
    } else {
      console.log('❌ Summary retrieval failed:', summaryRes.body);
    }
  } catch (error) {
    console.log('❌ Summary retrieval error:', error.message);
  }

  // Test 5: Error handling - Invalid goals
  console.log('\n5. Testing error handling (invalid goals)...');
  try {
    const errorRes = await makeRequest('PUT', '/api/users/me/goals', {
      primary: 'invalid_goal',
      pace_kg_per_week: -0.5,
      diet_style: 'high_protein'
    }, authToken);

    console.log(`   Status: ${errorRes.status}`);
    console.log(`   Content-Type: ${errorRes.headers['content-type']}`);
    
    if (errorRes.status === 400) {
      console.log('✅ Error handling works');
      console.log('   Error structure:', Object.keys(errorRes.body));
      
      if (errorRes.body.error && errorRes.body.error.code && errorRes.body.error.message) {
        console.log('✅ Error format is correct');
        console.log('   Error code:', errorRes.body.error.code);
        console.log('   Error message:', errorRes.body.error.message);
      } else {
        console.log('❌ Error format is incorrect:', errorRes.body);
      }
    } else {
      console.log('❌ Expected 400 status, got:', errorRes.status);
    }
  } catch (error) {
    console.log('❌ Error handling test failed:', error.message);
  }

  // Test 6: Unauthorized request
  console.log('\n6. Testing authentication (no token)...');
  try {
    const unauthRes = await makeRequest('GET', '/api/users/me/summary');

    console.log(`   Status: ${unauthRes.status}`);
    
    if (unauthRes.status === 401) {
      console.log('✅ Authentication required');
      if (unauthRes.body.error) {
        console.log('   Error code:', unauthRes.body.error.code);
      }
    } else {
      console.log('❌ Expected 401 status, got:', unauthRes.status);
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
  }

  console.log('\n✅ All manual tests completed!\n');
}

// Check if server is running
console.log('Checking if server is running at', BASE_URL);
http.get(`${BASE_URL}/health`, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Server is running\n');
    runTests().catch(console.error);
  } else {
    console.log('❌ Server is not responding correctly');
  }
}).on('error', (err) => {
  console.log('❌ Server is not running. Please start the server first:');
  console.log('   cd backend && npm start');
});

