const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Media = require('../models/Media');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;

// All routes require auth
router.use(authenticateToken);

// GET /api/media - list user's media
router.get('/', async (req, res) => {
  try {
    const items = await Media.find({ user: req.user.id, deleted: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to fetch media', error: e.message });
  }
});

// POST /api/media/uploads/init - announce intent to upload
router.post('/uploads/init', async (req, res) => {
  try {
    const { filename, contentType, type, size } = req.body || {};
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return res.json({
      success: true,
      uploadId,
      strategy: 'direct',
      target: '/api/upload/single',
      fields: { fieldName: 'file' },
      acceptedTypes: ['image/*', 'video/*']
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to init upload', error: e.message });
  }
});

// POST /api/media/uploads/complete - persist metadata and return Media
router.post('/uploads/complete', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.url || !body.type) {
      return res.status(400).json({ success: false, message: 'url and type are required' });
    }
    const doc = await Media.create({
      user: req.user.id,
      url: body.url,
      type: body.type,
      name: body.name,
      status: 'ready',
      uploadedAt: new Date(),
      cloudinaryId: body.cloudinaryId || null,
      processedUrl: body.processedUrl || null,
      thumbnailUrl: body.thumbnailUrl || null,
      durationS: body.duration,
      width: body.width,
      height: body.height
    });
    return res.json({ success: true, item: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Failed to complete upload', error: e.message });
  }
});

// POST /api/media/webhook/cloudinary - validate and upsert media
router.post('/webhook/cloudinary', async (req, res) => {
  try {
    const signature = req.get('X-Cld-Signature') || req.get('x-cld-signature');
    const timestamp = req.get('X-Cld-Timestamp') || req.get('x-cld-timestamp');
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
    if (process.env.NODE_ENV === 'production') {
      if (!signature || !timestamp || !apiSecret) {
        return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
      }
      try {
        const hmac = crypto.createHmac('sha256', apiSecret).update(`${timestamp}.${rawBody}`).digest('hex');
        if (hmac !== signature) {
          return res.status(401).json({ success: false, message: 'Signature mismatch' });
        }
      } catch (e) {
        return res.status(401).json({ success: false, message: 'Signature verification failed' });
      }
    }
    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : (req.body || {});
    const publicId = payload?.public_id;
    const secureUrl = payload?.secure_url || payload?.url;
    const resourceType = payload?.resource_type || (payload?.duration ? 'video' : 'image');
    if (!publicId || !secureUrl) return res.json({ success: true });
    await Media.findOneAndUpdate(
      { cloudinaryId: publicId },
      {
        $set: {
          url: secureUrl,
          type: resourceType === 'video' ? 'video' : 'image',
          status: 'ready',
          thumbnailUrl: payload?.thumbnail_url || null,
          durationS: payload?.duration || undefined,
          width: payload?.width || undefined,
          height: payload?.height || undefined
        }
      },
      { upsert: true, new: true }
    );
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Webhook error' });
  }
});
// POST /api/media - create media item
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.url || !body.type) {
      return res.status(400).json({ success: false, message: 'url and type are required' });
    }
    const doc = await Media.create({
      user: req.user.id,
      url: body.url,
      type: body.type,
      name: body.name,
      status: body.status || 'ready',
      uploadedAt: body.uploadedAt || new Date(),
      cloudinaryId: body.cloudinaryId || null,
      processedUrl: body.processedUrl || null,
      thumbnailUrl: body.thumbnailUrl || null,
      durationS: body.durationS,
      width: body.width,
      height: body.height,
      trimStartS: body.trimStartS,
      trimEndS: body.trimEndS,
      speed: body.speed,
      volume: body.volume,
      fadeInS: body.fadeInS,
      fadeOutS: body.fadeOutS,
      coverAtS: body.coverAtS,
    });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to create media', error: e.message });
  }
});

// PATCH /api/media/:id - update media item (owner only)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body || {};
    const doc = await Media.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: patch },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Media not found' });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to update media', error: e.message });
  }
});

// DELETE /api/media/:id - soft delete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Media.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { $set: { deleted: true, status: 'deleted' } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Media not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Failed to delete media', error: e.message });
  }
});

module.exports = router;


