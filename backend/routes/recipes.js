const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const { authenticateToken } = require('../middleware/auth');

// Get all recipes (with filtering and search)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const {
      category,
      difficulty,
      dietaryTags,
      search,
      isPublic,
      myRecipes,
      favorites,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }

    // Filter by dietary tags
    if (dietaryTags) {
      const tags = Array.isArray(dietaryTags) ? dietaryTags : [dietaryTags];
      query.dietaryTags = { $all: tags };
    }

    // Filter by visibility
    if (myRecipes === 'true') {
      query.userId = req.user.userId;
    } else if (favorites === 'true') {
      query.favoritedBy = req.user.userId;
    } else {
      // Show public recipes and user's own recipes
      query.$or = [
        { isPublic: true },
        { userId: req.user.userId },
      ];
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const recipes = await Recipe.find(query)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add isFavorite flag
    const recipesWithFavorite = recipes.map(recipe => ({
      ...recipe,
      isFavorite: recipe.favoritedBy.some(id => id.toString() === req.user.userId),
      isOwner: recipe.userId.toString() === req.user.userId,
    }));

    const total = await Recipe.countDocuments(query);

    res.json({
      recipes: recipesWithFavorite,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

// Get favorites
router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const recipes = await Recipe.find({
      favoritedBy: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const recipesWithFavorite = recipes.map(recipe => ({
      ...recipe,
      isFavorite: true,
      isOwner: recipe.userId.toString() === req.user.userId,
    }));

    res.json(recipesWithFavorite);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Get single recipe
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).lean();

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check access permissions
    if (!recipe.isPublic && recipe.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment views
    await Recipe.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 },
    });

    // Add flags
    recipe.isFavorite = recipe.favoritedBy.some(id => id.toString() === req.user.userId);
    recipe.isOwner = recipe.userId.toString() === req.user.userId;

    res.json(recipe);
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ error: 'Failed to get recipe' });
  }
});

// Create recipe
router.post('/', authenticateToken, async (req, res) => {
  try {
    const recipeData = {
      ...req.body,
      userId: req.user.userId,
    };

    const recipe = new Recipe(recipeData);
    await recipe.save();

    const recipeObj = recipe.toObject();
    recipeObj.isFavorite = false;
    recipeObj.isOwner = true;

    res.status(201).json(recipeObj);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Update recipe
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check ownership
    if (recipe.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update fields
    Object.assign(recipe, req.body);
    await recipe.save();

    const recipeObj = recipe.toObject();
    recipeObj.isFavorite = recipe.favoritedBy.some(id => id.toString() === req.user.userId);
    recipeObj.isOwner = true;

    res.json(recipeObj);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check ownership
    if (recipe.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Recipe.findByIdAndDelete(req.params.id);

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Toggle favorite
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const isFavorite = recipe.favoritedBy.some(id => id.toString() === req.user.userId);

    if (isFavorite) {
      // Remove from favorites
      recipe.favoritedBy = recipe.favoritedBy.filter(
        id => id.toString() !== req.user.userId
      );
    } else {
      // Add to favorites
      recipe.favoritedBy.push(req.user.userId);
    }

    await recipe.save();

    res.json({ isFavorite: !isFavorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Remove favorite (for consistency with frontend)
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    recipe.favoritedBy = recipe.favoritedBy.filter(
      id => id.toString() !== req.user.userId
    );

    await recipe.save();

    res.json({ isFavorite: false });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

module.exports = router;


