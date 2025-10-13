const express = require('express');
const router = express.Router();
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');
const { authenticateToken } = require('../middleware/auth');

// Get meal plans (with date range)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.user.userId };

    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const mealPlans = await MealPlan.find(query)
      .sort({ date: 1 })
      .populate('meals.breakfast.recipe')
      .populate('meals.lunch.recipe')
      .populate('meals.dinner.recipe')
      .populate('meals.snack.recipe')
      .lean();

    res.json(mealPlans);
  } catch (error) {
    console.error('Error getting meal plans:', error);
    res.status(500).json({ error: 'Failed to get meal plans' });
  }
});

// Get meal plan for specific date
router.get('/:date', authenticateToken, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({
      userId: req.user.userId,
      date: req.params.date,
    })
      .populate('meals.breakfast.recipe')
      .populate('meals.lunch.recipe')
      .populate('meals.dinner.recipe')
      .populate('meals.snack.recipe')
      .lean();

    if (!mealPlan) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    res.json(mealPlan);
  } catch (error) {
    console.error('Error getting meal plan:', error);
    res.status(500).json({ error: 'Failed to get meal plan' });
  }
});

// Create or update meal plan
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, meals, notes } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Check if meal plan exists
    let mealPlan = await MealPlan.findOne({
      userId: req.user.userId,
      date,
    });

    if (mealPlan) {
      // Update existing
      mealPlan.meals = meals || mealPlan.meals;
      mealPlan.notes = notes !== undefined ? notes : mealPlan.notes;
      await mealPlan.save();
    } else {
      // Create new
      mealPlan = new MealPlan({
        userId: req.user.userId,
        date,
        meals,
        notes,
      });
      await mealPlan.save();
    }

    // Populate recipes
    await mealPlan.populate('meals.breakfast.recipe');
    await mealPlan.populate('meals.lunch.recipe');
    await mealPlan.populate('meals.dinner.recipe');
    await mealPlan.populate('meals.snack.recipe');

    res.json(mealPlan);
  } catch (error) {
    console.error('Error saving meal plan:', error);
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
});

// Delete meal plan
router.delete('/:date', authenticateToken, async (req, res) => {
  try {
    const result = await MealPlan.findOneAndDelete({
      userId: req.user.userId,
      date: req.params.date,
    });

    if (!result) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({ error: 'Failed to delete meal plan' });
  }
});

// Generate weekly meal plan (AI-powered - simplified version)
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { startDate, preferences = {} } = req.body;

    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' });
    }

    // Get user's recipes or public recipes
    const query = {
      $or: [
        { userId: req.user.userId },
        { isPublic: true },
      ],
    };

    // Apply dietary preferences
    if (preferences.dietaryTags && preferences.dietaryTags.length > 0) {
      query.dietaryTags = { $all: preferences.dietaryTags };
    }

    // Get recipes for each category
    const breakfastRecipes = await Recipe.find({ ...query, category: 'breakfast' }).limit(7);
    const lunchRecipes = await Recipe.find({ ...query, category: 'lunch' }).limit(7);
    const dinnerRecipes = await Recipe.find({ ...query, category: 'dinner' }).limit(7);
    const snackRecipes = await Recipe.find({ ...query, category: 'snack' }).limit(7);

    // Generate 7 days of meal plans
    const generatedPlans = [];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Randomly select recipes for each meal
      const breakfast = breakfastRecipes[i % breakfastRecipes.length];
      const lunch = lunchRecipes[i % lunchRecipes.length];
      const dinner = dinnerRecipes[i % dinnerRecipes.length];
      const snack = snackRecipes[i % snackRecipes.length];

      const mealPlanData = {
        userId: req.user.userId,
        date: dateStr,
        meals: {},
      };

      if (breakfast) {
        mealPlanData.meals.breakfast = {
          recipe: breakfast._id,
          recipeName: breakfast.name,
          recipeImage: breakfast.image,
          calories: breakfast.nutrition.calories,
          protein: breakfast.nutrition.protein,
          carbs: breakfast.nutrition.carbs,
          fat: breakfast.nutrition.fat,
        };
      }

      if (lunch) {
        mealPlanData.meals.lunch = {
          recipe: lunch._id,
          recipeName: lunch.name,
          recipeImage: lunch.image,
          calories: lunch.nutrition.calories,
          protein: lunch.nutrition.protein,
          carbs: lunch.nutrition.carbs,
          fat: lunch.nutrition.fat,
        };
      }

      if (dinner) {
        mealPlanData.meals.dinner = {
          recipe: dinner._id,
          recipeName: dinner.name,
          recipeImage: dinner.image,
          calories: dinner.nutrition.calories,
          protein: dinner.nutrition.protein,
          carbs: dinner.nutrition.carbs,
          fat: dinner.nutrition.fat,
        };
      }

      if (snack) {
        mealPlanData.meals.snack = {
          recipe: snack._id,
          recipeName: snack.name,
          recipeImage: snack.image,
          calories: snack.nutrition.calories,
          protein: snack.nutrition.protein,
          carbs: snack.nutrition.carbs,
          fat: snack.nutrition.fat,
        };
      }

      // Upsert meal plan
      const mealPlan = await MealPlan.findOneAndUpdate(
        { userId: req.user.userId, date: dateStr },
        mealPlanData,
        { upsert: true, new: true }
      );

      generatedPlans.push(mealPlan);
    }

    res.json(generatedPlans);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

module.exports = router;


