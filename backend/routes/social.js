const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');
const User = require('../models/User');
const { Post, Challenge } = require('../models/Social');
const { Notification } = require('../models/Notification');

// Feature flag check - disable social endpoints when FEATURE_FEED=false
const FEATURE_FEED = process.env.FEATURE_FEED !== 'false';

// Middleware to check if social features are enabled
const checkSocialFeature = (req, res, next) => {
  if (!FEATURE_FEED) {
    return res.status(503).json({
      success: false,
      message: 'Social features are temporarily disabled',
      error: 'FEATURE_DISABLED'
    });
  }
  next();
};

// Simple in-memory fallback when MongoDB is unavailable
const useMemoryStore = process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState !== 1;
const memoryStore = {
  posts: [],
};

// GET /api/social/feed - Get social activity feed
// Contract alignment: materialize author identity { id, displayName, username, avatarUrl, badges{coach,verified} }
router.get('/feed', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    if (useMemoryStore) {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
      const skip = (page - 1) * limit;
      const sorted = memoryStore.posts.slice().sort((a, b) => b.createdAt - a.createdAt);
      const items = sorted.slice(skip, skip + limit);
      const activities = items.map(p => ({
        id: p.id,
        user: {
          id: req.user.id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profilePicture: req.user.profilePicture || null,
        },
        type: p.type,
        title: p.title,
        content: p.content,
        media: p.media,
        tags: p.tags,
        likeCount: Array.isArray(p.likes) ? p.likes.length : 0,
        commentCount: Array.isArray(p.comments) ? p.comments.length : 0,
        createdAt: new Date(p.createdAt)
      }));
      return res.json({ success: true, data: { activities, pagination: { page, limit, total: memoryStore.posts.length, pages: Math.ceil(memoryStore.posts.length / limit) } } });
    }

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id).select('_id friends');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const authorIds = [...user.friends.map(id => id), user._id];
    const [items, total] = await Promise.all([
      Post.find({ author: { $in: authorIds } })
        .populate('author', 'username firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments({ author: { $in: authorIds } })
    ]);

    // Optionally load coach/verified badge for authors
    const Coach = require('../models/Coach');
    const authorIdSet = Array.from(new Set(items.map(p => String(p.author?._id || p.author))));
    const coachDocs = await Coach.find({ userId: { $in: authorIdSet } }).select('userId verified').lean();
    const coachVerifiedByUserId = new Map(coachDocs.map(c => [String(c.userId), Boolean(c.verified)]));

    const activities = items.map(p => {
      const author = p.author || {};
      // Build avatar URL
      const avatar = author.profilePicture || null;
      const avatarUrl = typeof avatar === 'string' ? avatar : (avatar?.url || null);
      const displayName = [author.firstName, author.lastName].filter(Boolean).join(' ').trim() || author.username || 'User';
      const verified = coachVerifiedByUserId.get(String(author._id)) || false;
      return {
        id: p._id,
        author: {
          id: author._id,
          displayName,
          username: author.username || null,
          avatarUrl: avatarUrl,
          badges: { coach: verified, verified }
        },
        type: p.type,
        title: p.title,
        caption: p.content,
        content: p.content,
        media: p.media,
        location: p.location?.address || null,
        tags: p.tags,
        likeCount: Array.isArray(p.likes) ? p.likes.length : 0,
        commentCount: Array.isArray(p.comments) ? p.comments.length : 0,
        createdAt: p.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching social feed',
      error: error.message
    });
  }
});

