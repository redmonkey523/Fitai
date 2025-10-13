const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const Media = require('../models/Media');
const mm = require('mime-types');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary (optional in dev)
const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  // Fail fast in production if storage is not configured
  if (process.env.NODE_ENV === 'production') {
    console.error('Cloudinary not configured in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
  } else {
    console.warn('Cloudinary not configured; falling back to local uploads.');
  }
}

// In production, Cloudinary must be configured
const requireCloudinaryInProd = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !hasCloudinary) {
    return res.status(500).json({ success: false, message: 'Cloudinary is required in production' });
  }
  return next();
};

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', file.fieldname);
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter (allow by extension OR mimetype; browsers sometimes omit mimetype)
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv/;
  const ext = (path.extname(file.originalname || '').toLowerCase() || '').replace('.', '');
  const okByExt = allowed.test(ext);
  const okByMime = allowed.test((file.mimetype || '').toLowerCase());
  if (okByExt || okByMime) return cb(null, true);
  return cb(new Error('Only image and video files are allowed!'), false);
};

// Configure multer
const maxUploadMb = parseInt(process.env.MAX_UPLOAD_MB || '200', 10); // default 200MB
const maxUploadFiles = parseInt(process.env.MAX_UPLOAD_FILES || '5', 10);
const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxUploadMb * 1024 * 1024,
    files: maxUploadFiles
  },
  fileFilter: fileFilter
});

// Upload single file
router.post('/single', authenticateToken, requireCloudinaryInProd, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const fileType = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype || mm.lookup(file.originalname) || '';
    const isImage = /\.(jpeg|jpg|png|gif|webp)$/.test(fileType) || (mime.startsWith('image/'));
    const isVideo = /\.(mp4|mov|avi|mkv)$/.test(fileType) || (mime.startsWith('video/'));

    let uploadResult;
    let fileUrl;

    // Upload to Cloudinary if available; otherwise stay local
    if (hasCloudinary) {
      try {
        if (isImage) {
          uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'fitness-app/images',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto' }
            ]
          });
        } else if (isVideo) {
          uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'fitness-app/videos',
            resource_type: 'video',
            transformation: [
              { width: 640, height: 480, crop: 'limit' },
              { quality: 'auto' }
            ]
          });
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local file:', cloudErr?.message);
        uploadResult = null;
      }
    }

    // Delete local temp file after upload to Cloudinary; keep for local hosting otherwise
    if (uploadResult) {
      await fs.unlink(file.path);
    }

    if (uploadResult) {
      fileUrl = uploadResult.secure_url;
    } else {
      // Fallback to local URL if Cloudinary fails
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.fieldname}/${file.filename}`;
    }

    // Build basic metadata
    const meta = {
      type: isVideo ? 'video' : 'image',
      width: uploadResult?.width || undefined,
      height: uploadResult?.height || undefined,
      duration: isVideo ? uploadResult?.duration : undefined,
      thumbnail: isVideo && uploadResult?.secure_url ? cloudinary.url(uploadResult.public_id, { resource_type: 'video', format: 'jpg', transformation: [ { width: 640, height: 360, crop: 'fill' } ] }) : undefined,
    };

    // Persist Media doc for user's library
    let mediaDoc = null;
    try {
      mediaDoc = await Media.create({
        user: req.user.id,
        url: fileUrl,
        type: isVideo ? 'video' : 'image',
        name: file.originalname,
        status: 'ready',
        uploadedAt: new Date(),
        cloudinaryId: uploadResult?.public_id || null,
        thumbnailUrl: meta?.thumbnail || null,
        durationS: meta?.duration,
        width: meta?.width,
        height: meta?.height,
      });
    } catch (e) {
      // non-fatal
    }

    return res.json({
      success: true,
      file: {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: fileUrl,
        cloudinaryId: uploadResult?.public_id || null,
        ...meta
      },
      asset: {
        type: isVideo ? 'video' : 'image',
        src: fileUrl,
        width: meta?.width,
        height: meta?.height,
        poster: meta?.thumbnail || undefined,
      },
      media: mediaDoc ? { id: mediaDoc._id, url: mediaDoc.url, type: mediaDoc.type } : null,
    });
  } catch (error) {
    console.error('Upload error:', error);
    // If anything failed after multer processed the file, ensure temp file is cleaned up
    try { if (req?.file?.path) { await fs.unlink(req.file.path); } } catch {}
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Upload multiple files
router.post('/multiple', authenticateToken, requireCloudinaryInProd, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const fileType = path.extname(file.originalname).toLowerCase();
      const isImage = /\.(jpeg|jpg|png|gif|webp)$/.test(fileType);
      const isVideo = /\.(mp4|mov|avi|mkv)$/.test(fileType);

      let uploadResult;
      let fileUrl;

      // Upload to Cloudinary
      if (isImage) {
        uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'fitness-app/images',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
      } else if (isVideo) {
        uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: 'fitness-app/videos',
          resource_type: 'video',
          transformation: [
            { width: 640, height: 480, crop: 'limit' },
            { quality: 'auto' }
          ]
        });
      }

      // Delete local file after upload
      await fs.unlink(file.path);

      if (uploadResult) {
        fileUrl = uploadResult.secure_url;
      } else {
        // Fallback to local URL if Cloudinary fails
        fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.fieldname}/${file.filename}`;
      }

      const out = {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        url: fileUrl,
        cloudinaryId: uploadResult?.public_id || null
      };
      try {
        const doc = await Media.create({
          user: req.user.id,
          url: out.url,
          type: isVideo ? 'video' : 'image',
          name: out.originalName,
          status: 'ready',
          uploadedAt: new Date(),
          cloudinaryId: out.cloudinaryId,
        });
        out.mediaId = doc._id;
      } catch {}
      uploadedFiles.push(out);
    }

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    });
  }
});

