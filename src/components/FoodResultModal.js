import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import aiService from '../services/aiService';

const FoodResultModal = ({ 
  foodData, 
  onAddToMeal, 
  onClose, 
  visible 
}) => {
  const [servingSize, setServingSize] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');

  // Early return if not visible or no food data
  if (!visible || !foodData) return null;

  // Validate foodData structure
  const validatedFoodData = {
    name: foodData.name || 'Unknown Food',
    brand: foodData.brand || 'Unknown Brand',
    confidence: foodData.confidence || 0,
    nutrition: foodData.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
    ingredients: foodData.ingredients || [],
    allergens: foodData.allergens || [],
    photo: foodData.photo,
    nutritionGrade: foodData.nutritionGrade,
    verified: foodData.verified || false,
    source: foodData.source || 'AI Recognition'
  };

  // Calculate nutrition facts with error handling
  let nutrition;
  let macroPercentages;
  
  try {
    nutrition = aiService.calculateNutritionFacts(validatedFoodData, servingSize);
    macroPercentages = aiService.getMacroPercentages(nutrition);
  } catch (error) {
    console.error('Error calculating nutrition facts:', error);
    nutrition = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, servingSize: `${servingSize}g` };
    macroPercentages = { protein: 0, carbs: 0, fat: 0 };
  }

  const handleServingSizeChange = (newSize) => {
    try {
      const clampedSize = Math.max(10, Math.min(1000, newSize));
      setServingSize(clampedSize);
    } catch (error) {
      console.error('Error changing serving size:', error);
    }
  };

  const handleAddToMeal = () => {
    try {
      const adjustedFoodData = {
        ...validatedFoodData,
        nutrition: nutrition,
        servingSize: servingSize,
        meal: selectedMeal
      };
      
      if (onAddToMeal && typeof onAddToMeal === 'function') {
        onAddToMeal(adjustedFoodData);
      }
    } catch (error) {
      console.error('Error adding to meal:', error);
    }
  };

  const getConfidenceColor = (confidence) => {
    try {
      if (confidence >= 0.9) return COLORS.accent.success;
      if (confidence >= 0.7) return COLORS.accent.warning;
      return COLORS.accent.error;
    } catch (error) {
      return COLORS.accent.error;
    }
  };

  const getNutritionGradeColor = (grade) => {
    try {
      switch (grade?.toLowerCase()) {
        case 'a': return COLORS.accent.success;
        case 'b': return '#4CAF50';
        case 'c': return COLORS.accent.warning;
        case 'd': return '#FF9800';
        case 'e': return COLORS.accent.error;
        default: return COLORS.text.tertiary;
      }
    } catch (error) {
      return COLORS.text.tertiary;
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Food Recognition Result</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Food Image */}
          {validatedFoodData.photo && validatedFoodData.photo !== 'demo' && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: validatedFoodData.photo }} 
                style={styles.foodImage}
                onError={(error) => console.log('Image loading error:', error)}
              />
            </View>
          )}

          {/* Food Name and Confidence */}
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{validatedFoodData.name}</Text>
            {validatedFoodData.brand && validatedFoodData.brand !== 'Unknown Brand' && (
              <Text style={styles.brandName}>{validatedFoodData.brand}</Text>
            )}
            
            {validatedFoodData.confidence && (
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>AI Confidence:</Text>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill, 
                      { 
                        width: `${Math.min(validatedFoodData.confidence * 100, 100)}%`,
                        backgroundColor: getConfidenceColor(validatedFoodData.confidence)
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {Math.round(validatedFoodData.confidence * 100)}%
                </Text>
              </View>
            )}

            {/* Nutrition Grade */}
            {validatedFoodData.nutritionGrade && (
              <View style={styles.gradeContainer}>
                <Text style={styles.gradeLabel}>Nutrition Grade:</Text>
                <View style={[
                  styles.gradeBadge, 
                  { backgroundColor: getNutritionGradeColor(validatedFoodData.nutritionGrade) }
                ]}>
                  <Text style={styles.gradeText}>{validatedFoodData.nutritionGrade.toUpperCase()}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Serving Size Adjustment */}
          <View style={styles.servingSection}>
            <Text style={styles.sectionTitle}>Serving Size</Text>
            <View style={styles.servingControls}>
              <TouchableOpacity 
                style={styles.servingButton} 
                onPress={() => handleServingSizeChange(servingSize - 10)}
              >
                <Ionicons name="remove" size={20} color={COLORS.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.servingDisplay}>
                <Text style={styles.servingSize}>{servingSize}g</Text>
                <Text style={styles.servingLabel}>Serving Size</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.servingButton} 
                onPress={() => handleServingSizeChange(servingSize + 10)}
              >
                <Ionicons name="add" size={20} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nutrition Facts */}
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            
            {/* Calories */}
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>{nutrition.calories} kcal</Text>
            </View>

            {/* Macros */}
            <View style={styles.macroSection}>
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <View style={[styles.macroBar, { backgroundColor: COLORS.accent.primary }]}>
                    <View style={[styles.macroFill, { width: `${Math.min(macroPercentages.protein, 100)}%` }]} />
                  </View>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{nutrition.protein}g</Text>
                  <Text style={styles.macroPercent}>{macroPercentages.protein}%</Text>
                </View>

                <View style={styles.macroItem}>
                  <View style={[styles.macroBar, { backgroundColor: COLORS.accent.secondary }]}>
                    <View style={[styles.macroFill, { width: `${Math.min(macroPercentages.carbs, 100)}%` }]} />
                  </View>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{nutrition.carbs}g</Text>
                  <Text style={styles.macroPercent}>{macroPercentages.carbs}%</Text>
                </View>

                <View style={styles.macroItem}>
                  <View style={[styles.macroBar, { backgroundColor: COLORS.accent.warning }]}>
                    <View style={[styles.macroFill, { width: `${Math.min(macroPercentages.fat, 100)}%` }]} />
                  </View>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>{nutrition.fat}g</Text>
                  <Text style={styles.macroPercent}>{macroPercentages.fat}%</Text>
                </View>
              </View>
            </View>

            {/* Other Nutrients */}
            <View style={styles.otherNutrients}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fiber</Text>
                <Text style={styles.nutritionValue}>{nutrition.fiber}g</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Sugar</Text>
                <Text style={styles.nutritionValue}>{nutrition.sugar}g</Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Sodium</Text>
                <Text style={styles.nutritionValue}>{nutrition.sodium}mg</Text>
              </View>
            </View>
          </View>

          {/* Ingredients */}
          {validatedFoodData.ingredients && validatedFoodData.ingredients.length > 0 && (
            <View style={styles.ingredientsSection}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.ingredientsText}>
                {Array.isArray(validatedFoodData.ingredients) 
                  ? validatedFoodData.ingredients.join(', ')
                  : validatedFoodData.ingredients
                }
              </Text>
            </View>
          )}

          {/* Allergens */}
          {validatedFoodData.allergens && validatedFoodData.allergens.length > 0 && (
            <View style={styles.allergensSection}>
              <Text style={styles.sectionTitle}>Allergens</Text>
              <View style={styles.allergensList}>
                {validatedFoodData.allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenBadge}>
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Source */}
          <View style={styles.sourceSection}>
            <Text style={styles.sourceText}>
              Source: {validatedFoodData.source || 'AI Recognition'}
              {validatedFoodData.verified && (
                <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} />
              )}
            </Text>
          </View>
        </ScrollView>

        {/* Add to Meal Section */}
        <View style={styles.addToMealSection}>
          <Text style={styles.sectionTitle}>Add to Meal</Text>
          
          {/* Meal Selection */}
          <View style={styles.mealSelector}>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
              <TouchableOpacity
                key={meal}
                style={[
                  styles.mealButton,
                  selectedMeal === meal && styles.mealButtonSelected
                ]}
                onPress={() => setSelectedMeal(meal)}
              >
                <Text style={[
                  styles.mealButtonText,
                  selectedMeal === meal && styles.mealButtonTextSelected
                ]}>
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddToMeal}>
            <Ionicons name="add-circle" size={24} color={COLORS.text.primary} />
            <Text style={styles.addButtonText}>Add to {selectedMeal}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius.lg,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SIZES.spacing.sm,
  },
  content: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  foodImage: {
    width: 200,
    height: 200,
    borderRadius: SIZES.radius.md,
  },
  foodInfo: {
    marginBottom: SIZES.spacing.lg,
  },
  foodName: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  brandName: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.md,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  confidenceLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginRight: SIZES.spacing.sm,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 4,
    marginRight: SIZES.spacing.sm,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginRight: SIZES.spacing.sm,
  },
  gradeBadge: {
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
  },
  gradeText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  servingSection: {
    marginBottom: SIZES.spacing.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.md,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingDisplay: {
    alignItems: 'center',
    marginHorizontal: SIZES.spacing.lg,
  },
  servingSize: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  servingLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  nutritionSection: {
    marginBottom: SIZES.spacing.lg,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xs,
  },
  nutritionLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
  },
  nutritionValue: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  macroSection: {
    marginVertical: SIZES.spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: SIZES.spacing.xs,
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.text.primary,
  },
  macroLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  macroValue: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  macroPercent: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
  otherNutrients: {
    marginTop: SIZES.spacing.md,
  },
  ingredientsSection: {
    marginBottom: SIZES.spacing.lg,
  },
  ingredientsText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  allergensSection: {
    marginBottom: SIZES.spacing.lg,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenBadge: {
    backgroundColor: COLORS.accent.error,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    marginRight: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.xs,
  },
  allergenText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.medium,
  },
  sourceSection: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  sourceText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToMealSection: {
    padding: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  mealSelector: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.lg,
  },
  mealButton: {
    flex: 1,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: SIZES.spacing.xs,
    alignItems: 'center',
  },
  mealButtonSelected: {
    backgroundColor: COLORS.accent.primary,
  },
  mealButtonText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weight.medium,
  },
  mealButtonTextSelected: {
    color: COLORS.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
  },
  addButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginLeft: SIZES.spacing.sm,
  },
});

export default FoodResultModal;
