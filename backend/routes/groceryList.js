const express = require('express');
const router = express.Router();
const GroceryList = require('../models/GroceryList');
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');
const { authenticateToken } = require('../middleware/auth');

// Get grocery list
router.get('/', authenticateToken, async (req, res) => {
  try {
    let groceryList = await GroceryList.findOne({ userId: req.user.userId });

    if (!groceryList) {
      // Create empty grocery list if it doesn't exist
      groceryList = new GroceryList({
        userId: req.user.userId,
        items: [],
      });
      await groceryList.save();
    }

    res.json(groceryList);
  } catch (error) {
    console.error('Error getting grocery list:', error);
    res.status(500).json({ error: 'Failed to get grocery list' });
  }
});

// Generate grocery list from meal plans
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // Get meal plans for date range
    const mealPlans = await MealPlan.find({
      userId: req.user.userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate([
      'meals.breakfast.recipe',
      'meals.lunch.recipe',
      'meals.dinner.recipe',
      'meals.snack.recipe',
    ]);

    // Collect all ingredients
    const ingredientsMap = new Map();

    for (const mealPlan of mealPlans) {
      for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
        const meal = mealPlan.meals[mealType];
        if (meal && meal.recipe) {
          const recipe = meal.recipe;
          if (recipe.ingredients) {
            for (const ingredient of recipe.ingredients) {
              const key = `${ingredient.name.toLowerCase()}_${ingredient.unit}`;
              if (ingredientsMap.has(key)) {
                const existing = ingredientsMap.get(key);
                existing.quantity += ingredient.quantity;
              } else {
                ingredientsMap.set(key, {
                  name: ingredient.name,
                  quantity: ingredient.quantity,
                  unit: ingredient.unit,
                  category: ingredient.category || 'Other',
                });
              }
            }
          }
        }
      }
    }

    // Get or create grocery list
    let groceryList = await GroceryList.findOne({ userId: req.user.userId });

    if (!groceryList) {
      groceryList = new GroceryList({
        userId: req.user.userId,
        items: [],
      });
    }

    // Add new items to grocery list (avoid duplicates)
    const newItems = Array.from(ingredientsMap.values());
    
    for (const newItem of newItems) {
      const existingIndex = groceryList.items.findIndex(
        item => item.name.toLowerCase() === newItem.name.toLowerCase() && item.unit === newItem.unit
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        groceryList.items[existingIndex].quantity += newItem.quantity;
      } else {
        // Add new item
        groceryList.items.push({
          ...newItem,
          checked: false,
          addedAt: new Date(),
        });
      }
    }

    await groceryList.save();

    res.json(groceryList);
  } catch (error) {
    console.error('Error generating grocery list:', error);
    res.status(500).json({ error: 'Failed to generate grocery list' });
  }
});

// Add item to grocery list
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const { name, quantity = 1, unit = '', category = 'Other' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    let groceryList = await GroceryList.findOne({ userId: req.user.userId });

    if (!groceryList) {
      groceryList = new GroceryList({
        userId: req.user.userId,
        items: [],
      });
    }

    // Check for duplicates
    const existingIndex = groceryList.items.findIndex(
      item => item.name.toLowerCase() === name.toLowerCase() && item.unit === unit
    );

    if (existingIndex >= 0) {
      // Update quantity
      groceryList.items[existingIndex].quantity += quantity;
    } else {
      // Add new item
      groceryList.items.push({
        name,
        quantity,
        unit,
        category,
        checked: false,
        addedAt: new Date(),
      });
    }

    await groceryList.save();

    res.json(groceryList);
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update grocery item
router.put('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    const groceryList = await GroceryList.findOne({ userId: req.user.userId });

    if (!groceryList) {
      return res.status(404).json({ error: 'Grocery list not found' });
    }

    const item = groceryList.items.id(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Update fields
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.quantity !== undefined) item.quantity = updates.quantity;
    if (updates.unit !== undefined) item.unit = updates.unit;
    if (updates.category !== undefined) item.category = updates.category;
    if (updates.checked !== undefined) item.checked = updates.checked;

    await groceryList.save();

    res.json(groceryList);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete grocery item
router.delete('/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;

    const groceryList = await GroceryList.findOne({ userId: req.user.userId });

    if (!groceryList) {
      return res.status(404).json({ error: 'Grocery list not found' });
    }

    groceryList.items = groceryList.items.filter(
      item => item._id.toString() !== itemId
    );

    await groceryList.save();

    res.json(groceryList);
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Clear checked items
router.delete('/checked', authenticateToken, async (req, res) => {
  try {
    const groceryList = await GroceryList.findOne({ userId: req.user.userId });

    if (!groceryList) {
      return res.status(404).json({ error: 'Grocery list not found' });
    }

    groceryList.items = groceryList.items.filter(item => !item.checked);

    await groceryList.save();

    res.json(groceryList);
  } catch (error) {
    console.error('Error clearing checked items:', error);
    res.status(500).json({ error: 'Failed to clear checked items' });
  }
});

// Clear all items
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const groceryList = await GroceryList.findOne({ userId: req.user.userId });

    if (!groceryList) {
      return res.status(404).json({ error: 'Grocery list not found' });
    }

    groceryList.items = [];
    await groceryList.save();

    res.json(groceryList);
  } catch (error) {
    console.error('Error clearing grocery list:', error);
    res.status(500).json({ error: 'Failed to clear grocery list' });
  }
});

module.exports = router;


