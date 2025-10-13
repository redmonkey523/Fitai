/**
 * Meal Planning Service
 * Manages meal plans, recipes, and grocery lists
 */

import api from './api';
import crashReporting from './crashReporting';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  MEAL_PLANS: '@meal_plans_cache',
  RECIPES: '@recipes_cache',
  GROCERY_LIST: '@grocery_list_cache',
  FAVORITES: '@favorite_recipes',
};

class MealPlanningService {
  constructor() {
    this.mealPlans = [];
    this.recipes = [];
    this.groceryList = [];
    this.favorites = new Set();
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      await this.loadFromCache();
      crashReporting.log('Meal planning service initialized', 'info');
    } catch (error) {
      crashReporting.logError(error, { context: 'meal_planning_init' });
    }
  }

  /**
   * Load cached data
   */
  async loadFromCache() {
    try {
      const [plans, recipes, groceries, favorites] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.MEAL_PLANS),
        AsyncStorage.getItem(STORAGE_KEYS.RECIPES),
        AsyncStorage.getItem(STORAGE_KEYS.GROCERY_LIST),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
      ]);

      if (plans) this.mealPlans = JSON.parse(plans);
      if (recipes) this.recipes = JSON.parse(recipes);
      if (groceries) this.groceryList = JSON.parse(groceries);
      if (favorites) this.favorites = new Set(JSON.parse(favorites));
    } catch (error) {
      crashReporting.logError(error, { context: 'meal_planning_load_cache' });
    }
  }

  /**
   * Save to cache
   */
  async saveToCache() {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.MEAL_PLANS, JSON.stringify(this.mealPlans)),
        AsyncStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(this.recipes)),
        AsyncStorage.setItem(STORAGE_KEYS.GROCERY_LIST, JSON.stringify(this.groceryList)),
        AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([...this.favorites])),
      ]);
    } catch (error) {
      crashReporting.logError(error, { context: 'meal_planning_save_cache' });
    }
  }

  // ============ MEAL PLANS ============

  /**
   * Get meal plans for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async getMealPlans(startDate, endDate) {
    try {
      const response = await api.get('/nutrition/meal-plans', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (response.data) {
        this.mealPlans = response.data;
        await this.saveToCache();
      }

      return response.data || [];
    } catch (error) {
      crashReporting.logError(error, { context: 'get_meal_plans' });
      return this.mealPlans;
    }
  }

  /**
   * Get meal plan for a specific date
   * @param {Date} date
   * @returns {Promise<Object|null>}
   */
  async getMealPlanForDate(date) {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await api.get(`/nutrition/meal-plans/${dateStr}`);
      return response.data || null;
    } catch (error) {
      crashReporting.logError(error, { context: 'get_meal_plan_for_date' });
      
      // Fallback to cache
      const dateStr = date.toISOString().split('T')[0];
      return this.mealPlans.find(plan => plan.date === dateStr) || null;
    }
  }

  /**
   * Create or update meal plan
   * @param {Object} mealPlan
   * @returns {Promise<Object>}
   */
  async saveMealPlan(mealPlan) {
    try {
      const response = await api.post('/nutrition/meal-plans', mealPlan);
      
      if (response.data) {
        // Update cache
        const index = this.mealPlans.findIndex(p => p.date === mealPlan.date);
        if (index >= 0) {
          this.mealPlans[index] = response.data;
        } else {
          this.mealPlans.push(response.data);
        }
        await this.saveToCache();
      }

      return response.data;
    } catch (error) {
      crashReporting.logError(error, { context: 'save_meal_plan' });
      throw error;
    }
  }

  /**
   * Delete meal plan
   * @param {string} date - YYYY-MM-DD format
   * @returns {Promise<boolean>}
   */
  async deleteMealPlan(date) {
    try {
      await api.delete(`/nutrition/meal-plans/${date}`);
      
      // Update cache
      this.mealPlans = this.mealPlans.filter(p => p.date !== date);
      await this.saveToCache();
      
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'delete_meal_plan' });
      return false;
    }
  }

  /**
   * Generate meal plan for a week
   * @param {Object} preferences - Diet preferences, calorie target, etc.
   * @returns {Promise<Array>}
   */
  async generateWeeklyMealPlan(preferences) {
    try {
      const response = await api.post('/nutrition/meal-plans/generate', preferences);
      
      if (response.data) {
        // Merge with existing plans
        response.data.forEach(plan => {
          const index = this.mealPlans.findIndex(p => p.date === plan.date);
          if (index >= 0) {
            this.mealPlans[index] = plan;
          } else {
            this.mealPlans.push(plan);
          }
        });
        await this.saveToCache();
      }

      return response.data || [];
    } catch (error) {
      crashReporting.logError(error, { context: 'generate_weekly_meal_plan' });
      throw error;
    }
  }

  // ============ RECIPES ============

  /**
   * Search recipes
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  async searchRecipes(filters = {}) {
    try {
      const response = await api.get('/nutrition/recipes/search', filters);
      
      if (response.data) {
        // Update cache with new recipes
        response.data.forEach(recipe => {
          const index = this.recipes.findIndex(r => r.id === recipe.id);
          if (index >= 0) {
            this.recipes[index] = recipe;
          } else {
            this.recipes.push(recipe);
          }
        });
        await this.saveToCache();
      }

      return response.data || [];
    } catch (error) {
      crashReporting.logError(error, { context: 'search_recipes' });
      return this.recipes;
    }
  }

  /**
   * Get recipe by ID
   * @param {string} recipeId
   * @returns {Promise<Object|null>}
   */
  async getRecipe(recipeId) {
    try {
      const response = await api.get(`/nutrition/recipes/${recipeId}`);
      
      if (response.data) {
        // Update cache
        const index = this.recipes.findIndex(r => r.id === recipeId);
        if (index >= 0) {
          this.recipes[index] = response.data;
        } else {
          this.recipes.push(response.data);
        }
        await this.saveToCache();
      }

      return response.data || null;
    } catch (error) {
      crashReporting.logError(error, { context: 'get_recipe' });
      
      // Fallback to cache
      return this.recipes.find(r => r.id === recipeId) || null;
    }
  }

  /**
   * Create custom recipe
   * @param {Object} recipe
   * @returns {Promise<Object>}
   */
  async createRecipe(recipe) {
    try {
      const response = await api.post('/nutrition/recipes', recipe);
      
      if (response.data) {
        this.recipes.push(response.data);
        await this.saveToCache();
      }

      return response.data;
    } catch (error) {
      crashReporting.logError(error, { context: 'create_recipe' });
      throw error;
    }
  }

  /**
   * Update recipe
   * @param {string} recipeId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateRecipe(recipeId, updates) {
    try {
      const response = await api.put(`/nutrition/recipes/${recipeId}`, updates);
      
      if (response.data) {
        const index = this.recipes.findIndex(r => r.id === recipeId);
        if (index >= 0) {
          this.recipes[index] = response.data;
        }
        await this.saveToCache();
      }

      return response.data;
    } catch (error) {
      crashReporting.logError(error, { context: 'update_recipe' });
      throw error;
    }
  }

  /**
   * Delete recipe
   * @param {string} recipeId
   * @returns {Promise<boolean>}
   */
  async deleteRecipe(recipeId) {
    try {
      await api.delete(`/nutrition/recipes/${recipeId}`);
      
      this.recipes = this.recipes.filter(r => r.id !== recipeId);
      await this.saveToCache();
      
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'delete_recipe' });
      return false;
    }
  }

  /**
   * Toggle recipe favorite
   * @param {string} recipeId
   * @returns {Promise<boolean>}
   */
  async toggleFavorite(recipeId) {
    try {
      const isFavorite = this.favorites.has(recipeId);
      
      if (isFavorite) {
        await api.delete(`/nutrition/recipes/${recipeId}/favorite`);
        this.favorites.delete(recipeId);
      } else {
        await api.post(`/nutrition/recipes/${recipeId}/favorite`);
        this.favorites.add(recipeId);
      }
      
      await this.saveToCache();
      return !isFavorite;
    } catch (error) {
      crashReporting.logError(error, { context: 'toggle_favorite' });
      throw error;
    }
  }

  /**
   * Get favorite recipes
   * @returns {Promise<Array>}
   */
  async getFavoriteRecipes() {
    try {
      const response = await api.get('/nutrition/recipes/favorites');
      
      if (response.data) {
        response.data.forEach(recipe => {
          this.favorites.add(recipe.id);
          const index = this.recipes.findIndex(r => r.id === recipe.id);
          if (index >= 0) {
            this.recipes[index] = recipe;
          } else {
            this.recipes.push(recipe);
          }
        });
        await this.saveToCache();
      }

      return response.data || [];
    } catch (error) {
      crashReporting.logError(error, { context: 'get_favorite_recipes' });
      return this.recipes.filter(r => this.favorites.has(r.id));
    }
  }

  /**
   * Check if recipe is favorite
   * @param {string} recipeId
   * @returns {boolean}
   */
  isFavorite(recipeId) {
    return this.favorites.has(recipeId);
  }

  // ============ GROCERY LISTS ============

  /**
   * Get grocery list
   * @returns {Promise<Array>}
   */
  async getGroceryList() {
    try {
      const response = await api.get('/nutrition/grocery-list');
      
      if (response.data) {
        this.groceryList = response.data;
        await this.saveToCache();
      }

      return response.data || [];
    } catch (error) {
      crashReporting.logError(error, { context: 'get_grocery_list' });
      return this.groceryList;
    }
  }

  /**
   * Generate grocery list from meal plans
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async generateGroceryList(startDate, endDate) {
    try {
      const response = await api.post('/nutrition/grocery-list/generate', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      if (response.data) {
        this.groceryList = response.data;
        await this.saveToCache();
      }

      return response.data || [];
    } catch (error) {
      crashReporting.logError(error, { context: 'generate_grocery_list' });
      throw error;
    }
  }

  /**
   * Add item to grocery list
   * @param {Object} item
   * @returns {Promise<Object>}
   */
  async addGroceryItem(item) {
    try {
      const response = await api.post('/nutrition/grocery-list/items', item);
      
      if (response.data) {
        this.groceryList.push(response.data);
        await this.saveToCache();
      }

      return response.data;
    } catch (error) {
      crashReporting.logError(error, { context: 'add_grocery_item' });
      throw error;
    }
  }

  /**
   * Update grocery item
   * @param {string} itemId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateGroceryItem(itemId, updates) {
    try {
      const response = await api.put(`/nutrition/grocery-list/items/${itemId}`, updates);
      
      if (response.data) {
        const index = this.groceryList.findIndex(i => i.id === itemId);
        if (index >= 0) {
          this.groceryList[index] = response.data;
        }
        await this.saveToCache();
      }

      return response.data;
    } catch (error) {
      crashReporting.logError(error, { context: 'update_grocery_item' });
      throw error;
    }
  }

  /**
   * Delete grocery item
   * @param {string} itemId
   * @returns {Promise<boolean>}
   */
  async deleteGroceryItem(itemId) {
    try {
      await api.delete(`/nutrition/grocery-list/items/${itemId}`);
      
      this.groceryList = this.groceryList.filter(i => i.id !== itemId);
      await this.saveToCache();
      
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'delete_grocery_item' });
      return false;
    }
  }

  /**
   * Toggle grocery item checked
   * @param {string} itemId
   * @returns {Promise<boolean>}
   */
  async toggleGroceryItemChecked(itemId) {
    try {
      const item = this.groceryList.find(i => i.id === itemId);
      if (!item) return false;

      const newChecked = !item.checked;
      await this.updateGroceryItem(itemId, { checked: newChecked });
      
      return newChecked;
    } catch (error) {
      crashReporting.logError(error, { context: 'toggle_grocery_item_checked' });
      return false;
    }
  }

  /**
   * Clear checked items from grocery list
   * @returns {Promise<boolean>}
   */
  async clearCheckedItems() {
    try {
      await api.delete('/nutrition/grocery-list/checked');
      
      this.groceryList = this.groceryList.filter(i => !i.checked);
      await this.saveToCache();
      
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'clear_checked_items' });
      return false;
    }
  }

  /**
   * Clear entire grocery list
   * @returns {Promise<boolean>}
   */
  async clearGroceryList() {
    try {
      await api.delete('/nutrition/grocery-list');
      
      this.groceryList = [];
      await this.saveToCache();
      
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'clear_grocery_list' });
      return false;
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Calculate nutrition totals for a day
   * @param {Object} mealPlan
   * @returns {Object}
   */
  calculateDayNutrition(mealPlan) {
    if (!mealPlan || !mealPlan.meals) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
    }

    return mealPlan.meals.reduce((total, meal) => {
      if (meal.recipe && meal.recipe.nutrition) {
        const nutrition = meal.recipe.nutrition;
        return {
          calories: total.calories + (nutrition.calories || 0),
          protein: total.protein + (nutrition.protein || 0),
          carbs: total.carbs + (nutrition.carbs || 0),
          fat: total.fat + (nutrition.fat || 0),
          fiber: total.fiber + (nutrition.fiber || 0),
        };
      }
      return total;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  }

  /**
   * Get cached data
   * @returns {Object}
   */
  getCachedData() {
    return {
      mealPlans: this.mealPlans,
      recipes: this.recipes,
      groceryList: this.groceryList,
      favorites: [...this.favorites],
    };
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.MEAL_PLANS),
        AsyncStorage.removeItem(STORAGE_KEYS.RECIPES),
        AsyncStorage.removeItem(STORAGE_KEYS.GROCERY_LIST),
        AsyncStorage.removeItem(STORAGE_KEYS.FAVORITES),
      ]);
      
      this.mealPlans = [];
      this.recipes = [];
      this.groceryList = [];
      this.favorites = new Set();
      
      crashReporting.log('Meal planning cache cleared', 'info');
    } catch (error) {
      crashReporting.logError(error, { context: 'clear_meal_planning_cache' });
    }
  }
}

// Export singleton
const mealPlanningService = new MealPlanningService();
export default mealPlanningService;


