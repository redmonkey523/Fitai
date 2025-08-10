import axios from 'axios';

// Open Food Facts API (free, comprehensive food database)
const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v0/product';

// Calorie Mama Food AI API (paid, but very accurate)
const CALORIE_MAMA_API = 'https://api.caloriemama.ai/food_recognition';

// Google Cloud Vision API (alternative for food recognition)
const GOOGLE_VISION_API = 'https://vision.googleapis.com/v1/images:annotate';

class AIService {
  constructor() {
    this.openFoodFactsClient = axios.create({
      baseURL: OPEN_FOOD_FACTS_API,
      timeout: 10000,
    });
  }

  /**
   * Look up product information by barcode using Open Food Facts API
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
      } else {
        // Product not found in database
        return {
          name: 'Product Not Found',
          brand: 'Unknown',
          barcode: barcode,
          nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
          ingredients: [],
          allergens: [],
          verified: false,
          source: 'Open Food Facts'
        };
      }
    } catch (error) {
      console.error('Error looking up barcode:', error);
      
      // Return a fallback response instead of throwing
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
   * Process food image using AI for food recognition
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
      
      // For now, we'll use a simulated AI response
      // In production, you would integrate with:
      // 1. Calorie Mama API
      // 2. Google Cloud Vision API
      // 3. On-device TensorFlow Lite model
      
      return await this.simulateAIFoodRecognition(imagePath);
      
    } catch (error) {
      console.error('Error processing food image:', error);
      
      // Return a fallback response instead of throwing
      return {
        name: 'AI Processing Error',
        confidence: 0.5,
        nutrition: { 
          calories: 0, 
          protein: 0, 
          carbs: 0, 
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0
        },
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
   * Simulate AI food recognition (replace with real API calls)
   * @param {string} imagePath - Path to the captured image
   * @returns {Promise<Object>} Recognized food information
   */
  async simulateAIFoodRecognition(imagePath) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const foodOptions = [
        {
          name: 'Grilled Chicken Salad',
          confidence: 0.89,
          nutrition: { 
            calories: 320, 
            protein: 28, 
            carbs: 15, 
            fat: 18,
            fiber: 8,
            sugar: 5,
            sodium: 450
          },
          ingredients: ['chicken breast', 'mixed greens', 'olive oil', 'balsamic vinegar', 'cherry tomatoes', 'cucumber'],
          allergens: [],
          photo: imagePath,
          verified: false,
          source: 'AI Recognition'
        },
        {
          name: 'Protein Smoothie Bowl',
          confidence: 0.92,
          nutrition: { 
            calories: 280, 
            protein: 22, 
            carbs: 35, 
            fat: 8,
            fiber: 6,
            sugar: 18,
            sodium: 120
          },
          ingredients: ['banana', 'protein powder', 'almond milk', 'berries', 'granola', 'chia seeds'],
          allergens: ['nuts'],
          photo: imagePath,
          verified: false,
          source: 'AI Recognition'
        },
        {
          name: 'Salmon with Vegetables',
          confidence: 0.85,
          nutrition: { 
            calories: 420, 
            protein: 35, 
            carbs: 12, 
            fat: 25,
            fiber: 8,
            sugar: 4,
            sodium: 380
          },
          ingredients: ['salmon fillet', 'broccoli', 'carrots', 'olive oil', 'lemon', 'herbs'],
          allergens: ['fish'],
          photo: imagePath,
          verified: false,
          source: 'AI Recognition'
        },
        {
          name: 'Greek Yogurt with Berries',
          confidence: 0.94,
          nutrition: { 
            calories: 180, 
            protein: 18, 
            carbs: 22, 
            fat: 2,
            fiber: 3,
            sugar: 16,
            sodium: 85
          },
          ingredients: ['greek yogurt', 'strawberries', 'blueberries', 'honey', 'almonds'],
          allergens: ['milk', 'nuts'],
          photo: imagePath,
          verified: false,
          source: 'AI Recognition'
        },
        {
          name: 'Quinoa Bowl',
          confidence: 0.87,
          nutrition: { 
            calories: 380, 
            protein: 12, 
            carbs: 65, 
            fat: 8,
            fiber: 12,
            sugar: 6,
            sodium: 220
          },
          ingredients: ['quinoa', 'black beans', 'corn', 'avocado', 'lime', 'cilantro'],
          allergens: [],
          photo: imagePath,
          verified: false,
          source: 'AI Recognition'
        }
      ];
      
      return foodOptions[Math.floor(Math.random() * foodOptions.length)];
    } catch (error) {
      console.error('Error in simulated AI recognition:', error);
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
}

export default new AIService();
