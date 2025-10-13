const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Coach = require('../models/Coach');
const Follow = require('../models/Follow');
const { Plan } = require('../models/Plan');
const User = require('../models/User');

// List coaches
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (q) filter.$text = { $search: q };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Coach.find(filter)
        .select('-__v')
        .sort({ verified: -1, followers: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Coach.countDocuments(filter)
    ]);
    res.json({ success: true, data: { items, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error listing coaches', error: error.message });
  }
});

// Coach channel
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const coach = await Coach.findById(req.params.id);
    if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
    const programs = await Plan.find({ coachId: coach._id, isPublished: true }).sort({ createdAt: -1 }).limit(10);
    const isFollowing = await Follow.findOne({ userId: req.user._id, coachId: coach._id }).lean();
    res.json({ success: true, data: { coach, programs, isFollowing: !!isFollowing } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching coach', error: error.message });
  }
});

// Follow/unfollow
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    await Follow.findOneAndUpdate(
      { userId: req.user._id, coachId: req.params.id },
      { userId: req.user._id, coachId: req.params.id },
      { upsert: true, new: true }
    );
    await Coach.findByIdAndUpdate(req.params.id, { $inc: { followers: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error following', error: error.message });
  }
});

router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const deleted = await Follow.findOneAndDelete({ userId: req.user._id, coachId: req.params.id });
    if (deleted) await Coach.findByIdAndUpdate(req.params.id, { $inc: { followers: -1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error unfollowing', error: error.message });
  }
});

module.exports = router;

// Seed AI coaches for launch/demo
router.post('/seed-ai', authenticateToken, async (req, res) => {
  try {
    // Only allow admins (isPremium used here as simple admin flag in this project)
    if (!req.user?.isPremium) return res.status(403).json({ success: false, message: 'Forbidden' });
    const { coaches = [] } = req.body || {};
    if (!Array.isArray(coaches) || coaches.length === 0) {
      return res.status(400).json({ success: false, message: 'coaches array required' });
    }
    const created = [];
    for (const c of coaches) {
      // Create or upsert a bare user for coach profile picture/name
      const user = await User.findOneAndUpdate(
        { email: c.email || `${c.slug || c.name.replace(/\s+/g,'-').toLowerCase()}@ai.local` },
        { firstName: c.firstName || c.name?.split(' ')[0] || 'AI', lastName: c.lastName || c.name?.split(' ')[1] || 'Coach', avatar: c.avatar },
        { upsert: true, new: true }
      );
      const doc = await Coach.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          bio: c.bio || 'AI Coach for launch visuals',
          niches: c.niches || ['strength','conditioning'],
          verified: true,
          rating: 4.8,
          ratingCount: 124,
          followers: c.followers || Math.floor(Math.random()*20000)+1000,
        },
        { upsert: true, new: true }
      );
      created.push(doc);
    }
    res.json({ success: true, data: created });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Seed failed', error: e.message });
  }
});


