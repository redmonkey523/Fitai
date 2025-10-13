const express = require('express');
const { body, validationResult } = require('express-validator');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateProgressEntry = [
  body('type')
    .isIn(['weight', 'measurements', 'body_fat', 'progress_photo', 'fitness_test'])
    .withMessage('Please provide a valid progress type'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Value must be a positive number'),
  body('unit')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Unit must be between 1 and 10 characters'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('photo')
    .optional()
    .isObject()
    .withMessage('Photo must be an object'),
  body('measurements')
    .optional()
    .isObject()
    .withMessage('Measurements must be an object'),
];

// @route   POST /api/progress/entries
// @desc    Add a new progress entry
// @access  Private
router.post('/entries', validateProgressEntry, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const entryData = {
    ...req.body,
    userId: req.user._id,
    recordedAt: req.body.recordedAt || new Date()
  };

  const entry = await Progress.create(entryData);

  // Update user's latest progress
  await updateUserProgress(req.user._id, entry);

  res.status(201).json({
    success: true,
    message: 'Progress entry added successfully',
    data: { entry }
  });
}));

// @route   GET /api/progress/entries
// @desc    Get user's progress entries with filtering and pagination
// @access  Private
router.get('/entries', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    startDate,
    endDate,
    sortBy = 'recordedAt',
    sortOrder = 'desc'
  } = req.query;

  const filter = { userId: req.user._id };

  // Apply filters
  if (type) filter.type = type;
  if (startDate && endDate) {
    filter.recordedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const entries = await Progress.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Progress.countDocuments(filter);

  res.json({
    success: true,
    data: {
      entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// @route   GET /api/progress/entries/:id
// @desc    Get specific progress entry
// @access  Private
router.get('/entries/:id', asyncHandler(async (req, res) => {
  const entry = await Progress.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Progress entry not found'
    });
  }

  res.json({
    success: true,
    data: { entry }
  });
}));

// @route   PUT /api/progress/entries/:id
// @desc    Update progress entry
// @access  Private
router.put('/entries/:id', validateProgressEntry, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const entry = await Progress.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user._id
    },
    req.body,
    { new: true, runValidators: true }
  );

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Progress entry not found'
    });
  }

  // Recalculate user's progress
  await recalculateUserProgress(req.user._id);

  res.json({
    success: true,
    message: 'Progress entry updated successfully',
    data: { entry }
  });
}));

// @route   DELETE /api/progress/entries/:id
// @desc    Delete progress entry
// @access  Private
router.delete('/entries/:id', asyncHandler(async (req, res) => {
  const entry = await Progress.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!entry) {
    return res.status(404).json({
      success: false,
      message: 'Progress entry not found'
    });
  }

  // Recalculate user's progress
  await recalculateUserProgress(req.user._id);

  res.json({
    success: true,
    message: 'Progress entry deleted successfully'
  });
}));

// @route   GET /api/progress/summary
// @desc    Get progress summary and trends
// @access  Private
router.get('/summary', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const entries = await Progress.find({
    userId: req.user._id,
    recordedAt: { $gte: startDate }
  }).sort({ recordedAt: 1 });

  // Group by type
  const progressByType = {};
  entries.forEach(entry => {
    if (!progressByType[entry.type]) {
      progressByType[entry.type] = [];
    }
    progressByType[entry.type].push(entry);
  });

  // Calculate trends
  const trends = {};
  Object.keys(progressByType).forEach(type => {
    const typeEntries = progressByType[type];
    if (typeEntries.length >= 2) {
      const first = typeEntries[0];
      const last = typeEntries[typeEntries.length - 1];
      const change = last.value - first.value;
      const changePercent = first.value > 0 ? (change / first.value) * 100 : 0;
      
      trends[type] = {
        startValue: first.value,
        endValue: last.value,
        change,
        changePercent,
        direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable',
        entries: typeEntries.length
      };
    }
  });

  // Get user's goals
  const user = await User.findById(req.user._id);
  const goals = user.progressGoals || {};

  res.json({
    success: true,
    data: {
      trends,
      goals,
      totalEntries: entries.length,
      period: parseInt(period),
      progressByType
    }
  });
}));

