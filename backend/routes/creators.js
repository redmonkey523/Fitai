const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Coach = require('../models/Coach');

const router = express.Router();

// Cloudinary optional config
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Multer storage for local temp
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', 'creator');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (e) {
      cb(e);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ok = allowed.test((file.mimetype || '').toLowerCase()) || allowed.test((path.extname(file.originalname || '').toLowerCase() || ''));
  if (!ok) return cb(new Error('Only image files are allowed'));
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

// Helpers
const ensureCoach = async (userId) => {
  let coach = await Coach.findOne({ userId });
  if (!coach) coach = await Coach.create({ userId, verified: false });
  return coach;
};
// GET /creators/:id — public creator profile with enriched fields
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const coach = await Coach.findOne({ userId }).lean();
    if (!coach) return res.status(404).json({ success: false, message: 'Creator not found' });
    const User = require('../models/User');
    const Plan = require('../models/Plan');
    const user = await User.findById(userId).select('username firstName lastName profilePicture').lean();
    const programs = await Plan.find({ coachId: coach._id, isPublished: true }).select('name media price currency phases createdAt').sort({ createdAt: -1 }).limit(24).lean();
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username;
    const avatarUrl = typeof user?.profilePicture === 'string' ? user?.profilePicture : (user?.profilePicture?.url || coach?.profilePicture?.url || null);
    const bannerUrl = coach?.bannerImage?.url || null;
    const stats = { programs: programs.length, subscribers: coach?.followers || 0, posts: 0 };
    const links = { instagram: coach?.socialLinks?.instagram, youtube: coach?.socialLinks?.youtube, website: coach?.socialLinks?.website };
    return res.json({
      success: true,
      data: {
        user: { id: userId, displayName, username: user?.username },
        avatarUrl,
        bannerUrl,
        bio: coach?.bio || '',
        specialties: coach?.specialties || coach?.niches || [],
        certifications: coach?.certifications || [],
        programs: programs.map(p => ({ id: p._id, title: p.name, media: p.media, price: p.price, currency: p.currency, duration: p.phases?.length || 0 })),
        stats,
        links,
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load creator', error: e.message });
  }
});


// GET /creators/me — return full creator profile for logged-in user.
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const coach = await ensureCoach(req.user._id);
    res.json({ success: true, data: coach });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load creator profile', error: e.message });
  }
});

// PUT /creators/me — update text fields
router.put(
  '/me',
  authenticateToken,
  [
    body('bio').optional().isString().isLength({ max: 2000 }),
    body('specialties').optional().isArray({ max: 50 }),
    body('specialties.*').optional().isString().trim().isLength({ min: 1, max: 50 }),
    body('pricing').optional().isFloat({ min: 0 }),
    body('currency').optional().isString().isLength({ min: 3, max: 5 }),
    body('socialLinks').optional().isObject(),
    body('socialLinks.instagram').optional().isString().isLength({ max: 200 }),
    body('socialLinks.youtube').optional().isString().isLength({ max: 200 }),
    body('socialLinks.tiktok').optional().isString().isLength({ max: 200 }),
    body('socialLinks.website').optional().isString().isLength({ max: 500 }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const coach = await ensureCoach(req.user._id);
      const { bio, specialties, pricing, currency, socialLinks } = req.body || {};
      if (typeof bio !== 'undefined') coach.bio = bio;
      if (Array.isArray(specialties)) {
        // keep legacy niches for compatibility
        coach.specialties = specialties;
        coach.niches = specialties;
      }
      if (typeof pricing !== 'undefined') coach.pricing = pricing;
      if (typeof currency !== 'undefined') coach.currency = currency;
      if (socialLinks && typeof socialLinks === 'object') {
        coach.socialLinks = { ...coach.socialLinks, ...socialLinks };
      }
      await coach.save();
      res.json({ success: true, data: coach });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to update profile', error: e.message });
    }
  }
);

// Upload helper
async function handleImageUpload(localPath, folder) {
  let uploadResult = null;
  if (hasCloudinary) {
    uploadResult = await cloudinary.uploader.upload(localPath, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1600, height: 1600, crop: 'limit' },
        { quality: 'auto' },
        { format: 'webp' },
      ],
    });
    await fs.unlink(localPath).catch(() => {});
    return {
      url: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      thumbnail: uploadResult.secure_url,
      size: uploadResult.bytes,
    };
  }
  // Local fallback
  const fileName = path.basename(localPath);
  return {
    url: `/uploads/creator/${fileName}`,
    cloudinaryId: null,
    width: undefined,
    height: undefined,
    thumbnail: undefined,
  };
}

// POST /creators/me/avatar — upload and replace profile picture
router.post('/me/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const meta = await handleImageUpload(req.file.path, 'fitness-app/creator/avatar');
    if (meta && meta.url && !/^https?:\/\//i.test(meta.url)) {
      meta.url = `${req.protocol}://${req.get('host')}${meta.url}`;
    }
    const coach = await ensureCoach(req.user._id);
    coach.profilePicture = meta;
    await coach.save();
    res.json({ success: true, avatarUrl: meta.url, data: { profilePicture: meta } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to upload avatar', error: e.message });
  }
});

// POST /creators/me/banner — upload and replace banner image
router.post('/me/banner', authenticateToken, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const meta = await handleImageUpload(req.file.path, 'fitness-app/creator/banner');
    if (meta && meta.url && !/^https?:\/\//i.test(meta.url)) {
      meta.url = `${req.protocol}://${req.get('host')}${meta.url}`;
    }
    const coach = await ensureCoach(req.user._id);
    coach.bannerImage = meta;
    await coach.save();
    res.json({ success: true, bannerUrl: meta.url, data: { bannerImage: meta } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to upload banner', error: e.message });
  }
});

// POST /creators/me/certifications — add new certification
router.post(
  '/me/certifications',
  authenticateToken,
  [
    body('name').isString().trim().isLength({ min: 2, max: 200 }),
    body('issuer').optional().isString().isLength({ max: 200 }),
    body('credentialId').optional().isString().isLength({ max: 200 }),
    body('url').optional().isString().isLength({ max: 500 }),
    body('issuedAt').optional().isISO8601(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const coach = await ensureCoach(req.user._id);
      const toAdd = {
        name: req.body.name,
        issuer: req.body.issuer,
        credentialId: req.body.credentialId,
        url: req.body.url,
        issuedAt: req.body.issuedAt ? new Date(req.body.issuedAt) : undefined,
      };
      coach.certifications.push(toAdd);
      await coach.save();
      res.status(201).json({ success: true, data: coach.certifications[coach.certifications.length - 1] });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to add certification', error: e.message });
    }
  }
);

// DELETE /creators/me/certifications/:id — remove certification by ID
router.delete(
  '/me/certifications/:id',
  authenticateToken,
  [param('id').isString().isLength({ min: 1 })],
  handleValidation,
  async (req, res) => {
    try {
      const coach = await ensureCoach(req.user._id);
      const before = coach.certifications.length;
      coach.certifications = coach.certifications.filter((c) => String(c._id) !== String(req.params.id));
      if (coach.certifications.length === before) {
        return res.status(404).json({ success: false, message: 'Certification not found' });
      }
      await coach.save();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to remove certification', error: e.message });
    }
  }
);

module.exports = router;


