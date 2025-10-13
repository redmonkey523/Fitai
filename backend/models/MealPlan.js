const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
  },
  meals: {
    breakfast: {
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
      recipeName: String,
      recipeImage: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      customFood: {
        name: String,
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number,
        },
      },
    },
    lunch: {
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
      recipeName: String,
      recipeImage: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      customFood: {
        name: String,
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number,
        },
      },
    },
    dinner: {
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
      recipeName: String,
      recipeImage: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      customFood: {
        name: String,
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number,
        },
      },
    },
    snack: {
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
      recipeName: String,
      recipeImage: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      customFood: {
        name: String,
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number,
        },
      },
    },
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index for userId and date
mealPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);


