const express = require('express');
const { body, validationResult } = require('express-validator');
const Nutrition = require('../models/Nutrition');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateFoodEntry = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Food name must be between 1 and 100 characters'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand must be less than 50 characters'),
  body('servingSize')
    .isObject()
    .withMessage('Serving size is required'),
  body('servingSize.amount')
    .isFloat({ min: 0.1 })
    .withMessage('Serving amount must be a positive number'),
  body('servingSize.unit')
    .isLength({ min: 1, max: 20 })
    .withMessage('Serving unit is required'),
  body('nutrition')
    .isObject()
    .withMessage('Nutrition information is required'),
  body('nutrition.calories')
    .isFloat({ min: 0 })
    .withMessage('Calories must be a non-negative number'),
  body('nutrition.protein')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Protein must be a non-negative number'),
  body('nutrition.carbs')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Carbs must be a non-negative number'),
  body('nutrition.fat')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fat must be a non-negative number'),
  body('mealType')
    .isIn(['breakfast', 'lunch', 'dinner', 'snack'])
    .withMessage('Please provide a valid meal type'),
  body('consumedAt')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
];

// @route   POST /api/nutrition/entries
// @desc    Add a new food entry
// @access  Private
router.post('/entries', validateFoodEntry, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const entryData = {
    ...req.body,
    userId: req.user._id,
    consumedAt: req.body.consumedAt || new Date()
  };

  const entry = await Nutrition.create(entryData);

  // Update user's daily nutrition totals
  await updateUserNutritionTotals(req.user._id, entry);

  res.status(201).json({
    success: true,
    message: 'Food entry added successfully',
    data: { entry }
  });
}));

// @route   GET /api/nutrition/entries
// @desc    Get user's food entries with filtering and pagination
// @access  Private
router.get('/entries', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    mealType,
    date,
    startDate,
    endDate,
    search,
    sortBy = 'consumedAt',
    sortOrder = 'desc'
  } = req.query;

  const filter = { userId: req.user._id };

  // Apply filters
  if (mealType) filter.mealType = mealType;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }

  // Date filtering
  if (date) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    filter.consumedAt = { $gte: startOfDay, $lt: endOfDay };
  } else if (startDate && endDate) {
    filter.consumedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const entries = await Nutrition.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Nutrition.countDocuments(filter);

  res.json({
    success: true,
    data: {
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// @route   GET /api/nutrition/entries/:id
// @desc    Get specific food entry
// @access  Private
router.get('/entries/:id', asyncHandler(async (req, res) => {
  const entry = await Nutrition.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Food entry not found'
    });
  }

  res.json({
    success: true,
    data: { entry }
  });
}));

// @route   PUT /api/nutrition/entries/:id
// @desc    Update food entry
// @access  Private
router.put('/entries/:id', validateFoodEntry, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const entry = await Nutrition.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user._id
    },
    req.body,
    { new: true, runValidators: true }
  );

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Food entry not found'
    });
  }

  // Recalculate user's daily nutrition totals
  await recalculateUserNutritionTotals(req.user._id);

  res.json({
    success: true,
    message: 'Food entry updated successfully',
    data: { entry }
  });
}));

// @route   DELETE /api/nutrition/entries/:id
// @desc    Delete food entry
// @access  Private
router.delete('/entries/:id', asyncHandler(async (req, res) => {
  const entry = await Nutrition.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Food entry not found'
    });
  }

  // Recalculate user's daily nutrition totals
  await recalculateUserNutritionTotals(req.user._id);

  res.json({
    success: true,
    message: 'Food entry deleted successfully'
  });
}));

