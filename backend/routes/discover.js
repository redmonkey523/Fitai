const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Coach = require('../models/Coach');
const { Plan } = require('../models/Plan');

// Simple in-memory cache for discover results
// { key: { ts, payload } }
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60s

// Discover feed
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { tab = 'for_you', limit = 20, debug } = req.query;
    const l = Math.min(50, parseInt(limit));
    let items = [];
    if (tab === 'coaches') {
      const cacheKey = `coaches:${l}`;
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
        return res.json(cached.payload);
      }
      items = await Coach.find({}).sort({ verified: -1, followers: -1 }).limit(l).lean();
      const payload = { success: true, data: { coaches: items } };
      cache.set(cacheKey, { ts: Date.now(), payload });
      return res.json(payload);
    }

    // Programs (plans)
    const baseQuery = { isPublished: true, isPublic: true };
    const plans = await Plan.find(baseQuery).limit(300).lean();

    if (tab !== 'trending') {
      const cacheKey = `for_you:${l}:${!!debug}`;
      const cached = cache.get(cacheKey);
      if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
        return res.json(cached.payload);
      }
      // Fallback/basic: completion7d then recency
      const sorted = plans
        .sort((a, b) => {
          const ac = a?.metrics?.completion7d || 0;
          const bc = b?.metrics?.completion7d || 0;
          if (bc !== ac) return bc - ac;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, l);
      const payload = { success: true, data: { programs: sorted } };
      cache.set(cacheKey, { ts: Date.now(), payload });
      return res.json(payload);
    }

    // Trending v2 scoring
    const coachIds = plans.map(p => p.coachId).filter(Boolean);
    const coaches = coachIds.length > 0
      ? await Coach.find({ _id: { $in: coachIds } }).select('_id verified followers').lean()
      : [];
    const coachMap = new Map(coaches.map(c => [String(c._id), c]));

    const now = Date.now();
    const halfLifeDays = 14; // time-decay half-life
    const ln2 = Math.log(2);

    const scorePlan = (p) => {
      const m = p.metrics || {};
      const completion = Number(m.completion7d || 0); // 0..100
      const saveRate = Number(m.saveRate || 0); // 0..1
      const commentVel = Number(m.commentVelocity || 0); // arbitrary scale
      const retention = Number(m.retentionW3 || 0); // 0..1
      const refund = Number(m.refundRate || 0); // 0..1
      const report = Number(m.reportRate || 0); // 0..1

      // Normalize comment velocity into ~0..100 via log scale
      const commentScore = Math.min(100, Math.log10(commentVel + 1) * 40); // log10(100)≈2 -> up to ~80

      // Base score from quality metrics
      let score = 0;
      score += 0.35 * Math.max(0, Math.min(100, completion));
      score += 0.20 * Math.max(0, Math.min(100, saveRate * 100));
      score += 0.15 * commentScore;
      score += 0.10 * Math.max(0, Math.min(100, retention * 100));
      score -= 0.20 * Math.max(0, Math.min(100, refund * 100));
      score -= 0.25 * Math.max(0, Math.min(100, report * 100));

      // Time decay multiplier (0.6..1.0)
      const ageDays = Math.max(0, (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const decay = Math.exp(-ln2 * (ageDays / halfLifeDays));
      score *= (0.6 + 0.4 * decay);

      // Coach boost: verified + followers
      if (p.coachId) {
        const c = coachMap.get(String(p.coachId));
        if (c) {
          if (c.verified) score += 8; // verified boost
          const followerBoost = Math.log10((c.followers || 0) + 1) * 5; // up to ~25 boost at 100k
          score += followerBoost;
        }
      }

      return score;
    };

    const scored = plans
      .map(p => ({ ...p, _score: scorePlan(p) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, l)
      .map(doc => {
        if (debug === '1') {
          const { _score, ...rest } = doc;
          return { ...rest, score: Number((_score || 0).toFixed(2)) };
        }
        const { _score, ...rest } = doc;
        return rest;
      });

    const cacheKey = `trending:${l}:${!!debug}`;
    const payload = { success: true, data: { programs: scored } };
    cache.set(cacheKey, { ts: Date.now(), payload });
    return res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error loading discover', error: error.message });
  }
});

module.exports = router;


