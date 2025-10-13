const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
  },
  
  // Creator
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Timing
  prepTime: {
    type: Number, // in minutes
    required: true,
  },
  cookTime: {
    type: Number, // in minutes
    required: true,
  },
  
  // Servings
  servings: {
    type: Number,
    required: true,
    default: 1,
  },
  
  // Classification
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  
  // Dietary Tags
  dietaryTags: [{
    type: String,
    enum: [
      'Vegetarian',
      'Vegan',
      'Gluten-Free',
      'Dairy-Free',
      'Keto',
      'Paleo',
      'Low-Carb',
      'High-Protein',
    ],
  }],
  
  // Ingredients
  ingredients: [{
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'Other',
    },
  }],
  
  // Instructions
  instructions: [{
    type: String,
    required: true,
  }],
  
  // Nutrition per serving
  nutrition: {
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    carbs: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    fiber: {
      type: Number,
      default: 0,
    },
    sugar: {
      type: Number,
      default: 0,
    },
    sodium: {
      type: Number,
      default: 0,
    },
  },
  
  // Additional Info
  notes: {
    type: String,
  },
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: false,
  },
  
  // Favorites tracking
  favoritedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Stats
  views: {
    type: Number,
    default: 0,
  },
  cookCount: {
    type: Number,
    default: 0,
  },
  
}, {
  timestamps: true,
});

// Indexes
recipeSchema.index({ userId: 1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ isPublic: 1 });
recipeSchema.index({ favoritedBy: 1 });
recipeSchema.index({ name: 'text', description: 'text' });

// Virtual for isFavorite (will be set in query)
recipeSchema.virtual('isFavorite').get(function() {
  return this._isFavorite || false;
});

// Ensure virtuals are included in JSON output
recipeSchema.set('toJSON', { virtuals: true });
recipeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Recipe', recipeSchema);


