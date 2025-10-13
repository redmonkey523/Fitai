const axios = require('axios');

async function testBackend() {
  try {
    console.log('🧪 Testing Backend Server...\n');

    // Test 1: Basic health check
    console.log('1. Testing basic health check...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health Check Response:', healthResponse.data);
    console.log('');

    // Test 2: AI health check
    console.log('2. Testing AI health check...');
    const aiHealthResponse = await axios.get('http://localhost:5000/api/ai/health');
    console.log('✅ AI Health Check Response:', aiHealthResponse.data);
    console.log('');

    console.log('🎉 Backend is working!');
    
  } catch (error) {
    console.error('❌ Backend Test Failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running. Please start it with: cd backend && node server.js');
    }
  }
}

testBackend();
