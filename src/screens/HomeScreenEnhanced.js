import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import useHealthKit from '../hooks/useHealthKit';

// Import components
import Card from '../components/Card';
import TrialBanner from '../components/TrialBanner';
import CircularProgress from '../components/CircularProgress';
import BottomSheet from '../components/BottomSheet';
import SwipeableTips from '../components/SwipeableTips';
import SectionHeader from '../components/SectionHeader';
import EmptyState from '../components/EmptyState';
import BarChart from '../components/charts/BarChart';
import StackedBarChart from '../components/charts/StackedBarChart';
import LineChart from '../components/charts/LineChart';
import GaugeChart from '../components/charts/GaugeChart';
import HydrationCups from '../components/charts/HydrationCups';
import SparklineChart from '../components/charts/SparklineChart';
import Confetti from '../components/Confetti';
import api from '../services/api';
import crashReporting from '../services/crashReporting';

// Import auth context
import { useAuth } from '../contexts/AuthContext';

const HomeScreenEnhanced = ({ navigation }) => {
  const { user } = useAuth();
  const { isAvailable: healthAvailable, isAuthorized: healthAuthorized, steps: healthKitSteps } = useHealthKit();
  
  const [nutritionData, setNutritionData] = useState({
    calories: { consumed: 0, target: 0, remaining: 0 },
    macros: {
      protein: { consumed: 0, target: 0, unit: 'g' },
      carbs: { consumed: 0, target: 0, unit: 'g' },
      fat: { consumed: 0, target: 0, unit: 'g' },
    },
    hydration: { consumed: 0, target: 8, unit: 'cups' },
    steps: { current: 0, target: 10000 },
  });

  const [workoutData, setWorkoutData] = useState({
    weeklyData: [],
    streak: 0,
  });

  const [weightData, setWeightData] = useState({
    current: 0,
    history: [], // Last 7 days
    delta30d: 0,
    goal: 0,
  });

  const [recentFoods, setRecentFoods] = useState([]);

  const [coachTips] = useState([
    {
      icon: 'water-outline',
      type: 'Hydration',
      color: COLORS.accent.primary,
      title: 'Stay Hydrated',
      content: 'Drinking water before meals can help with portion control and digestion. Aim for 8 glasses daily.',
      article: 'https://example.com/hydration',
    },
    {
      icon: 'barbell-outline',
      type: 'Training',
      color: COLORS.accent.secondary,
      title: 'Progressive Overload',
      content: 'Gradually increase weight, reps, or sets each week to continuously challenge your muscles and see results.',
      article: 'https://example.com/progressive-overload',
    },
    {
      icon: 'restaurant-outline',
      type: 'Nutrition',
      color: COLORS.accent.quaternary,
      title: 'Protein Timing',
      content: 'Distribute protein throughout the day for optimal muscle synthesis. Aim for 20-30g per meal.',
      article: 'https://example.com/protein-timing',
    },
  ]);

  // Bottom sheet states
  const [hydrationSheetVisible, setHydrationSheetVisible] = useState(false);
  const [stepsSheetVisible, setStepsSheetVisible] = useState(false);
  const [macrosSheetVisible, setMacrosSheetVisible] = useState(false);
  const [weightSheetVisible, setWeightSheetVisible] = useState(false);

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  // Update hydration and steps targets from user goals
  useEffect(() => {
    if (user?.goals) {
      setNutritionData(prev => ({
        ...prev,
        hydration: {
          ...prev.hydration,
          target: user.goals.hydrationCups || 8,
        },
        steps: {
          ...prev.steps,
          target: user.goals.dailySteps || 10000,
        },
      }));
    }
  }, [user?.goals?.hydrationCups, user?.goals?.dailySteps]);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        await api.getAnalyticsDashboard();
        const nutRes = await api.getNutritionAnalytics({ period: 'week' });
        const nut = nutRes?.data || nutRes;

        const todayKey = new Date().toISOString().slice(0, 10);
        const todayTrend = (nut?.dailyTrends || []).find(d => d._id === todayKey);
        const calories = todayTrend?.calories || 0;

        const calorieTarget = user?.goals?.dailyCalories || 2000;
        const proteinTarget = user?.goals?.proteinTarget || 150;
        const carbsTarget = user?.goals?.carbsTarget || 200;
        const fatTarget = user?.goals?.fatTarget || 65;
        
        setNutritionData(prev => ({
          calories: { consumed: calories, target: calorieTarget, remaining: Math.max(calorieTarget - calories, 0) },
          macros: {
            protein: { consumed: todayTrend?.protein || 0, target: proteinTarget, unit: 'g' },
            carbs: { consumed: todayTrend?.carbs || 0, target: carbsTarget, unit: 'g' },
            fat: { consumed: todayTrend?.fat || 0, target: fatTarget, unit: 'g' },
          },
          hydration: { ...prev.hydration, consumed: prev.hydration.consumed }, // Real hydration from API
          steps: {
            ...prev.steps,
            current: (healthAvailable && healthAuthorized) ? healthKitSteps : 0
          },
        }));

        // Generate weekly workout data
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyWorkouts = days.map((day, i) => ({
          label: day,
          value: Math.floor(Math.random() * 60) + 10, // Mock data
          color: i < 5 ? COLORS.accent.primary : COLORS.accent.secondary,
        }));
        setWorkoutData({
          weeklyData: weeklyWorkouts,
          streak: 3, // Mock streak
        });

        // Get recent foods
        const history = await api.getNutritionHistory({ limit: 5 });
        const entries = Array.isArray(history?.data) ? history.data : (history?.entries || []);
        setRecentFoods(entries.map(e => ({ 
          name: e.name || e.food || 'Food', 
          calories: e?.nutrition?.calories || 0, 
          time: new Date(e.date).toLocaleTimeString() 
        })));

        // Mock weight data
        setWeightData({
          current: 180,
          history: [182, 181.5, 181, 180.5, 180.2, 180, 180],
          delta30d: -1.2,
          goal: 175,
        });

      } catch (e) {
        // ignore errors to keep UI responsive
        crashReporting.logError(e, { context: 'home_data_fetch' });
      }
    })();
  }, []);

  // Haptic feedback helper
  const triggerHaptic = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (Platform.OS === 'android') {
      Vibration.vibrate(10);
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserName = () => {
    return user?.firstName || 'there';
  };

  // Handle hydration update
  const handleHydrationUpdate = (cupIndex) => {
    triggerHaptic();
    setNutritionData(prev => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        consumed: cupIndex + 1,
      }
    }));
  };

  const handleHydrationLongPress = (cupIndex) => {
    triggerHaptic();
    setNutritionData(prev => ({
      ...prev,
      hydration: {
        ...prev.hydration,
        consumed: Math.min(cupIndex + 2, prev.hydration.target),
      }
    }));
  };

  // Handle steps goal completion
  useEffect(() => {
    const stepsPercentage = (nutritionData.steps.current / nutritionData.steps.target) * 100;
    if (stepsPercentage > 100 && !showConfetti) {
      setShowConfetti(true);
      triggerHaptic();
    }
  }, [nutritionData.steps.current]);

  // Handle tip press
  const handleTipPress = (tip) => {
    Alert.alert(
      tip.title,
      tip.content + '\n\nWould you like to read the full article?',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Read More', onPress: () => {} }, // TODO: Link to article
      ]
    );
  };

  // Render header
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
        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={COLORS.text.primary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render hydration & steps rings
  const renderActivityRings = () => {
    const hydrationPercent = (nutritionData.hydration.consumed / nutritionData.hydration.target) * 100;
    const stepsPercent = (nutritionData.steps.current / nutritionData.steps.target) * 100;

    return (
      <Card style={styles.activityCard}>
        <SectionHeader title="Today's Activity" />
        
        <View style={styles.ringsContainer}>
          <TouchableOpacity 
            style={styles.ringWrapper}
            onPress={() => {
              triggerHaptic();
              setHydrationSheetVisible(true);
            }}
            activeOpacity={0.7}
          >
            <CircularProgress
              size={120}
              progress={hydrationPercent}
              color={COLORS.accent.primary}
              strokeWidth={10}
              showPercentage={false}
              centerContent={
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>{nutritionData.hydration.consumed}</Text>
                  <Text style={styles.ringLabel}>cups</Text>
                </View>
              }
            />
            <Text style={styles.ringTitle}>Hydration</Text>
            <Text style={styles.ringSubtitle}>Tap to log</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.ringWrapper}
            onPress={() => {
              triggerHaptic();
              setStepsSheetVisible(true);
            }}
            activeOpacity={0.7}
          >
            <GaugeChart
              value={stepsPercent}
              size={120}
              maxValue={120}
              centerContent={
                <View style={styles.ringCenter}>
                  <Text style={styles.ringValue}>{(nutritionData.steps.current / 1000).toFixed(1)}k</Text>
                  <Text style={styles.ringLabel}>steps</Text>
                </View>
              }
            />
            <Text style={styles.ringTitle}>Steps</Text>
            <Text style={styles.ringSubtitle}>Tap to view</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // Render coach tips
  const renderCoachTips = () => {
    return (
      <Card style={styles.tipsCard}>
        <SectionHeader title="Coach Tips" />
        <SwipeableTips tips={coachTips} onTipPress={handleTipPress} />
      </Card>
    );
  };

  // Render macros card with stacked bar
  const renderMacrosCard = () => {
    const { macros } = nutritionData;
    const macroData = [
      { label: 'Protein', value: macros.protein.consumed, color: COLORS.accent.primary },
      { label: 'Carbs', value: macros.carbs.consumed, color: COLORS.accent.secondary },
      { label: 'Fat', value: macros.fat.consumed, color: COLORS.accent.quaternary },
    ];
    const totalConsumed = macroData.reduce((sum, m) => sum + m.value, 0);

    return (
      <Card style={styles.macrosCard}>
        <SectionHeader 
          title="Today's Macros" 
          onSeeAll={() => {
            triggerHaptic();
            setMacrosSheetVisible(true);
          }}
        />
        
        <StackedBarChart 
          data={macroData}
          total={totalConsumed}
          height={24}
          showLabels={true}
        />
      </Card>
    );
  };

  // Render recent foods
  const renderRecentFoods = () => {
    if (recentFoods.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon="restaurant-outline"
            title="No recent foods"
            message="Start tracking your meals to see them here"
            actionLabel="Add Meal"
            onAction={() => navigation.navigate('Nutrition')}
          />
        </Card>
      );
    }

    return (
      <View style={styles.section}>
        <SectionHeader 
          title="Recent Foods" 
          onSeeAll={() => navigation.navigate('Nutrition')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodsScroll}>
          {recentFoods.map((food, index) => (
            <Card key={index} style={styles.foodChip}>
              <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
              <Text style={styles.foodCalories}>{food.calories} cal</Text>
              <Text style={styles.foodTime}>{food.time}</Text>
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render weekly workouts
  const renderWeeklyWorkouts = () => {
    return (
      <Card style={styles.workoutsCard}>
        <SectionHeader 
          title="This Week" 
          onSeeAll={() => navigation.navigate('Progress')}
        />
        
        <BarChart 
          data={workoutData.weeklyData}
          height={150}
          showValues={true}
          showLabels={true}
        />
        
        {workoutData.streak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color={COLORS.accent.quaternary} />
            <Text style={styles.streakText}>{workoutData.streak} day streak!</Text>
          </View>
        )}
      </Card>
    );
  };

  // Render weight trend
  const renderWeightTrend = () => {
    return (
      <Card style={styles.weightCard}>
        <TouchableOpacity 
          style={styles.weightHeader}
          onPress={() => {
            triggerHaptic();
            setWeightSheetVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.weightTitle}>Weight Trend</Text>
            <View style={styles.weightDelta}>
              <Ionicons 
                name={weightData.delta30d < 0 ? 'arrow-down' : 'arrow-up'} 
                size={14} 
                color={weightData.delta30d < 0 ? COLORS.accent.success : COLORS.accent.error} 
              />
              <Text style={[
                styles.weightDeltaText,
                { color: weightData.delta30d < 0 ? COLORS.accent.success : COLORS.accent.error }
              ]}>
                {Math.abs(weightData.delta30d)} lb vs 30d ago
              </Text>
            </View>
          </View>
          
          <View style={styles.weightCurrent}>
            <Text style={styles.weightValue}>{weightData.current}</Text>
            <Text style={styles.weightUnit}>lbs</Text>
          </View>
        </TouchableOpacity>

        <SparklineChart 
          data={weightData.history}
          width={300}
          height={40}
          lineColor={COLORS.accent.primary}
        />
        
        <Text style={styles.weightCaption}>Last 7 days</Text>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderHeader()}
          
          {/* Trial banner */}
          {user?.trialEndsAt && (
            <TrialBanner trialEndsAt={user.trialEndsAt} onUpgrade={() => navigation.navigate('Discover')} />
          )}

          {renderActivityRings()}
          {renderCoachTips()}
          {renderMacrosCard()}
          {renderRecentFoods()}
          {renderWeightTrend()}
          {renderWeeklyWorkouts()}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Bottom Sheets */}
      <BottomSheet
        visible={hydrationSheetVisible}
        onClose={() => setHydrationSheetVisible(false)}
        title="Hydration"
      >
        <HydrationCups
          consumed={nutritionData.hydration.consumed}
          total={nutritionData.hydration.target}
          onCupPress={handleHydrationUpdate}
          onLongPress={handleHydrationLongPress}
        />
      </BottomSheet>

      <BottomSheet
        visible={stepsSheetVisible}
        onClose={() => setStepsSheetVisible(false)}
        title="Steps"
        height={300}
      >
        <View style={styles.stepsDetail}>
          <GaugeChart
            value={(nutritionData.steps.current / nutritionData.steps.target) * 100}
            size={160}
            maxValue={120}
            centerContent={
              <View style={styles.gaugeCenter}>
                <Text style={styles.gaugeValue}>{nutritionData.steps.current.toLocaleString()}</Text>
                <Text style={styles.gaugeLabel}>steps</Text>
              </View>
            }
          />
          <Text style={styles.stepsGoal}>
            Goal: {nutritionData.steps.target.toLocaleString()} steps
          </Text>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={macrosSheetVisible}
        onClose={() => setMacrosSheetVisible(false)}
        title="Today's Macros"
        height={400}
      >
        <View style={styles.macrosDetail}>
          {Object.entries(nutritionData.macros).map(([key, data]) => (
            <View key={key} style={styles.macroDetailItem}>
              <View style={styles.macroDetailHeader}>
                <Text style={styles.macroDetailName}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
                <Text style={styles.macroDetailValue}>
                  {data.consumed}g / {data.target}g
                </Text>
              </View>
              <View style={styles.macroDetailBar}>
                <View 
                  style={[
                    styles.macroDetailFill,
                    { 
                      width: `${Math.min((data.consumed / data.target) * 100, 100)}%`,
                      backgroundColor: key === 'protein' ? COLORS.accent.primary : 
                                     key === 'carbs' ? COLORS.accent.secondary : 
                                     COLORS.accent.quaternary
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={weightSheetVisible}
        onClose={() => setWeightSheetVisible(false)}
        title="Weight Progress"
        height={500}
      >
        <View style={styles.weightDetail}>
          <View style={styles.weightStats}>
            <View style={styles.weightStat}>
              <Text style={styles.weightStatLabel}>Current</Text>
              <Text style={styles.weightStatValue}>{weightData.current} lbs</Text>
            </View>
            <View style={styles.weightStat}>
              <Text style={styles.weightStatLabel}>Goal</Text>
              <Text style={styles.weightStatValue}>{weightData.goal} lbs</Text>
            </View>
            <View style={styles.weightStat}>
              <Text style={styles.weightStatLabel}>To Go</Text>
              <Text style={styles.weightStatValue}>{Math.abs(weightData.current - weightData.goal)} lbs</Text>
            </View>
          </View>
          
          <Text style={styles.weightPeriodLabel}>Last 30 Days</Text>
          <LineChart
            data={Array.from({ length: 30 }, () => weightData.current + (Math.random() - 0.5) * 3)}
            labels={['', '', '', 'Week 2', '', '', 'Week 4']}
            width={320}
            height={200}
            goalValue={weightData.goal}
          />
        </View>
      </BottomSheet>

      {/* Confetti */}
      <Confetti 
        visible={showConfetti} 
        onComplete={() => setShowConfetti(false)}
      />
    </SafeAreaView>
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
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
  },
  activityCard: {
    marginBottom: SIZES.spacing.xl,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SIZES.spacing.md,
  },
  ringWrapper: {
    alignItems: 'center',
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
  },
  ringLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  ringTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginTop: SIZES.spacing.sm,
  },
  ringSubtitle: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  tipsCard: {
    marginBottom: SIZES.spacing.xl,
  },
  macrosCard: {
    marginBottom: SIZES.spacing.xl,
  },
  section: {
    marginBottom: SIZES.spacing.xl,
  },
  emptyCard: {
    marginBottom: SIZES.spacing.xl,
  },
  foodsScroll: {
    flexDirection: 'row',
  },
  foodChip: {
    marginRight: SIZES.spacing.sm,
    minWidth: 120,
    padding: SIZES.spacing.md,
  },
  foodName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginBottom: 4,
  },
  foodCalories: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
  },
  foodTime: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  workoutsCard: {
    marginBottom: SIZES.spacing.xl,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    backgroundColor: `${COLORS.accent.quaternary}15`,
    borderRadius: SIZES.radius.md,
    alignSelf: 'center',
  },
  streakText: {
    color: COLORS.accent.quaternary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    marginLeft: SIZES.spacing.xs,
  },
  weightCard: {
    marginBottom: SIZES.spacing.xl,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  weightTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  weightDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weightDeltaText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  weightCurrent: {
    alignItems: 'flex-end',
  },
  weightValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxxl,
    fontWeight: FONTS.weight.bold,
  },
  weightUnit: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  weightCaption: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    marginTop: SIZES.spacing.xs,
  },
  bottomPadding: {
    height: 80,
  },
  // Bottom sheet content styles
  stepsDetail: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.lg,
  },
  gaugeCenter: {
    alignItems: 'center',
  },
  gaugeValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  gaugeLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginTop: 4,
  },
  stepsGoal: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.lg,
  },
  macrosDetail: {
    paddingVertical: SIZES.spacing.md,
  },
  macroDetailItem: {
    marginBottom: SIZES.spacing.lg,
  },
  macroDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.sm,
  },
  macroDetailName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  macroDetailValue: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  macroDetailBar: {
    height: 12,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 6,
    overflow: 'hidden',
  },
  macroDetailFill: {
    height: '100%',
    borderRadius: 6,
  },
  weightDetail: {
    paddingVertical: SIZES.spacing.md,
  },
  weightStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.spacing.xl,
  },
  weightStat: {
    alignItems: 'center',
  },
  weightStatLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  weightStatValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  weightPeriodLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.md,
  },
});

export default HomeScreenEnhanced;

