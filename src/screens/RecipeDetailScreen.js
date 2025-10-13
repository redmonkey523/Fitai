import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES } from '../constants/theme';
import mealPlanningService from '../services/mealPlanningService';

export default function RecipeDetailScreen({ navigation, route }) {
  const { recipeId } = route.params;
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(1);

  useEffect(() => {
    loadRecipe();
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const recipeData = await mealPlanningService.getRecipe(recipeId);
      setRecipe(recipeData);
      setServings(recipeData.servings || 1);
    } catch (error) {
      console.error('Error loading recipe:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load recipe',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await mealPlanningService.toggleRecipeFavorite(recipe._id, recipe.isFavorite);
      setRecipe(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
      
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

  const handleEdit = () => {
    navigation.navigate('RecipeForm', { recipeId: recipe._id, recipe });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mealPlanningService.deleteRecipe(recipe._id);
              Toast.show({
                type: 'success',
                text1: 'Recipe Deleted',
              });
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete recipe',
              });
            }
          },
        },
      ]
    );
  };

  const handleAddToGroceryList = async () => {
    try {
      const scaledIngredients = recipe.ingredients.map(ing => ({
        ...ing,
        quantity: ing.quantity * (servings / recipe.servings),
      }));
      
      await Promise.all(
        scaledIngredients.map(ing =>
          mealPlanningService.addGroceryItem({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category || 'Other',
          })
        )
      );
      
      Toast.show({
        type: 'success',
        text1: 'Added to Grocery List',
        text2: `${scaledIngredients.length} items added`,
      });
    } catch (error) {
      console.error('Error adding to grocery list:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add to grocery list',
      });
    }
  };

  const adjustServings = (delta) => {
    const newServings = Math.max(1, servings + delta);
    setServings(newServings);
  };

  const calculateScaledValue = (originalValue) => {
    if (!originalValue || !recipe.servings) return originalValue;
    return Math.round((originalValue * servings) / recipe.servings);
  };

  const calculateScaledIngredient = (ingredient) => {
    if (!ingredient.quantity || !recipe.servings) return ingredient.quantity;
    const scaled = (ingredient.quantity * servings) / recipe.servings;
    return scaled % 1 === 0 ? scaled : scaled.toFixed(2);
  };

  if (loading || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconButton}>
            <Ionicons
              name={recipe.isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={recipe.isFavorite ? COLORS.error : COLORS.text}
            />
          </TouchableOpacity>
          {recipe.isOwner && (
            <>
              <TouchableOpacity onPress={handleEdit} style={styles.iconButton}>
                <Ionicons name="create-outline" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image */}
        {recipe.image ? (
          <Image source={{ uri: recipe.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="restaurant-outline" size={80} color={COLORS.textSecondary} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Description */}
          <Text style={styles.title}>{recipe.name}</Text>
          {recipe.description && (
            <Text style={styles.description}>{recipe.description}</Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Prep</Text>
              <Text style={styles.statValue}>{recipe.prepTime}m</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="flame-outline" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Cook</Text>
              <Text style={styles.statValue}>{recipe.cookTime}m</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="restaurant-outline" size={24} color={COLORS.primary} />
              <Text style={styles.statLabel}>Servings</Text>
              <View style={styles.servingsControl}>
                <TouchableOpacity onPress={() => adjustServings(-1)}>
                  <Ionicons name="remove-circle-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.statValue}>{servings}</Text>
                <TouchableOpacity onPress={() => adjustServings(1)}>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
            {recipe.difficulty && (
              <View style={styles.statBox}>
                <Ionicons name="star-outline" size={24} color={COLORS.primary} />
                <Text style={styles.statLabel}>Difficulty</Text>
                <Text style={styles.statValue}>{recipe.difficulty}</Text>
              </View>
            )}
          </View>

          {/* Dietary Tags */}
          {recipe.dietaryTags && recipe.dietaryTags.length > 0 && (
            <View style={styles.tagsContainer}>
              {recipe.dietaryTags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Nutrition */}
          {recipe.nutrition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition per Serving</Text>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {calculateScaledValue(recipe.nutrition.calories)}
                  </Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {calculateScaledValue(recipe.nutrition.protein)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {calculateScaledValue(recipe.nutrition.carbs)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>
                    {calculateScaledValue(recipe.nutrition.fat)}g
                  </Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <TouchableOpacity onPress={handleAddToGroceryList} style={styles.addToListButton}>
                <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addToListText}>Add to List</Text>
              </TouchableOpacity>
            </View>
            {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.ingredientText}>
                  {calculateScaledIngredient(ingredient)} {ingredient.unit} {ingredient.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions && recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          {recipe.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{recipe.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
  },
  placeholderImage: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  addToListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  addToListText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  nutritionItem: {
    alignItems: 'center',
    gap: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
  },
});