// @route   GET /api/nutrition/summary
// @desc    Get nutrition summary for a specific date or date range
// @access  Private
router.get('/summary', asyncHandler(async (req, res) => {
  const { date, startDate, endDate } = req.query;

  let dateFilter = {};
  
  if (date) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    dateFilter = { $gte: startOfDay, $lt: endOfDay };
  } else if (startDate && endDate) {
    dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    // Default to today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    dateFilter = { $gte: startOfDay, $lt: endOfDay };
  }

  const entries = await Nutrition.find({
    userId: req.user._id,
    consumedAt: dateFilter
  });

  // Calculate totals
  const summary = entries.reduce((acc, entry) => {
    acc.calories += entry.nutrition.calories || 0;
    acc.protein += entry.nutrition.protein || 0;
    acc.carbs += entry.nutrition.carbs || 0;
    acc.fat += entry.nutrition.fat || 0;
    acc.fiber += entry.nutrition.fiber || 0;
    acc.sugar += entry.nutrition.sugar || 0;
    acc.sodium += entry.nutrition.sodium || 0;
    acc.entries += 1;
    return acc;
  }, {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    entries: 0
  });

  // Get user's nutrition goals
  const user = await User.findById(req.user._id);
  const goals = user.nutritionGoals || {};

  // Calculate percentages
  const percentages = {
    calories: goals.calories ? (summary.calories / goals.calories) * 100 : 0,
    protein: goals.protein ? (summary.protein / goals.protein) * 100 : 0,
    carbs: goals.carbs ? (summary.carbs / goals.carbs) * 100 : 0,
    fat: goals.fat ? (summary.fat / goals.fat) * 100 : 0,
    fiber: goals.fiber ? (summary.fiber / goals.fiber) * 100 : 0
  };

  // Group by meal type
  const mealBreakdown = entries.reduce((acc, entry) => {
    if (!acc[entry.mealType]) {
      acc[entry.mealType] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        entries: 0
      };
    }
    acc[entry.mealType].calories += entry.nutrition.calories || 0;
    acc[entry.mealType].protein += entry.nutrition.protein || 0;
    acc[entry.mealType].carbs += entry.nutrition.carbs || 0;
    acc[entry.mealType].fat += entry.nutrition.fat || 0;
    acc[entry.mealType].entries += 1;
    return acc;
  }, {});

  res.json({
    success: true,
    data: {
      summary,
      goals,
      percentages,
      mealBreakdown,
      entries: entries.length
    }
  });
}));

// @route   GET /api/nutrition/goals
// @desc    Get user's nutrition goals
// @access  Private
router.get('/goals', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: { goals: user.nutritionGoals || {} }
  });
}));

// @route   PUT /api/nutrition/goals
// @desc    Update user's nutrition goals
// @access  Private
router.put('/goals', asyncHandler(async (req, res) => {
  const { calories, protein, carbs, fat, fiber, sugar, sodium, water } = req.body;

  const updateData = {};
  if (calories !== undefined) updateData['nutritionGoals.calories'] = calories;
  if (protein !== undefined) updateData['nutritionGoals.protein'] = protein;
  if (carbs !== undefined) updateData['nutritionGoals.carbs'] = carbs;
  if (fat !== undefined) updateData['nutritionGoals.fat'] = fat;
  if (fiber !== undefined) updateData['nutritionGoals.fiber'] = fiber;
  if (sugar !== undefined) updateData['nutritionGoals.sugar'] = sugar;
  if (sodium !== undefined) updateData['nutritionGoals.sodium'] = sodium;
  if (water !== undefined) updateData['nutritionGoals.water'] = water;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  );

  res.json({
    success: true,
    message: 'Nutrition goals updated successfully',
    data: { goals: user.nutritionGoals }
  });
}));

// @route   POST /api/nutrition/water
// @desc    Log water intake
// @access  Private
router.post('/water', asyncHandler(async (req, res) => {
  const { amount, unit = 'ml' } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid water amount is required'
    });
  }

  const waterEntry = await Nutrition.create({
    userId: req.user._id,
    name: 'Water',
    servingSize: { amount, unit },
    nutrition: { calories: 0 },
    mealType: 'snack',
    consumedAt: new Date(),
    isWater: true
  });

  // Update user's daily water intake
  await updateUserWaterIntake(req.user._id, amount);

  res.status(201).json({
    success: true,
    message: 'Water intake logged successfully',
    data: { entry: waterEntry }
  });
}));

