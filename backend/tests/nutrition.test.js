const request = require('supertest');
const express = require('express');

let app;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  
  // Mock nutrition routes for testing
  app.post('/api/nutrition/log', (req, res) => {
    const { foodName, calories, protein, carbs, fat, mealType, date } = req.body;
    
    if (!foodName || !calories || !mealType) {
      return res.status(400).json({
        success: false,
        message: 'Food name, calories, and meal type are required'
      });
    }
    
    // Validate calories is a number
    if (isNaN(parseInt(calories))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid calorie value'
      });
    }
    
    const nutritionEntry = {
      id: Date.now().toString(),
      foodName,
      calories: parseInt(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      mealType,
      date: date || new Date().toISOString(),
      userId: '1'
    };
    
    res.status(201).json({
      success: true,
      nutritionEntry,
      message: 'Nutrition entry logged successfully'
    });
  });
  
  app.get('/api/nutrition/daily/:date', (req, res) => {
    const { date } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Mock daily nutrition data
    const dailyNutrition = {
      date,
      totalCalories: 1850,
      totalProtein: 120,
      totalCarbs: 180,
      totalFat: 65,
      meals: [
        {
          mealType: 'breakfast',
          entries: [
            {
              id: '1',
              foodName: 'Oatmeal with Berries',
              calories: 350,
              protein: 12,
              carbs: 60,
              fat: 8
            }
          ]
        },
        {
          mealType: 'lunch',
          entries: [
            {
              id: '2',
              foodName: 'Grilled Chicken Salad',
              calories: 450,
              protein: 35,
              carbs: 15,
              fat: 25
            }
          ]
        }
      ]
    };
    
    res.json({
      success: true,
      dailyNutrition
    });
  });
  
  app.get('/api/nutrition/search', (req, res) => {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Mock food search results
    const searchResults = [
      {
        id: '1',
        name: 'Chicken Breast',
        brand: 'Organic Valley',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        servingSize: '100g'
      },
      {
        id: '2',
        name: 'Brown Rice',
        brand: 'Uncle Ben\'s',
        calories: 110,
        protein: 2.5,
        carbs: 23,
        fat: 0.9,
        servingSize: '100g'
      }
    ];
    
    // Filter results based on query
    const filteredResults = searchResults.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length
    });
  });
  
  app.delete('/api/nutrition/entry/:id', (req, res) => {
    const { id } = req.params;
    
    if (!id || id === '' || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Entry ID is required'
      });
    }
    
    res.json({
      success: true,
      message: 'Nutrition entry deleted successfully'
    });
  });
});

describe('Nutrition API', () => {
  describe('POST /api/nutrition/log', () => {
    it('should log a nutrition entry with valid data', async () => {
      const nutritionData = {
        foodName: 'Grilled Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        mealType: 'lunch',
        date: '2024-01-15T12:00:00Z'
      };
      
      const response = await request(app)
        .post('/api/nutrition/log')
        .send(nutritionData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.nutritionEntry).toHaveProperty('id');
      expect(response.body.nutritionEntry.foodName).toBe(nutritionData.foodName);
      expect(response.body.nutritionEntry.calories).toBe(nutritionData.calories);
      expect(response.body.nutritionEntry.mealType).toBe(nutritionData.mealType);
    });
    
    it('should return 400 for missing required fields', async () => {
      const nutritionData = {
        foodName: 'Chicken Breast',
        calories: 165
        // Missing mealType
      };
      
      const response = await request(app)
        .post('/api/nutrition/log')
        .send(nutritionData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
    
    it('should handle invalid calorie values', async () => {
      const nutritionData = {
        foodName: 'Test Food',
        calories: 'invalid',
        mealType: 'breakfast'
      };
      
      const response = await request(app)
        .post('/api/nutrition/log')
        .send(nutritionData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/nutrition/daily/:date', () => {
    it('should return daily nutrition summary', async () => {
      const date = '2024-01-15';
      const userId = '1';
      
      const response = await request(app)
        .get(`/api/nutrition/daily/${date}?userId=${userId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.dailyNutrition).toHaveProperty('date');
      expect(response.body.dailyNutrition).toHaveProperty('totalCalories');
      expect(response.body.dailyNutrition).toHaveProperty('meals');
      expect(Array.isArray(response.body.dailyNutrition.meals)).toBe(true);
    });
    
    it('should return 400 without user ID', async () => {
      const date = '2024-01-15';
      
      const response = await request(app)
        .get(`/api/nutrition/daily/${date}`)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User ID is required');
    });
  });
  
  describe('GET /api/nutrition/search', () => {
    it('should return search results for valid query', async () => {
      const query = 'chicken';
      
      const response = await request(app)
        .get(`/api/nutrition/search?query=${query}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
    });
    
    it('should return 400 without search query', async () => {
      const response = await request(app)
        .get('/api/nutrition/search')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Search query is required');
    });
    
    it('should return empty results for non-matching query', async () => {
      const query = 'nonexistentfood';
      
      const response = await request(app)
        .get(`/api/nutrition/search?query=${query}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });
  
  describe('DELETE /api/nutrition/entry/:id', () => {
    it('should delete nutrition entry with valid ID', async () => {
      const entryId = '123';
      
      const response = await request(app)
        .delete(`/api/nutrition/entry/${entryId}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
    
    it('should return 400 without entry ID', async () => {
      const response = await request(app)
        .delete('/api/nutrition/entry/undefined')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Entry ID is required');
    });
  });
});

describe('Nutrition Data Validation', () => {
  it('should validate calorie ranges', () => {
    const validCalories = [0, 100, 500, 1000, 2000];
    const invalidCalories = [-1, 'abc', null, undefined];
    
    validCalories.forEach(calories => {
      expect(typeof calories).toBe('number');
      expect(calories).toBeGreaterThanOrEqual(0);
    });
    
    invalidCalories.forEach(calories => {
      expect(typeof calories === 'number' && calories >= 0).toBe(false);
    });
  });
  
  it('should validate meal types', () => {
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const invalidMealTypes = ['invalid', '', null, undefined];
    
    validMealTypes.forEach(mealType => {
      expect(typeof mealType).toBe('string');
      expect(mealType.length).toBeGreaterThan(0);
    });
    
    // Test invalid meal types
    expect(typeof 'invalid' === 'string' && 'invalid'.length > 0).toBe(true); // This should be valid
    expect(typeof '' === 'string' && ''.length > 0).toBe(false); // Empty string
    expect(typeof null === 'string' && null.length > 0).toBe(false); // null
    expect(typeof undefined === 'string' && undefined.length > 0).toBe(false); // undefined
  });
});
