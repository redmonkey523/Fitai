import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { addNutritionEntry, fetchDailyNutrition } from '../store/slices/nutritionSlice';
import Button from './Button';
import Input from './Input';
import Card from './Card';
import ProgressBar from './ProgressBar';

const NutritionTracker = () => {
  const dispatch = useDispatch();
  const { dailyNutrition, loading, error } = useSelector(state => state.nutrition);
  const { user } = useSelector(state => state.auth);

  const [showAddModal, setShowAddModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState('breakfast');

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny' },
    { key: 'lunch', label: 'Lunch', icon: 'restaurant' },
    { key: 'dinner', label: 'Dinner', icon: 'moon' },
    { key: 'snack', label: 'Snack', icon: 'cafe' }
  ];

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      dispatch(fetchDailyNutrition({ userId: user.id, date: today }));
    }
  }, [dispatch, user]);

  const handleAddFood = () => {
    if (!foodName.trim() || !calories.trim()) {
      Alert.alert('Error', 'Please enter food name and calories');
      return;
    }

    const nutritionData = {
      userId: user.id,
      foodName: foodName.trim(),
      calories: parseInt(calories),
      protein: protein ? parseFloat(protein) : 0,
      carbs: carbs ? parseFloat(carbs) : 0,
      fat: fat ? parseFloat(fat) : 0,
      mealType,
      date: new Date().toISOString()
    };

    dispatch(addNutritionEntry(nutritionData));
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealType('breakfast');
  };

  const getCalorieProgress = () => {
    if (!dailyNutrition || !user?.nutritionGoals?.dailyCalories) return 0;
    return Math.min((dailyNutrition.totalCalories / user.nutritionGoals.dailyCalories) * 100, 100);
  };

  const getMacroProgress = (current, target) => {
    if (!current || !target) return 0;
    return Math.min((current / target) * 100, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading nutrition data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Daily Summary Card */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Nutrition</Text>
        
        <View style={styles.calorieSection}>
          <Text style={styles.calorieText}>
            {dailyNutrition?.totalCalories || 0} / {user?.nutritionGoals?.dailyCalories || 2000} cal
          </Text>
          <ProgressBar 
            progress={getCalorieProgress()} 
            color={COLORS.accent.primary}
            style={styles.progressBar}
          />
        </View>

        <View style={styles.macrosContainer}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {dailyNutrition?.totalProtein || 0}g
            </Text>
            <ProgressBar 
              progress={getMacroProgress(dailyNutrition?.totalProtein, user?.nutritionGoals?.protein)}
              color={COLORS.success}
              style={styles.macroProgress}
            />
          </View>
          
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {dailyNutrition?.totalCarbs || 0}g
            </Text>
            <ProgressBar 
              progress={getMacroProgress(dailyNutrition?.totalCarbs, user?.nutritionGoals?.carbs)}
              color={COLORS.warning}
              style={styles.macroProgress}
            />
          </View>
          
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>
              {dailyNutrition?.totalFat || 0}g
            </Text>
            <ProgressBar 
              progress={getMacroProgress(dailyNutrition?.totalFat, user?.nutritionGoals?.fat)}
              color={COLORS.error}
              style={styles.macroProgress}
            />
          </View>
        </View>
      </Card>

      {/* Meal Sections */}
      {mealTypes.map(meal => (
        <Card key={meal.key} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleContainer}>
              <Ionicons name={meal.icon} size={24} color={COLORS.accent.primary} />
              <Text style={styles.mealTitle}>{meal.label}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                setMealType(meal.key);
                setShowAddModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {dailyNutrition?.meals?.[meal.key]?.length > 0 ? (
            dailyNutrition.meals[meal.key].map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.foodName}</Text>
                  <Text style={styles.foodCalories}>{food.calories} cal</Text>
                </View>
                <View style={styles.foodMacros}>
                  <Text style={styles.foodMacro}>P: {food.protein}g</Text>
                  <Text style={styles.foodMacro}>C: {food.carbs}g</Text>
                  <Text style={styles.foodMacro}>F: {food.fat}g</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMeal}>No foods logged yet</Text>
          )}
        </Card>
      ))}

      {/* Add Food Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Food</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Food Name"
              value={foodName}
              onChangeText={setFoodName}
              placeholder="Enter food name"
            />

            <Input
              label="Calories"
              value={calories}
              onChangeText={setCalories}
              placeholder="Enter calories"
              keyboardType="numeric"
            />

            <Input
              label="Protein (g)"
              value={protein}
              onChangeText={setProtein}
              placeholder="Enter protein"
              keyboardType="numeric"
            />

            <Input
              label="Carbs (g)"
              value={carbs}
              onChangeText={setCarbs}
              placeholder="Enter carbs"
              keyboardType="numeric"
            />

            <Input
              label="Fat (g)"
              value={fat}
              onChangeText={setFat}
              placeholder="Enter fat"
              keyboardType="numeric"
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
              <Button
                title="Add Food"
                onPress={handleAddFood}
                style={styles.addFoodButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  summaryCard: {
    margin: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  calorieSection: {
    marginBottom: 20,
  },
  calorieText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  macroProgress: {
    height: 4,
    width: '100%',
    borderRadius: 2,
  },
  mealCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: COLORS.accent.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  foodCalories: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  foodMacro: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  emptyMeal: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  cancelButtonText: {
    color: COLORS.text.primary,
  },
  addFoodButton: {
    flex: 1,
  },
});

export default NutritionTracker;