// @route   GET /api/progress/weight
// @desc    Get weight progress specifically
// @access  Private
router.get('/weight', asyncHandler(async (req, res) => {
  const { period = '90' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const weightEntries = await Progress.find({
    userId: req.user._id,
    type: 'weight',
    recordedAt: { $gte: startDate }
  }).sort({ recordedAt: 1 });

  // Calculate weight statistics
  const weights = weightEntries.map(entry => entry.value);
  const currentWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const startWeight = weights.length > 0 ? weights[0] : null;
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;
  const averageWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : null;

  // Calculate change
  const weightChange = currentWeight && startWeight ? currentWeight - startWeight : null;
  const weightChangePercent = weightChange && startWeight ? (weightChange / startWeight) * 100 : null;

  // Get user's weight goal
  const user = await User.findById(req.user._id);
  const weightGoal = user.progressGoals?.weight;

  res.json({
    success: true,
    data: {
      entries: weightEntries,
      currentWeight,
      startWeight,
      minWeight,
      maxWeight,
      averageWeight,
      weightChange,
      weightChangePercent,
      weightGoal,
      progressToGoal: weightGoal && currentWeight ? ((startWeight - currentWeight) / (startWeight - weightGoal)) * 100 : null
    }
  });
}));

// @route   GET /api/progress/measurements
// @desc    Get body measurements progress
// @access  Private
router.get('/measurements', asyncHandler(async (req, res) => {
  const { period = '90' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const measurementEntries = await Progress.find({
    userId: req.user._id,
    type: 'measurements',
    recordedAt: { $gte: startDate }
  }).sort({ recordedAt: 1 });

  // Group measurements by body part
  const measurementsByPart = {};
  measurementEntries.forEach(entry => {
    if (entry.measurements) {
      Object.keys(entry.measurements).forEach(part => {
        if (!measurementsByPart[part]) {
          measurementsByPart[part] = [];
        }
        measurementsByPart[part].push({
          value: entry.measurements[part],
          date: entry.recordedAt
        });
      });
    }
  });

  // Calculate changes for each body part
  const changes = {};
  Object.keys(measurementsByPart).forEach(part => {
    const partMeasurements = measurementsByPart[part];
    if (partMeasurements.length >= 2) {
      const first = partMeasurements[0];
      const last = partMeasurements[partMeasurements.length - 1];
      const change = last.value - first.value;
      
      changes[part] = {
        startValue: first.value,
        endValue: last.value,
        change,
        changePercent: first.value > 0 ? (change / first.value) * 100 : 0
      };
    }
  });

  res.json({
    success: true,
    data: {
      entries: measurementEntries,
      measurementsByPart,
      changes,
      totalEntries: measurementEntries.length
    }
  });
}));

// @route   GET /api/progress/photos
// @desc    Get progress photos
// @access  Private
router.get('/photos', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const filter = { 
    userId: req.user._id,
    type: 'progress_photo'
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const photos = await Progress.find(filter)
    .sort({ recordedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Progress.countDocuments(filter);

  res.json({
    success: true,
    data: {
      photos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// @route   POST /api/progress/photos
// @desc    Add a progress photo
// @access  Private
router.post('/photos', asyncHandler(async (req, res) => {
  const { photo, category, notes } = req.body;

  if (!photo || !photo.url) {
    return res.status(400).json({
      success: false,
      message: 'Photo URL is required'
    });
  }

  const photoEntry = await Progress.create({
    userId: req.user._id,
    type: 'progress_photo',
    photo,
    category: category || 'general',
    notes,
    recordedAt: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Progress photo added successfully',
    data: { entry: photoEntry }
  });
}));

// @route   GET /api/progress/analytics
// @desc    Get detailed progress analytics
// @access  Private
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '90' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const entries = await Progress.find({
    userId: req.user._id,
    recordedAt: { $gte: startDate }
  }).sort({ recordedAt: 1 });

  // Group by type and calculate trends
  const analytics = {};
  const types = ['weight', 'measurements', 'body_fat', 'fitness_test'];
  
  types.forEach(type => {
    const typeEntries = entries.filter(entry => entry.type === type);
    if (typeEntries.length > 0) {
      analytics[type] = {
        totalEntries: typeEntries.length,
        firstEntry: typeEntries[0],
        lastEntry: typeEntries[typeEntries.length - 1],
        averageValue: typeEntries.reduce((sum, entry) => sum + entry.value, 0) / typeEntries.length,
        minValue: Math.min(...typeEntries.map(entry => entry.value)),
        maxValue: Math.max(...typeEntries.map(entry => entry.value)),
        trend: calculateTrend(typeEntries)
      };
    }
  });

  // Calculate consistency score
  const consistencyScore = calculateConsistencyScore(entries);

  // Get user's goals and calculate progress
  const user = await User.findById(req.user._id);
  const goals = user.progressGoals || {};
  const goalProgress = calculateGoalProgress(analytics, goals);

  res.json({
    success: true,
    data: {
      analytics,
      consistencyScore,
      goalProgress,
      totalEntries: entries.length,
      period: parseInt(period)
    }
  });
}));

// @route   GET /api/progress/goals
// @desc    Get user's progress goals
// @access  Private
router.get('/goals', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    data: { goals: user.progressGoals || {} }
  });
}));

// @route   PUT /api/progress/goals
// @desc    Update user's progress goals
// @access  Private
router.put('/goals', asyncHandler(async (req, res) => {
  const { weight, bodyFat, measurements, fitnessTests } = req.body;

  const updateData = {};
  if (weight !== undefined) updateData['progressGoals.weight'] = weight;
  if (bodyFat !== undefined) updateData['progressGoals.bodyFat'] = bodyFat;
  if (measurements !== undefined) updateData['progressGoals.measurements'] = measurements;
  if (fitnessTests !== undefined) updateData['progressGoals.fitnessTests'] = fitnessTests;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true }
  );

  res.json({
    success: true,
    message: 'Progress goals updated successfully',
    data: { goals: user.progressGoals }
  });
}));

