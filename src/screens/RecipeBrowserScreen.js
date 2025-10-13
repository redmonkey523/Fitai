import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES } from '../constants/theme';
import mealPlanningService from '../services/mealPlanningService';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { id: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { id: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { id: 'snack', label: 'Snacks', icon: 'fast-food-outline' },
  { id: 'favorites', label: 'Favorites', icon: 'heart' },
];

const DIETARY_FILTERS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'High-Protein',
];

export default function RecipeBrowserScreen({ navigation, route }) {
  const { onSelect, date, mealType } = route.params || {};
  
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery, selectedCategory, selectedDietary]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      
      let recipesData;
      if (selectedCategory === 'favorites') {
        recipesData = await mealPlanningService.getFavoriteRecipes();
      } else {
        const filters = {};
        if (selectedCategory !== 'all') {
          filters.category = selectedCategory;
        }
        recipesData = await mealPlanningService.searchRecipes(filters);
      }
      
      setRecipes(recipesData);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load recipes',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.ingredients?.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // Dietary filters
    if (selectedDietary.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedDietary.every(diet =>
          recipe.dietaryTags?.includes(diet)
        )
      );
    }

    setFilteredRecipes(filtered);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    loadRecipes();
  };

  const toggleDietaryFilter = (filter) => {
    setSelectedDietary(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleRecipePress = (recipe) => {
    if (onSelect) {
      onSelect(recipe);
      navigation.goBack();
    } else {
      navigation.navigate('RecipeDetail', { recipeId: recipe._id });
    }
  };

  const handleToggleFavorite = async (recipe, event) => {
    event?.stopPropagation();
    
    try {
      await mealPlanningService.toggleRecipeFavorite(recipe._id, recipe.isFavorite);
      
      // Update local state
      setRecipes(prev =>
        prev.map(r =>
          r._id === recipe._id
            ? { ...r, isFavorite: !r.isFavorite }
            : r
        )
      );
      
      Toast.show({
        type: 'success',
        text1: recipe.isFavorite ? 'Removed from favorites' : 'Added to favorites',
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update favorite',
      });
    }
  };

  const renderRecipeCard = (recipe) => {
    return (
      <TouchableOpacity
        key={recipe._id}
        style={styles.recipeCard}
        onPress={() => handleRecipePress(recipe)}
      >
        {recipe.image ? (
          <Image
            source={{ uri: recipe.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.recipeImage, styles.placeholderImage]}>
            <Ionicons name="restaurant-outline" size={40} color={COLORS.textSecondary} />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => handleToggleFavorite(recipe, e)}
        >
          <Ionicons
            name={recipe.isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={recipe.isFavorite ? COLORS.error : COLORS.white}
          />
        </TouchableOpacity>

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName} numberOfLines={2}>
            {recipe.name}
          </Text>
          
          {recipe.description && (
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {recipe.description}
            </Text>
          )}

          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.statText}>
                {recipe.prepTime + recipe.cookTime} min
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.statText}>
                {recipe.nutrition?.calories || 0} cal
              </Text>
            </View>
            
            {recipe.difficulty && (
              <View style={styles.statItem}>
                <Ionicons name="star-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.statText}>{recipe.difficulty}</Text>
              </View>
            )}
          </View>

          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <View style={styles.tagContainer}>
              {recipe.dietaryTags.slice(0, 2).map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {onSelect ? `Select ${mealType || 'Recipe'}` : 'Recipe Browser'}
        </Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('RecipeForm')}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.categoryTabActive,
            ]}
            onPress={() => handleCategoryChange(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={20}
              color={selectedCategory === category.id ? COLORS.white : COLORS.text}
            />
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && styles.categoryLabelActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dietary Filters Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name="options-outline" size={20} color={COLORS.text} />
        <Text style={styles.filterToggleText}>Dietary Filters</Text>
        {selectedDietary.length > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{selectedDietary.length}</Text>
          </View>
        )}
        <Ionicons
          name={showFilters ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.text}
        />
      </TouchableOpacity>

      {/* Dietary Filters */}
      {showFilters && (
        <View style={styles.dietaryFilters}>
          {DIETARY_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.dietaryChip,
                selectedDietary.includes(filter) && styles.dietaryChipActive,
              ]}
              onPress={() => toggleDietaryFilter(filter)}
            >
              <Text
                style={[
                  styles.dietaryChipText,
                  selectedDietary.includes(filter) && styles.dietaryChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recipes Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.recipesGrid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadRecipes();
              }}
            />
          }
        >
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No recipes found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters or create a new recipe
              </Text>
            </View>
          ) : (
            filteredRecipes.map(recipe => renderRecipeCard(recipe))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  categoryScroll: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryLabelActive: {
    color: COLORS.white,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterToggleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  dietaryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
  },
  dietaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dietaryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dietaryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  dietaryChipTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  recipesGrid: {
    padding: 20,
    gap: 16,
  },
  recipeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  recipeImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  recipeInfo: {
    padding: 16,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});


