const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { authenticateToken } = require('../middleware/auth');
const { Purchase } = require('../models/Commerce');
const { Plan } = require('../models/Plan');

// POST /api/commerce/purchase - purchase a program
router.post('/purchase', authenticateToken, asyncHandler(async (req, res) => {
  const { programId } = req.body || {};
  if (!programId) return res.status(400).json({ success: false, message: 'programId required' });

  const program = await Plan.findById(programId).lean();
  if (!program || !program.isPublished || !program.isPublic) {
    return res.status(404).json({ success: false, message: 'Program not available' });
  }
  const price = Number(program.price || 0);
  if (price <= 0) return res.status(400).json({ success: false, message: 'Program is free' });

  // Placeholder for real payment integration (Stripe/etc.)
  // For now, mark purchase as recorded immediately
  const created = await Purchase.findOneAndUpdate(
    { userId: req.user._id, programId },
    { userId: req.user._id, programId, price, currency: program.currency || 'USD', provider: 'manual' },
    { upsert: true, new: true }
  );

  return res.json({ success: true, data: { purchase: created } });
}));

// POST /api/commerce/purchase-pro - one-time purchase unlocking macro tracker and pro features
router.post('/purchase-pro', authenticateToken, asyncHandler(async (req, res) => {
  const price = Number(process.env.PRO_PRICE_USD || 29);
  const purchase = await Purchase.findOneAndUpdate(
    { userId: req.user._id, product: 'pro' },
    { userId: req.user._id, product: 'pro', price, currency: 'USD', provider: 'manual' },
    { upsert: true, new: true }
  );
  return res.json({ success: true, data: { purchase } });
}));

// GET /api/commerce/entitlements - return user's pro/program entitlements
router.get('/entitlements', authenticateToken, asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ userId: req.user._id }).lean();
  const pro = Boolean(req.user.isPremium) || purchases.some(p => p.product === 'pro');
  const programs = purchases.filter(p => p.programId).map(p => String(p.programId));
  return res.json({ success: true, data: { pro, programs, isAdmin: Boolean(req.user.isPremium) } });
}));

module.exports = router;