// Upload profile picture
router.post('/profile-picture', authenticateToken, requireCloudinaryInProd, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No profile picture uploaded'
      });
    }

    const file = req.file;
    const fileType = path.extname(file.originalname).toLowerCase();
    
    if (!/\.(jpeg|jpg|png|gif|webp)$/.test(fileType)) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed for profile pictures'
      });
    }

    // Upload to Cloudinary with profile picture transformations
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'fitness-app/profile-pictures',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { format: 'webp' }
      ]
    });

    // Delete local file after upload
    await fs.unlink(file.path);

    const response = {
      success: true,
      profilePicture: {
        url: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        size: file.size
      }
    };
    try {
      await Media.create({
        user: req.user.id,
        url: uploadResult.secure_url,
        type: 'image',
        name: file.originalname,
        status: 'ready',
        uploadedAt: new Date(),
        cloudinaryId: uploadResult.public_id,
        width: 400,
        height: 400,
        thumbnailUrl: uploadResult.secure_url,
      });
    } catch {}
    res.json(response);
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile picture',
      error: error.message
    });
  }
});

// Upload progress photos
router.post('/progress-photos', authenticateToken, requireCloudinaryInProd, upload.array('photos', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No progress photos uploaded'
      });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const fileType = path.extname(file.originalname).toLowerCase();
      
      if (!/\.(jpeg|jpg|png|gif|webp)$/.test(fileType)) {
        await fs.unlink(file.path);
        continue;
      }

      // Upload to Cloudinary with progress photo transformations
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'fitness-app/progress-photos',
        resource_type: 'image',
        transformation: [
          { width: 600, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { format: 'webp' }
        ]
      });

      // Delete local file after upload
      await fs.unlink(file.path);

      const out = {
        originalName: file.originalname,
        url: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        size: file.size
      };
      try {
        const doc = await Media.create({
          user: req.user.id,
          url: out.url,
          type: 'image',
          name: out.originalName,
          status: 'ready',
          uploadedAt: new Date(),
          cloudinaryId: out.cloudinaryId,
          width: 600,
          height: 800,
          thumbnailUrl: out.url,
        });
        out.mediaId = doc._id;
      } catch {}
      uploadedPhotos.push(out);
    }

    res.json({
      success: true,
      photos: uploadedPhotos,
      count: uploadedPhotos.length
    });
  } catch (error) {
    console.error('Progress photos upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading progress photos',
      error: error.message
    });
  }
});

