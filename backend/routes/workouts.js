const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Normalize user id: accept in-memory numeric ids by mapping to a stable ObjectId-like hex
const toStableObjectIdHex = (id) => {
  const s = String(id || '');
  if (/^[a-f\d]{24}$/i.test(s)) return s.toLowerCase();
  return crypto.createHash('md5').update(`memuser:${s}`).digest('hex').slice(0, 24);
};

// Validation middleware (aligned with Workout model)
const validateWorkout = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Workout name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('type')
    .isIn(['strength', 'cardio', 'hiit', 'yoga', 'pilates', 'sports', 'flexibility', 'custom'])
    .withMessage('Please provide a valid workout type'),
  body()
    .custom((value) => {
      // Accept either duration or estimatedDuration
      const d = value.duration ?? value.estimatedDuration;
      return Number.isInteger(d) && d >= 5 && d <= 300;
    })
    .withMessage('Duration must be between 5 and 300 minutes'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Please provide a valid difficulty level'),
  body('exercises')
    .isArray({ min: 1 })
    .withMessage('At least one exercise is required'),
  body('exercises.*')
    .custom((ex) => !!ex.exercise || !!ex.exerciseId)
    .withMessage('Each exercise must include an exercise id'),
  body('exercises.*.sets')
    .isArray({ min: 1 })
    .withMessage('At least one set is required'),
  body('exercises.*.sets.*.reps')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reps must be a positive integer'),
  body('exercises.*.sets.*.weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('exercises.*.sets.*.duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('exercises.*.sets.*.distance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance must be a positive number'),
  body('exercises.*.restTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Rest time must be a non-negative integer'),
];

// @route   POST /api/workouts
// @desc    Create a new workout
// @access  Private
router.post('/', validateWorkout, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Map incoming body to model shape
  const duration = req.body.duration ?? req.body.estimatedDuration;
  const exercises = (req.body.exercises || []).map((ex, idx) => ({
    exercise: ex.exercise || ex.exerciseId,
    sets: Array.isArray(ex.sets) ? ex.sets : [],
    order: ex.order ?? idx + 1,
    restBetweenSets: ex.restTime ?? 60,
  }));

  const workoutData = {
    name: req.body.name,
    description: req.body.description,
    type: req.body.type,
    difficulty: req.body.difficulty,
    duration,
    exercises,
    user: toStableObjectIdHex(req.user?._id),
    isTemplate: false,
  };

  const workout = await Workout.create(workoutData);

  // Populate exercise details
  await workout.populate('exercises.exercise', 'name category muscleGroups equipment');

  res.status(201).json({
    success: true,
    message: 'Workout created successfully',
    data: { workout }
  });
}));

