const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Plan, PlanAssignment } = require('../models/Plan');

// Create a plan (admin/coach)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const body = req.body;
    const plan = await Plan.create({ ...body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// List plans
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { goal, difficulty, q, limit = 20, page = 1 } = req.query;
    const filter = { isPublic: true };
    if (goal) filter.goal = goal;
    if (difficulty) filter.difficulty = difficulty;
    if (q) filter.$text = { $search: q };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Plan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Plan.countDocuments(filter)
    ]);
    res.json({ success: true, data: { items, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing plans', error: error.message });
  }
});

// Get plan detail
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching plan', error: error.message });
  }
});

// Patch a plan (add media, update sessions)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const update = req.body;
    const plan = await Plan.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Assign plan to user
router.post('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id;
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const assignment = await PlanAssignment.findOneAndUpdate(
      { userId: req.user._id, planId },
      { userId: req.user._id, planId, startDate },
      { new: true, upsert: true }
    );
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get user's calendar (current assignment)
router.get('/me/calendar', authenticateToken, async (req, res) => {
  try {
    // Avoid ObjectId casting issues if req.user._id is a number (in-memory mode)
    const userId = req.user._id;
    const assignment = await PlanAssignment.findOne({ userId });
    if (!assignment) return res.json({ success: true, data: { weeks: [] } });
    const plan = await Plan.findById(assignment.planId);
    if (!plan) return res.json({ success: true, data: { weeks: [] } });
    res.json({ success: true, data: { planId: plan._id, name: plan.name, phases: plan.phases, assignment } });
  } catch (error) {
    console.error('Plans calendar error:', error);
    res.status(500).json({ success: false, message: 'Error fetching calendar', error: error.message });
  }
});

module.exports = router;


