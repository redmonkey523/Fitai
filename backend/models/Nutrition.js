const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Food identification
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  brand: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  barcode: {
    type: String,
    trim: true,
    maxlength: 50,
    sparse: true
  },
  
  // Serving information
  servingSize: {
    amount: {
      type: Number,
      required: true,
      min: 0.1
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    }
  },
  
  // Nutrition facts
  nutrition: {
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      min: 0,
      default: 0
    },
    carbs: {
      type: Number,
      min: 0,
      default: 0
    },
    fat: {
      type: Number,
      min: 0,
      default: 0
    },
    fiber: {
      type: Number,
      min: 0,
      default: 0
    },
    sugar: {
      type: Number,
      min: 0,
      default: 0
    },
    sodium: {
      type: Number,
      min: 0,
      default: 0
    },
    cholesterol: {
      type: Number,
      min: 0,
      default: 0
    },
    saturatedFat: {
      type: Number,
      min: 0,
      default: 0
    },
    transFat: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // Meal categorization
  mealType: {
    type: String,
    required: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'snack'
  },
  
  // Consumption details
  consumedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Additional information
  ingredients: [{
    type: String,
    trim: true
  }],
  
  allergens: [{
    type: String,
    trim: true
  }],
  
  // Media and verification
  photo: {
    url: String,
    thumbnail: String
  },
  
  nutritionGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E', null],
    default: null
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  source: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Manual Entry'
  },
  
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  
  // Special flags
  isWater: {
    type: Boolean,
    default: false
  },
  
  isCommonFood: {
    type: Boolean,
    default: false
  },
  
  // User notes
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // AI recognition data
  aiData: {
    recognizedFood: String,
    confidence: Number,
    alternatives: [String],
    processingTime: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
nutritionSchema.index({ userId: 1, consumedAt: -1 });
nutritionSchema.index({ userId: 1, mealType: 1, consumedAt: -1 });
nutritionSchema.index({ name: 'text', brand: 'text' });
// nutritionSchema.index({ barcode: 1 }); // Removed duplicate index
nutritionSchema.index({ isCommonFood: 1, name: 1 });

// Virtual for total calories (serving size adjusted)
nutritionSchema.virtual('totalCalories').get(function() {
  return this.nutrition.calories * this.servingSize.amount;
});

// Virtual for total protein (serving size adjusted)
nutritionSchema.virtual('totalProtein').get(function() {
  return this.nutrition.protein * this.servingSize.amount;
});

// Virtual for total carbs (serving size adjusted)
nutritionSchema.virtual('totalCarbs').get(function() {
  return this.nutrition.carbs * this.servingSize.amount;
});

// Virtual for total fat (serving size adjusted)
nutritionSchema.virtual('totalFat').get(function() {
  return this.nutrition.fat * this.servingSize.amount;
});

// Method to get formatted serving size
nutritionSchema.methods.getFormattedServingSize = function() {
  return `${this.servingSize.amount} ${this.servingSize.unit}`;
};

// Method to get nutrition summary
nutritionSchema.methods.getNutritionSummary = function() {
  return {
    calories: this.totalCalories,
    protein: this.totalProtein,
    carbs: this.totalCarbs,
    fat: this.totalFat,
    fiber: this.nutrition.fiber * this.servingSize.amount,
    sugar: this.nutrition.sugar * this.servingSize.amount,
    sodium: this.nutrition.sodium * this.servingSize.amount
  };
};

// Static method to get daily nutrition summary
nutritionSchema.statics.getDailySummary = async function(userId, date) {
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setDate(endOfDay.getDate() + 1);
  
  const entries = await this.find({
    userId,
    consumedAt: { $gte: startOfDay, $lt: endOfDay }
  });
  
  return entries.reduce((summary, entry) => {
    const nutrition = entry.getNutritionSummary();
    summary.calories += nutrition.calories;
    summary.protein += nutrition.protein;
    summary.carbs += nutrition.carbs;
    summary.fat += nutrition.fat;
    summary.fiber += nutrition.fiber;
    summary.sugar += nutrition.sugar;
    summary.sodium += nutrition.sodium;
    summary.entries += 1;
    return summary;
  }, {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    entries: 0
  });
};

// Static method to search foods
nutritionSchema.statics.searchFoods = async function(query, limit = 10) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    $or: [
      { name: searchRegex },
      { brand: searchRegex }
    ],
    isCommonFood: true
  })
  .select('name brand servingSize nutrition')
  .limit(limit)
  .sort({ verified: -1, confidence: -1 });
};

// Pre-save middleware to validate nutrition data
nutritionSchema.pre('save', function(next) {
  // Ensure at least one macronutrient is present
  if (!this.nutrition.protein && !this.nutrition.carbs && !this.nutrition.fat) {
    return next(new Error('At least one macronutrient (protein, carbs, or fat) must be specified'));
  }
  
  // Validate serving size
  if (this.servingSize.amount <= 0) {
    return next(new Error('Serving amount must be greater than 0'));
  }
  
  next();
});

// Pre-save middleware to update confidence based on verification
nutritionSchema.pre('save', function(next) {
  if (this.verified) {
    this.confidence = Math.max(this.confidence, 0.9);
  }
  next();
});

module.exports = mongoose.model('Nutrition', nutritionSchema);
