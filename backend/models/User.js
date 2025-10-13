const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  
  // Profile Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    required: true
  },
  
  // Physical Information
  height: {
    value: { type: Number, required: false },
    unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
  },
  weight: {
    value: { type: Number, required: false },
    unit: { type: String, enum: ['kg', 'lbs'], default: 'kg' }
  },
  bodyFatPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Fitness Profile
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  goals: [{
    type: String,
    enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'flexibility', 'general_fitness']
  }],
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
    default: 'moderately_active'
  },

  // Goal Quiz Data - Single source of truth
  goalQuiz: {
    primary: {
      type: String,
      enum: ['lose', 'recomp', 'gain'],
      default: null
    },
    pace_kg_per_week: {
      type: Number,
      default: 0
    },
    diet_style: {
      type: String,
      enum: ['balanced', 'high_protein', 'low_carb', 'plant'],
      default: 'balanced'
    }
  },

  // Computed Targets - Derived from profile + goals
  targets: {
    calories: {
      type: Number,
      default: 2000
    },
    protein_g: {
      type: Number,
      default: 150
    },
    carbs_g: {
      type: Number,
      default: 200
    },
    fat_g: {
      type: Number,
      default: 65
    },
    fiber_g: {
      type: Number,
      default: 30
    },
    water_cups: {
      type: Number,
      default: 10
    },
    bmr: {
      type: Number,
      default: 1600
    },
    tdee: {
      type: Number,
      default: 2000
    },
    formula: {
      type: String,
      default: 'mifflin_st_jeor'
    }
  },
  
  // Preferences
  workoutPreferences: {
    preferredTypes: [{
      type: String,
      enum: ['strength', 'cardio', 'hiit', 'yoga', 'pilates', 'sports', 'flexibility']
    }],
    preferredDuration: {
      type: Number,
      min: 10,
      max: 180,
      default: 45
    },
    preferredIntensity: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'moderate'
    },
    availableEquipment: [{
      type: String,
      enum: ['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'cardio_machine', 'gym_access']
    }],
    availableTime: {
      type: Number,
      min: 10,
      max: 180,
      default: 45
    }
  },
  
  // Health Information
  medicalConditions: [{
    condition: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    notes: String
  }],
  injuries: [{
    injury: String,
    bodyPart: String,
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    recoveryDate: Date,
    notes: String
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    notes: String
  }],
  
  // Settings
  notificationSettings: {
    workoutReminders: { type: Boolean, default: true },
    nutritionReminders: { type: Boolean, default: true },
    hydrationReminders: { type: Boolean, default: true },
    progressUpdates: { type: Boolean, default: true },
    socialNotifications: { type: Boolean, default: true },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '08:00' }
    }
  },
  
  // Privacy Settings
  privacySettings: {
    profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    progressVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    workoutVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    allowFriendRequests: { type: Boolean, default: true }
  },
  
  // Social
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Stats
  stats: {
    totalWorkouts: { type: Number, default: 0 },
    totalWorkoutTime: { type: Number, default: 0 }, // in minutes
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalCaloriesBurned: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
  },
  
  // Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: Date
  ,
  trialEndsAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'stats.lastActive': -1 });
userSchema.index({ fitnessLevel: 1, goals: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    firstName: this.firstName,
    lastName: this.lastName,
    profilePicture: this.profilePicture,
    fitnessLevel: this.fitnessLevel,
    goals: this.goals,
    stats: this.stats,
    privacySettings: this.privacySettings
  };
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
