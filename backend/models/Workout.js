const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'sports'],
    required: true
  },
  muscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body']
  }],
  equipment: [{
    type: String,
    enum: ['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'treadmill', 'bike', 'rower', 'elliptical', 'yoga_mat', 'foam_roller']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  instructions: [String],
  videoUrl: String,
  imageUrl: String,
  caloriesPerMinute: {
    type: Number,
    default: 0
  }
});

const setSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  reps: {
    type: Number,
    min: 0
  },
  weight: {
    type: Number,
    min: 0
  },
  duration: {
    type: Number, // in seconds
    min: 0
  },
  distance: {
    type: Number, // in meters
    min: 0
  },
  restTime: {
    type: Number, // in seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: String
});

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Workout Information
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['strength', 'cardio', 'hiit', 'yoga', 'pilates', 'sports', 'flexibility', 'custom'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  
  // Workout Structure
  exercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    sets: [setSchema],
    order: {
      type: Number,
      required: true
    },
    restBetweenSets: {
      type: Number, // in seconds
      default: 60
    }
  }],
  
  // Workout Session Data
  session: {
    startTime: Date,
    endTime: Date,
    actualDuration: Number, // in minutes
    completed: {
      type: Boolean,
      default: false
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    caloriesBurned: {
      type: Number,
      default: 0
    },
    averageHeartRate: Number,
    maxHeartRate: Number,
    notes: String
  },
  
  // Performance Metrics
  performance: {
    totalSets: { type: Number, default: 0 },
    completedSets: { type: Number, default: 0 },
    totalReps: { type: Number, default: 0 },
    totalWeight: { type: Number, default: 0 }, // in kg
    totalDistance: { type: Number, default: 0 }, // in meters
    averageIntensity: { type: Number, min: 1, max: 10 },
    perceivedExertion: { type: Number, min: 1, max: 10 }
  },
  
  // Workout Template
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateName: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // AI Recommendations
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiReason: String,
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  
  // Social
  shared: {
    type: Boolean,
    default: false
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Tags and Categories
  tags: [String],
  equipment: [String],
  muscleGroups: [String],
  
  // Weather and Environment
  weather: {
    temperature: Number,
    conditions: String,
    location: String
  },
  
  // Health Data
  healthData: {
    preWorkoutWeight: Number,
    postWorkoutWeight: Number,
    hydrationLevel: { type: Number, min: 1, max: 10 },
    sleepQuality: { type: Number, min: 1, max: 10 },
    stressLevel: { type: Number, min: 1, max: 10 },
    energyLevel: { type: Number, min: 1, max: 10 }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
workoutSchema.index({ user: 1, createdAt: -1 });
workoutSchema.index({ user: 1, 'session.startTime': -1 });
workoutSchema.index({ type: 1, difficulty: 1 });
workoutSchema.index({ isTemplate: 1, isPublic: 1 });

// Virtual for workout status
workoutSchema.virtual('status').get(function() {
  if (!this.session.startTime) return 'planned';
  if (!this.session.endTime) return 'in_progress';
  if (this.session.completed) return 'completed';
  return 'incomplete';
});

// Virtual for workout efficiency
workoutSchema.virtual('efficiency').get(function() {
  if (!this.session.actualDuration || !this.duration) return 0;
  return Math.min(1, this.session.actualDuration / this.duration);
});

// Method to start workout session
workoutSchema.methods.startSession = function() {
  this.session.startTime = new Date();
  this.session.completed = false;
  return this.save();
};

// Method to end workout session
workoutSchema.methods.endSession = function(completionData = {}) {
  this.session.endTime = new Date();
  this.session.actualDuration = Math.round((this.session.endTime - this.session.startTime) / (1000 * 60));
  this.session.completed = completionData.completed || false;
  this.session.completionRate = completionData.completionRate || 0;
  this.session.caloriesBurned = completionData.caloriesBurned || 0;
  this.session.notes = completionData.notes || '';
  
  // Calculate performance metrics
  this.calculatePerformanceMetrics();
  
  return this.save();
};

// Method to calculate performance metrics
workoutSchema.methods.calculatePerformanceMetrics = function() {
  let totalSets = 0;
  let completedSets = 0;
  let totalReps = 0;
  let totalWeight = 0;
  let totalDistance = 0;
  
  this.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      totalSets++;
      if (set.completed) {
        completedSets++;
        if (set.reps) totalReps += set.reps;
        if (set.weight) totalWeight += set.weight;
        if (set.distance) totalDistance += set.distance;
      }
    });
  });
  
  this.performance = {
    totalSets,
    completedSets,
    totalReps,
    totalWeight,
    totalDistance,
    averageIntensity: this.performance?.averageIntensity || 5,
    perceivedExertion: this.performance?.perceivedExertion || 5
  };
};

// Method to add exercise to workout
workoutSchema.methods.addExercise = function(exerciseId, sets = []) {
  const order = this.exercises.length + 1;
  this.exercises.push({
    exercise: exerciseId,
    sets,
    order,
    restBetweenSets: 60
  });
  return this.save();
};

// Method to update set completion
workoutSchema.methods.updateSetCompletion = function(exerciseIndex, setIndex, completed, data = {}) {
  if (this.exercises[exerciseIndex] && this.exercises[exerciseIndex].sets[setIndex]) {
    const set = this.exercises[exerciseIndex].sets[setIndex];
    set.completed = completed;
    if (data.reps) set.reps = data.reps;
    if (data.weight) set.weight = data.weight;
    if (data.duration) set.duration = data.duration;
    if (data.distance) set.distance = data.distance;
    if (data.notes) set.notes = data.notes;
  }
  return this.save();
};

module.exports = mongoose.model('Workout', workoutSchema);