// GET /api/social/explore - Public discover feed with trending algorithm
router.get('/explore', checkSocialFeature, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const sort = 'trending'; // force trending only
    const skip = (page - 1) * limit;

    // Only public posts are shown in explore
    const baseQuery = { visibility: { $in: ['public', undefined] } };
    // Optionally respect client opt-out: if shareToDiscover=false we exclude
    const shareOpt = String(req.query.share ?? 'any'); // any | discover_only
    const shareFilter = shareOpt === 'discover_only' ? { 'options.shareToDiscover': { $ne: false } } : {};

    const total = await Post.countDocuments({ ...baseQuery, ...shareFilter });
    let posts = await Post.find({ ...baseQuery, ...shareFilter })
      .populate('author', 'firstName lastName profilePicture')
      .lean();

    const now = Date.now();
    const halfLifeDays = 2; // make recency matter like IG explore
    const ln2 = Math.log(2);

    const scoreOf = (p) => {
      const likeCount = Array.isArray(p.likes) ? p.likes.length : (p.likeCount || 0);
      const commentCount = Array.isArray(p.comments) ? p.comments.length : (p.commentCount || 0);
      const ageDays = Math.max(0, (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const decay = Math.exp(-ln2 * (ageDays / halfLifeDays));
      // Log-scaled engagement + time decay
      const likeScore = Math.log10(likeCount + 1) * 40; // 0..~80
      const commentScore = Math.log10(commentCount + 1) * 60; // comments weigh more
      return (likeScore + commentScore) * (0.5 + 0.5 * decay);
    };

    posts = posts
      .map(p => ({ ...p, _score: scoreOf(p) }))
      .sort((a, b) => (b._score - a._score));

    const slice = posts.slice(skip, skip + limit).map(p => ({
      id: p._id,
      user: {
        id: p.author?._id,
        firstName: p.author?.firstName,
        lastName: p.author?.lastName,
        profilePicture: p.author?.profilePicture || null,
      },
      type: p.type,
      title: p.title,
      content: p.content,
      media: p.media,
      tags: p.tags,
      likeCount: Array.isArray(p.likes) ? p.likes.length : (p.likeCount || 0),
      commentCount: Array.isArray(p.comments) ? p.comments.length : (p.commentCount || 0),
      createdAt: p.createdAt,
      score: typeof p._score === 'number' ? Number(p._score.toFixed(2)) : undefined,
    }));

    return res.json({
      success: true,
      data: {
        activities: slice,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        sort,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching explore feed', error: error.message });
  }
});

// POST /api/social/activity - Create new social activity
router.post('/activity', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const { type = 'general', title = '', content = '', media = [], tags = [], visibility = 'public', options = {} } = req.body;
    try {
      const debugMediaCount = Array.isArray(media) ? media.length : 0;
      console.log('[POST /social/activity] Incoming', {
        hasContent: typeof content === 'string' && content.trim().length > 0,
        contentPreview: typeof content === 'string' ? content.slice(0, 60) : null,
        mediaCount: debugMediaCount,
        types: Array.isArray(media) ? media.map(m => m?.type).slice(0, 3) : [],
      });
    } catch {}
    // Normalize content: if caption is empty but media exists, synthesize a default
    const hasMediaArray = Array.isArray(media) && media.length > 0;
    const normalizedContent = (typeof content === 'string' && content.trim().length > 0)
      ? content.trim()
      : (hasMediaArray ? 'Shared a photo' : '');
    // Allow media-only posts: backend will still reject if neither present via model validator (Mongo path)

    // Development-first: in-memory store for reliability unless DB is explicitly enabled
    if ((normalizedContent.length === 0) && (!Array.isArray(media) || media.length === 0)) {
      return res.status(400).json({ success: false, message: 'Content or media is required' });
    }
    const userId = req.user?._id || req.user?.id;
    const doc = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      author: userId,
      type,
      title: title?.trim() || undefined,
      content: normalizedContent,
      media,
      tags,
      visibility,
      options,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    };
    if (String(process.env.SOCIAL_ENABLE_DB).toLowerCase() !== 'true') {
      memoryStore.posts.push(doc);
      return res.status(201).json({
        success: true,
        message: 'Activity posted successfully',
        data: {
          id: doc.id,
          user: {
            id: userId,
            firstName: req.user?.firstName || 'User',
            lastName: req.user?.lastName || '',
            profilePicture: req.user?.profilePicture || null
          },
          type: doc.type,
          title: doc.title,
          content: doc.content,
          media: doc.media,
          tags: doc.tags,
          likeCount: 0,
          commentCount: 0,
          createdAt: new Date(doc.createdAt)
        }
      });
    }

    try {
      const post = await Post.create({
        author: req.user.id,
        type,
        title: title?.trim() || undefined,
        content: normalizedContent,
        media,
        tags,
        visibility,
        options
      });

      await post.populate('author', 'firstName lastName profilePicture');

      return res.status(201).json({
        success: true,
        message: 'Activity posted successfully',
        data: {
          id: post._id,
          user: {
            id: post.author._id,
            firstName: post.author.firstName,
            lastName: post.author.lastName,
            profilePicture: post.author.profilePicture || null
          },
          type: post.type,
          title: post.title,
          content: post.content,
          media: post.media,
          tags: post.tags,
          likeCount: 0,
          commentCount: 0,
          createdAt: post.createdAt
        }
      });
    } catch (dbErr) {
      // Fallback to in-memory doc on any DB error (dev resilience)
      console.warn('Post.create failed, using in-memory fallback:', dbErr?.message);
      // Ensure media objects are minimally valid for feed rendering
      const safeMedia = Array.isArray(media)
        ? media.map(m => ({ type: m?.type === 'video' ? 'video' : 'image', url: String(m?.url || ''), thumbnail: m?.thumbnail || undefined }))
            .filter(m => m.url)
        : [];
      const doc = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        author: req.user.id,
        type,
        title: title?.trim() || undefined,
        content: normalizedContent,
        media,
        tags,
        visibility,
        options,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      };
      memoryStore.posts.push(doc);
      return res.status(201).json({
        success: true,
        message: 'Activity posted successfully',
        data: {
          id: doc.id,
          user: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            profilePicture: req.user.profilePicture || null,
          },
          type: doc.type,
          title: doc.title,
          content: doc.content,
        media: doc.media,
          tags: doc.tags,
          likeCount: 0,
          commentCount: 0,
          createdAt: new Date(doc.createdAt),
        },
      });
    }
  } catch (error) {
    // Provide structured validation errors for the client
    if (error && (error.name === 'ValidationError' || /validation/i.test(error?.message || ''))) {
      const errors = error.errors ? Object.values(error.errors).map(e => e.message) : [error.message];
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    const msg = error?.message || '';
    res.status(500).json({ success: false, message: 'Error creating activity', error: msg });
  }
});