// Upload workout video
router.post('/workout-video', authenticateToken, requireCloudinaryInProd, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No workout video uploaded'
      });
    }

    const file = req.file;
    const fileType = path.extname(file.originalname).toLowerCase();
    
    if (!/\.(mp4|mov|avi|mkv)$/.test(fileType)) {
      await fs.unlink(file.path);
      return res.status(400).json({
        success: false,
        message: 'Only video files are allowed for workout videos'
      });
    }

    // Upload to Cloudinary with video transformations
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: 'fitness-app/workout-videos',
      resource_type: 'video',
      transformation: [
        { width: 640, height: 480, crop: 'limit' },
        { quality: 'auto' },
        { format: 'mp4' }
      ]
    });

    // Delete local file after upload
    await fs.unlink(file.path);

    const response = {
      success: true,
      video: {
        originalName: file.originalname,
        url: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        size: file.size,
        duration: uploadResult.duration,
        thumbnail: uploadResult.thumbnail_url
      }
    };
    try {
      await Media.create({
        user: req.user.id,
        url: uploadResult.secure_url,
        type: 'video',
        name: file.originalname,
        status: 'ready',
        uploadedAt: new Date(),
        cloudinaryId: uploadResult.public_id,
        durationS: uploadResult.duration,
        thumbnailUrl: uploadResult.thumbnail_url,
      });
    } catch {}
    res.json(response);
  } catch (error) {
    console.error('Workout video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading workout video',
      error: error.message
    });
  }
});

// Optional processing route using Cloudinary transformations
router.post('/process-clip', authenticateToken, async (req, res) => {
  try {
    if (!hasCloudinary) {
      return res.status(400).json({ success: false, message: 'Cloud processing not configured' });
    }
    const { cloudinaryId, trimStartS, trimEndS, muted, speed, coverAtS, brightness, contrast, hue } = req.body || {};
    if (!cloudinaryId) {
      return res.status(400).json({ success: false, message: 'cloudinaryId is required' });
    }
    const transformation = [];
    if (trimStartS) transformation.push({ start_offset: Number(trimStartS) });
    if (trimEndS) transformation.push({ end_offset: Number(trimEndS) });
    if (speed && Number(speed) !== 1) transformation.push({ effect: `accelerate:${Math.round((Number(speed) - 1) * 100)}` });
    if (muted) transformation.push({ audio_codec: 'none' });
    // Color adjustments (Cloudinary effects). Values roughly mapped from 0..100 UI
    const toDelta = (v) => Math.max(-50, Math.min(50, Math.round(Number(v || 0) - 50))); // center at 0
    if (typeof brightness !== 'undefined') transformation.push({ effect: `brightness:${toDelta(brightness)}` });
    if (typeof contrast !== 'undefined') transformation.push({ effect: `contrast:${toDelta(contrast)}` });
    if (typeof hue !== 'undefined') {
      // Map 0..360 to -100..100 which is Cloudinary hue range
      const h = Math.max(-100, Math.min(100, Math.round(((Number(hue) % 360) / 360) * 200 - 100)));
      transformation.push({ effect: `hue:${h}` });
    }

    const result = await cloudinary.uploader.explicit(cloudinaryId, {
      type: 'upload',
      resource_type: 'video',
      eager: [ transformation.length ? transformation : {} ],
      eager_async: false,
    });

    const derived = result?.eager?.[0];
    const processedUrl = derived?.secure_url || result?.secure_url;

    let thumbnailUrl = null;
    if (typeof coverAtS !== 'undefined' && coverAtS !== null) {
      const thumb = cloudinary.url(cloudinaryId, {
        resource_type: 'video',
        type: 'upload',
        secure: true,
        transformation: [
          { start_offset: Number(coverAtS) },
          { width: 640, height: 360, crop: 'fill' },
          { format: 'jpg' },
        ]
      });
      thumbnailUrl = thumb;
    }

    return res.json({ success: true, processedUrl, thumbnailUrl, publicId: result?.public_id });
  } catch (e) {
    console.error('process-clip error', e);
    return res.status(500).json({ success: false, message: 'Processing failed', error: e?.message });
  }
});

// Delete file from Cloudinary
router.delete('/delete/:cloudinaryId', authenticateToken, async (req, res) => {
  try {
    const { cloudinaryId } = req.params;
    const { resourceType = 'image' } = req.query;

    if (!cloudinaryId) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary ID is required'
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(cloudinaryId, {
      resource_type: resourceType
    });

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Get upload statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // This would typically query your database for user's upload statistics
    const stats = {
      totalUploads: 0,
      totalSize: 0,
      imagesCount: 0,
      videosCount: 0,
      profilePicturesCount: 0,
      progressPhotosCount: 0,
      workoutVideosCount: 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting upload statistics',
      error: error.message
    });
  }
});

// Serve static files (fallback for local storage)
router.get('/uploads/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', folder, filename);
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  });
});

module.exports = router;
