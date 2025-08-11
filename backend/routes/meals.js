const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Recipe, MealPlan } = require('../models/Meal');

// Create recipe
router.post('/recipes', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: recipe });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Search recipes
router.get('/recipes', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    const filter = { $or: [{ isPublic: true }, { userId: req.user._id }] };
    if (q) filter.$text = { $search: q };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Recipe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Recipe.countDocuments(filter)
    ]);
    res.json({ success: true, data: { items, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching recipes', error: error.message });
  }
});

// Upsert meal plan items
router.put('/plan', authenticateToken, async (req, res) => {
  try {
    const { items, goal, macroTargets } = req.body;
    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, items, goal, macroTargets },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get meal plan for date range
router.get('/plan', authenticateToken, async (req, res) => {
  try {
    const { start, end } = req.query;
    const plan = await MealPlan.findOne({ userId: req.user._id });
    if (!plan) return res.json({ success: true, data: { items: [] } });
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(new Date().setDate(new Date().getDate() + 7));
    const items = (plan.items || []).filter(i => i.date >= startDate && i.date <= endDate);
    res.json({ success: true, data: { items, macroTargets: plan.macroTargets, goal: plan.goal } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching meal plan', error: error.message });
  }
});

module.exports = router;


