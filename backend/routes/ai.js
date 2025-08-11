const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AIService = require('../services/aiService');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();
const aiService = new AIService();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'food-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * @route POST /api/ai/food-recognition
 * @desc Process food image with AI for nutrition recognition
 * @access Private
 */
router.post('/food-recognition', 
  authenticateToken, 
  upload.single('image'),
  validateRequest,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const imagePath = req.file.path;
      console.log(`Processing food image: ${imagePath}`);

      // Process the image with AI
      const foodResults = await aiService.processFoodImage(imagePath);

      // Clean up the uploaded file after processing
      try {
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Error deleting uploaded file:', error);
      }

      res.json({
        success: true,
        data: foodResults
      });

    } catch (error) {
      console.error('Food recognition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process food image',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/barcode-scan
 * @desc Look up product information by barcode
 * @access Private
 */
router.post('/barcode-scan',
  authenticateToken,
  validateRequest,
  async (req, res) => {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        return res.status(400).json({
          success: false,
          message: 'Barcode is required'
        });
      }

      console.log(`Looking up barcode: ${barcode}`);

      // Look up product by barcode
      const productData = await aiService.lookupProductByBarcode(barcode);

      res.json({
        success: true,
        data: productData
      });

    } catch (error) {
      console.error('Barcode scan error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to look up product',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/demo-food
 * @desc Get demo food recognition results (for testing)
 * @access Private
 */
router.post('/demo-food',
  authenticateToken,
  async (req, res) => {
    try {
      console.log('Processing demo food recognition');

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const foodResults = await aiService.simulateAIFoodRecognition('demo');

      res.json({
        success: true,
        data: foodResults
      });

    } catch (error) {
      console.error('Demo food recognition error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process demo food',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/ai/demo-barcode
 * @desc Get demo barcode scan results (for testing)
 * @access Private
 */
router.post('/demo-barcode',
  authenticateToken,
  async (req, res) => {
    try {
      console.log('Processing demo barcode scan');

      // Simulate barcode scanning delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const productData = await aiService.simulateBarcodeLookup();

      res.json({
        success: true,
        data: productData
      });

    } catch (error) {
      console.error('Demo barcode scan error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process demo barcode',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/ai/demo/food
 * @desc Get demo food data (for testing)
 * @access Public
 */
router.get('/demo/food', async (req, res) => {
  try {
    const demoFood = aiService.getDemoFood ? await aiService.getDemoFood() : await aiService.simulateAIFoodRecognition('demo');
    res.json({
      success: true,
      data: demoFood
    });
  } catch (error) {
    console.error('Demo food error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get demo food data',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai/demo/barcode
 * @desc Get demo barcode data (for testing)
 * @access Public
 */
router.get('/demo/barcode', async (req, res) => {
  try {
    const demoBarcode = aiService.getDemoBarcode ? await aiService.getDemoBarcode() : await aiService.simulateBarcodeLookup();
    res.json({
      success: true,
      data: demoBarcode
    });
  } catch (error) {
    console.error('Demo barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get demo barcode data',
      error: error.message
    });
  }
});

/**
 * @route GET /api/ai/health
 * @desc Check AI service health
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    // Check if AI services are available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY;
    const calorieMamaApiKey = process.env.CALORIE_MAMA_API_KEY;

    const services = {
      openai: !!openaiApiKey,
      googleVision: !!googleVisionApiKey,
      calorieMama: !!calorieMamaApiKey,
      openFoodFacts: true, // Always available (free API)
      demo: true // Always available
    };

    res.json({
      success: true,
      data: {
        status: 'healthy',
        services,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI health check error:', error);
    res.status(500).json({
      success: false,
      message: 'AI service health check failed',
      error: error.message
    });
  }
});

module.exports = router;
