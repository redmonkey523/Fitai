import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import CameraScanner from '../components/CameraScanner';
import FoodResultModal from '../components/FoodResultModal';

const NutritionScreen = ({ navigation }) => {
  const { entitlements, user } = useAuth();
  const nowMs = Date.now();
  const trialEndsMs = user?.trialEndsAt ? new Date(user.trialEndsAt).getTime() : null;
  const trialActive = trialEndsMs ? nowMs < trialEndsMs : true;
  const isAdmin = user?.email === 'chickenman10010@gmail.com';
  const isPro = Boolean(entitlements?.pro) || isAdmin || trialActive;
  const [activeTab, setActiveTab] = useState('meals');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('food');
  const [showFoodResult, setShowFoodResult] = useState(false);
  const [currentFoodData, setCurrentFoodData] = useState(null);
  
  // Daily nutrition tracking
  const [dailyNutrition, setDailyNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });

  // Meals data
  const [meals, setMeals] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  });

  // Water tracking
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterGoal] = useState(8);

  useEffect(() => {
    updateDailyNutrition();
  }, [meals]);

  const updateDailyNutrition = () => {
    let total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    };

    Object.values(meals).forEach(mealFoods => {
      mealFoods.forEach(food => {
        if (food.nutrition) {
          total.calories += food.nutrition.calories || 0;
          total.protein += food.nutrition.protein || 0;
          total.carbs += food.nutrition.carbs || 0;
          total.fat += food.nutrition.fat || 0;
          total.fiber += food.nutrition.fiber || 0;
          total.sugar += food.nutrition.sugar || 0;
          total.sodium += food.nutrition.sodium || 0;
        }
      });
    });

    setDailyNutrition(total);
  };

  const handleCameraFoodRecognition = () => {
    setCameraMode('food');
    setShowCamera(true);
  };

  const handleBarcodeScan = () => {
    setCameraMode('barcode');
    setShowCamera(true);
  };

  const handleFoodCapture = (foodResults) => {
    setShowCamera(false);
    setCurrentFoodData(foodResults);
    setShowFoodResult(true);
  };

  const handleBarcodeScanned = (productData) => {
    setShowCamera(false);
    setCurrentFoodData(productData);
    setShowFoodResult(true);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleAddToMeal = (foodData) => {
    const meal = foodData.meal || 'snack';
    setMeals(prev => ({
      ...prev,
      [meal]: [...prev[meal], foodData]
    }));
    setShowFoodResult(false);
    setCurrentFoodData(null);
  };

  const handleCloseFoodResult = () => {
    setShowFoodResult(false);
    setCurrentFoodData(null);
  };

  const addWaterGlass = () => {
    setWaterGlasses(prev => Math.min(prev + 1, waterGoal));
  };

  const resetWater = () => {
    setWaterGlasses(0);
  };

  const removeFoodItem = (mealType, index) => {
    setMeals(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter((_, i) => i !== index)
    }));
  };

  const renderMealsTab = () => (
    <View style={styles.mealsContainer}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, !isPro && styles.lockedButton]}
          onPress={() => { if (isPro) handleCameraFoodRecognition(); else Alert.alert('Pro Required', 'Unlock Pro to use AI food recognition.'); }}
        >
          <Ionicons name="camera" size={24} color={COLORS.text.primary} />
          <Text style={styles.actionText}>Scan Food</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !isPro && styles.lockedButton]}
          onPress={() => { if (isPro) handleBarcodeScan(); else Alert.alert('Pro Required', 'Unlock Pro to use barcode scanning.'); }}
        >
          <Ionicons name="barcode" size={24} color={COLORS.text.primary} />
          <Text style={styles.actionText}>Scan Barcode</Text>
        </TouchableOpacity>
        {!isPro && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.accent.primary }]}
          onPress={async () => {
            try {
              const res = await (await import('../services/api')).default.purchasePro();
              if (res?.success) Alert.alert('Pro Unlocked', 'Macro tracker and pro features are now enabled.');
            } catch (e) {
              Alert.alert('Purchase Failed', e?.message || 'Try again later');
            }
          }}
        >
          <Ionicons name="lock-open" size={24} color={COLORS.background.primary} />
          <Text style={[styles.actionText, { color: COLORS.background.primary }]}>Unlock Pro</Text>
        </TouchableOpacity>
        )}
      </View>

      {/* Meals */}
      {Object.entries(meals).map(([mealType, mealFoods]) => (
        <View key={mealType} style={styles.mealSection}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
            <Text style={styles.mealCount}>{mealFoods.length} items</Text>
          </View>
          
          {mealFoods.length === 0 ? (
            <View style={styles.emptyMeal}>
              <Ionicons name="restaurant-outline" size={32} color={COLORS.text.tertiary} />
              <Text style={styles.emptyText}>No foods added yet</Text>
            </View>
          ) : (
            mealFoods.map((food, index) => (
              <View key={index} style={styles.foodItem}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  {food.brand && food.brand !== 'Unknown Brand' && (
                    <Text style={styles.foodBrand}>{food.brand}</Text>
                  )}
                  <Text style={styles.foodServing}>
                    {food.servingSize || 100}g • {food.nutrition?.calories || 0} kcal
                  </Text>
                </View>
                <View style={styles.foodMacros}>
                  <Text style={styles.macroText}>P: {food.nutrition?.protein || 0}g</Text>
                  <Text style={styles.macroText}>C: {food.nutrition?.carbs || 0}g</Text>
                  <Text style={styles.macroText}>F: {food.nutrition?.fat || 0}g</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeFoodItem(mealType, index)}
                >
                  <Ionicons name="close" size={16} color={COLORS.accent.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      ))}
    </View>
  );

  const renderWaterTab = () => (
    <View style={styles.waterContainer}>
      <View style={styles.waterHeader}>
        <Text style={styles.waterTitle}>Water Intake</Text>
        <Text style={styles.waterSubtitle}>Goal: {waterGoal} glasses</Text>
      </View>

      <View style={styles.waterProgress}>
        <View style={styles.waterGlasses}>
          {Array.from({ length: waterGoal }, (_, i) => (
            <View 
              key={i} 
              style={[
                styles.waterGlass, 
                i < waterGlasses && styles.waterGlassFilled
              ]}
            />
          ))}
        </View>
        <Text style={styles.waterCount}>{waterGlasses}/{waterGoal} glasses</Text>
      </View>

      <View style={styles.waterActions}>
        <TouchableOpacity style={styles.waterButton} onPress={addWaterGlass}>
          <Ionicons name="add" size={24} color={COLORS.text.primary} />
          <Text style={styles.waterButtonText}>Add Glass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.waterButton, styles.resetButton]} onPress={resetWater}>
          <Ionicons name="refresh" size={24} color={COLORS.text.primary} />
          <Text style={styles.waterButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAddFoodTab = () => (
    <View style={styles.addFoodContainer}>
      <View style={styles.addFoodHeader}>
        <Ionicons name="camera" size={64} color={COLORS.accent.primary} />
        <Text style={styles.addFoodTitle}>Add Food to Your Day</Text>
        <Text style={styles.addFoodSubtitle}>
          Use AI-powered food recognition or scan product barcodes to track your nutrition
        </Text>
      </View>

      <View style={styles.addFoodOptions}>
        <TouchableOpacity style={styles.addFoodOption} onPress={handleCameraFoodRecognition}>
          <View style={styles.optionIcon}>
            <Ionicons name="camera" size={32} color={COLORS.accent.primary} />
          </View>
          <Text style={styles.optionTitle}>AI Food Recognition</Text>
          <Text style={styles.optionDescription}>
            Take a photo of your food and let AI identify it automatically
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addFoodOption} onPress={handleBarcodeScan}>
          <View style={styles.optionIcon}>
            <Ionicons name="barcode" size={32} color={COLORS.accent.secondary} />
          </View>
          <Text style={styles.optionTitle}>Barcode Scanner</Text>
          <Text style={styles.optionDescription}>
            Scan product barcodes for instant nutrition information
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'meals':
        return renderMealsTab();
      case 'water':
        return renderWaterTab();
      case 'add':
        return renderAddFoodTab();
      default:
        return renderMealsTab();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <TouchableOpacity 
            style={styles.mealPlanButton}
            onPress={() => navigation.navigate('MealPlanning')}
          >
            <Ionicons name="calendar-outline" size={24} color={COLORS.accent.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.headerCalories}>{Math.round(dailyNutrition.calories)} kcal</Text>
          <Text style={styles.headerMacros}>
            P: {Math.round(dailyNutrition.protein)}g • C: {Math.round(dailyNutrition.carbs)}g • F: {Math.round(dailyNutrition.fat)}g
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'meals', label: 'Meals', icon: 'restaurant' },
          { key: 'water', label: 'Water', icon: 'water' },
          { key: 'add', label: 'Add Food', icon: 'add-circle' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.key ? COLORS.accent.primary : COLORS.text.secondary} 
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Camera Scanner Modal */}
      <Modal visible={showCamera} animationType="slide" presentationStyle="fullScreen">
        <CameraScanner 
          mode={cameraMode} 
          onCapture={handleFoodCapture} 
          onScan={handleBarcodeScanned} 
          onClose={handleCloseCamera} 
        />
      </Modal>

      {/* Food Result Modal */}
      <FoodResultModal
        foodData={currentFoodData}
        onAddToMeal={handleAddToMeal}
        onClose={handleCloseFoodResult}
        visible={showFoodResult}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.xl,
    backgroundColor: COLORS.background.secondary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  mealPlanButton: {
    padding: 8,
  },
  headerStats: {
    alignItems: 'flex-start',
  },
  headerCalories: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
  },
  headerMacros: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
  },
  activeTab: {
    backgroundColor: COLORS.background.primary,
  },
  tabText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
    marginLeft: SIZES.spacing.xs,
  },
  activeTabText: {
    color: COLORS.accent.primary,
  },
  scrollView: {
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
  quickActions: {
    flexDirection: 'row',
    padding: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.small,
  },
  actionText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
    marginLeft: SIZES.spacing.xs,
  },
  mealsContainer: {
    padding: SIZES.spacing.lg,
  },
  mealSection: {
    marginBottom: SIZES.spacing.xl,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  mealTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  mealCount: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  emptyMeal: {
    alignItems: 'center',
    padding: SIZES.spacing.xl,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
  },
  emptyText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.tertiary,
    marginTop: SIZES.spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  foodBrand: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  foodServing: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
  foodMacros: {
    alignItems: 'flex-end',
    marginRight: SIZES.spacing.sm,
  },
  macroText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  removeButton: {
    padding: SIZES.spacing.xs,
  },
  waterContainer: {
    padding: SIZES.spacing.lg,
    alignItems: 'center',
  },
  waterHeader: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  waterTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  waterSubtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.xs,
  },
  waterProgress: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  waterGlasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  waterGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    margin: SIZES.spacing.xs,
  },
  waterGlassFilled: {
    backgroundColor: COLORS.accent.primary,
  },
  waterCount: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  waterActions: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
  },
  resetButton: {
    backgroundColor: COLORS.background.secondary,
  },
  waterButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
    marginLeft: SIZES.spacing.xs,
  },
  addFoodContainer: {
    padding: SIZES.spacing.lg,
    alignItems: 'center',
  },
  addFoodHeader: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  addFoodTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  addFoodSubtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addFoodOptions: {
    width: '100%',
    gap: SIZES.spacing.lg,
  },
  addFoodOption: {
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacing.md,
  },
  optionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.sm,
  },
  optionDescription: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NutritionScreen;
