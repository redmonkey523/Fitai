const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// In-memory storage for now (replace with database model in production)
const sleepLogs = new Map();

// Validation middleware
const validateSleepLog = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('bedTime').isISO8601().withMessage('Valid bed time is required'),
  body('wakeTime').isISO8601().withMessage('Valid wake time is required'),
  body('quality').isInt({ min: 1, max: 5 }).withMessage('Quality must be between 1-5'),
  body('notes').optional().isString().isLength({ max: 500 }),
  body('interruptions').optional().isInt({ min: 0 }),
  body('feltRested').optional().isBoolean(),
  body('mood').optional().isIn(['poor', 'neutral', 'good', 'great']),
];

/**
 * @route   POST /api/sleep
 * @desc    Log a sleep session
 * @access  Private
 */
router.post('/', authenticateToken, validateSleepLog, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const userId = req.user._id.toString();
  const sleepData = {
    id: req.body.id || `sleep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    date: req.body.date,
    bedTime: req.body.bedTime,
    wakeTime: req.body.wakeTime,
    duration: req.body.duration || calculateDuration(req.body.bedTime, req.body.wakeTime),
    quality: req.body.quality,
    notes: req.body.notes || '',
    interruptions: req.body.interruptions || 0,
    feltRested: req.body.feltRested || false,
    mood: req.body.mood || 'neutral',
    source: req.body.source || 'manual',
    createdAt: new Date().toISOString(),
  };

  // Store sleep log
  if (!sleepLogs.has(userId)) {
    sleepLogs.set(userId, []);
  }
  
  const userLogs = sleepLogs.get(userId);
  
  // Check for existing log on same date
  const existingIndex = userLogs.findIndex(log => log.date === sleepData.date);
  if (existingIndex !== -1) {
    userLogs[existingIndex] = sleepData;
  } else {
    userLogs.push(sleepData);
  }
  
  // Sort by date
  userLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(201).json({
    success: true,
    message: 'Sleep logged successfully',
    data: sleepData,
  });
}));

/**
 * @route   GET /api/sleep
 * @desc    Get sleep logs for date range
 * @access  Private
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { startDate, endDate, limit = 30 } = req.query;

  let logs = sleepLogs.get(userId) || [];

  // Filter by date range if provided
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    logs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  }

  // Limit results
  logs = logs.slice(0, parseInt(limit));

  res.json({
    success: true,
    data: {
      logs,
      count: logs.length,
    },
  });
}));

/**
 * @route   GET /api/sleep/stats
 * @desc    Get sleep statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { days = 7 } = req.query;

  const logs = sleepLogs.get(userId) || [];
  
  // Get logs for specified period
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const periodLogs = logs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= startDate && logDate <= endDate;
  });

  if (periodLogs.length === 0) {
    return res.json({
      success: true,
      data: {
        averageDuration: 0,
        averageQuality: 0,
        totalSleep: 0,
        daysLogged: 0,
        sleepDebt: 8 * parseInt(days),
        consistency: 0,
        recoveryScore: 0,
      },
    });
  }

  // Calculate statistics
  const totalDuration = periodLogs.reduce((sum, log) => sum + log.duration, 0);
  const averageDuration = totalDuration / periodLogs.length;
  const averageQuality = periodLogs.reduce((sum, log) => sum + log.quality, 0) / periodLogs.length;
  
  const goalSleep = 8 * periodLogs.length;
  const sleepDebt = Math.max(0, goalSleep - totalDuration);

  // Calculate consistency
  const variance = periodLogs.reduce((sum, log) => {
    return sum + Math.pow(log.duration - averageDuration, 2);
  }, 0) / periodLogs.length;
  const consistency = Math.max(0, 100 - Math.sqrt(variance) * 10);

  // Calculate recovery score
  const durationScore = Math.min(40, (averageDuration / 8) * 40);
  const qualityScore = (averageQuality / 5) * 30;
  const consistencyScore = (consistency / 100) * 20;
  const debtPenalty = Math.min(10, (sleepDebt / 8) * 10);
  const recoveryScore = Math.max(0, Math.min(100, durationScore + qualityScore + consistencyScore - debtPenalty));

  res.json({
    success: true,
    data: {
      averageDuration,
      averageQuality,
      totalSleep: totalDuration,
      daysLogged: periodLogs.length,
      sleepDebt,
      consistency,
      recoveryScore,
      logs: periodLogs,
    },
  });
}));

/**
 * @route   PUT /api/sleep/:id
 * @desc    Update a sleep log
 * @access  Private
 */
router.put('/:id', authenticateToken, validateSleepLog, asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const logs = sleepLogs.get(userId) || [];
  const index = logs.findIndex(log => log.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Sleep log not found',
    });
  }

  // Update log
  logs[index] = {
    ...logs[index],
    ...req.body,
    id,
    userId,
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    message: 'Sleep log updated',
    data: logs[index],
  });
}));

/**
 * @route   DELETE /api/sleep/:id
 * @desc    Delete a sleep log
 * @access  Private
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { id } = req.params;

  const logs = sleepLogs.get(userId) || [];
  const index = logs.findIndex(log => log.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Sleep log not found',
    });
  }

  logs.splice(index, 1);

  res.json({
    success: true,
    message: 'Sleep log deleted',
  });
}));

// Helper function
function calculateDuration(bedTime, wakeTime) {
  const start = new Date(bedTime);
  const end = new Date(wakeTime);
  const durationMs = end - start;
  return durationMs / (1000 * 60 * 60); // hours
}

module.exports = router;


