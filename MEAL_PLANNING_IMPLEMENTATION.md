# 🍽️ Meal Planning System - Implementation Guide

## ✅ Phase 1: Core Services (COMPLETE)

### Files Created

1. **`src/services/mealPlanningService.js`** (660 lines)
   - Complete meal planning service
   - Recipe management
   - Grocery list handling
   - Local caching with AsyncStorage
   - Error handling with crashReporting

2. **`src/services/api.js`** (Updated)
   - Added 22 new meal planning API methods
   - Full CRUD operations for meal plans
   - Recipe search and management
   - Grocery list generation

---

## 🎯 Features Implemented

### Meal Planning Service

#### Meal Plans ✅
- `getMealPlans(startDate, endDate)` - Get meal plans for date range
- `getMealPlanForDate(date)` - Get specific day's meal plan
- `saveMealPlan(mealPlan)` - Create/update meal plan
- `deleteMealPlan(date)` - Delete meal plan
- `generateWeeklyMealPlan(preferences)` - AI-generated meal plans

#### Recipes ✅
- `searchRecipes(filters)` - Search with filters (diet, calories, etc.)
- `getRecipe(recipeId)` - Get full recipe details
- `createRecipe(recipe)` - Create custom recipe
- `updateRecipe(recipeId, updates)` - Update recipe
- `deleteRecipe(recipeId)` - Delete recipe
- `toggleFavorite(recipeId)` - Add/remove from favorites
- `getFavoriteRecipes()` - Get all favorites
- `isFavorite(recipeId)` - Check favorite status

#### Grocery Lists ✅
- `getGroceryList()` - Get current grocery list
- `generateGroceryList(startDate, endDate)` - Auto-generate from meal plans
- `addGroceryItem(item)` - Add item manually
- `updateGroceryItem(itemId, updates)` - Update item
- `deleteGroceryItem(itemId)` - Delete item
- `toggleGroceryItemChecked(itemId)` - Check/uncheck item
- `clearCheckedItems()` - Remove checked items
- `clearGroceryList()` - Clear entire list

#### Utilities ✅
- `calculateDayNutrition(mealPlan)` - Calculate daily macros
- `getCachedData()` - Get all cached data
- `clearCache()` - Clear all cache
- Local caching with AsyncStorage
- Automatic sync with backend
- Offline support with fallback to cache

---

## 📊 Data Structures

### Meal Plan Object
```javascript
{
  id: 'plan_123',
  date: '2025-10-10', // YYYY-MM-DD
  meals: [
    {
      id: 'meal_1',
      type: 'breakfast', // breakfast | lunch | dinner | snack
      recipe: {
        id: 'recipe_123',
        name: 'Protein Oatmeal',
        image: 'https://...',
        prepTime: 10, // minutes
        cookTime: 5,
        servings: 1,
        nutrition: {
          calories: 350,
          protein: 25,
          carbs: 45,
          fat: 8,
          fiber: 6,
        },
        ingredients: [
          {
            name: 'Oats',
            amount: 0.5,
            unit: 'cup',
            category: 'grains',
          },
          {
            name: 'Protein powder',
            amount: 1,
            unit: 'scoop',
            category: 'protein',
          },
        ],
        instructions: [
          'Combine oats and water in a bowl',
          'Microwave for 2 minutes',
          'Stir in protein powder',
        ],
        tags: ['high-protein', 'quick', 'breakfast'],
      },
      scheduledTime: '08:00',
      completed: false,
    },
    // ... more meals
  ],
  totalNutrition: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 30,
  },
}
```

### Recipe Object
```javascript
{
  id: 'recipe_123',
  name: 'Grilled Chicken Salad',
  description: 'Healthy high-protein salad',
  image: 'https://...',
  author: 'user_456',
  isPublic: true,
  prepTime: 15,
  cookTime: 20,
  totalTime: 35,
  servings: 2,
  difficulty: 'easy', // easy | medium | hard
  nutrition: {
    calories: 450,
    protein: 40,
    carbs: 30,
    fat: 18,
    fiber: 8,
    sugar: 5,
    sodium: 450, // mg
  },
  ingredients: [
    {
      name: 'Chicken breast',
      amount: 6,
      unit: 'oz',
      category: 'protein',
      notes: 'boneless, skinless',
    },
    {
      name: 'Mixed greens',
      amount: 2,
      unit: 'cups',
      category: 'vegetables',
    },
  ],
  instructions: [
    {
      step: 1,
      text: 'Season chicken with salt and pepper',
      time: 2,
    },
    {
      step: 2,
      text: 'Grill chicken for 6-8 minutes per side',
      time: 15,
    },
    {
      step: 3,
      text: 'Let rest 5 minutes, then slice',
      time: 5,
    },
    {
      step: 4,
      text: 'Arrange greens on plate, top with chicken',
      time: 2,
    },
  ],
  tags: ['high-protein', 'low-carb', 'gluten-free', 'lunch', 'dinner'],
  dietaryInfo: {
    vegetarian: false,
    vegan: false,
    glutenFree: true,
    dairyFree: true,
    lowCarb: true,
    keto: false,
  },
  allergens: [],
  cuisine: 'American',
  mealType: ['lunch', 'dinner'],
  favorites: 45,
  rating: 4.5,
  reviews: 12,
  createdAt: '2025-10-01T10:00:00Z',
  updatedAt: '2025-10-09T14:00:00Z',
}
```

