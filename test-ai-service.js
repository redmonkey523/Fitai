const axios = require('axios');

// Test the AI service endpoints
async function testAIService() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🧪 Testing AI Service...\n');

    // Test 1: Health check
    console.log('1. Testing AI Health Check...');
    const healthResponse = await axios.get(`${baseURL}/ai/health`);
    console.log('✅ Health Check Response:', healthResponse.data);
    console.log('');

    // Test 2: Demo food recognition
    console.log('2. Testing Demo Food Recognition...');
    const demoFoodResponse = await axios.post(`${baseURL}/ai/demo-food`, {}, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Demo Food Response:', demoFoodResponse.data);
    console.log('');

    // Test 3: Demo barcode scan
    console.log('3. Testing Demo Barcode Scan...');
    const demoBarcodeResponse = await axios.post(`${baseURL}/ai/demo-barcode`, {}, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Demo Barcode Response:', demoBarcodeResponse.data);
    console.log('');

    // Test 4: Real barcode lookup
    console.log('4. Testing Real Barcode Lookup...');
    const barcodeResponse = await axios.post(`${baseURL}/ai/barcode-scan`, {
      barcode: '3017620422003' // Nutella barcode
    }, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('✅ Barcode Lookup Response:', barcodeResponse.data);
    console.log('');

    console.log('🎉 All AI Service Tests Passed!');
    
  } catch (error) {
    console.error('❌ AI Service Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

// Run the test
testAIService();
