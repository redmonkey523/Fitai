import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';

// Import auth context
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = () => {
  const { user } = useAuth();
  
  // Mock data - in real app this would come from your backend
  const [nutritionData, setNutritionData] = useState({
    calories: {
      consumed: 1200,
      target: 2000,
      remaining: 800,
    },
    macros: {
      protein: { consumed: 85, target: 150, unit: 'g' },
      carbs: { consumed: 120, target: 200, unit: 'g' },
      fat: { consumed: 45, target: 65, unit: 'g' },
    },
    hydration: { consumed: 6, target: 8, unit: 'cups' },
    steps: { current: 6500, target: 10000 },
  });

  const [workoutData, setWorkoutData] = useState({
    today: {
      name: 'Upper Body — Week 3 • Day 2',
      duration: '45 min',
      focus: 'Chest, Shoulders, Triceps',
      equipment: 'Dumbbells, Bench',
      status: 'not_started', // 'not_started', 'in_progress', 'completed'
      progress: 0,
    },
    recent: [
      { name: 'Lower Body', date: 'Yesterday', duration: '40 min' },
      { name: 'Cardio HIIT', date: '2 days ago', duration: '30 min' },
    ],
  });

  const [recoveryData, setRecoveryData] = useState({
    score: 72,
    sleep: '7h 50m',
    strainTarget: 12,
    connected: true, // Simulate wearable connection
  });

  const [progressRings, setProgressRings] = useState({
    protein: 57, // percentage
    workouts: 4, // completed this week
    weight: -2.5, // lbs change this week
  });

  const [recentFoods, setRecentFoods] = useState([
    { name: 'Chicken Breast', calories: 165, time: '2h ago' },
    { name: 'Brown Rice', calories: 110, time: '2h ago' },
    { name: 'Protein Shake', calories: 180, time: '4h ago' },
    { name: 'Oatmeal', calories: 150, time: '6h ago' },
    { name: 'Banana', calories: 105, time: '8h ago' },
    { name: 'Greek Yogurt', calories: 130, time: '10h ago' },
  ]);

  const [coachTip, setCoachTip] = useState({
    title: 'Protein Timing Hack',
    content: 'Have 20-30g protein within 30 minutes of your workout for optimal muscle recovery.',
    type: 'tip', // 'tip', 'workout', 'recipe'
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user's first name
  const getUserName = () => {
    return user?.firstName || 'there';
  };

  // Calculate macro percentages
  const getMacroPercentage = (consumed, target) => {
    return Math.min((consumed / target) * 100, 100);
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'scan':
        Alert.alert('Barcode Scanner', 'This would open the camera to scan food barcodes');
        break;
      case 'quick_add':
        Alert.alert('Quick Add', 'This would open a quick food logging interface');
        break;
      case 'add_meal':
        Alert.alert('Add Meal', 'This would open the meal logging interface');
        break;
      case 'start_workout':
        Alert.alert('Start Workout', 'This would start today\'s recommended workout');
        break;
      case 'resume_workout':
        Alert.alert('Resume Workout', 'This would resume your in-progress workout');
        break;
    }
  };

  // Render header with greeting and avatar
  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()}, {getUserName()}!</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>
        <TouchableOpacity style={styles.avatarContainer}>
          {user?.avatar ? (
            <View style={styles.avatar}>
              {/* In real app, this would be an Image component */}
              <Ionicons name="person" size={24} color={COLORS.text.primary} />
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.text.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render macros and calories card
  const renderMacrosCard = () => {
    const { calories, macros } = nutritionData;
    
    return (
      <Card style={styles.macrosCard}>
        <View style={styles.macrosHeader}>
          <Text style={styles.macrosTitle}>Today's Nutrition</Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        </View>
        
        {/* Calories Section */}
        <View style={styles.caloriesSection}>
          <View style={styles.caloriesMain}>
            <Text style={styles.caloriesRemaining}>{calories.remaining}</Text>
            <Text style={styles.caloriesLabel}>calories remaining</Text>
          </View>
          <View style={styles.caloriesProgress}>
            <View style={styles.progressRing}>
              <View style={[styles.progressFill, { 
                width: `${(calories.consumed / calories.target) * 100}%` 
              }]} />
            </View>
            <Text style={styles.caloriesConsumed}>{calories.consumed}/{calories.target}</Text>
          </View>
        </View>

        {/* Macros Section */}
        <View style={styles.macrosSection}>
          {Object.entries(macros).map(([macro, data]) => (
            <View key={macro} style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>{macro.charAt(0).toUpperCase() + macro.slice(1)}</Text>
                <Text style={styles.macroAmount}>{data.consumed}/{data.target}g</Text>
              </View>
              <View style={styles.macroProgress}>
                <View style={[styles.macroBar, { 
                  width: `${getMacroPercentage(data.consumed, data.target)}%`,
                  backgroundColor: macro === 'protein' ? COLORS.accent.primary : 
                                macro === 'carbs' ? COLORS.accent.secondary : COLORS.accent.quaternary
                }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction} 
            onPress={() => handleQuickAction('scan')}
          >
            <Ionicons name="scan-outline" size={20} color={COLORS.accent.primary} />
            <Text style={styles.quickActionText}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction} 
            onPress={() => handleQuickAction('quick_add')}
          >
            <Ionicons name="add-outline" size={20} color={COLORS.accent.primary} />
            <Text style={styles.quickActionText}>Quick Add</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction} 
            onPress={() => handleQuickAction('add_meal')}
          >
            <Ionicons name="restaurant-outline" size={20} color={COLORS.accent.primary} />
            <Text style={styles.quickActionText}>Add Meal</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // Render today's workout card
  const renderWorkoutCard = () => {
    const { today } = workoutData;
    
    return (
      <Card style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View>
            <Text style={styles.workoutTitle}>Today's Workout</Text>
            <Text style={styles.workoutName}>{today.name}</Text>
          </View>
          <View style={styles.workoutStatus}>
            <Ionicons 
              name={today.status === 'completed' ? 'checkmark-circle' : 'fitness'} 
              size={24} 
              color={today.status === 'completed' ? COLORS.accent.success : COLORS.accent.primary} 
            />
          </View>
        </View>
        
        <View style={styles.workoutDetails}>
          <View style={styles.workoutDetail}>
            <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.workoutDetailText}>{today.duration}</Text>
          </View>
          <View style={styles.workoutDetail}>
            <Ionicons name="body-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.workoutDetailText}>{today.focus}</Text>
          </View>
          <View style={styles.workoutDetail}>
            <Ionicons name="construct-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.workoutDetailText}>{today.equipment}</Text>
          </View>
        </View>

        <Button
          type="primary"
          label={today.status === 'not_started' ? 'Start Workout' : 
                today.status === 'in_progress' ? 'Resume Workout' : 'Workout Complete'}
          onPress={() => handleQuickAction(today.status === 'in_progress' ? 'resume_workout' : 'start_workout')}
          style={styles.workoutButton}
        />
      </Card>
    );
  };

  // Render recent foods row
  const renderRecentFoods = () => {
    return (
      <View style={styles.recentFoodsContainer}>
        <Text style={styles.sectionTitle}>Recent Foods</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentFoodsScroll}>
          {recentFoods.map((food, index) => (
            <TouchableOpacity key={index} style={styles.foodChip}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodCalories}>{food.calories} cal</Text>
              <Text style={styles.foodTime}>{food.time}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render mini widgets (hydration & steps)
  const renderMiniWidgets = () => {
    return (
      <View style={styles.miniWidgetsContainer}>
        <Card style={styles.miniWidget}>
          <View style={styles.miniWidgetHeader}>
            <Ionicons name="water-outline" size={20} color={COLORS.accent.primary} />
            <Text style={styles.miniWidgetTitle}>Hydration</Text>
          </View>
          <Text style={styles.miniWidgetValue}>
            {nutritionData.hydration.consumed}/{nutritionData.hydration.target} {nutritionData.hydration.unit}
          </Text>
          <View style={styles.miniWidgetProgress}>
            <View style={[styles.miniWidgetBar, { 
              width: `${(nutritionData.hydration.consumed / nutritionData.hydration.target) * 100}%` 
            }]} />
          </View>
        </Card>

        <Card style={styles.miniWidget}>
          <View style={styles.miniWidgetHeader}>
            <Ionicons name="footsteps-outline" size={20} color={COLORS.accent.secondary} />
            <Text style={styles.miniWidgetTitle}>Steps</Text>
          </View>
          <Text style={styles.miniWidgetValue}>
            {nutritionData.steps.current.toLocaleString()}/{nutritionData.steps.target.toLocaleString()}
          </Text>
          <View style={styles.miniWidgetProgress}>
            <View style={[styles.miniWidgetBar, { 
              width: `${(nutritionData.steps.current / nutritionData.steps.target) * 100}%`,
              backgroundColor: COLORS.accent.secondary
            }]} />
          </View>
        </Card>
      </View>
    );
  };

  // Render recovery tile
  const renderRecoveryTile = () => {
    if (!recoveryData.connected) return null;
    
    return (
      <Card style={styles.recoveryCard}>
        <View style={styles.recoveryHeader}>
          <Ionicons name="pulse-outline" size={20} color={COLORS.accent.quaternary} />
          <Text style={styles.recoveryTitle}>Recovery</Text>
        </View>
        <View style={styles.recoveryContent}>
          <Text style={styles.recoveryScore}>{recoveryData.score}%</Text>
          <View style={styles.recoveryDetails}>
            <Text style={styles.recoveryDetail}>Sleep {recoveryData.sleep}</Text>
            <Text style={styles.recoveryDetail}>Strain target {recoveryData.strainTarget}</Text>
          </View>
        </View>
      </Card>
    );
  };

  // Render progress rings
  const renderProgressRings = () => {
    return (
      <Card style={styles.progressCard}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.progressRingsContainer}>
          <View style={styles.progressRing}>
            <View style={styles.ringContainer}>
              <Text style={styles.ringValue}>{progressRings.protein}%</Text>
              <Text style={styles.ringLabel}>Protein</Text>
            </View>
          </View>
          <View style={styles.progressRing}>
            <View style={styles.ringContainer}>
              <Text style={styles.ringValue}>{progressRings.workouts}</Text>
              <Text style={styles.ringLabel}>Workouts</Text>
            </View>
          </View>
          <View style={styles.progressRing}>
            <View style={styles.ringContainer}>
              <Text style={styles.ringValue}>{progressRings.weight > 0 ? '+' : ''}{progressRings.weight}lbs</Text>
              <Text style={styles.ringLabel}>Weight</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  // Render coach tip
  const renderCoachTip = () => {
    return (
      <Card style={styles.coachCard}>
        <View style={styles.coachHeader}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.accent.quaternary} />
          <Text style={styles.coachTitle}>Coach Tip</Text>
        </View>
        <Text style={styles.coachTipTitle}>{coachTip.title}</Text>
        <Text style={styles.coachTipContent}>{coachTip.content}</Text>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderHeader()}
          {renderMacrosCard()}
          {renderWorkoutCard()}
          {renderRecentFoods()}
          {renderMiniWidgets()}
          {renderRecoveryTile()}
          {renderProgressRings()}
          {renderCoachTip()}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  date: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.xs,
  },
  avatarContainer: {
    marginLeft: SIZES.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macrosCard: {
    marginBottom: SIZES.spacing.lg,
  },
  macrosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  macrosTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  caloriesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  caloriesMain: {
    alignItems: 'center',
  },
  caloriesRemaining: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
  },
  caloriesLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  caloriesProgress: {
    alignItems: 'center',
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 30,
  },
  caloriesConsumed: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  macrosSection: {
    marginBottom: SIZES.spacing.lg,
  },
  macroItem: {
    marginBottom: SIZES.spacing.md,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.xs,
  },
  macroName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  macroAmount: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  macroProgress: {
    height: 6,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroBar: {
    height: '100%',
    borderRadius: 3,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SIZES.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.utility.divider,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginTop: SIZES.spacing.xs,
  },
  workoutCard: {
    marginBottom: SIZES.spacing.lg,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.md,
  },
  workoutTitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  workoutName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  workoutStatus: {
    marginLeft: SIZES.spacing.md,
  },
  workoutDetails: {
    marginBottom: SIZES.spacing.lg,
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  workoutDetailText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginLeft: SIZES.spacing.sm,
  },
  workoutButton: {
    alignSelf: 'stretch',
  },
  recentFoodsContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  recentFoodsScroll: {
    flexDirection: 'row',
  },
  foodChip: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
    marginRight: SIZES.spacing.sm,
    minWidth: 100,
  },
  foodName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  foodCalories: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  foodTime: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  miniWidgetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.lg,
  },
  miniWidget: {
    flex: 1,
    marginHorizontal: SIZES.spacing.xs,
  },
  miniWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  miniWidgetTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginLeft: SIZES.spacing.xs,
  },
  miniWidgetValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  miniWidgetProgress: {
    height: 4,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniWidgetBar: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 2,
  },
  recoveryCard: {
    marginBottom: SIZES.spacing.lg,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  recoveryTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginLeft: SIZES.spacing.sm,
  },
  recoveryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recoveryScore: {
    color: COLORS.accent.quaternary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginRight: SIZES.spacing.lg,
  },
  recoveryDetails: {
    flex: 1,
  },
  recoveryDetail: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  progressCard: {
    marginBottom: SIZES.spacing.lg,
  },
  progressRingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressRing: {
    alignItems: 'center',
  },
  ringContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  ringLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  coachCard: {
    marginBottom: SIZES.spacing.lg,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  coachTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginLeft: SIZES.spacing.sm,
  },
  coachTipTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  coachTipContent: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 80,
  },
});

export default HomeScreen;