### Grocery List Item
```javascript
{
  id: 'item_123',
  name: 'Chicken breast',
  amount: 2,
  unit: 'lbs',
  category: 'protein', // protein | vegetables | fruits | grains | dairy | other
  checked: false,
  notes: 'boneless, skinless',
  fromRecipe: 'recipe_456', // optional
  addedAt: '2025-10-09T10:00:00Z',
}
```

---

## 🏗️ Next Steps: UI Screens

### Priority 1: Meal Plan Screen (Main View)

**File to Create:** `src/screens/MealPlanScreen.js`

**Features:**
- Weekly calendar view
- Daily meal cards (breakfast, lunch, dinner, snacks)
- Nutrition summary per day
- Add/edit/delete meals
- Generate AI meal plan button
- Navigate to recipe details
- Generate grocery list button

**UI Components:**
```
┌─────────────────────────────────────────┐
│  Meal Plan          [+ Add] [Generate] │
├─────────────────────────────────────────┤
│  Oct 7-13, 2025    < Today >           │
│  ┌─────────────────────────────────┐   │
│  │ Mon 7  Tue 8  Wed 9*  Thu 10... │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Wednesday, October 9                  │
│  🎯 2,150 / 2,000 kcal                 │
│  💪 145 / 150g protein                 │
│                                         │
│  🌅 Breakfast                          │
│  ┌────────────────────────────────┐    │
│  │ [Image] Protein Oatmeal        │    │
│  │ 350 cal • 25g protein          │    │
│  │ ⏱️ 15 min                       │    │
│  └────────────────────────────────┘    │
│                                         │
│  🌞 Lunch                              │
│  ┌────────────────────────────────┐    │
│  │ [Image] Grilled Chicken Salad  │    │
│  │ 450 cal • 40g protein          │    │
│  └────────────────────────────────┘    │
│                                         │
│  🌙 Dinner                             │
│  ┌────────────────────────────────┐    │
│  │ [+ Add Meal]                   │    │
│  └────────────────────────────────┘    │
│                                         │
│  [📋 Generate Grocery List]            │
└─────────────────────────────────────────┘
```

### Priority 2: Recipe Browser Screen

**File to Create:** `src/screens/RecipeBrowserScreen.js`

**Features:**
- Search recipes
- Filter by diet, cuisine, meal type, cook time
- View recipe cards
- Favorite recipes
- Navigate to recipe details

**UI:**
```
┌─────────────────────────────────────────┐
│  Recipes               [🔍 Search]      │
├─────────────────────────────────────────┤
│  🔥 Popular  ⭐ Favorites  📝 My Recipes│
│                                         │
│  Filters: All ▾  Quick ▾  High Protein │
│                                         │
│  ┌─────────────────┐ ┌───────────────┐ │
│  │ [Image]         │ │ [Image]       │ │
│  │ Protein Bowl    │ │ Chicken Wrap  │ │
│  │ 450 cal         │ │ 380 cal       │ │
│  │ ❤️ 25min         │ │ ❤️ 20min       │ │
│  └─────────────────┘ └───────────────┘ │
│  ┌─────────────────┐ ┌───────────────┐ │
│  │ [Image]         │ │ [Image]       │ │
│  │ Salmon & Rice   │ │ Veggie Stir-  │ │
│  │ 520 cal         │ │ fry 320 cal   │ │
│  │ ❤️ 30min         │ │ ❤️ 15min       │ │
│  └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────┘
```

### Priority 3: Recipe Detail Screen

**File to Create:** `src/screens/RecipeDetailScreen.js`

**Features:**
- Full recipe display
- Ingredients list
- Step-by-step instructions
- Nutrition facts
- Servings adjuster
- Add to meal plan
- Add ingredients to grocery list
- Favorite button
- Share recipe

