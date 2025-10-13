/**
 * Enhanced Progress Screen with Charts
 * Shows weight trend, activity, nutrition compliance, hydration, and steps
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useGoals, useSummary } from '../hooks/useUserData';
import useHealthKit from '../hooks/useHealthKit';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ConnectHealthCard from '../components/ConnectHealthCard';
import CircularProgress from '../components/CircularProgress';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreenEnhanced({ navigation }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch goals and summary data
  const { data: goals, isLoading: goalsLoading, refetch: refetchGoals } = useGoals();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useSummary(timeRange);
  
  // HealthKit integration
  const { 
    isAvailable: healthKitAvailable, 
    isAuthorized: healthKitAuthorized, 
    steps: healthKitSteps,
    requestPermissions: requestHealthKitPermissions
  } = useHealthKit();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchGoals(), refetchSummary()]);
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Progress</Text>
      <View style={styles.timeRangePicker}>
        <Text
          style={[styles.rangeButton, timeRange === '7d' && styles.rangeButtonActive]}
          onPress={() => setTimeRange('7d')}
        >
          7D
        </Text>
        <Text
          style={[styles.rangeButton, timeRange === '30d' && styles.rangeButtonActive]}
          onPress={() => setTimeRange('30d')}
        >
          30D
        </Text>
        <Text
          style={[styles.rangeButton, timeRange === '90d' && styles.rangeButtonActive]}
          onPress={() => setTimeRange('90d')}
        >
          90D
        </Text>
      </View>
    </View>
  );

  const renderGoalQuizPrompt = () => {
    // Show if no goals exist
    if (!goals || !goals.targets) {
      return (
        <Card style={styles.goalQuizCard}>
          <View style={styles.goalQuizContent}>
            <Ionicons name="flag" size={48} color={COLORS.accent.primary} />
            <Text style={styles.goalQuizTitle}>Set Your Goals</Text>
            <Text style={styles.goalQuizText}>
              Take the Goal Quiz to get personalized nutrition and fitness targets
            </Text>
            <Button
              title="Start Goal Quiz"
              onPress={() => navigation.navigate('GoalQuiz')}
              style={styles.goalQuizButton}
            />
          </View>
        </Card>
      );
    }
    
    // Show edit button if goals exist
    return (
      <Card style={styles.goalsCard}>
        <View style={styles.goalsHeader}>
          <View>
            <Text style={styles.goalsTitle}>Your Goals</Text>
            {goals.createdAt && (
              <Text style={styles.goalsDate}>
                Set {new Date(goals.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <Button
            title="Edit Goals"
            variant="secondary"
            onPress={() => navigation.navigate('GoalQuiz')}
            style={styles.editGoalsButton}
          />
        </View>
        <View style={styles.goalsRings}>
          {/* Calories Ring */}
          <View style={styles.goalRingItem}>
            <CircularProgress
              size={100}
              strokeWidth={10}
              progress={summary?.nutrition?.caloriesPercent || 0}
              color={COLORS.accent.quaternary}
              showPercentage={false}
              centerContent={
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>{summary?.nutrition?.caloriesConsumed || 0}</Text>
                  <Text style={styles.ringTarget}>/{goals.targets?.dailyCalories || 0}</Text>
                </View>
              }
              accessibilityLabel="Calories progress"
            />
            <Text style={styles.ringLabel}>Calories</Text>
            <Text style={styles.ringSubLabel}>kcal</Text>
          </View>

          {/* Protein Ring */}
          <View style={styles.goalRingItem}>
            <CircularProgress
              size={100}
              strokeWidth={10}
              progress={summary?.nutrition?.proteinPercent || 0}
              color={COLORS.accent.primary}
              showPercentage={false}
              centerContent={
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>{summary?.nutrition?.proteinConsumed || 0}</Text>
                  <Text style={styles.ringTarget}>/{goals.targets?.proteinTarget || 0}</Text>
                </View>
              }
              accessibilityLabel="Protein progress"
            />
            <Text style={styles.ringLabel}>Protein</Text>
            <Text style={styles.ringSubLabel}>grams</Text>
          </View>

          {/* Steps Ring - Only show when HealthKit connected */}
          {(healthKitAvailable && healthKitAuthorized) && (
            <View style={styles.goalRingItem}>
              <CircularProgress
                size={100}
                strokeWidth={10}
                progress={((healthKitSteps || 0) / (goals.targets?.dailySteps || 10000)) * 100}
                color={COLORS.accent.success}
                showPercentage={false}
                centerContent={
                  <View style={styles.ringCenter}>
                    <Text style={styles.ringValue}>{((healthKitSteps || 0) / 1000).toFixed(1)}k</Text>
                    <Text style={styles.ringTarget}>/{((goals.targets?.dailySteps || 10000) / 1000).toFixed(0)}k</Text>
                  </View>
                }
                accessibilityLabel="Steps progress"
              />
              <Text style={styles.ringLabel}>Steps</Text>
              <Text style={styles.ringSubLabel}>today</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const renderWeightTrendChart = () => {
    const weightData = summary?.weightTrend || [];
    
    if (weightData.length === 0) {
      return (
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="trending-down" size={24} color={COLORS.accent.primary} />
            <Text style={styles.chartTitle}>Weight Trend</Text>
          </View>
          <View style={styles.emptyChart}>
            <Ionicons name="scale-outline" size={48} color={COLORS.text.tertiary} />
            <Text style={styles.emptyText}>No weight data yet</Text>
            <Text style={styles.emptySubtext}>Track your weight to see trends</Text>
          </View>
        </Card>
      );
    }

    const labels = weightData.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const data = weightData.map(d => d.weight);
    const weightDelta = data.length >= 2 ? (data[data.length - 1] - data[0]).toFixed(1) : 0;
    const deltaColor = weightDelta < 0 ? COLORS.accent.success : COLORS.accent.error;

    return (
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Weight Trend</Text>
            <Text style={styles.chartSubtitle}>
              {weightDelta > 0 ? '+' : ''}{weightDelta} kg vs 30d
            </Text>
          </View>
          <View style={[styles.deltaBadge, { backgroundColor: deltaColor + '20' }]}>
            <Ionicons 
              name={weightDelta < 0 ? 'trending-down' : 'trending-up'} 
              size={16} 
              color={deltaColor} 
            />
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {Math.abs(weightDelta)} kg
            </Text>
          </View>
        </View>
        
        <LineChart
          data={{
            labels,
            datasets: [{ data }],
          }}
          width={screenWidth - 64}
          height={200}
          chartConfig={{
            backgroundColor: COLORS.background.secondary,
            backgroundGradientFrom: COLORS.background.secondary,
            backgroundGradientTo: COLORS.background.secondary,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(14, 165, 255, ${opacity})`,
            labelColor: (opacity = 1) => COLORS.text.secondary,
            style: {
              borderRadius: SIZES.radius.md,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: COLORS.accent.primary,
            },
          }}
          bezier
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderActivityChart = () => {
    const activityData = summary?.weeklyActivity || [];
    
    if (activityData.length === 0) {
      return (
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Ionicons name="barbell" size={24} color={COLORS.accent.primary} />
            <Text style={styles.chartTitle}>Weekly Activity</Text>
          </View>
          <View style={styles.emptyChart}>
            <Ionicons name="fitness-outline" size={48} color={COLORS.text.tertiary} />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Start tracking your workouts</Text>
          </View>
        </Card>
      );
    }

    const labels = activityData.map(d => d.day?.slice(0, 3) || '');
    const data = activityData.map(d => d.workouts || 0);
    const streak = summary?.streak || 0;

    return (
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak} day streak</Text>
              </View>
            )}
          </View>
        </View>
        
        <BarChart
          data={{
            labels,
            datasets: [{ data: data.length ? data : [0] }],
          }}
          width={screenWidth - 64}
          height={200}
          chartConfig={{
            backgroundColor: COLORS.background.secondary,
            backgroundGradientFrom: COLORS.background.secondary,
            backgroundGradientTo: COLORS.background.secondary,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(14, 165, 255, ${opacity})`,
            labelColor: (opacity = 1) => COLORS.text.secondary,
            style: {
              borderRadius: SIZES.radius.md,
            },
          }}
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderNutritionCompliance = () => {
    const nutritionData = summary?.nutritionCompliance || {};
    const targets = goals?.targets || {};
    
    // Calculate summary stats
    const daysHitGoal = nutritionData.daysHitGoal || 0;
    const totalDays = 7;
    const avgProtein = nutritionData.avgProtein || nutritionData.protein || 0;
    
    const metrics = [
      { label: 'Calories', key: 'calories', actual: nutritionData.calories || 0, target: targets.dailyCalories || 2000, unit: 'kcal', icon: 'flame' },
      { label: 'Protein', key: 'protein', actual: nutritionData.protein || 0, target: targets.proteinTarget || 150, unit: 'g', icon: 'fitness' },
      { label: 'Carbs', key: 'carbs', actual: nutritionData.carbs || 0, target: targets.carbsTarget || 200, unit: 'g', icon: 'nutrition' },
      { label: 'Fat', key: 'fat', actual: nutritionData.fat || 0, target: targets.fatTarget || 60, unit: 'g', icon: 'water' },
    ];

    return (
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Ionicons name="pie-chart" size={24} color={COLORS.accent.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.chartTitle}>Nutrition Compliance</Text>
            {(daysHitGoal > 0 || avgProtein > 0) && (
              <Text style={styles.complianceSummary}>
                Hit goal on {daysHitGoal}/{totalDays} days • Protein avg {Math.round(avgProtein)}g
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.complianceGrid}>
          {metrics.map((metric) => {
            const percent = metric.target > 0 ? Math.min(100, (metric.actual / metric.target) * 100) : 0;
            const isGood = percent >= 90 && percent <= 110;
            
            return (
              <View key={metric.key} style={styles.complianceItem}>
                <Ionicons name={metric.icon} size={20} color={COLORS.accent.primary} />
                <Text style={styles.complianceLabel}>{metric.label}</Text>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, percent)}%`,
                        backgroundColor: isGood ? COLORS.accent.success : COLORS.accent.warning,
                      }
                    ]} 
                  />
                </View>
                
                <Text style={styles.complianceValues}>
                  {metric.actual}/{metric.target} {metric.unit}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const renderHydrationAndSteps = () => {
    const hydration = summary?.hydration || {};
    const stepsTarget = goals?.targets?.dailySteps || 10000;
    const hydrationTarget = goals?.targets?.hydrationCups || 8;

    return (
      <View style={styles.dualCardRow}>
        <Card style={styles.miniCard}>
          <View style={styles.miniCardHeader}>
            <Ionicons name="water" size={24} color="#4ECDC4" />
            <Text style={styles.miniCardTitle}>Hydration</Text>
          </View>
          
          <View style={styles.donutContainer}>
            <Text style={styles.donutValue}>
              {hydration.actual || 0}/{hydrationTarget}
            </Text>
            <Text style={styles.donutLabel}>cups</Text>
          </View>
          
          <Text style={styles.miniCardSubtext}>
            Weekly avg: {hydration.weeklyAvg || 0} cups/day
          </Text>
        </Card>

        <Card style={styles.miniCard}>
          <View style={styles.miniCardHeader}>
            <Ionicons name="walk" size={24} color="#FFE66D" />
            <Text style={styles.miniCardTitle}>Steps</Text>
          </View>
          
          {!healthKitAvailable || !healthKitAuthorized ? (
            <ConnectHealthCard
              variant="compact"
              onConnect={async () => {
                const granted = await requestHealthKitPermissions();
                if (!granted) {
                  Alert.alert(
                    'Permission Denied',
                    'Enable Health permissions in Settings to track steps.',
                    [{ text: 'OK' }]
                  );
                }
              }}
              style={{ marginTop: SIZES.spacing.sm }}
            />
          ) : (
            <>
              <View style={styles.donutContainer}>
                <Text style={styles.donutValue}>
                  {((healthKitSteps || 0) / 1000).toFixed(1)}k
                </Text>
                <Text style={styles.donutLabel}>today</Text>
              </View>
              
              <Text style={styles.miniCardSubtext}>
                Goal: {(stepsTarget / 1000).toFixed(0)}k steps
              </Text>
            </>
          )}
        </Card>
      </View>
    );
  };

  if (goalsLoading || summaryLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading progress data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderGoalQuizPrompt()}
        {renderWeightTrendChart()}
        {renderActivityChart()}
        {renderNutritionCompliance()}
        {renderHydrationAndSteps()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  timeRangePicker: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.full,
    padding: 4,
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius.full,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  rangeButtonActive: {
    backgroundColor: COLORS.accent.primary,
    color: COLORS.text.onAccent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
  },
  chartCard: {
    marginBottom: SIZES.spacing.md,
    padding: SIZES.spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  chartTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  complianceSummary: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.xs,
  },
  chartSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius.full,
    gap: 4,
  },
  deltaText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  streakBadge: {
    marginTop: 4,
  },
  streakText: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent.warning,
    fontWeight: FONTS.weight.medium,
  },
  chart: {
    borderRadius: SIZES.radius.md,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xxl,
  },
  emptyText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginTop: SIZES.spacing.md,
  },
  emptySubtext: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  complianceGrid: {
    gap: SIZES.spacing.md,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  complianceLabel: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.medium,
  },
  progressBar: {
    flex: 2,
    height: 8,
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: SIZES.radius.full,
  },
  complianceValues: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    width: 80,
    textAlign: 'right',
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
  },
  miniCard: {
    flex: 1,
    padding: SIZES.spacing.md,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.md,
  },
  miniCardTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.lg,
  },
  donutValue: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  donutLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  miniCardSubtext: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  healthKitEmptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
  },
  emptyStateText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  connectButtonSmall: {
    minHeight: 32,
  },
  goalQuizCard: {
    marginBottom: SIZES.spacing.lg,
    padding: SIZES.spacing.xl,
  },
  goalQuizContent: {
    alignItems: 'center',
  },
  goalQuizTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.xs,
  },
  goalQuizText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  goalQuizButton: {
    minWidth: 200,
  },
  goalsCard: {
    marginBottom: SIZES.spacing.md,
    padding: SIZES.spacing.lg,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  goalsTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  goalsDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  editGoalsButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SIZES.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  goalItem: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  goalsRings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SIZES.spacing.md,
  },
  goalRingItem: {
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringValue: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  ringTarget: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  ringLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.xs,
  },
  ringSubLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  bottomPadding: {
    height: 80,
  },
});

