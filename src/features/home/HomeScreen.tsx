/**
 * HomeScreen - Daily snapshot with quick actions
 * Shows today's macros, hydration, workouts (read-only), and quick actions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useDailyMeals } from '../nutrition/hooks/useDailyMeals';
import { useDailyHydration } from '../nutrition/hooks/useDailyHydration';
import { AddMealSheet } from '../nutrition/AddMealSheet';

interface HomeScreenProps {
  navigation?: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [showAddMeal, setShowAddMeal] = useState(false);
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const { data: mealsData, isLoading: mealsLoading } = useDailyMeals(today);
  const { total: hydrationTotal, addWater, isAdding } = useDailyHydration(today);

  const totals = mealsData?.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const meals = mealsData?.meals || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['meals', today] });
    queryClient.invalidateQueries({ queryKey: ['hydration', today] });
  };

  const handleAddWater = (ml: number) => {
    addWater(ml);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );

  const renderMacrosCard = () => {
    // Mock goals - in real app, fetch from DB
    const goals = { kcal: 2000, protein: 150, carbs: 200, fat: 65 };
    const remaining = Math.max(0, goals.kcal - totals.kcal);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Nutrition</Text>

        <View style={styles.caloriesRow}>
          <View>
            <Text style={styles.caloriesValue}>{totals.kcal}</Text>
            <Text style={styles.caloriesLabel}>consumed</Text>
          </View>
          <View style={styles.caloriesRemaining}>
            <Text style={styles.remainingValue}>{remaining}</Text>
            <Text style={styles.remainingLabel}>remaining</Text>
          </View>
        </View>

        <View style={styles.macroGrid}>
          <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <Text style={styles.macroName}>Protein</Text>
              <Text style={styles.macroValue}>
                {Math.round(totals.protein)}/{goals.protein}g
              </Text>
            </View>
            <View style={styles.macroBar}>
              <View
                style={[
                  styles.macroFill,
                  {
                    width: `${Math.min(100, (totals.protein / goals.protein) * 100)}%`,
                    backgroundColor: COLORS.accent.primary,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <Text style={styles.macroName}>Carbs</Text>
              <Text style={styles.macroValue}>
                {Math.round(totals.carbs)}/{goals.carbs}g
              </Text>
            </View>
            <View style={styles.macroBar}>
              <View
                style={[
                  styles.macroFill,
                  {
                    width: `${Math.min(100, (totals.carbs / goals.carbs) * 100)}%`,
                    backgroundColor: COLORS.accent.secondary,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.macroItem}>
            <View style={styles.macroHeader}>
              <Text style={styles.macroName}>Fat</Text>
              <Text style={styles.macroValue}>
                {Math.round(totals.fat)}/{goals.fat}g
              </Text>
            </View>
            <View style={styles.macroBar}>
              <View
                style={[
                  styles.macroFill,
                  {
                    width: `${Math.min(100, (totals.fat / goals.fat) * 100)}%`,
                    backgroundColor: COLORS.accent.quaternary,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHydration = () => {
    const goal = 2500; // 2.5L in ml
    const percentage = Math.min(100, (hydrationTotal / goal) * 100);

    return (
      <View style={styles.card}>
        <View style={styles.hydrationHeader}>
          <View style={styles.hydrationLeft}>
            <Ionicons name="water" size={24} color={COLORS.accent.primary} />
            <View>
              <Text style={styles.cardTitle}>Hydration</Text>
              <Text style={styles.hydrationValue}>
                {(hydrationTotal / 1000).toFixed(1)}L / {(goal / 1000).toFixed(1)}L
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.hydrationBar}>
          <View style={[styles.hydrationFill, { width: `${percentage}%` }]} />
        </View>

        <View style={styles.waterButtons}>
          <TouchableOpacity
            style={styles.waterButton}
            onPress={() => handleAddWater(250)}
            disabled={isAdding}
          >
            <Ionicons name="add" size={16} color={COLORS.text.onAccent} />
            <Text style={styles.waterButtonText}>250ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.waterButton}
            onPress={() => handleAddWater(500)}
            disabled={isAdding}
          >
            <Ionicons name="add" size={16} color={COLORS.text.onAccent} />
            <Text style={styles.waterButtonText}>500ml</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderWorkouts = () => {
    // Placeholder - workouts handled by Agent 3
    return (
      <View style={styles.card}>
        <View style={styles.workoutHeader}>
          <Text style={styles.cardTitle}>Today's Workouts</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('Workouts')}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.workoutPlaceholder}>
          <Ionicons name="fitness-outline" size={48} color={COLORS.text.tertiary} />
          <Text style={styles.workoutPlaceholderText}>No workouts scheduled</Text>
          <TouchableOpacity
            style={styles.workoutButton}
            onPress={() => navigation?.navigate?.('Workouts')}
          >
            <Text style={styles.workoutButtonText}>Browse Workouts</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Quick Actions</Text>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickAction} onPress={() => setShowAddMeal(true)}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="restaurant-outline" size={28} color={COLORS.accent.primary} />
          </View>
          <Text style={styles.quickActionText}>Add Meal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => handleAddWater(250)}
          disabled={isAdding}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="water-outline" size={28} color={COLORS.accent.primary} />
          </View>
          <Text style={styles.quickActionText}>Add Water</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation?.navigate?.('Nutrition')}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="stats-chart-outline" size={28} color={COLORS.accent.primary} />
          </View>
          <Text style={styles.quickActionText}>View Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation?.navigate?.('Progress')}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="trending-up-outline" size={28} color={COLORS.accent.primary} />
          </View>
          <Text style={styles.quickActionText}>Progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentMeals = () => {
    if (meals.length === 0) return null;

    return (
      <View style={styles.card}>
        <View style={styles.recentHeader}>
          <Text style={styles.cardTitle}>Recent Meals</Text>
          <TouchableOpacity onPress={() => navigation?.navigate?.('Nutrition')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {meals.slice(0, 3).map((meal) => (
          <View key={meal.id} style={styles.mealRow}>
            <View style={styles.mealLeft}>
              <Text style={styles.mealTime}>{meal.time}</Text>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealMacros}>
                  {meal.kcal} cal • P: {meal.protein}g
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (mealsLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
      >
        {renderHeader()}
        {renderMacrosCard()}
        {renderHydration()}
        {renderWorkouts()}
        {renderQuickActions()}
        {renderRecentMeals()}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <AddMealSheet visible={showAddMeal} date={today} onClose={() => setShowAddMeal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.xl,
  },
  headerContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  greeting: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  date: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  cardTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.md,
  },
  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  caloriesValue: {
    fontSize: 42,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
  },
  caloriesLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
  },
  caloriesRemaining: {
    alignItems: 'flex-end',
  },
  remainingValue: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  remainingLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  macroGrid: {
    gap: SIZES.spacing.md,
  },
  macroItem: {
    gap: SIZES.spacing.xs,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroName: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  macroValue: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
  },
  macroBar: {
    height: 6,
    backgroundColor: COLORS.background.primary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  hydrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  hydrationValue: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  hydrationBar: {
    height: 8,
    backgroundColor: COLORS.background.primary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.md,
  },
  hydrationFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 4,
  },
  waterButtons: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
  },
  waterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SIZES.spacing.sm,
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
  },
  waterButtonText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.onAccent,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  workoutPlaceholder: {
    paddingVertical: SIZES.spacing.xl,
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  workoutPlaceholderText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
  workoutButton: {
    marginTop: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.sm,
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
  },
  workoutButtonText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.onAccent,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius.md,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  quickActionText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  viewAllText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.accent.primary,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  mealLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
  },
  mealTime: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
    minWidth: 50,
  },
  mealInfo: {
    flex: 1,
    gap: 2,
  },
  mealName: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
  },
  mealMacros: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.xxl,
    gap: SIZES.spacing.md,
  },
  loadingText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  bottomPadding: {
    height: 80,
  },
});