**UI:**
```
┌─────────────────────────────────────────┐
│  [< Back]              [❤️] [Share]     │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │        [Recipe Image]           │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Grilled Chicken Salad                 │
│  ⭐⭐⭐⭐☆ 4.5 (12 reviews)              │
│                                         │
│  ⏱️ 35 min  👥 2 servings  🔥 Medium    │
│                                         │
│  📊 Nutrition (per serving)            │
│  450 cal  40g protein  30g carbs       │
│                                         │
│  🥘 Ingredients                         │
│  ☐ 6 oz Chicken breast                 │
│  ☐ 2 cups Mixed greens                 │
│  ☐ 1 tbsp Olive oil                    │
│  [+ Add All to Grocery List]           │
│                                         │
│  📝 Instructions                        │
│  1. Season chicken with salt...        │
│  2. Grill chicken for 6-8 min...       │
│  3. Let rest 5 minutes...              │
│                                         │
│  [Add to Meal Plan]                    │
└─────────────────────────────────────────┘
```

### Priority 4: Grocery List Screen

**File to Create:** `src/screens/GroceryListScreen.js`

**Features:**
- Categorized items (Protein, Vegetables, etc.)
- Check/uncheck items
- Add custom items
- Clear checked items
- Share list
- Generate from meal plan

**UI:**
```
┌─────────────────────────────────────────┐
│  Grocery List          [+ Add] [Clear] │
├─────────────────────────────────────────┤
│  12 items  •  5 checked                │
│  [Generate from Meal Plan]             │
│                                         │
│  🥩 Protein (3 items)                  │
│  ☑️ Chicken breast (2 lbs)             │
│  ☐ Ground beef (1 lb)                  │
│  ☐ Eggs (1 dozen)                      │
│                                         │
│  🥗 Vegetables (4 items)               │
│  ☑️ Mixed greens (1 bag)               │
│  ☐ Tomatoes (4)                        │
│  ☐ Bell peppers (2)                    │
│  ☐ Onion (1)                           │
│                                         │
│  🍞 Grains (2 items)                   │
│  ☑️ Brown rice (1 bag)                 │
│  ☐ Whole wheat bread (1 loaf)          │
│                                         │
│  🥛 Dairy (2 items)                    │
│  ☑️ Greek yogurt (32 oz)               │
│  ☑️ Milk (1 gallon)                    │
│                                         │
│  [Share List] [Export]                 │
└─────────────────────────────────────────┘
```

### Priority 5: Create Recipe Screen

**File to Create:** `src/screens/CreateRecipeScreen.js`

**Features:**
- Recipe name and description
- Upload photo
- Add ingredients
- Add instructions
- Set nutrition info (manual or calculated)
- Set tags and dietary info
- Save as private or public

---

## 📡 Backend Implementation Needed

### File to Create: `backend/routes/mealPlans.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET /api/nutrition/meal-plans
router.get('/', authenticateToken, async (req, res) => {
  // Get meal plans for date range
});

// GET /api/nutrition/meal-plans/:date
router.get('/:date', authenticateToken, async (req, res) => {
  // Get meal plan for specific date
});

// POST /api/nutrition/meal-plans
router.post('/', authenticateToken, async (req, res) => {
  // Create/update meal plan
});

// DELETE /api/nutrition/meal-plans/:date
router.delete('/:date', authenticateToken, async (req, res) => {
  // Delete meal plan
});

// POST /api/nutrition/meal-plans/generate
router.post('/generate', authenticateToken, async (req, res) => {
  // Generate AI meal plan for week
  // Use OpenAI or similar to generate based on:
  // - User's calorie target
  // - Dietary preferences
  // - Macro targets
  // - Cuisine preferences
});

module.exports = router;
```

### File to Create: `backend/routes/recipes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET /api/nutrition/recipes/search
router.get('/search', authenticateToken, async (req, res) => {
  // Search recipes with filters
});

// GET /api/nutrition/recipes/:id
router.get('/:id', authenticateToken, async (req, res) => {
  // Get recipe details
});

// POST /api/nutrition/recipes
router.post('/', authenticateToken, async (req, res) => {
  // Create custom recipe
});

// PUT /api/nutrition/recipes/:id
router.put('/:id', authenticateToken, async (req, res) => {
  // Update recipe
});

// DELETE /api/nutrition/recipes/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  // Delete recipe
});

// POST /api/nutrition/recipes/:id/favorite
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  // Add to favorites
});

// DELETE /api/nutrition/recipes/:id/favorite
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  // Remove from favorites
});

// GET /api/nutrition/recipes/favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  // Get user's favorite recipes
});

module.exports = router;
```

### File to Create: `backend/routes/groceryList.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET /api/nutrition/grocery-list
router.get('/', authenticateToken, async (req, res) => {
  // Get user's grocery list
});

