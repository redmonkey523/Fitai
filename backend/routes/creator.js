const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Coach = require('../models/Coach');
const CreatorApplication = require('../models/CreatorApplication');
const { Plan } = require('../models/Plan');

// Normalize user id: accept in-memory numeric ids by mapping to a stable ObjectId-like hex
const toStableObjectIdHex = (id) => {
  const s = String(id || '');
  if (/^[a-f\d]{24}$/i.test(s)) return s.toLowerCase();
  return crypto.createHash('md5').update(`memuser:${s}`).digest('hex').slice(0, 24);
};

// Apply to be a creator/coach
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const { bio, niches = [], links = [] } = req.body;
    const userId = toStableObjectIdHex(req.user?._id);
    
    // Auto-approve application and create coach record immediately
    const app = await CreatorApplication.findOneAndUpdate(
      { userId },
      { userId, bio, niches, links, status: 'approved' },
      { upsert: true, new: true }
    );
    
    // Create coach record if it doesn't exist
    const existingCoach = await Coach.findOne({ userId });
    if (!existingCoach) {
      const coach = new Coach({
        userId,
        bio,
        niches,
        links,
        followers: 0,
        verified: true, // Auto-verify for development
        tier: 'standard'
      });
      await coach.save();
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Application approved! You now have access to the Creator Studio.',
      data: app 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Creator stats (for approved coaches)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = toStableObjectIdHex(req.user?._id);
    const coach = await Coach.findOne({ userId });
    if (!coach) return res.status(403).json({ success: false, message: 'Not a creator' });
    const programs = await Plan.find({ coachId: coach._id }).sort({ createdAt: -1 }).limit(25);
    const totals = {
      programs: programs.length,
      followers: coach.followers,
      avgCompletion7d: Math.round((programs.reduce((s, p) => s + (p.metrics?.completion7d || 0), 0) / (programs.length || 1)) * 100) / 100,
      saves: programs.reduce((s, p) => s + (p.metrics?.saveRate || 0), 0),
      commentVelocity: programs.reduce((s, p) => s + (p.metrics?.commentVelocity || 0), 0),
    };
    res.json({ success: true, data: { coach, totals, programs } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;