// @route   GET /api/nutrition/water
// @desc    Get water intake for a specific date
// @access  Private
router.get('/water', asyncHandler(async (req, res) => {
  const { date } = req.query;

  let dateFilter = {};
  if (date) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    dateFilter = { $gte: startOfDay, $lt: endOfDay };
  } else {
    // Default to today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    dateFilter = { $gte: startOfDay, $lt: endOfDay };
  }

  const waterEntries = await Nutrition.find({
    userId: req.user._id,
    isWater: true,
    consumedAt: dateFilter
  });

  const totalWater = waterEntries.reduce((sum, entry) => {
    return sum + (entry.servingSize.amount || 0);
  }, 0);

  const user = await User.findById(req.user._id);
  const waterGoal = user.nutritionGoals?.water || 2000; // Default 2L

  res.json({
    success: true,
    data: {
      entries: waterEntries,
      total: totalWater,
      goal: waterGoal,
      percentage: (totalWater / waterGoal) * 100
    }
  });
}));

// @route   GET /api/nutrition/search
// @desc    Search for foods in database
// @access  Private
router.get('/search', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }

  const searchRegex = new RegExp(q.trim(), 'i');
  
  const foods = await Nutrition.find({
    $or: [
      { name: searchRegex },
      { brand: searchRegex }
    ],
    isCommonFood: true // Only search common foods, not personal entries
  })
  .select('name brand servingSize nutrition')
  .limit(parseInt(limit));

  res.json({
    success: true,
    data: { foods }
  });
}));

// @route   GET /api/nutrition/analytics
// @desc    Get nutrition analytics and trends
// @access  Private
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '7' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const entries = await Nutrition.find({
    userId: req.user._id,
    consumedAt: { $gte: startDate },
    isWater: false
  });

  // Daily breakdown
  const dailyBreakdown = {};
  entries.forEach(entry => {
    const date = entry.consumedAt.toISOString().split('T')[0];
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        entries: 0
      };
    }
    dailyBreakdown[date].calories += entry.nutrition.calories || 0;
    dailyBreakdown[date].protein += entry.nutrition.protein || 0;
    dailyBreakdown[date].carbs += entry.nutrition.carbs || 0;
    dailyBreakdown[date].fat += entry.nutrition.fat || 0;
    dailyBreakdown[date].entries += 1;
  });

  // Calculate averages
  const days = Object.keys(dailyBreakdown).length || 1;
  const averages = Object.values(dailyBreakdown).reduce((acc, day) => {
    acc.calories += day.calories / days;
    acc.protein += day.protein / days;
    acc.carbs += day.carbs / days;
    acc.fat += day.fat / days;
    acc.entries += day.entries / days;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 });

  // Most consumed foods
  const foodCounts = {};
  entries.forEach(entry => {
    const key = `${entry.name}${entry.brand ? ` (${entry.brand})` : ''}`;
    foodCounts[key] = (foodCounts[key] || 0) + 1;
  });

  const topFoods = Object.entries(foodCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  res.json({
    success: true,
    data: {
      dailyBreakdown,
      averages,
      topFoods,
      totalEntries: entries.length,
      period: parseInt(period)
    }
  });
}));

// Helper functions
async function updateUserNutritionTotals(userId, entry) {
  const date = entry.consumedAt.toISOString().split('T')[0];
  const key = `nutritionTotals.${date}`;

  await User.findByIdAndUpdate(userId, {
    $inc: {
      [`${key}.calories`]: entry.nutrition.calories || 0,
      [`${key}.protein`]: entry.nutrition.protein || 0,
      [`${key}.carbs`]: entry.nutrition.carbs || 0,
      [`${key}.fat`]: entry.nutrition.fat || 0,
      [`${key}.entries`]: 1
    }
  });
}

async function updateUserWaterIntake(userId, amount) {
  const today = new Date().toISOString().split('T')[0];
  const key = `waterIntake.${today}`;

  await User.findByIdAndUpdate(userId, {
    $inc: { [key]: amount }
  });
}

async function recalculateUserNutritionTotals(userId) {
  // This would recalculate all nutrition totals for the user
  // Implementation depends on your specific requirements
  console.log('Recalculating nutrition totals for user:', userId);
}

module.exports = router;
