const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// API Configuration
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0/product';
const CALORIE_MAMA_API = 'https://api.caloriemama.ai/food_recognition';
const GOOGLE_VISION_API = 'https://vision.googleapis.com/v1/images:annotate';
const NUTRITIONIX_API = 'https://trackapi.nutritionix.com/v2';
const CLARIFAI_API = 'https://api.clarifai.com/v2/models/bd367be194cf45149e75f01d59f77ba7/outputs';
const IMAGGA_API = 'https://api.imagga.com/v2/tags';

class AIService {
  constructor() {
    this.openFoodFactsClient = axios.create({
      baseURL: OPEN_FOOD_FACTS_API,
      timeout: 15000,
    });

    this.nutritionixClient = axios.create({
      baseURL: NUTRITIONIX_API,
      timeout: 15000,
      headers: {
        'x-app-id': process.env.NUTRITIONIX_APP_ID || '',
        'x-app-key': process.env.NUTRITIONIX_APP_KEY || '',
        'Content-Type': 'application/json',
      }
    });

    // Demo barcode database for testing
    this.demoBarcodes = {
      '3017620422003': {
        name: 'Nutella Hazelnut Spread',
        brand: 'Ferrero',
        nutrition: { calories: 539, protein: 6.3, carbs: 57.5, fat: 30.9, fiber: 3.4, sugar: 56.8, sodium: 42 },
        ingredients: ['sugar', 'palm oil', 'hazelnuts', 'cocoa', 'skimmed milk powder', 'whey powder', 'lecithin', 'vanillin'],
        allergens: ['nuts', 'milk'],
        nutritionGrade: 'E',
        verified: true
      },
      '5000159407236': {
        name: 'Snickers Chocolate Bar',
        brand: 'Mars',
        nutrition: { calories: 488, protein: 8.6, carbs: 60.5, fat: 24.0, fiber: 2.8, sugar: 52.5, sodium: 189 },
        ingredients: ['milk chocolate', 'peanuts', 'caramel', 'nougat'],
        allergens: ['nuts', 'milk', 'soy'],
        nutritionGrade: 'E',
        verified: true
      },
      '4008400322221': {
        name: 'Greek Yogurt Natural',
        brand: 'Fage',
        nutrition: { calories: 59, protein: 10.0, carbs: 3.6, fat: 0.4, fiber: 0, sugar: 3.2, sodium: 36 },
        ingredients: ['milk', 'live cultures'],
        allergens: ['milk'],
        nutritionGrade: 'A',
        verified: true
      },
      '049000006343': {
        name: 'Coca-Cola Classic',
        brand: 'Coca-Cola',
        nutrition: { calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0, sugar: 39, sodium: 45 },
        ingredients: ['carbonated water', 'high fructose corn syrup', 'caramel color', 'phosphoric acid', 'natural flavors', 'caffeine'],
        allergens: [],
        nutritionGrade: 'E',
        verified: true
      },
      '028400090000': {
        name: 'Banana',
        brand: 'Fresh Produce',
        nutrition: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1 },
        ingredients: ['banana'],
        allergens: [],
        nutritionGrade: 'A',
        verified: true
      }
    };

