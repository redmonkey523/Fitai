const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Simple test server is running',
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Demo AI endpoint
app.post('/api/ai/scan-food', (req, res) => {
  res.json({
    success: true,
    data: {
      food_name: 'Demo Apple',
      calories: 95,
      nutrition: {
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4.4
      },
      confidence: 0.95,
      source: 'demo'
    }
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Simple test server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ API test: http://localhost:${PORT}/api/test`);
  console.log(`✓ AI demo: http://localhost:${PORT}/api/ai/scan-food`);
});