// @route   GET /api/workouts
// @desc    Get user's workouts with filtering and pagination
// @access  Private
router.get('/', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    difficulty,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const filter = { user: toStableObjectIdHex(req.user?._id) };

  // Apply filters
  if (type) filter.type = type;
  if (difficulty) filter.difficulty = difficulty;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const workouts = await Workout.find(filter)
    .populate('exercises.exercise', 'name category muscleGroups equipment')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Workout.countDocuments(filter);

  res.json({
    success: true,
    data: {
      workouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// @route   GET /api/workouts/:id
// @desc    Get specific workout by ID
// @access  Private
router.get('/:id', asyncHandler(async (req, res) => {
  const workout = await Workout.findOne({
    _id: req.params.id,
    user: toStableObjectIdHex(req.user?._id)
  }).populate('exercises.exercise', 'name category muscleGroups equipment instructions media');

  if (!workout) {
    return res.status(404).json({
      success: false,
      message: 'Workout not found'
    });
  }

  res.json({
    success: true,
    data: { workout }
  });
}));

// @route   PUT /api/workouts/:id
// @desc    Update workout
// @access  Private
router.put('/:id', validateWorkout, asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Map incoming body to model shape
  const duration = req.body.duration ?? req.body.estimatedDuration;
  const exercises = (req.body.exercises || []).map((ex, idx) => ({
    exercise: ex.exercise || ex.exerciseId,
    sets: Array.isArray(ex.sets) ? ex.sets : [],
    order: ex.order ?? idx + 1,
    restBetweenSets: ex.restTime ?? 60,
  }));

  const update = {
    name: req.body.name,
    description: req.body.description,
    type: req.body.type,
    difficulty: req.body.difficulty,
    duration,
    exercises,
  };

  const workout = await Workout.findOneAndUpdate(
    {
      _id: req.params.id,
      user: toStableObjectIdHex(req.user?._id)
    },
    update,
    { new: true, runValidators: true }
  ).populate('exercises.exercise', 'name category muscleGroups equipment');

  if (!workout) {
    return res.status(404).json({
      success: false,
      message: 'Workout not found'
    });
  }

  res.json({
    success: true,
    message: 'Workout updated successfully',
    data: { workout }
  });
}));

// @route   DELETE /api/workouts/:id
// @desc    Delete workout
// @access  Private
router.delete('/:id', asyncHandler(async (req, res) => {
  const workout = await Workout.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!workout) {
    return res.status(404).json({
      success: false,
      message: 'Workout not found'
    });
  }

  res.json({
    success: true,
    message: 'Workout deleted successfully'
  });
}));

// @route   POST /api/workouts/:id/start
// @desc    Start a workout session
// @access  Private
router.post('/:id/start', asyncHandler(async (req, res) => {
  const workout = await Workout.findOne({
    _id: req.params.id,
    user: toStableObjectIdHex(req.user?._id)
  });

  if (!workout) {
    return res.status(404).json({
      success: false,
      message: 'Workout not found'
    });
  }

  if (workout.status === 'in_progress') {
    return res.status(400).json({
      success: false,
      message: 'Workout is already in progress'
    });
  }

  // Create workout session
  const session = {
    startTime: new Date(),
    status: 'in_progress',
    exercises: workout.exercises.map(exercise => ({
      exerciseId: exercise.exerciseId,
      sets: exercise.sets.map(set => ({
        ...set,
        completed: false,
        actualReps: null,
        actualWeight: null,
        actualDuration: null,
        actualDistance: null,
        notes: ''
      }))
    }))
  };

  workout.sessions.push(session);
  workout.status = 'in_progress';
  workout.currentSessionIndex = workout.sessions.length - 1;

  await workout.save();

  res.json({
    success: true,
    message: 'Workout started successfully',
    data: { session }
  });
}));

// @route   PUT /api/workouts/:id/complete-set
// @desc    Complete a specific set in the current workout session
// @access  Private
router.put('/:id/complete-set', asyncHandler(async (req, res) => {
  const { exerciseIndex, setIndex, actualData } = req.body;

  const workout = await Workout.findOne({
    _id: req.params.id,
    user: toStableObjectIdHex(req.user?._id)
  });

  if (!workout) {
    return res.status(404).json({
      success: false,
      message: 'Workout not found'
    });
  }

  if (workout.status !== 'in_progress') {
    return res.status(400).json({
      success: false,
      message: 'No workout in progress'
    });
  }

  const currentSession = workout.sessions[workout.currentSessionIndex];
  if (!currentSession) {
    return res.status(400).json({
      success: false,
      message: 'No active session found'
    });
  }

  const exercise = currentSession.exercises[exerciseIndex];
  if (!exercise) {
    return res.status(400).json({
      success: false,
      message: 'Exercise not found'
    });
  }

  const set = exercise.sets[setIndex];
  if (!set) {
    return res.status(400).json({
      success: false,
      message: 'Set not found'
    });
  }

  // Update set with actual data
  Object.assign(set, {
    completed: true,
    ...actualData,
    completedAt: new Date()
  });

  await workout.save();

  res.json({
    success: true,
    message: 'Set completed successfully',
    data: { set }
  });
}));

// @route   POST /api/workouts/:id/complete
// @desc    Complete the current workout session
// @access  Private
router.post('/:id/complete', asyncHandler(async (req, res) => {
  const { notes, rating } = req.body;

  const workout = await Workout.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!workout) {
    return res.status(404).json({
      success: false,
      message: 'Workout not found'
    });
  }

  if (workout.status !== 'in_progress') {
    return res.status(400).json({
      success: false,
      message: 'No workout in progress'
    });
  }

  const currentSession = workout.sessions[workout.currentSessionIndex];
  if (!currentSession) {
    return res.status(400).json({
      success: false,
      message: 'No active session found'
    });
  }

  // Complete the session
  currentSession.endTime = new Date();
  currentSession.duration = currentSession.endTime - currentSession.startTime;
  currentSession.status = 'completed';
  currentSession.notes = notes || '';
  currentSession.rating = rating || null;

  // Calculate session statistics
  const totalSets = currentSession.exercises.reduce((sum, exercise) => 
    sum + exercise.sets.filter(set => set.completed).length, 0
  );
  const totalReps = currentSession.exercises.reduce((sum, exercise) => 
    sum + exercise.sets.reduce((setSum, set) => 
      setSum + (set.actualReps || 0), 0
    ), 0
  );
  const totalWeight = currentSession.exercises.reduce((sum, exercise) => 
    sum + exercise.sets.reduce((setSum, set) => 
      setSum + (set.actualWeight || 0), 0
    ), 0
  );

  currentSession.stats = {
    totalSets,
    totalReps,
    totalWeight,
    totalDuration: currentSession.duration
  };

  // Update workout status
  workout.status = 'completed';
  workout.completedAt = new Date();

  // Update user stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      'stats.totalWorkouts': 1,
      'stats.totalWorkoutTime': Math.round(currentSession.duration / 1000 / 60), // minutes
      'stats.totalSets': totalSets,
      'stats.totalReps': totalReps
    }
  });

  await workout.save();

  res.json({
    success: true,
    message: 'Workout completed successfully',
    data: { session: currentSession }
  });
}));