    // Demo food recognition database
    this.demoFoods = [
      {
        name: 'Grilled Chicken Salad',
        confidence: 0.89,
        nutrition: { calories: 320, protein: 28, carbs: 15, fat: 18, fiber: 8, sugar: 5, sodium: 450 },
        ingredients: ['chicken breast', 'mixed greens', 'olive oil', 'balsamic vinegar', 'cherry tomatoes', 'cucumber'],
        allergens: [],
        verified: false
      },
      {
        name: 'Protein Smoothie Bowl',
        confidence: 0.92,
        nutrition: { calories: 280, protein: 22, carbs: 35, fat: 8, fiber: 6, sugar: 18, sodium: 120 },
        ingredients: ['banana', 'protein powder', 'almond milk', 'berries', 'granola', 'chia seeds'],
        allergens: ['nuts'],
        verified: false
      },
      {
        name: 'Salmon with Vegetables',
        confidence: 0.85,
        nutrition: { calories: 420, protein: 35, carbs: 12, fat: 25, fiber: 8, sugar: 4, sodium: 380 },
        ingredients: ['salmon fillet', 'broccoli', 'carrots', 'olive oil', 'lemon', 'herbs'],
        allergens: ['fish'],
        verified: false
      },
      {
        name: 'Greek Yogurt with Berries',
        confidence: 0.94,
        nutrition: { calories: 180, protein: 18, carbs: 22, fat: 2, fiber: 3, sugar: 16, sodium: 85 },
        ingredients: ['greek yogurt', 'strawberries', 'blueberries', 'honey', 'almonds'],
        allergens: ['milk', 'nuts'],
        verified: false
      },
      {
        name: 'Quinoa Bowl',
        confidence: 0.87,
        nutrition: { calories: 380, protein: 12, carbs: 65, fat: 8, fiber: 12, sugar: 6, sodium: 220 },
        ingredients: ['quinoa', 'black beans', 'corn', 'avocado', 'lime', 'cilantro'],
        allergens: [],
        verified: false
      }
    ];
  }

  /**
   * Return a single demo food item for GET /api/ai/demo/food
   */
  getDemoFood() {
    try {
      if (Array.isArray(this.demoFoods) && this.demoFoods.length > 0) {
        const idx = Math.floor(Math.random() * this.demoFoods.length);
        return this.demoFoods[idx];
      }
      return { name: 'Demo Food', nutrition: { calories: 0 }, confidence: 1 };
    } catch (e) {
      return { name: 'Demo Food', nutrition: { calories: 0 }, confidence: 1 };
    }
  }

  /**
   * Return a demo barcode product for GET /api/ai/demo/barcode
   */
  async getDemoBarcode() {
    return this.simulateBarcodeLookup();
  }

  /**
   * Look up product information by barcode using multiple APIs
   * @param {string} barcode - The barcode to look up
   * @returns {Promise<Object>} Product information
   */
  async lookupProductByBarcode(barcode) {
    try {
      // Validate barcode input
      if (!barcode || typeof barcode !== 'string') {
        throw new Error('Invalid barcode provided');
      }

      console.log(`Looking up barcode: ${barcode}`);
      
      // Check demo barcodes first
      if (this.demoBarcodes[barcode]) {
        console.log('Found in demo database');
        return {
          ...this.demoBarcodes[barcode],
          barcode: barcode,
          source: 'Demo Database'
        };
      }

      // Handle demo mode
      if (barcode === 'demo123') {
        console.log('Demo barcode detected');
        return await this.simulateBarcodeLookup();
      }

      // Try Open Food Facts first (free, comprehensive)
      try {
        const openFoodResult = await this.lookupOpenFoodFacts(barcode);
        if (openFoodResult && openFoodResult.verified) {
          return openFoodResult;
        }
      } catch (error) {
        console.log('Open Food Facts lookup failed:', error.message);
      }

      // Try Nutritionix as fallback
      try {
        const nutritionixResult = await this.lookupNutritionix(barcode);
        if (nutritionixResult && nutritionixResult.verified) {
          return nutritionixResult;
        }
      } catch (error) {
        console.log('Nutritionix lookup failed:', error.message);
      }

      // Return not found response
      return {
        name: 'Product Not Found',
        brand: 'Unknown',
        barcode: barcode,
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
        ingredients: [],
        allergens: [],
        verified: false,
        source: 'Multiple APIs - Not Found'
      };

    } catch (error) {
      console.error('Error looking up barcode:', error);
      
      return {
        name: 'Network Error',
        brand: 'Unknown',
        barcode: barcode,
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
        ingredients: [],
        allergens: [],
        verified: false,
        source: 'Error - Please try again',
        error: error.message
      };
    }
  }

  /**
   * Look up product using Open Food Facts API
   * @param {string} barcode - The barcode to look up
   * @returns {Promise<Object>} Product information
   */
  async lookupOpenFoodFacts(barcode) {
    try {
      const response = await this.openFoodFactsClient.get(`/${barcode}.json`);
      const data = response.data;

      if (data.status === 1 && data.product) {
        const product = data.product;
        
        return {
          name: product.product_name || product.product_name_en || 'Unknown Product',
          brand: product.brands || product.brand_owner || 'Unknown Brand',
          barcode: barcode,
          nutrition: {
            calories: this.extractNutrient(product.nutriments, 'energy_100g', 'energy-kcal_100g'),
            protein: this.extractNutrient(product.nutriments, 'proteins_100g'),
            carbs: this.extractNutrient(product.nutriments, 'carbohydrates_100g'),
            fat: this.extractNutrient(product.nutriments, 'fat_100g'),
            fiber: this.extractNutrient(product.nutriments, 'fiber_100g'),
            sugar: this.extractNutrient(product.nutriments, 'sugars_100g'),
            sodium: this.extractNutrient(product.nutriments, 'sodium_100g'),
          },
          ingredients: product.ingredients_text_en || product.ingredients_text || [],
          allergens: product.allergens_tags || [],
          image: product.image_front_url || product.image_url,
          nutritionGrade: product.nutrition_grade_fr || product.nutrition_grade,
          servingSize: product.serving_size || '100g',
          verified: true,
          source: 'Open Food Facts'
        };
      }
      return null;
    } catch (error) {
      console.error('Open Food Facts lookup error:', error);
      throw error;
    }
  }

  /**
   * Look up product using Nutritionix API
   * @param {string} barcode - The barcode to look up
   * @returns {Promise<Object>} Product information
   */
  async lookupNutritionix(barcode) {
    try {
      if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_APP_KEY) {
        throw new Error('Nutritionix API credentials not configured');
      }

      const response = await this.nutritionixClient.get(`/search/item?upc=${barcode}`);
      const data = response.data;

      if (data.foods && data.foods.length > 0) {
        const food = data.foods[0];
        
        return {
          name: food.food_name || 'Unknown Product',
          brand: food.brand_name || 'Unknown Brand',
          barcode: barcode,
          nutrition: {
            calories: food.nf_calories || 0,
            protein: food.nf_protein || 0,
            carbs: food.nf_total_carbohydrate || 0,
            fat: food.nf_total_fat || 0,
            fiber: food.nf_dietary_fiber || 0,
            sugar: food.nf_sugars || 0,
            sodium: food.nf_sodium || 0,
          },
          ingredients: food.ingredients || [],
          allergens: food.allergens || [],
          servingSize: food.serving_unit || '100g',
          verified: true,
          source: 'Nutritionix'
        };
      }
      return null;
    } catch (error) {
      console.error('Nutritionix lookup error:', error);
      throw error;
    }
  }

  /**
   * Process food image using multiple AI services
   * @param {string} imagePath - Path to the captured image
   * @returns {Promise<Object>} Recognized food information
   */
  async processFoodImage(imagePath) {
    try {
      // Validate imagePath input
      if (!imagePath || typeof imagePath !== 'string') {
        throw new Error('Invalid image path provided');
      }

      console.log('Processing food image with AI...');
      
      // Handle demo mode
      if (imagePath === 'demo') {
        console.log('Demo image detected');
        return await this.simulateAIFoodRecognition(imagePath);
      }

      // Try Calorie Mama first (most accurate for food recognition)
      try {
        const calorieMamaResult = await this.processWithCalorieMama(imagePath);
        if (calorieMamaResult && calorieMamaResult.confidence > 0.7) {
          return calorieMamaResult;
        }
      } catch (error) {
        console.log('Calorie Mama processing failed:', error.message);
      }

      // Try Clarifai Food Model (FREE - 1000 requests/month)
      try {
        const clarifaiResult = await this.processWithClarifai(imagePath);
        if (clarifaiResult && clarifaiResult.confidence > 0.7) {
          return clarifaiResult;
        }
      } catch (error) {
        console.log('Clarifai processing failed:', error.message);
      }

      // Try Google Vision as fallback
      try {
        const googleVisionResult = await this.processWithGoogleVision(imagePath);
        if (googleVisionResult && googleVisionResult.confidence > 0.6) {
          return googleVisionResult;
        }
      } catch (error) {
        console.log('Google Vision processing failed:', error.message);
      }

      // Try Nutritionix image search as fallback
      try {
        const nutritionixResult = await this.processWithNutritionix(imagePath);
        if (nutritionixResult && nutritionixResult.confidence > 0.5) {
          return nutritionixResult;
        }
      } catch (error) {
        console.log('Nutritionix image processing failed:', error.message);
      }

      // Fallback to demo mode
      console.log('All AI services failed, using demo mode');
      return await this.simulateAIFoodRecognition(imagePath);
      
    } catch (error) {
      console.error('Error processing food image:', error);
      
      return {
        name: 'AI Processing Error',
        confidence: 0.5,
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
        ingredients: [],
        allergens: [],
        photo: imagePath,
        verified: false,
        source: 'AI Recognition (Error)',
        error: error.message
      };
    }
  }

  /**
   * Process image with Calorie Mama AI
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Object>} Recognition result
   */
  async processWithCalorieMama(imagePath) {
    try {
      if (!process.env.CALORIE_MAMA_API_KEY) {
        throw new Error('Calorie Mama API key not configured');
      }

      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const response = await axios.post(CALORIE_MAMA_API, formData, {
        headers: {
          'Authorization': `Bearer ${process.env.CALORIE_MAMA_API_KEY}`,
          ...formData.getHeaders(),
        },
        timeout: 30000,
      });

      if (response.data && response.data.foods && response.data.foods.length > 0) {
        const food = response.data.foods[0];
        return {
          name: food.name,
          confidence: food.confidence || 0.8,
          nutrition: {
            calories: food.calories || 0,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fat: food.fat || 0,
            fiber: food.fiber || 0,
            sugar: food.sugar || 0,
            sodium: food.sodium || 0,
          },
          ingredients: food.ingredients || [],
          allergens: food.allergens || [],
          photo: imagePath,
          verified: false,
          source: 'Calorie Mama AI'
        };
      }
      return null;
    } catch (error) {
      console.error('Calorie Mama processing error:', error);
      throw error;
    }
  }

  /**
   * Process image with Google Vision API
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Object>} Recognition result
   */
  async processWithGoogleVision(imagePath) {
    try {
      if (!process.env.GOOGLE_VISION_API_KEY) {
        throw new Error('Google Vision API key not configured');
      }

      // Read and encode image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 10
              },
              {
                type: 'TEXT_DETECTION',
                maxResults: 5
              }
            ]
          }
        ]
      };

      const response = await axios.post(
        `${GOOGLE_VISION_API}?key=${process.env.GOOGLE_VISION_API_KEY}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data && response.data.responses && response.data.responses[0]) {
        const result = response.data.responses[0];
        const labels = result.labelAnnotations || [];
        const texts = result.textAnnotations || [];

        // Find food-related labels
        const foodLabels = labels.filter(label => 
          label.description && this.isFoodRelated(label.description.toLowerCase())
        );

        if (foodLabels.length > 0) {
          const topLabel = foodLabels[0];
          return {
            name: topLabel.description,
            confidence: topLabel.score || 0.7,
            nutrition: this.estimateNutritionFromLabel(topLabel.description),
            ingredients: [],
            allergens: [],
            photo: imagePath,
            verified: false,
            source: 'Google Vision AI'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Google Vision processing error:', error);
      throw error;
    }
  }

  /**
   * Process image with Clarifai Food Model
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Object>} Recognition result
   */
  async processWithClarifai(imagePath) {
    try {
      if (!process.env.CLARIFAI_API_KEY) {
        throw new Error('Clarifai API key not configured');
      }

      // Read and encode image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const requestBody = {
        inputs: [
          {
            data: {
              image: {
                base64: base64Image
              }
            }
          }
        ]
      };

      const response = await axios.post(CLARIFAI_API, requestBody, {
        headers: {
          'Authorization': `Key ${process.env.CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.data && response.data.outputs && response.data.outputs[0]) {
        const output = response.data.outputs[0];
        const concepts = output.data.concepts || [];

        // Filter for food-related concepts with high confidence
        const foodConcepts = concepts.filter(concept => 
          concept.value > 0.7 && this.isFoodRelated(concept.name.toLowerCase())
        );

        if (foodConcepts.length > 0) {
          const topConcept = foodConcepts[0];
          return {
            name: topConcept.name,
            confidence: topConcept.value,
            nutrition: this.estimateNutritionFromLabel(topConcept.name),
            ingredients: [],
            allergens: [],
            photo: imagePath,
            verified: false,
            source: 'Clarifai Food Model'
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Clarifai processing error:', error);
      throw error;
    }
  }

  /**
   * Process image with Nutritionix
   * @param {string} imagePath - Path to the image
   * @returns {Promise<Object>} Recognition result
   */
  async processWithNutritionix(imagePath) {
    try {
      if (!process.env.NUTRITIONIX_APP_ID || !process.env.NUTRITIONIX_APP_KEY) {
        throw new Error('Nutritionix API credentials not configured');
      }

      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const response = await axios.post(`${NUTRITIONIX_API}/natural/nutrients`, formData, {
        headers: {
          'x-app-id': process.env.NUTRITIONIX_APP_ID,
          'x-app-key': process.env.NUTRITIONIX_APP_KEY,
          ...formData.getHeaders(),
        },
        timeout: 30000,
      });

      if (response.data && response.data.foods && response.data.foods.length > 0) {
        const food = response.data.foods[0];
        return {
          name: food.food_name,
          confidence: 0.75,
          nutrition: {
            calories: food.nf_calories || 0,
            protein: food.nf_protein || 0,
            carbs: food.nf_total_carbohydrate || 0,
            fat: food.nf_total_fat || 0,
            fiber: food.nf_dietary_fiber || 0,
            sugar: food.nf_sugars || 0,
            sodium: food.nf_sodium || 0,
          },
          ingredients: [],
          allergens: [],
          photo: imagePath,
          verified: false,
          source: 'Nutritionix Image Search'
        };
      }
      return null;
    } catch (error) {
      console.error('Nutritionix image processing error:', error);
      throw error;
    }
  }

  /**
   * Check if a label is food-related
   * @param {string} label - The label to check
   * @returns {boolean} True if food-related
   */
  isFoodRelated(label) {
    const foodKeywords = [
      'food', 'meal', 'dish', 'cuisine', 'cooking', 'recipe',
      'fruit', 'vegetable', 'meat', 'fish', 'dairy', 'bread',
      'pasta', 'rice', 'salad', 'soup', 'dessert', 'snack',
      'breakfast', 'lunch', 'dinner', 'appetizer', 'main course'
    ];
    
    return foodKeywords.some(keyword => label.includes(keyword));
  }

  /**
   * Estimate nutrition from food label
   * @param {string} foodName - Name of the food
   * @returns {Object} Estimated nutrition
   */
  estimateNutritionFromLabel(foodName) {
    // Simple nutrition estimation based on food type
    const estimates = {
      'apple': { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4, sugar: 19, sodium: 2 },
      'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1 },
      'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 },
      'salad': { calories: 20, protein: 2, carbs: 4, fat: 0.2, fiber: 2, sugar: 2, sodium: 10 },
      'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.5, sugar: 3.8, sodium: 598 },
      'hamburger': { calories: 354, protein: 16, carbs: 30, fat: 17, fiber: 1.2, sugar: 6.2, sodium: 505 },
    };

    const lowerName = foodName.toLowerCase();
    for (const [key, nutrition] of Object.entries(estimates)) {
      if (lowerName.includes(key)) {
        return nutrition;
      }
    }

    // Default estimation
    return { calories: 150, protein: 5, carbs: 20, fat: 5, fiber: 2, sugar: 5, sodium: 100 };
  }

  /**
   * Simulate AI food recognition (fallback)
   * @param {string} imagePath - Path to the captured image
   * @returns {Promise<Object>} Recognized food information
   */
  async simulateAIFoodRecognition(imagePath) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return random demo food
      const randomFood = this.demoFoods[Math.floor(Math.random() * this.demoFoods.length)];
      return {
        ...randomFood,
        photo: imagePath,
        source: 'Demo AI Recognition'
      };
    } catch (error) {
      console.error('Error in simulated AI recognition:', error);
      throw error;
    }
  }

  /**
   * Simulate barcode lookup for demo mode
   * @returns {Promise<Object>} Demo product data
   */
  async simulateBarcodeLookup() {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const demoProducts = [
        {
          name: 'Organic Bananas',
          brand: 'Fresh Market',
          barcode: 'demo123',
          nutrition: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1 },
          ingredients: ['banana'],
          allergens: [],
          nutritionGrade: 'A',
          servingSize: '100g',
          verified: true,
          source: 'Demo Database'
        },
        {
          name: 'Almond Milk',
          brand: 'Silk',
          barcode: 'demo123',
          nutrition: { calories: 30, protein: 1, carbs: 1, fat: 2.5, fiber: 0, sugar: 0, sodium: 150 },
          ingredients: ['almond milk', 'vitamin e', 'calcium carbonate'],
          allergens: ['nuts'],
          nutritionGrade: 'A',
          servingSize: '240ml',
          verified: true,
          source: 'Demo Database'
        }
      ];
      
      return demoProducts[Math.floor(Math.random() * demoProducts.length)];
    } catch (error) {
      console.error('Error in simulated barcode lookup:', error);
      throw error;
    }
  }

  /**
   * Extract nutrient value from nutriments object
   * @param {Object} nutriments - Nutriments object from Open Food Facts
   * @param {string} primaryKey - Primary key to look for
   * @param {string} fallbackKey - Fallback key if primary not found
   * @returns {number} Nutrient value or 0 if not found
   */
  extractNutrient(nutriments, primaryKey, fallbackKey = null) {
    try {
      if (!nutriments || typeof nutriments !== 'object') return 0;
      
      let value = nutriments[primaryKey];
      if (value === undefined && fallbackKey) {
        value = nutriments[fallbackKey];
      }
      
      return value !== undefined ? parseFloat(value) || 0 : 0;
    } catch (error) {
      console.error('Error extracting nutrient:', error);
      return 0;
    }
  }

  /**
   * Get nutrition facts for a food item
   * @param {Object} foodItem - Food item with nutrition data
   * @param {number} servingSize - Serving size in grams
   * @returns {Object} Calculated nutrition facts
   */
  calculateNutritionFacts(foodItem, servingSize = 100) {
    try {
      if (!foodItem || !foodItem.nutrition) {
        return {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          servingSize: `${servingSize}g`
        };
      }

      const multiplier = servingSize / 100;
      const nutrition = foodItem.nutrition;
      
      return {
        calories: Math.round((nutrition.calories || 0) * multiplier),
        protein: Math.round((nutrition.protein || 0) * multiplier * 10) / 10,
        carbs: Math.round((nutrition.carbs || 0) * multiplier * 10) / 10,
        fat: Math.round((nutrition.fat || 0) * multiplier * 10) / 10,
        fiber: Math.round((nutrition.fiber || 0) * multiplier * 10) / 10,
        sugar: Math.round((nutrition.sugar || 0) * multiplier * 10) / 10,
        sodium: Math.round((nutrition.sodium || 0) * multiplier),
        servingSize: `${servingSize}g`
      };
    } catch (error) {
      console.error('Error calculating nutrition facts:', error);
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        servingSize: `${servingSize}g`
      };
    }
  }

  /**
   * Validate barcode format
   * @param {string} barcode - Barcode to validate
   * @returns {boolean} True if valid format
   */
  isValidBarcode(barcode) {
    try {
      if (!barcode || typeof barcode !== 'string') return false;
      
      // Remove any non-digit characters
      const cleanBarcode = barcode.replace(/\D/g, '');
      
      // Check common barcode lengths
      const validLengths = [8, 12, 13, 14];
      return validLengths.includes(cleanBarcode.length);
    } catch (error) {
      console.error('Error validating barcode:', error);
      return false;
    }
  }

  /**
   * Get macro percentages for a food item
   * @param {Object} nutrition - Nutrition data
   * @returns {Object} Macro percentages
   */
  getMacroPercentages(nutrition) {
    try {
      if (!nutrition || typeof nutrition !== 'object') {
        return { protein: 0, carbs: 0, fat: 0 };
      }

      const totalCalories = nutrition.calories || 0;
      if (totalCalories === 0) return { protein: 0, carbs: 0, fat: 0 };

      const proteinCalories = (nutrition.protein || 0) * 4;
      const carbCalories = (nutrition.carbs || 0) * 4;
      const fatCalories = (nutrition.fat || 0) * 9;

      return {
        protein: Math.round((proteinCalories / totalCalories) * 100),
        carbs: Math.round((carbCalories / totalCalories) * 100),
        fat: Math.round((fatCalories / totalCalories) * 100)
      };
    } catch (error) {
      console.error('Error calculating macro percentages:', error);
      return { protein: 0, carbs: 0, fat: 0 };
    }
  }

  /**
   * Get AI service status
   * @returns {Object} Status of all AI services
   */
  getServiceStatus() {
    return {
      openFoodFacts: true, // Always available (free API)
      nutritionix: !!(process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_APP_KEY),
      calorieMama: !!process.env.CALORIE_MAMA_API_KEY,
      clarifai: !!process.env.CLARIFAI_API_KEY,
      googleVision: !!process.env.GOOGLE_VISION_API_KEY,
      demo: true // Always available
    };
  }
}

module.exports = AIService;