// POST /api/nutrition/grocery-list/generate
router.post('/generate', authenticateToken, async (req, res) => {
  // Generate grocery list from meal plans
  // Aggregate all ingredients from date range
  // Group by category
  // Combine duplicate items
});

// POST /api/nutrition/grocery-list/items
router.post('/items', authenticateToken, async (req, res) => {
  // Add item to grocery list
});

// PUT /api/nutrition/grocery-list/items/:id
router.put('/items/:id', authenticateToken, async (req, res) => {
  // Update grocery item
});

// DELETE /api/nutrition/grocery-list/items/:id
router.delete('/items/:id', authenticateToken, async (req, res) => {
  // Delete grocery item
});

// DELETE /api/nutrition/grocery-list/checked
router.delete('/checked', authenticateToken, async (req, res) => {
  // Clear all checked items
});

// DELETE /api/nutrition/grocery-list
router.delete('/', authenticateToken, async (req, res) => {
  // Clear entire grocery list
});

module.exports = router;
```

### Database Models Needed

**`backend/models/MealPlan.js`**
```javascript
const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  meals: [{
    type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    scheduledTime: String,
    completed: { type: Boolean, default: false },
    notes: String,
  }],
  totalNutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
  },
}, { timestamps: true });

mealPlanSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
```

**`backend/models/Recipe.js`**
```javascript
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: false },
  prepTime: Number,
  cookTime: Number,
  totalTime: Number,
  servings: Number,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
  },
  ingredients: [{
    name: String,
    amount: Number,
    unit: String,
    category: String,
    notes: String,
  }],
  instructions: [{
    step: Number,
    text: String,
    time: Number,
  }],
  tags: [String],
  dietaryInfo: {
    vegetarian: Boolean,
    vegan: Boolean,
    glutenFree: Boolean,
    dairyFree: Boolean,
    lowCarb: Boolean,
    keto: Boolean,
  },
  allergens: [String],
  cuisine: String,
  mealType: [String],
  favorites: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
}, { timestamps: true });

recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ author: 1, isPublic: 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
```

**`backend/models/GroceryList.js`**
```javascript
const mongoose = require('mongoose');

const groceryListSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name: { type: String, required: true },
    amount: Number,
    unit: String,
    category: { type: String, enum: ['protein', 'vegetables', 'fruits', 'grains', 'dairy', 'other'] },
    checked: { type: Boolean, default: false },
    notes: String,
    fromRecipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
    addedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

groceryListSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model('GroceryList', groceryListSchema);
```

---

## ✅ Current Status

### Completed ✅
- [x] Meal planning service (660 lines)
- [x] API integration (22 methods)
- [x] Data structures defined
- [x] Local caching system
- [x] Error handling
- [x] Offline support

### In Progress 🔄
- [ ] UI Screens (5 screens needed)
- [ ] Backend routes (3 route files)
- [ ] Database models (3 models)
- [ ] Navigation integration
- [ ] Testing

### Estimated Time to Complete
- **UI Screens:** 2-3 hours
- **Backend Implementation:** 2-3 hours
- **Testing & Polish:** 1-2 hours
- **Total:** 5-8 hours

---

## 🚀 Quick Start Guide

### For Developers: Using the Service

```javascript
import mealPlanningService from './services/mealPlanningService';

// Initialize
await mealPlanningService.initialize();

// Get this week's meal plans
const today = new Date();
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
const plans = await mealPlanningService.getMealPlans(today, nextWeek);

// Search recipes
const recipes = await mealPlanningService.searchRecipes({
  query: 'chicken',
  diet: 'high-protein',
  maxCookTime: 30,
});

// Generate grocery list
const groceryList = await mealPlanningService.generateGroceryList(today, nextWeek);

// Add item to grocery list
await mealPlanningService.addGroceryItem({
  name: 'Bananas',
  amount: 6,
  unit: 'pieces',
  category: 'fruits',
});
```

---

## 📝 Next Implementation Steps

### Step 1: Create UI Screens
1. MealPlanScreen.js
2. RecipeBrowserScreen.js
3. RecipeDetailScreen.js
4. GroceryListScreen.js
5. CreateRecipeScreen.js

### Step 2: Add Navigation
Add screens to TabNavigator or StackNavigator

### Step 3: Backend Implementation
1. Create database models
2. Create route handlers
3. Implement AI meal plan generation
4. Test API endpoints

### Step 4: Integration Testing
1. Test service → API → backend flow
2. Test offline caching
3. Test error scenarios

### Step 5: Polish
1. Add animations
2. Add empty states
3. Add loading skeletons
4. Improve error messages

---

**Phase 1 Status:** ✅ **COMPLETE**  
**Overall Progress:** 40% complete  
**Next Priority:** UI Screens implementation

Would you like me to continue with the UI screens or backend implementation?


