const mongoose = require('mongoose');

const workoutAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalWorkouts: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number, // in minutes
    default: 0
  },
  totalCalories: {
    type: Number,
    default: 0
  },
  exercises: [{
    name: String,
    totalSets: Number,
    totalReps: Number,
    totalWeight: Number,
    totalDuration: Number
  }],
  workoutTypes: [{
    type: String,
    count: Number,
    totalDuration: Number
  }],
  averageHeartRate: Number,
  maxHeartRate: Number,
  averageIntensity: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const nutritionAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFat: {
    type: Number,
    default: 0
  },
  totalFiber: {
    type: Number,
    default: 0
  },
  totalSugar: {
    type: Number,
    default: 0
  },
  totalSodium: {
    type: Number,
    default: 0
  },
  meals: [{
    type: String, // breakfast, lunch, dinner, snack
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    foodCount: Number
  }],
  waterIntake: {
    type: Number, // in ml
    default: 0
  },
  foodCategories: [{
    category: String,
    count: Number,
    totalCalories: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const progressAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  weight: {
    type: Number,
    default: 0
  },
  bodyFat: {
    type: Number,
    default: 0
  },
  muscleMass: {
    type: Number,
    default: 0
  },
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    biceps: Number,
    thighs: Number,
    calves: Number,
    neck: Number,
    shoulders: Number
  },
  photos: [{
    type: String, // front, back, side
    url: String,
    timestamp: Date
  }],
  goals: [{
    type: String,
    targetValue: Number,
    currentValue: Number,
    unit: String,
    progress: Number // percentage
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userInsightsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  insights: {
    workoutConsistency: {
      score: Number, // 0-100
      streak: Number,
      averageWorkoutsPerWeek: Number,
      mostActiveDay: String,
      leastActiveDay: String
    },
    nutritionBalance: {
      score: Number, // 0-100
      averageCalories: Number,
      proteinGoalMet: Number, // percentage
      carbGoalMet: Number,
      fatGoalMet: Number,
      mostConsumedFood: String
    },
    progressTrends: {
      weightChange: Number,
      bodyFatChange: Number,
      muscleGain: Number,
      goalProgress: Number
    },
    recommendations: [{
      type: String,
      category: String,
      message: String,
      priority: Number // 1-5
    }],
    achievements: [{
      type: String,
      title: String,
      description: String,
      earnedAt: Date
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const appUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  sessionCount: {
    type: Number,
    default: 0
  },
  totalSessionTime: {
    type: Number, // in minutes
    default: 0
  },
  featuresUsed: [{
    feature: String,
    usageCount: Number,
    timeSpent: Number
  }],
  screenViews: [{
    screen: String,
    viewCount: Number,
    averageTime: Number
  }],
  actions: [{
    action: String,
    count: Number,
    timestamp: Date
  }],
  deviceInfo: {
    platform: String,
    version: String,
    model: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const trendAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metric: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  dataPoints: [{
    date: Date,
    value: Number,
    change: Number,
    changePercentage: Number
  }],
  trend: {
    direction: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable'],
      required: true
    },
    slope: Number,
    correlation: Number,
    confidence: Number
  },
  predictions: [{
    date: Date,
    predictedValue: Number,
    confidence: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
workoutAnalyticsSchema.index({ userId: 1, date: -1 });
workoutAnalyticsSchema.index({ date: 1 });

nutritionAnalyticsSchema.index({ userId: 1, date: -1 });
nutritionAnalyticsSchema.index({ date: 1 });

progressAnalyticsSchema.index({ userId: 1, date: -1 });
progressAnalyticsSchema.index({ date: 1 });

userInsightsSchema.index({ userId: 1, period: 1, startDate: -1 });
userInsightsSchema.index({ period: 1, startDate: 1 });

appUsageSchema.index({ userId: 1, date: -1 });
appUsageSchema.index({ date: 1 });

trendAnalysisSchema.index({ userId: 1, metric: 1, period: 1 });
trendAnalysisSchema.index({ metric: 1, period: 1 });

// Virtual fields
workoutAnalyticsSchema.virtual('averageWorkoutDuration').get(function() {
  return this.totalWorkouts > 0 ? this.totalDuration / this.totalWorkouts : 0;
});

nutritionAnalyticsSchema.virtual('calorieGoalMet').get(function() {
  // This would need to be calculated based on user's calorie goal
  return 0;
});

// Methods
workoutAnalyticsSchema.methods.addWorkout = function(workoutData) {
  this.totalWorkouts += 1;
  this.totalDuration += workoutData.duration || 0;
  this.totalCalories += workoutData.calories || 0;
  
  if (workoutData.exercises) {
    workoutData.exercises.forEach(exercise => {
      const existingExercise = this.exercises.find(e => e.name === exercise.name);
      if (existingExercise) {
        existingExercise.totalSets += exercise.sets || 0;
        existingExercise.totalReps += exercise.reps || 0;
        existingExercise.totalWeight += exercise.weight || 0;
        existingExercise.totalDuration += exercise.duration || 0;
      } else {
        this.exercises.push({
          name: exercise.name,
          totalSets: exercise.sets || 0,
          totalReps: exercise.reps || 0,
          totalWeight: exercise.weight || 0,
          totalDuration: exercise.duration || 0
        });
      }
    });
  }
  
  return this.save();
};

nutritionAnalyticsSchema.methods.addMeal = function(mealData) {
  this.totalCalories += mealData.calories || 0;
  this.totalProtein += mealData.protein || 0;
  this.totalCarbs += mealData.carbs || 0;
  this.totalFat += mealData.fat || 0;
  this.totalFiber += mealData.fiber || 0;
  this.totalSugar += mealData.sugar || 0;
  this.totalSodium += mealData.sodium || 0;
  
  if (mealData.mealType) {
    const existingMeal = this.meals.find(m => m.type === mealData.mealType);
    if (existingMeal) {
      existingMeal.calories += mealData.calories || 0;
      existingMeal.protein += mealData.protein || 0;
      existingMeal.carbs += mealData.carbs || 0;
      existingMeal.fat += mealData.fat || 0;
      existingMeal.foodCount += 1;
    } else {
      this.meals.push({
        type: mealData.mealType,
        calories: mealData.calories || 0,
        protein: mealData.protein || 0,
        carbs: mealData.carbs || 0,
        fat: mealData.fat || 0,
        foodCount: 1
      });
    }
  }
  
  return this.save();
};

// Statics
workoutAnalyticsSchema.statics.getUserWorkoutTrend = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });
};

nutritionAnalyticsSchema.statics.getUserNutritionTrend = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });
};

userInsightsSchema.statics.generateInsights = function(userId, period = 'weekly') {
  // This would contain logic to generate insights based on user data
  return {
    workoutConsistency: { score: 75, streak: 5 },
    nutritionBalance: { score: 80, averageCalories: 1850 },
    progressTrends: { weightChange: -2.5, goalProgress: 60 },
    recommendations: [
      {
        type: 'workout',
        category: 'consistency',
        message: 'Try to work out 4-5 times this week to maintain your streak',
        priority: 3
      }
    ]
  };
};

// Pre-save middleware
trendAnalysisSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create models
const WorkoutAnalytics = mongoose.model('WorkoutAnalytics', workoutAnalyticsSchema);
const NutritionAnalytics = mongoose.model('NutritionAnalytics', nutritionAnalyticsSchema);
const ProgressAnalytics = mongoose.model('ProgressAnalytics', progressAnalyticsSchema);
const UserInsights = mongoose.model('UserInsights', userInsightsSchema);
const AppUsage = mongoose.model('AppUsage', appUsageSchema);
const TrendAnalysis = mongoose.model('TrendAnalysis', trendAnalysisSchema);

module.exports = {
  WorkoutAnalytics,
  NutritionAnalytics,
  ProgressAnalytics,
  UserInsights,
  AppUsage,
  TrendAnalysis
};
