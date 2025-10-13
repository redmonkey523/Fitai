import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES } from '../constants/theme';
import mealPlanningService from '../services/mealPlanningService';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function MealPlanningScreen({ navigation }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [weekMealPlans, setWeekMealPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadWeekMealPlans();
  }, [currentWeekStart]);

  const loadWeekMealPlans = async () => {
    try {
      setLoading(true);
      const weekDates = getWeekDates(currentWeekStart);
      const plans = {};
      
      for (const date of weekDates) {
        const dateStr = formatDate(date);
        const plan = await mealPlanningService.getMealPlanForDate(dateStr);
        if (plan) {
          plans[dateStr] = plan;
        }
      }
      
      setWeekMealPlans(plans);
    } catch (error) {
      console.error('Error loading meal plans:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load meal plans',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateWeeklyPlan = async () => {
    Alert.alert(
      'Generate Weekly Meal Plan',
      'This will generate meal plans for the entire week based on your nutritional goals. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setGenerating(true);
              const preferences = {
                startDate: formatDate(currentWeekStart),
                // You can add more preferences here like dietary restrictions, etc.
              };
              
              const generatedPlans = await mealPlanningService.generateWeeklyMealPlan(preferences);
              
              // Reload the week
              await loadWeekMealPlans();
              
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: `Generated ${generatedPlans.length} meal plans`,
              });
            } catch (error) {
              console.error('Error generating meal plan:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to generate meal plan',
              });
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleAddMeal = (date, mealType) => {
    navigation.navigate('RecipeBrowser', {
      date: formatDate(date),
      mealType,
      onSelect: (recipe) => {
        addMealToPlan(date, mealType, recipe);
      },
    });
  };

  const addMealToPlan = async (date, mealType, recipe) => {
    try {
      const dateStr = formatDate(date);
      const existingPlan = weekMealPlans[dateStr] || { date: dateStr, meals: {} };
      
      const updatedPlan = {
        ...existingPlan,
        meals: {
          ...existingPlan.meals,
          [mealType.toLowerCase()]: {
            recipe: recipe._id,
            recipeName: recipe.name,
            recipeImage: recipe.image,
            calories: recipe.nutrition?.calories || 0,
            protein: recipe.nutrition?.protein || 0,
            carbs: recipe.nutrition?.carbs || 0,
            fat: recipe.nutrition?.fat || 0,
          },
        },
      };
      
      await mealPlanningService.saveMealPlan(updatedPlan);
      await loadWeekMealPlans();
      
      Toast.show({
        type: 'success',
        text1: 'Meal Added',
        text2: `${recipe.name} added to ${mealType}`,
      });
    } catch (error) {
      console.error('Error adding meal:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add meal',
      });
    }
  };

  const handleRemoveMeal = (date, mealType) => {
    Alert.alert(
      'Remove Meal',
      'Are you sure you want to remove this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const dateStr = formatDate(date);
              const existingPlan = weekMealPlans[dateStr];
              
              if (existingPlan) {
                const updatedMeals = { ...existingPlan.meals };
                delete updatedMeals[mealType.toLowerCase()];
                
                const updatedPlan = {
                  ...existingPlan,
                  meals: updatedMeals,
                };
                
                await mealPlanningService.saveMealPlan(updatedPlan);
                await loadWeekMealPlans();
                
                Toast.show({
                  type: 'success',
                  text1: 'Meal Removed',
                });
              }
            } catch (error) {
              console.error('Error removing meal:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to remove meal',
              });
            }
          },
        },
      ]
    );
  };

  const handleViewRecipe = (recipeId) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newWeekStart);
  };

  const renderMealSlot = (date, mealType) => {
    const dateStr = formatDate(date);
    const dayPlan = weekMealPlans[dateStr];
    const meal = dayPlan?.meals?.[mealType.toLowerCase()];

    if (meal) {
      return (
        <TouchableOpacity
          style={styles.mealCard}
          onPress={() => handleViewRecipe(meal.recipe)}
          onLongPress={() => handleRemoveMeal(date, mealType)}
        >
          <View style={styles.mealInfo}>
            <Text style={styles.mealName} numberOfLines={1}>
              {meal.recipeName}
            </Text>
            <Text style={styles.mealNutrition}>
              {meal.calories} cal • {meal.protein}g protein
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.emptyMealSlot}
        onPress={() => handleAddMeal(date, mealType)}
      >
        <Ionicons name="add-circle-outline" size={24} color={COLORS.textSecondary} />
        <Text style={styles.emptyMealText}>Add {mealType}</Text>
      </TouchableOpacity>
    );
  };

  const renderDay = (date) => {
    const dateStr = formatDate(date);
    const dayPlan = weekMealPlans[dateStr];
    const isToday = isDateToday(date);
    
    // Calculate total nutrition for the day
    let totalCalories = 0;
    let totalProtein = 0;
    
    if (dayPlan?.meals) {
      Object.values(dayPlan.meals).forEach(meal => {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein || 0;
      });
    }

    return (
      <View key={dateStr} style={styles.dayContainer}>
        <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
          <View>
            <Text style={[styles.dayName, isToday && styles.todayText]}>
              {DAYS_OF_WEEK[date.getDay()]}
            </Text>
            <Text style={[styles.dayDate, isToday && styles.todayText]}>
              {date.getDate()} {date.toLocaleDateString('en-US', { month: 'short' })}
            </Text>
          </View>
          {dayPlan && (
            <View style={styles.dayNutrition}>
              <Text style={styles.dayNutritionText}>{totalCalories} cal</Text>
              <Text style={styles.dayNutritionText}>{totalProtein}g protein</Text>
            </View>
          )}
        </View>
        
        {MEAL_TYPES.map(mealType => (
          <View key={mealType} style={styles.mealTypeContainer}>
            <Text style={styles.mealTypeLabel}>{mealType}</Text>
            {renderMealSlot(date, mealType)}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading meal plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Planning</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('GroceryList')}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('RecipeBrowser')}
          >
            <Ionicons name="book-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>
            {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' - '}
            {getWeekEnd(currentWeekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateWeeklyPlan}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Ionicons name="sparkles-outline" size={20} color={COLORS.white} />
            <Text style={styles.generateButtonText}>Generate Weekly Plan</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Meal Plans */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadWeekMealPlans();
          }} />
        }
      >
        {getWeekDates(currentWeekStart).map(date => renderDay(date))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  return new Date(d.setDate(diff));
}

function getWeekEnd(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  return endDate;
}

function getWeekDates(startDate) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function isDateToday(date) {
  const today = new Date();
  return formatDate(date) === formatDate(today);
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
  },
  navButton: {
    padding: 8,
  },
  weekInfo: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  dayContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  todayHeader: {
    borderBottomColor: COLORS.primary,
    borderBottomWidth: 2,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  todayText: {
    color: COLORS.primary,
  },
  dayDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dayNutrition: {
    alignItems: 'flex-end',
  },
  dayNutritionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  mealTypeContainer: {
    marginBottom: 12,
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  mealNutrition: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyMealSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyMealText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});


