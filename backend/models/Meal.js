const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, maxlength: 2000 },
  ingredients: [ingredientSchema],
  instructions: [{ type: String, trim: true }],
  servingSize: { amount: { type: Number, default: 1 }, unit: { type: String, default: 'serving' } },
  nutrition: {
    calories: { type: Number, default: 0 }, protein: { type: Number, default: 0 }, carbs: { type: Number, default: 0 }, fat: { type: Number, default: 0 }
  },
  tags: [{ type: String, trim: true, lowercase: true }],
  isPublic: { type: Boolean, default: false }
}, { timestamps: true });

recipeSchema.index({ title: 'text', tags: 'text' });

const mealItemSchema = new mongoose.Schema({
  date: { type: Date, required: true, index: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  servings: { type: Number, default: 1, min: 0 }
}, { _id: false });

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [mealItemSchema],
  goal: { type: String, enum: ['weight_loss', 'muscle_gain', 'endurance', 'strength', 'general_fitness'] },
  macroTargets: { calories: Number, protein: Number, carbs: Number, fat: Number }
}, { timestamps: true });

const Recipe = mongoose.model('Recipe', recipeSchema);
const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

module.exports = { Recipe, MealPlan };


