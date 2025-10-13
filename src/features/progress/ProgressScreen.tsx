/**
 * ProgressScreen - Progress tracking with goals, charts, and photos
 * Shows goals (TDEE), trends (7/30 days), and progress photos
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { db } from '../../storage/db';
import { GoalSetup } from './GoalSetup';
import { EmptyProgress } from './components/EmptyProgress';
import { TrendChart } from './components/TrendChart';
import { ProgressPhotos, type ProgressPhoto } from './components/ProgressPhotos';
import { tdee, calculateMacros, type GoalInput } from '../../services/goals';
import { ErrorState } from '../discover/components/ErrorState';

type TimeRange = '7d' | '30d';

export default function ProgressScreen({ navigation }: any) {
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const queryClient = useQueryClient();

  // Fetch current goal
  const { data: goalData, isLoading: goalLoading, error: goalError, refetch: refetchGoal } = useQuery({
    queryKey: ['goals', 'current'],
    queryFn: async () => {
      try {
        const rows = await db.execute('SELECT * FROM goals ORDER BY createdAt DESC LIMIT 1');
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (error) {
        console.error('[ProgressScreen] Goal query error:', error);
        return null;
      }
    },
  });

  // Fetch meal trends (calories)
  const { data: mealTrends, isLoading: mealsLoading, error: mealsError, refetch: refetchMeals } = useQuery({
    queryKey: ['meal-trends', timeRange],
    queryFn: async () => {
      const days = timeRange === '7d' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      try {
        // Get daily totals
        const rows = await db.execute(
          `SELECT date, SUM(kcal) as kcal FROM meals 
           WHERE date >= ? 
           GROUP BY date 
           ORDER BY date ASC`,
          [startDate.toISOString().split('T')[0]]
        );

        return (rows || []).map((row: any) => ({
          date: row.date,
          value: row.kcal || 0,
        }));
      } catch (error) {
        console.error('[ProgressScreen] Meal trends error:', error);
        return [];
      }
    },
  });

  // Fetch progress photos
  const { data: photos, error: photosError, refetch: refetchPhotos } = useQuery<ProgressPhoto[]>({
    queryKey: ['progress-photos'],
    queryFn: async () => {
      try {
        const rows = await db.execute('SELECT * FROM photos ORDER BY date DESC LIMIT 12');
        return (rows || []) as ProgressPhoto[];
      } catch (error) {
        console.error('[ProgressScreen] Photos query error:', error);
        return [];
      }
    },
  });

  const handleRefresh = () => {
    refetchGoal();
    refetchMeals();
    refetchPhotos();
  };

  // Show error state if any query failed (only if not loading)
  const hasError = goalError || mealsError || photosError;
  if (hasError && !goalLoading && !mealsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>
        <ErrorState 
          message="Failed to load progress data"
          error={hasError}
          onRetry={handleRefresh}
        />
      </View>
    );
  }

  const handleAddMeal = () => {
    navigation?.navigate?.('Nutrition');
  };

  const handleStartWorkout = () => {
    navigation?.navigate?.('Workouts');
  };

  const handleSetGoals = () => {
    setShowGoalSetup(true);
  };

  const handleGoalComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  };

  // Check if we have any data
  const hasData =
    goalData ||
    (mealTrends && mealTrends.length > 0) ||
    (photos && photos.length > 0);

  // Show empty state if no data
  if (!goalLoading && !mealsLoading && !hasData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>
        <EmptyProgress
          onAddMeal={handleAddMeal}
          onSetGoals={handleSetGoals}
          onStartWorkout={handleStartWorkout}
        />
      </View>
    );
  }

  const renderGoalCard = () => {
    if (!goalData) {
      return (
        <TouchableOpacity style={styles.goalSetupCard} onPress={handleSetGoals}>
          <View style={styles.goalSetupLeft}>
            <Ionicons name="flag-outline" size={32} color={COLORS.accent.primary} />
            <View style={styles.goalSetupText}>
              <Text style={styles.goalSetupTitle}>Set Your Goals</Text>
              <Text style={styles.goalSetupSubtext}>
                Calculate your TDEE and get macro targets
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text.tertiary} />
        </TouchableOpacity>
      );
    }

    const goalInput: GoalInput = {
      sex: goalData.sex,
      age: goalData.age,
      height_cm: goalData.height_cm,
      weight_kg: goalData.weight_kg,
      activity: goalData.activity,
      target: goalData.target,
    };

    const tdeeValue = tdee(goalInput);
    const macros = calculateMacros(goalInput);

    return (
      <View style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Your Goals</Text>
          <TouchableOpacity onPress={handleSetGoals}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goalStats}>
          <View style={styles.goalStat}>
            <Text style={styles.goalStatLabel}>TDEE</Text>
            <Text style={styles.goalStatValue}>{tdeeValue}</Text>
            <Text style={styles.goalStatUnit}>cal/day</Text>
          </View>

          <View style={styles.goalStat}>
            <Text style={styles.goalStatLabel}>Target</Text>
            <Text style={styles.goalStatValue}>{macros.kcal}</Text>
            <Text style={styles.goalStatUnit}>cal/day</Text>
          </View>

          <View style={styles.goalStat}>
            <Text style={styles.goalStatLabel}>Protein</Text>
            <Text style={styles.goalStatValue}>{macros.protein}</Text>
            <Text style={styles.goalStatUnit}>g/day</Text>
          </View>
        </View>

        <View style={styles.macroRow}>
          <View style={styles.macroMini}>
            <Text style={styles.macroMiniLabel}>Carbs</Text>
            <Text style={styles.macroMiniValue}>{macros.carbs}g</Text>
          </View>
          <View style={styles.macroMini}>
            <Text style={styles.macroMiniLabel}>Fat</Text>
            <Text style={styles.macroMiniValue}>{macros.fat}g</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTimeRangePicker = () => (
    <View style={styles.timeRangePicker}>
      <TouchableOpacity
        style={[styles.rangeButton, timeRange === '7d' && styles.rangeButtonActive]}
        onPress={() => setTimeRange('7d')}
      >
        <Text
          style={[styles.rangeButtonText, timeRange === '7d' && styles.rangeButtonTextActive]}
        >
          7 Days
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.rangeButton, timeRange === '30d' && styles.rangeButtonActive]}
        onPress={() => setTimeRange('30d')}
      >
        <Text
          style={[styles.rangeButtonText, timeRange === '30d' && styles.rangeButtonTextActive]}
        >
          30 Days
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      >
        {renderGoalCard()}

        {renderTimeRangePicker()}

        {mealsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accent.primary} />
          </View>
        ) : (
          <>
            <TrendChart
              title="Calorie Intake"
              data={mealTrends || []}
              unit=" cal"
              color={COLORS.accent.primary}
            />

            {/* Placeholder for workout trends - Agent 3 will implement */}
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>Workout Frequency</Text>
              <Text style={styles.placeholderText}>
                Coming soon - workouts per week tracking
              </Text>
            </View>

            {/* Placeholder for weight trend - needs weight tracking */}
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>Weight Trend</Text>
              <Text style={styles.placeholderText}>
                Coming soon - body weight tracking
              </Text>
            </View>
          </>
        )}

        <ProgressPhotos photos={photos || []} />

        <View style={styles.bottomPadding} />
      </ScrollView>

      <GoalSetup
        visible={showGoalSetup}
        onClose={() => setShowGoalSetup(false)}
        onComplete={handleGoalComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.lg,
  },
  goalSetupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
  },
  goalSetupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
    flex: 1,
  },
  goalSetupText: {
    flex: 1,
  },
  goalSetupTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  goalSetupSubtext: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  goalCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  goalTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
  },
  editButton: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.accent.primary,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
    marginBottom: SIZES.spacing.md,
  },
  goalStat: {
    alignItems: 'center',
  },
  goalStatLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginBottom: 4,
  },
  goalStatValue: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
  },
  goalStatUnit: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroMini: {
    alignItems: 'center',
  },
  macroMiniLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  macroMiniValue: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
  },
  timeRangePicker: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    padding: 4,
    marginBottom: SIZES.spacing.md,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: SIZES.spacing.sm,
    alignItems: 'center',
    borderRadius: SIZES.radius.sm,
  },
  rangeButtonActive: {
    backgroundColor: COLORS.accent.primary,
  },
  rangeButtonText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  rangeButtonTextActive: {
    color: COLORS.text.onAccent,
  },
  loadingContainer: {
    paddingVertical: SIZES.spacing.xxl,
    alignItems: 'center',
  },
  placeholderCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  placeholderText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 80,
  },
});