// Helper functions
async function updateUserProgress(userId, entry) {
  const updateData = {};
  
  if (entry.type === 'weight') {
    updateData['progress.currentWeight'] = entry.value;
    updateData['progress.lastWeightUpdate'] = entry.recordedAt;
  } else if (entry.type === 'body_fat') {
    updateData['progress.currentBodyFat'] = entry.value;
    updateData['progress.lastBodyFatUpdate'] = entry.recordedAt;
  }

  if (Object.keys(updateData).length > 0) {
    await User.findByIdAndUpdate(userId, updateData);
  }
}

async function recalculateUserProgress(userId) {
  // Get latest entries for each type
  const latestEntries = await Progress.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $sort: { recordedAt: -1 } },
    { $group: { _id: '$type', latest: { $first: '$$ROOT' } } }
  ]);

  const updateData = {};
  latestEntries.forEach(({ _id: type, latest }) => {
    if (type === 'weight') {
      updateData['progress.currentWeight'] = latest.value;
      updateData['progress.lastWeightUpdate'] = latest.recordedAt;
    } else if (type === 'body_fat') {
      updateData['progress.currentBodyFat'] = latest.value;
      updateData['progress.lastBodyFatUpdate'] = latest.recordedAt;
    }
  });

  if (Object.keys(updateData).length > 0) {
    await User.findByIdAndUpdate(userId, updateData);
  }
}

function calculateTrend(entries) {
  if (entries.length < 2) return 'insufficient_data';
  
  const values = entries.map(entry => entry.value);
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  const changePercent = firstAvg > 0 ? (change / firstAvg) * 100 : 0;
  
  if (changePercent > 5) return 'increasing';
  if (changePercent < -5) return 'decreasing';
  return 'stable';
}

function calculateConsistencyScore(entries) {
  if (entries.length === 0) return 0;
  
  // Calculate average days between entries
  const dates = entries.map(entry => entry.recordedAt).sort();
  const intervals = [];
  
  for (let i = 1; i < dates.length; i++) {
    const interval = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24); // days
    intervals.push(interval);
  }
  
  if (intervals.length === 0) return 100;
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const consistency = Math.max(0, 100 - (avgInterval - 7) * 10); // Penalize for gaps > 7 days
  
  return Math.round(consistency);
}

function calculateGoalProgress(analytics, goals) {
  const progress = {};
  
  if (analytics.weight && goals.weight) {
    const startWeight = analytics.weight.firstEntry.value;
    const currentWeight = analytics.weight.lastEntry.value;
    const targetWeight = goals.weight;
    
    if (startWeight > targetWeight) {
      // Weight loss goal
      progress.weight = Math.max(0, Math.min(100, 
        ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100
      ));
    } else {
      // Weight gain goal
      progress.weight = Math.max(0, Math.min(100,
        ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100
      ));
    }
  }
  
  return progress;
}

// POST /api/progress/measurements - Add new measurement
router.post('/measurements', async (req, res) => {
  try {
    const {
      type,
      value,
      unit,
      notes,
      date
    } = req.body;

    const measurement = new Progress({
      user: req.user.id,
      type: 'measurement',
      measurementType: type,
      value,
      unit,
      notes: notes || '',
      date: date ? new Date(date) : new Date()
    });
    
    await measurement.save();
    
    res.status(201).json({
      success: true,
      message: 'Measurement added successfully',
      data: measurement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding measurement',
      error: error.message
    });
  }
});

// PUT /api/progress/measurements/:id - Update measurement
router.put('/measurements/:id', async (req, res) => {
  try {
    const measurement = await Progress.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: 'Measurement not found'
      });
    }
    
    const updateData = { ...req.body };
    delete updateData.user; // Prevent user field from being updated
    delete updateData._id; // Prevent ID from being updated
    
    const updatedMeasurement = await Progress.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Measurement updated successfully',
      data: updatedMeasurement
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating measurement',
      error: error.message
    });
  }
});

// DELETE /api/progress/measurements/:id - Delete measurement
router.delete('/measurements/:id', async (req, res) => {
  try {
    const measurement = await Progress.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!measurement) {
      return res.status(404).json({
        success: false,
        message: 'Measurement not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Measurement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting measurement',
      error: error.message
    });
  }
});

