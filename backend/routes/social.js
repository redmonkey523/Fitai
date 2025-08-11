const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const { Post, Challenge } = require('../models/Social');
const { Notification } = require('../models/Notification');

// GET /api/social/feed - Get social activity feed
router.get('/feed', async (req, res) => {
  try {
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
        .populate('author', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ author: { $in: authorIds } })
    ]);

    const activities = items.map(p => ({
      id: p._id,
      user: {
        id: p.author._id,
        firstName: p.author.firstName,
        lastName: p.author.lastName,
        profilePicture: p.author.profilePicture || null
      },
      type: p.type,
      title: p.title,
      content: p.content,
      media: p.media,
      tags: p.tags,
      likeCount: p.likes?.length || 0,
      commentCount: p.comments?.length || 0,
      createdAt: p.createdAt
    }));

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

// POST /api/social/activity - Create new social activity
router.post('/activity', async (req, res) => {
  try {
    const { type = 'general', title = '', content, media = [], tags = [], visibility = 'friends' } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const post = await Post.create({
      author: req.user.id,
      type,
      title: title?.trim() || undefined,
      content: content.trim(),
      media,
      tags,
      visibility
    });

    await post.populate('author', 'firstName lastName profilePicture');

    res.status(201).json({
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
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating activity',
      error: error.message
    });
  }
});

// GET /api/social/challenges - Get available challenges
router.get('/challenges', async (req, res) => {
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
router.post('/challenges/:challengeId/join', async (req, res) => {
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
router.get('/challenges/:challengeId/progress', async (req, res) => {
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
router.get('/leaderboard', async (req, res) => {
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
router.post('/activity/:activityId/like', async (req, res) => {
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
router.post('/activity/:activityId/comment', async (req, res) => {
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
router.get('/activity/:activityId/comments', async (req, res) => {
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
router.get('/notifications', async (req, res) => {
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
router.put('/notifications/:notificationId/read', async (req, res) => {
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
router.put('/notifications/read-all', async (req, res) => {
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
