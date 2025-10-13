const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Basic Information
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'sports', 'yoga', 'pilates'],
    required: true
  },
  
  muscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body', 'core', 'upper_body', 'lower_body'],
    required: true
  }],
  
  primaryMuscleGroup: {
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body', 'core', 'upper_body', 'lower_body'],
    required: true
  },
  
  secondaryMuscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'lower_back', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'full_body', 'core', 'upper_body', 'lower_body']
  }],
  
  // Equipment and Requirements
  equipment: [{
    type: String,
    enum: ['bodyweight', 'dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'treadmill', 'bike', 'rower', 'elliptical', 'yoga_mat', 'foam_roller', 'bench', 'pull_up_bar', 'dip_bars', 'cable_machine', 'smith_machine', 'leg_press', 'lat_pulldown', 'seated_row', 'chest_press', 'shoulder_press', 'leg_extension', 'leg_curl', 'calf_raise', 'ab_crunch', 'roman_chair', 'medicine_ball', 'stability_ball', 'bosu_ball', 'trx', 'battle_ropes', 'sled', 'tire', 'sandbag', 'weight_vest', 'ankle_weights', 'wrist_weights', 'grip_trainer', 'lacrosse_ball', 'tennis_ball', 'mobility_band', 'stretching_strap', 'yoga_block', 'yoga_strap', 'yoga_wheel', 'yoga_bolster', 'yoga_blanket', 'yoga_towel', 'yoga_socks', 'yoga_gloves']
  }],
  
  // Difficulty and Skill Level
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  
  // Instructions and Media
  instructions: [{
    step: { type: Number, required: true },
    description: { type: String, required: true },
    imageUrl: String
  }],
  
  videoUrl: String,
  imageUrl: String,
  gifUrl: String,
  
  // Exercise Metrics
  caloriesPerMinute: {
    type: Number,
    min: 0,
    default: 0
  },
  
  estimatedDuration: {
    type: Number, // in seconds
    min: 0
  },
  
  // Exercise Variations
  variations: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Modifications
  modifications: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Progressions
  progressions: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Regressions
  regressions: [{
    name: String,
    description: String,
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    instructions: [String]
  }],
  
  // Exercise Tips
  tips: [String],
  
  // Exercise Cues
  cues: [String],
  
  // Exercise Warnings
  warnings: [String],
  
  // Exercise Benefits
  benefits: [String],
  
  // Exercise Contraindications
  contraindications: [String],
  
  // Exercise Equipment Setup
  setupInstructions: [String],
  
  // Exercise Safety
  safetyNotes: [String],
  
  // Exercise History
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Exercise Statistics
  stats: {
    timesUsed: { type: Number, default: 0 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, default: 0 },
    difficultyRating: { type: Number, min: 0, max: 5, default: 0 },
    effectivenessRating: { type: Number, min: 0, max: 5, default: 0 }
  },
  
  // Exercise Tags
  tags: [String],
  
  // Exercise Categories for Search
  searchTags: [String],
  
  // Exercise Language Support
  translations: {
    en: { name: String, description: String, instructions: [String] },
    es: { name: String, description: String, instructions: [String] },
    fr: { name: String, description: String, instructions: [String] },
    de: { name: String, description: String, instructions: [String] },
    it: { name: String, description: String, instructions: [String] },
    pt: { name: String, description: String, instructions: [String] },
    ru: { name: String, description: String, instructions: [String] },
    ja: { name: String, description: String, instructions: [String] },
    ko: { name: String, description: String, instructions: [String] },
    zh: { name: String, description: String, instructions: [String] }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ primaryMuscleGroup: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ equipment: 1 });
exerciseSchema.index({ difficulty: 1 });
exerciseSchema.index({ tags: 1 });
exerciseSchema.index({ searchTags: 1 });
exerciseSchema.index({ isPublic: 1, isVerified: 1 });

// Virtual for full description
exerciseSchema.virtual('fullDescription').get(function() {
  return `${this.name} - ${this.category} exercise targeting ${this.primaryMuscleGroup}`;
});

// Method to update usage statistics
exerciseSchema.methods.incrementUsage = function() {
  this.stats.timesUsed += 1;
  return this.save();
};

// Method to add rating
exerciseSchema.methods.addRating = function(rating, difficultyRating, effectivenessRating) {
  const totalRatings = this.stats.totalRatings + 1;
  this.stats.averageRating = ((this.stats.averageRating * this.stats.totalRatings) + rating) / totalRatings;
  this.stats.difficultyRating = ((this.stats.difficultyRating * this.stats.totalRatings) + difficultyRating) / totalRatings;
  this.stats.effectivenessRating = ((this.stats.effectivenessRating * this.stats.totalRatings) + effectivenessRating) / totalRatings;
  this.stats.totalRatings = totalRatings;
  return this.save();
};

// Method to get exercise variations by difficulty
exerciseSchema.methods.getVariationsByDifficulty = function(difficulty) {
  return this.variations.filter(v => v.difficulty === difficulty);
};

// Method to get exercise modifications by difficulty
exerciseSchema.methods.getModificationsByDifficulty = function(difficulty) {
  return this.modifications.filter(m => m.difficulty === difficulty);
};

module.exports = mongoose.model('Exercise', exerciseSchema);