// GET /api/social/challenges - Get available challenges
router.get('/challenges', checkSocialFeature, async (req, res) => {
  try {
    const status = String(req.query.status || 'active');
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));

    let results;
    if (status === 'active') {
      results = await Challenge.findActive().limit(limit);
    } else {
      results = await Challenge.find({ status }).sort({ createdAt: -1 }).limit(limit).populate('creator', 'firstName lastName profilePicture');
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching challenges',
      error: error.message
    });
  }
});

// POST /api/social/challenges/:challengeId/join - Join a challenge
router.post('/challenges/:challengeId/join', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    await challenge.addParticipant(req.user.id);
    res.json({ success: true, message: 'Successfully joined challenge' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error joining challenge',
      error: error.message
    });
  }
});

// GET /api/social/challenges/:challengeId/progress - Get challenge progress
router.get('/challenges/:challengeId/progress', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    const participant = challenge.participants.find(p => p.user.equals(req.user.id));
    res.json({ success: true, data: participant || { user: req.user.id, progress: { currentValue: 0, completed: false } } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching challenge progress',
      error: error.message
    });
  }
});

// GET /api/social/leaderboard - Get leaderboard
router.get('/leaderboard', checkSocialFeature, async (req, res) => {
  try {
    const type = String(req.query.type || 'overall');
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));

    // Use user.stats fields if available
    const users = await User.find({}).select('firstName lastName profilePicture stats').lean();
    const scored = users.map(u => ({
      user: {
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        profilePicture: u.profilePicture || null
      },
      score:
        (type === 'overall' && (u.stats?.totalWorkouts || 0) + (u.stats?.currentStreak || 0)) ||
        (type === 'workouts' && (u.stats?.totalWorkouts || 0)) ||
        (type === 'streak' && (u.stats?.currentStreak || 0)) || 0,
      metric: type
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, idx) => ({ rank: idx + 1, ...entry }));

    res.json({ success: true, data: { type, leaderboard: scored } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

// POST /api/social/activity/:activityId/like - Like an activity
router.post('/activity/:activityId/like', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const post = await Post.findById(activityId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    await post.addLike(req.user.id);
    res.json({ success: true, message: 'Activity liked successfully', data: { activityId, liked: true, likesCount: post.likes.length } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error liking activity',
      error: error.message
    });
  }
});

// POST /api/social/activity/:activityId/comment - Comment on an activity
router.post('/activity/:activityId/comment', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }
    const post = await Post.findById(activityId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    post.comments.push({ user: req.user.id, content: content.trim() });
    await post.save();
    const created = post.comments[post.comments.length - 1];
    res.status(201).json({ success: true, message: 'Comment added successfully', data: { id: created._id, content: created.content, createdAt: created.createdAt } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
});

// GET /api/social/activity/:activityId/comments - Get activity comments
router.get('/activity/:activityId/comments', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const post = await Post.findById(activityId)
      .populate('comments.user', 'firstName lastName profilePicture');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const total = post.comments.length;
    const slice = post.comments
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + limit)
      .map(c => ({
        id: c._id,
        user: {
          id: c.user?._id || null,
          firstName: c.user?.firstName || 'Unknown',
          lastName: c.user?.lastName || '',
          profilePicture: c.user?.profilePicture || null
        },
        content: c.content,
        createdAt: c.createdAt
      }));

    res.json({ success: true, data: { comments: slice, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
});

// GET /api/social/notifications - Get user notifications
router.get('/notifications', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: req.user.id }),
      Notification.countDocuments({ recipient: req.user.id, read: false })
    ]);

    res.json({
      success: true,
      data: {
        notifications: items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// PUT /api/social/notifications/:notificationId/read - Mark notification as read
router.put('/notifications/:notificationId/read', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const n = await Notification.findOne({ _id: notificationId, recipient: req.user.id });
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    await n.markAsRead();
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// PUT /api/social/notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', checkSocialFeature, authenticateToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true, readAt: new Date(), status: 'read' }
    );
    res.json({ success: true, message: 'All notifications marked as read', data: { updatedCount: result.modifiedCount } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message
    });
  }
});

module.exports = router;
