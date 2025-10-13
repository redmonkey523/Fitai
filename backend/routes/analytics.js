const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Naive rate limiting for events
const rateLimitWindowMs = 60 * 1000;
const rateLimitMax = 120; // 120 events/min per user
const rl = new Map(); // userId -> { ts, count }

// POST /api/analytics/events - Track client-side events (best-effort, minimal schema)
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const { event, payload, ts } = req.body || {};
    if (!event || typeof event !== 'string') {
      return res.status(400).json({ success: false, message: 'event is required' });
    }
    // Rate-limit per user
    const uid = String(req.user?.id || 'unknown');
    const now = Date.now();
    const bucket = rl.get(uid) || { ts: now, count: 0 };
    if (now - bucket.ts > rateLimitWindowMs) { bucket.ts = now; bucket.count = 0; }
    bucket.count += 1; rl.set(uid, bucket);
    if (bucket.count > rateLimitMax) {
      return res.status(429).json({ success: false, message: 'Too many events' });
    }
    // In memory/log-only for now. Replace with DB write if needed.
    console.log('[analytics:event]', {
      userId: req.user?.id,
      event,
      ts: ts || Date.now(),
      payload: payload || {}
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to track event', error: error.message });
  }
});

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get workout analytics
    const Workout = require('../models/Workout');
    const workoutStats = await Workout.aggregate([
      { $match: { user: user._id, 'session.completed': true } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$session.actualDuration' },
          totalCalories: { $sum: '$session.caloriesBurned' },
          averageDuration: { $avg: '$session.actualDuration' },
          averageCalories: { $avg: '$session.caloriesBurned' }
        }
      }
    ]);
    
    // Get nutrition analytics
    const Nutrition = require('../models/Nutrition');
    const nutritionStats = await Nutrition.aggregate([
      { $match: { user: user._id, type: { $ne: 'water' } } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalCalories: { $sum: '$nutrition.calories' },
          averageCalories: { $avg: '$nutrition.calories' },
          totalProtein: { $sum: '$nutrition.protein' },
          totalCarbs: { $sum: '$nutrition.carbs' },
          totalFat: { $sum: '$nutrition.fat' }
        }
      }
    ]);
    
    // Get progress analytics
    const Progress = require('../models/Progress');
    const progressStats = await Progress.aggregate([
      { $match: { user: user._id, type: { $ne: 'photo' } } },
      {
        $group: {
          _id: null,
          totalMeasurements: { $sum: 1 },
          measurementTypes: { $addToSet: '$type' }
        }
      }
    ]);
    
    // Get weekly trends
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyWorkouts = await Workout.aggregate([
      {
        $match: {
          user: user._id,
          'session.completed': true,
          'session.endTime': { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$session.endTime' } },
          count: { $sum: 1 },
          duration: { $sum: '$session.actualDuration' },
          calories: { $sum: '$session.caloriesBurned' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const weeklyNutrition = await Nutrition.aggregate([
      {
        $match: {
          user: user._id,
          type: { $ne: 'water' },
          date: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          calories: { $sum: '$nutrition.calories' },
          protein: { $sum: '$nutrition.protein' },
          carbs: { $sum: '$nutrition.carbs' },
          fat: { $sum: '$nutrition.fat' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate streaks
    const currentStreak = user.stats?.currentStreak || 0;
    const longestStreak = user.stats?.longestStreak || 0;
    
    // Calculate goals progress
    const nutritionGoals = user.nutritionGoals || {};
    const fitnessGoals = user.fitnessGoals || {};
    
    const dashboardData = {
      overview: {
        totalWorkouts: workoutStats[0]?.totalWorkouts || 0,
        totalCaloriesBurned: workoutStats[0]?.totalCalories || 0,
        totalNutritionEntries: nutritionStats[0]?.totalEntries || 0,
        totalMeasurements: progressStats[0]?.totalMeasurements || 0,
        currentStreak,
        longestStreak
      },
      workoutAnalytics: {
        totalWorkouts: workoutStats[0]?.totalWorkouts || 0,
        totalDuration: workoutStats[0]?.totalDuration || 0,
        totalCalories: workoutStats[0]?.totalCalories || 0,
        averageDuration: Math.round(workoutStats[0]?.averageDuration || 0),
        averageCalories: Math.round(workoutStats[0]?.averageCalories || 0)
      },
      nutritionAnalytics: {
        totalEntries: nutritionStats[0]?.totalEntries || 0,
        totalCalories: nutritionStats[0]?.totalCalories || 0,
        averageCalories: Math.round(nutritionStats[0]?.averageCalories || 0),
        totalProtein: Math.round(nutritionStats[0]?.totalProtein || 0),
        totalCarbs: Math.round(nutritionStats[0]?.totalCarbs || 0),
        totalFat: Math.round(nutritionStats[0]?.totalFat || 0)
      },
      weeklyTrends: {
        workouts: weeklyWorkouts,
        nutrition: weeklyNutrition
      },
      goals: {
        nutrition: nutritionGoals,
        fitness: fitnessGoals
      }
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/workouts - Get workout analytics
router.get('/workouts', authenticateToken, async (req, res) => {
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
    
    const Workout = require('../models/Workout');
    
    let matchQuery = {
      user: userId,
      'session.completed': true,
      'session.endTime': { $gte: startDate }
    };
    
    if (type) {
      matchQuery.type = type;
    }
    
    // Get workout statistics
    const workoutStats = await Workout.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$session.actualDuration' },
          totalCalories: { $sum: '$session.caloriesBurned' },
          averageDuration: { $avg: '$session.actualDuration' },
          averageCalories: { $avg: '$session.caloriesBurned' },
          completionRate: { $avg: '$session.completionRate' }
        }
      }
    ]);
    
    // Get workouts by type
    const workoutsByType = await Workout.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDuration: { $sum: '$session.actualDuration' },
          totalCalories: { $sum: '$session.caloriesBurned' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get daily workout trends
    const dailyTrends = await Workout.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$session.endTime' } },
          count: { $sum: 1 },
          duration: { $sum: '$session.actualDuration' },
          calories: { $sum: '$session.caloriesBurned' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get workout frequency by day of week
    const weeklyFrequency = await Workout.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dayOfWeek: '$session.endTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const analytics = {
      period,
      overview: workoutStats[0] || {
        totalWorkouts: 0,
        totalDuration: 0,
        totalCalories: 0,
        averageDuration: 0,
        averageCalories: 0,
        completionRate: 0
      },
      byType: workoutsByType,
      dailyTrends,
      weeklyFrequency
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching workout analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/nutrition - Get nutrition analytics
router.get('/nutrition', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const userId = req.user.id;
    
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const Nutrition = require('../models/Nutrition');
    
    // Get nutrition statistics
    const nutritionStats = await Nutrition.aggregate([
      {
        $match: {
          user: userId,
          type: { $ne: 'water' },
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalCalories: { $sum: '$nutrition.calories' },
          totalProtein: { $sum: '$nutrition.protein' },
          totalCarbs: { $sum: '$nutrition.carbs' },
          totalFat: { $sum: '$nutrition.fat' },
          totalFiber: { $sum: '$nutrition.fiber' },
          totalSugar: { $sum: '$nutrition.sugar' },
          totalSodium: { $sum: '$nutrition.sodium' },
          averageCalories: { $avg: '$nutrition.calories' }
        }
      }
    ]);
    
    // Get nutrition by meal
    const nutritionByMeal = await Nutrition.aggregate([
      {
        $match: {
          user: userId,
          type: { $ne: 'water' },
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$meal',
          count: { $sum: 1 },
          calories: { $sum: '$nutrition.calories' },
          protein: { $sum: '$nutrition.protein' },
          carbs: { $sum: '$nutrition.carbs' },
          fat: { $sum: '$nutrition.fat' }
        }
      },
      { $sort: { calories: -1 } }
    ]);
    
    // Get daily nutrition trends
    const dailyTrends = await Nutrition.aggregate([
      {
        $match: {
          user: userId,
          type: { $ne: 'water' },
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          calories: { $sum: '$nutrition.calories' },
          protein: { $sum: '$nutrition.protein' },
          carbs: { $sum: '$nutrition.carbs' },
          fat: { $sum: '$nutrition.fat' },
          entries: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get macro distribution
    const macroDistribution = nutritionStats[0] ? {
      protein: Math.round((nutritionStats[0].totalProtein * 4 / nutritionStats[0].totalCalories) * 100),
      carbs: Math.round((nutritionStats[0].totalCarbs * 4 / nutritionStats[0].totalCalories) * 100),
      fat: Math.round((nutritionStats[0].totalFat * 9 / nutritionStats[0].totalCalories) * 100)
    } : { protein: 0, carbs: 0, fat: 0 };
    
    const analytics = {
      period,
      overview: nutritionStats[0] || {
        totalEntries: 0,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        totalSugar: 0,
        totalSodium: 0,
        averageCalories: 0
      },
      byMeal: nutritionByMeal,
      dailyTrends,
      macroDistribution
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching nutrition analytics',
      error: error.message
    });
  }
});

// GET /api/analytics/progress - Get progress analytics
// Contract additions: also return { measurements: [{ date, weight?, bodyFat?, waist? }], photosCount, workoutsCount }
// Supports timeframe parameter: 7d, 30d, 90d
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    // Always set JSON content type first
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const { period = 'month', type, timeframe } = req.query;
    const userId = req.user.id;
    
    const startDate = new Date();
    
    // Handle timeframe parameter (7d, 30d, 90d format)
    if (timeframe) {
      const match = timeframe.match(/^(\d+)d$/);
      if (match) {
        const days = parseInt(match[1], 10);
        startDate.setDate(startDate.getDate() - days);
      } else {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid timeframe format. Use format like "7d", "30d", "90d"'
          }
        });
      }
    } else if (period === 'week' || period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month' || period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'quarter' || period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      // Default to 30 days
      startDate.setDate(startDate.getDate() - 30);
    }
    
    const Progress = require('../models/Progress');
    const Workout = require('../models/Workout');
    
    let matchQuery = {
      user: userId,
      type: { $ne: 'photo' },
      date: { $gte: startDate }
    };
    
    if (type) {
      matchQuery.type = type;
    }
    
    // Get progress statistics
    const progressStats = await Progress.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averageValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' },
          latestValue: { $last: '$value' },
          firstValue: { $first: '$value' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get progress trends by type
    const progressTrends = await Progress.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            type: '$type',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          value: { $avg: '$value' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Build measurements array keyed by date with selected fields (weight, body_fat, waist)
    const dailyMeasurementsRaw = await Progress.aggregate([
      { $match: { user: userId, date: { $gte: startDate }, type: { $in: ['weight', 'body_fat', 'waist'] } } },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          items: { $push: { type: '$type', value: '$value' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const measurements = dailyMeasurementsRaw.map(d => {
      const entry = { date: d._id };
      for (const it of d.items) {
        if (it.type === 'weight') entry.weight = it.value;
        if (it.type === 'body_fat') entry.bodyFat = it.value;
        if (it.type === 'waist') entry.waist = it.value;
      }
      return entry;
    });

    // Photos count within period
    const photosCount = await Progress.countDocuments({ user: userId, type: 'photo', date: { $gte: startDate } });
    // Workouts count within period
    const workoutsCount = await Workout.countDocuments({ user: userId, 'session.completed': true, 'session.endTime': { $gte: startDate } }).catch(() => 0);

    // Calculate changes for each measurement type
    const progressChanges = progressStats.map(stat => {
      const change = stat.latestValue - stat.firstValue;
      const changePercent = stat.firstValue !== 0 ? (change / stat.firstValue) * 100 : 0;
      
      return {
        type: stat._id,
        count: stat.count,
        averageValue: Math.round(stat.averageValue * 100) / 100,
        firstValue: stat.firstValue,
        latestValue: stat.latestValue,
        change,
        changePercent: Math.round(changePercent * 100) / 100,
        trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
      };
    });
    
    const analytics = {
      period,
      overview: progressChanges,
      trends: progressTrends
    };
    
    res.json({
      success: true,
      // legacy data shape
      data: analytics,
      // v2 additions for UI contracts
      measurements,
      photosCount,
      workoutsCount
    });
  } catch (error) {
    // Ensure JSON response even on error
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    console.error('GET /analytics/progress error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Error fetching progress analytics'
      }
    });
  }
});

// GET /api/analytics/insights - Get AI-powered insights
// Contract additions: also return { summaries: [{ title, value, delta, period }], tips: [string] }
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get recent data for analysis
    const Workout = require('../models/Workout');
    const Nutrition = require('../models/Nutrition');
    const Progress = require('../models/Progress');
    
    const recentWorkouts = await Workout.find({
      user: userId,
      'session.completed': true
    })
    .sort({ 'session.endTime': -1 })
    .limit(10);
    
    const recentNutrition = await Nutrition.find({
      user: userId,
      type: { $ne: 'water' }
    })
    .sort({ date: -1 })
    .limit(20);
    
    const recentProgress = await Progress.find({
      user: userId,
      type: { $ne: 'photo' }
    })
    .sort({ date: -1 })
    .limit(10);
    
    // Generate insights
    const insights = [];
    
    // Workout insights
    if (recentWorkouts.length > 0) {
      const avgDuration = recentWorkouts.reduce((sum, w) => sum + w.session.actualDuration, 0) / recentWorkouts.length;
      const avgCalories = recentWorkouts.reduce((sum, w) => sum + w.session.caloriesBurned, 0) / recentWorkouts.length;
      
      if (avgDuration < 30) {
        insights.push({
          type: 'workout',
          category: 'duration',
          title: 'Short Workout Sessions',
          message: 'Your average workout duration is below 30 minutes. Consider extending your sessions for better results.',
          priority: 'medium',
          actionable: true,
          suggestion: 'Try adding 10-15 minutes to your workouts'
        });
      }
      
      if (avgCalories < 200) {
        insights.push({
          type: 'workout',
          category: 'intensity',
          title: 'Low Calorie Burn',
          message: 'Your workouts are burning fewer calories than expected. Consider increasing intensity.',
          priority: 'medium',
          actionable: true,
          suggestion: 'Try high-intensity intervals or longer sessions'
        });
      }
    }
    
    // Nutrition insights
    if (recentNutrition.length > 0) {
      const avgCalories = recentNutrition.reduce((sum, n) => sum + n.nutrition.calories, 0) / recentNutrition.length;
      const avgProtein = recentNutrition.reduce((sum, n) => sum + n.nutrition.protein, 0) / recentNutrition.length;
      
      const nutritionGoals = user.nutritionGoals || {};
      
      if (nutritionGoals.calories && avgCalories < nutritionGoals.calories * 0.8) {
        insights.push({
          type: 'nutrition',
          category: 'calories',
          title: 'Low Calorie Intake',
          message: 'You\'re consuming significantly fewer calories than your goal. This may affect your energy levels.',
          priority: 'high',
          actionable: true,
          suggestion: 'Consider adding healthy snacks between meals'
        });
      }
      
      if (nutritionGoals.protein && avgProtein < nutritionGoals.protein * 0.7) {
        insights.push({
          type: 'nutrition',
          category: 'protein',
          title: 'Insufficient Protein',
          message: 'Your protein intake is below your target. Protein is crucial for muscle recovery and growth.',
          priority: 'high',
          actionable: true,
          suggestion: 'Add protein-rich foods like chicken, fish, or legumes'
        });
      }
    }
    
    // Progress insights
    if (recentProgress.length > 0) {
      const weightMeasurements = recentProgress.filter(p => p.type === 'weight').slice(0, 2);
      
      if (weightMeasurements.length >= 2) {
        const change = weightMeasurements[0].value - weightMeasurements[1].value;
        const changePercent = (change / weightMeasurements[1].value) * 100;
        
        if (Math.abs(changePercent) > 5) {
          insights.push({
            type: 'progress',
            category: 'weight',
            title: 'Significant Weight Change',
            message: `You've ${change > 0 ? 'gained' : 'lost'} ${Math.abs(change).toFixed(1)} lbs recently.`,
            priority: 'medium',
            actionable: true,
            suggestion: 'Monitor your nutrition and workout consistency'
          });
        }
      }
    }
    
    // Consistency insights
    const lastWorkout = recentWorkouts[0];
    if (lastWorkout) {
      const daysSinceLastWorkout = Math.floor((Date.now() - lastWorkout.session.endTime) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastWorkout > 3) {
        insights.push({
          type: 'consistency',
          category: 'workout',
          title: 'Workout Gap',
          message: `It's been ${daysSinceLastWorkout} days since your last workout.`,
          priority: 'high',
          actionable: true,
          suggestion: 'Schedule your next workout today'
        });
      }
    }
    
    // Positive insights
    if (recentWorkouts.length >= 3) {
      insights.push({
        type: 'achievement',
        category: 'consistency',
        title: 'Great Consistency!',
        message: 'You\'ve completed multiple workouts recently. Keep up the great work!',
        priority: 'low',
        actionable: false,
        positive: true
      });
    }
    
    const sortedInsights = insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Summaries derived from recent stats when possible
    const summaries = [];
    try {
      const Workout = require('../models/Workout');
      const Progress = require('../models/Progress');
      const monthStart = new Date(); monthStart.setMonth(monthStart.getMonth() - 1);
      const workoutsMonth = await Workout.countDocuments({ user: userId, 'session.completed': true, 'session.endTime': { $gte: monthStart } });
      const prevMonthStart = new Date(); prevMonthStart.setMonth(prevMonthStart.getMonth() - 2);
      const workoutsPrev = await Workout.countDocuments({ user: userId, 'session.completed': true, 'session.endTime': { $gte: prevMonthStart, $lt: monthStart } });
      const deltaW = workoutsMonth - workoutsPrev;
      summaries.push({ title: 'Workouts', value: workoutsMonth, delta: deltaW, period: 'month' });
      const photosMonth = await Progress.countDocuments({ user: userId, type: 'photo', date: { $gte: monthStart } });
      summaries.push({ title: 'Progress Photos', value: photosMonth, delta: 0, period: 'month' });
    } catch (_) {}

    // Tips derived from insights or defaults
    const tips = [];
    if (sortedInsights.length === 0) {
      tips.push('Set a realistic weekly workout goal and track progress.');
      tips.push('Keep protein intake consistent to support recovery.');
      tips.push('Maintain consistent photo angles and lighting.');
    } else {
      for (const ins of sortedInsights.slice(0, 5)) {
        if (ins.suggestion) tips.push(ins.suggestion);
      }
      if (tips.length === 0) tips.push('Great consistency — keep going this week!');
    }

    res.json({
      success: true,
      data: {
        insights: sortedInsights,
        totalInsights: sortedInsights.length,
        actionableCount: sortedInsights.filter(i => i.actionable).length,
      },
      // v2 additions for UI contracts
      summaries,
      tips
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching insights',
      error: error.message
    });
  }
});

module.exports = router;