// POST /api/progress/photos - Upload progress photo
router.post('/photos', async (req, res) => {
  try {
    const {
      photoUrl,
      type,
      notes,
      date
    } = req.body;
    
    // Validate required fields
    if (!photoUrl || !type) {
      return res.status(400).json({
        success: false,
        message: 'Photo URL and type are required'
      });
    }
    
    // Validate photo type
    const validTypes = ['front', 'back', 'side', 'face', 'full_body'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo type'
      });
    }
    
    const photo = new Progress({
      user: req.user.id,
      type: 'photo',
      photoUrl,
      photoType: type,
      notes: notes || '',
      date: date ? new Date(date) : new Date()
    });
    
    await photo.save();
    
    res.status(201).json({
      success: true,
      message: 'Progress photo uploaded successfully',
      data: photo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading progress photo',
      error: error.message
    });
  }
});

// GET /api/progress/photos - Get progress photos
router.get('/photos', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    const userId = req.user.id;
    
    let query = { user: userId, type: 'photo' };
    
    if (type) {
      query.photoType = type;
    }
    
    const photos = await Progress.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: photos,
      total: photos.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress photos',
      error: error.message
    });
  }
});

// DELETE /api/progress/photos/:id - Delete progress photo
router.delete('/photos/:id', async (req, res) => {
  try {
    const photo = await Progress.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
      type: 'photo'
    });
    
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Progress photo not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Progress photo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting progress photo',
      error: error.message
    });
  }
});

// GET /api/progress/analytics - Get progress analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'month', type } = req.query;
    const userId = req.user.id;
    
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    let query = { 
      user: userId, 
      date: { $gte: startDate },
      type: { $ne: 'photo' }
    };
    
    if (type) {
      query.type = type;
    }
    
    const progressData = await Progress.find(query)
      .sort({ date: 1 });
    
    // Calculate analytics
    const analytics = calculateProgressAnalytics(progressData, period);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress analytics',
      error: error.message
    });
  }
});

// GET /api/progress/summary - Get progress summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get latest measurements for each type
    const latestMeasurements = await Progress.aggregate([
      { $match: { user: userId, type: { $ne: 'photo' } } },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$type',
          latest: { $first: '$$ROOT' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get progress photos count
    const photoCount = await Progress.countDocuments({
      user: userId,
      type: 'photo'
    });
    
    // Calculate trends
    const trends = await calculateTrends(userId);
    
    res.json({
      success: true,
      data: {
        latestMeasurements,
        photoCount,
        trends
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress summary',
      error: error.message
    });
  }
});

// Helper function to calculate progress analytics
function calculateProgressAnalytics(data, period) {
  const analytics = {};
  
  // Group by measurement type
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {});
  
  // Calculate analytics for each type
  Object.keys(groupedData).forEach(type => {
    const measurements = groupedData[type];
    
    if (measurements.length < 2) {
      analytics[type] = {
        type,
        dataPoints: measurements.length,
        trend: 'insufficient_data',
        change: 0,
        average: measurements[0]?.value || 0
      };
      return;
    }
    
    // Sort by date
    measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const first = measurements[0];
    const last = measurements[measurements.length - 1];
    const change = last.value - first.value;
    const changePercent = first.value !== 0 ? (change / first.value) * 100 : 0;
    
    const average = measurements.reduce((sum, m) => sum + m.value, 0) / measurements.length;
    
    // Determine trend
    let trend = 'stable';
    if (changePercent > 2) trend = 'increasing';
    else if (changePercent < -2) trend = 'decreasing';
    
    analytics[type] = {
      type,
      dataPoints: measurements.length,
      trend,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      average: Math.round(average * 100) / 100,
      firstValue: first.value,
      lastValue: last.value,
      firstDate: first.date,
      lastDate: last.date
    };
  });
  
  return {
    period,
    analytics,
    totalDataPoints: data.length
  };
}

// Helper function to calculate trends
async function calculateTrends(userId) {
  const trends = {};
  
  // Get weight trend
  const weightData = await Progress.find({
    user: userId,
    type: 'weight'
  })
  .sort({ date: -1 })
  .limit(7);
  
  if (weightData.length >= 2) {
    const recent = weightData[0].value;
    const previous = weightData[weightData.length - 1].value;
    const change = recent - previous;
    trends.weight = {
      current: recent,
      change,
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
    };
  }
  
  // Get body fat trend
  const bodyFatData = await Progress.find({
    user: userId,
    type: 'body_fat'
  })
  .sort({ date: -1 })
  .limit(7);
  
  if (bodyFatData.length >= 2) {
    const recent = bodyFatData[0].value;
    const previous = bodyFatData[bodyFatData.length - 1].value;
    const change = recent - previous;
    trends.bodyFat = {
      current: recent,
      change,
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
    };
  }
  
  return trends;
}

module.exports = router;