// @route   GET /api/workouts/templates
// @desc    Get workout templates
// @access  Private
router.get('/templates', asyncHandler(async (req, res) => {
  const { category, difficulty, limit = 10 } = req.query;

  const filter = { isTemplate: true };
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;

  const templates = await Workout.find(filter)
    .populate('exercises.exercise', 'name category muscleGroups equipment')
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: { templates }
  });
}));

// @route   POST /api/workouts/:id/clone
// @desc    Clone a workout template
// @access  Private
router.post('/:id/clone', asyncHandler(async (req, res) => {
  const template = await Workout.findOne({
    _id: req.params.id,
    isTemplate: true
  }).populate('exercises.exercise');

  if (!template) {
    return res.status(404).json({
      success: false,
      message: 'Template not found'
    });
  }

  // Create new workout from template
  const workoutData = {
    name: `${template.name} (Copy)`,
    description: template.description,
    type: template.type,
    difficulty: template.difficulty,
    duration: template.duration ?? template.estimatedDuration,
    exercises: template.exercises.map((ex, idx) => ({
      exercise: ex.exercise || ex.exerciseId,
      sets: ex.sets,
      order: ex.order ?? idx + 1,
      restBetweenSets: ex.restBetweenSets ?? 60,
    })),
    user: req.user._id,
    createdBy: req.user._id,
    isTemplate: false
  };

  const workout = await Workout.create(workoutData);

  res.status(201).json({
    success: true,
    message: 'Workout cloned successfully',
    data: { workout }
  });
}));

// @route   GET /api/workouts/stats/summary
// @desc    Get workout statistics summary
// @access  Private
router.get('/stats/summary', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const stats = await Workout.aggregate([
    {
      $match: {
        userId: req.user._id,
        'sessions.endTime': { $gte: startDate }
      }
    },
    {
      $unwind: '$sessions'
    },
    {
      $match: {
        'sessions.status': 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalWorkouts: { $sum: 1 },
        totalDuration: { $sum: '$sessions.duration' },
        totalSets: { $sum: '$sessions.stats.totalSets' },
        totalReps: { $sum: '$sessions.stats.totalReps' },
        totalWeight: { $sum: '$sessions.stats.totalWeight' },
        averageRating: { $avg: '$sessions.rating' }
      }
    }
  ]);

  const summary = stats[0] || {
    totalWorkouts: 0,
    totalDuration: 0,
    totalSets: 0,
    totalReps: 0,
    totalWeight: 0,
    averageRating: 0
  };

  res.json({
    success: true,
    data: { summary }
  });
}));

module.exports = router;
