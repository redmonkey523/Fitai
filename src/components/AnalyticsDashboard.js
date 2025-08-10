import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { aiRecommender } from '../utils/aiWorkoutRecommender';

// Import components
import Card from './Card';
import ProgressBar from './ProgressBar';
import Button from './Button';

const { width } = Dimensions.get('window');

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    // Mock analytics data - in a real app, this would come from your backend
    const data = {
      overview: {
        totalWorkouts: 24,
        totalCalories: 8750,
        avgWorkoutDuration: 42,
        currentStreak: 5,
        weeklyGoalProgress: 0.75,
        monthlyGoalProgress: 0.60
      },
      trends: {
        weekly: [
          { day: 'Mon', workouts: 1, calories: 250, steps: 6500 },
          { day: 'Tue', workouts: 2, calories: 450, steps: 8200 },
          { day: 'Wed', workouts: 0, calories: 150, steps: 5800 },
          { day: 'Thu', workouts: 1, calories: 320, steps: 7400 },
          { day: 'Fri', workouts: 1, calories: 380, steps: 9100 },
          { day: 'Sat', workouts: 2, calories: 520, steps: 11200 },
          { day: 'Sun', workouts: 0, calories: 180, steps: 4300 },
        ],
        monthly: {
          workouts: [18, 22, 24, 26],
          calories: [7200, 8100, 8750, 9200],
          steps: [180000, 195000, 210000, 225000]
        }
      },
      correlations: {
        nutritionWorkout: 0.78,
        sleepPerformance: 0.65,
        stressRecovery: -0.42,
        hydrationEnergy: 0.71
      },
      predictions: {
        nextWeekWorkouts: 5,
        nextWeekCalories: 2100,
        goalAchievementDate: '2025-04-15',
        recommendedIntensity: 'moderate'
      }
    };

    setAnalyticsData(data);
    generateInsights(data);
  };

  const generateInsights = (data) => {
    const newInsights = [];

    // Performance insights
    if (data.overview.currentStreak >= 5) {
      newInsights.push({
        type: 'success',
        title: 'Consistency Champion',
        message: `You've maintained a ${data.overview.currentStreak}-day workout streak!`,
        icon: '🔥'
      });
    }

    if (data.correlations.nutritionWorkout > 0.7) {
      newInsights.push({
        type: 'info',
        title: 'Nutrition-Performance Link',
        message: 'Your nutrition habits strongly correlate with workout performance.',
        icon: '📊'
      });
    }

    if (data.trends.weekly.filter(d => d.workouts > 0).length >= 5) {
      newInsights.push({
        type: 'success',
        title: 'Active Week',
        message: 'You worked out on 5+ days this week!',
        icon: '💪'
      });
    }

    // Improvement suggestions
    if (data.correlations.sleepPerformance < 0.7) {
      newInsights.push({
        type: 'warning',
        title: 'Sleep Optimization',
        message: 'Improving sleep quality could boost your workout performance.',
        icon: '😴'
      });
    }

    if (data.overview.weeklyGoalProgress < 0.8) {
      newInsights.push({
        type: 'suggestion',
        title: 'Goal Adjustment',
        message: 'Consider adjusting your weekly goals for better achievability.',
        icon: '🎯'
      });
    }

    setInsights(newInsights);
  };

  const renderOverviewTab = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.tabContent}>
        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.overview.totalWorkouts}</Text>
            <Text style={styles.metricLabel}>Total Workouts</Text>
            <ProgressBar 
              progress={analyticsData.overview.weeklyGoalProgress} 
              type="progress" 
            />
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.overview.totalCalories}</Text>
            <Text style={styles.metricLabel}>Calories Burned</Text>
            <ProgressBar 
              progress={analyticsData.overview.monthlyGoalProgress} 
              type="progress" 
            />
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.overview.currentStreak}</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
            <View style={styles.streakIndicator}>
              <Text style={styles.streakText}>🔥 Active</Text>
            </View>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricValue}>{analyticsData.overview.avgWorkoutDuration}m</Text>
            <Text style={styles.metricLabel}>Avg Duration</Text>
            <Text style={styles.trendText}>↗️ +5% this week</Text>
          </Card>
        </View>

        {/* Weekly Activity Chart */}
        <Card title="Weekly Activity" style={styles.chartCard}>
          <View style={styles.chartContainer}>
            {analyticsData.trends.weekly.map((day, index) => (
              <View key={index} style={styles.chartColumn}>
                <View 
                  style={[
                    styles.chartBar, 
                    { 
                      height: (day.calories / 600) * 100,
                      backgroundColor: day.workouts > 0 ? COLORS.accent.success : COLORS.accent.tertiary
                    }
                  ]} 
                />
                <Text style={styles.chartLabel}>{day.day}</Text>
                <Text style={styles.chartValue}>{day.workouts}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Insights */}
        <Card title="AI Insights" style={styles.insightsCard}>
          <View style={styles.insightsContainer}>
            {insights.slice(0, 3).map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>
    );
  };

  const renderTrendsTab = () => {
    if (!analyticsData) return null;

    return (
      <View style={styles.tabContent}>
        {/* Monthly Trends */}
        <Card title="Monthly Progress" style={styles.trendCard}>
          <View style={styles.trendContainer}>
            <View style={styles.trendMetric}>
              <Text style={styles.trendLabel}>Workouts</Text>
              <Text style={styles.trendValue}>
                {analyticsData.trends.monthly.workouts[analyticsData.trends.monthly.workouts.length - 1]}
              </Text>
              <Text style={styles.trendChange}>+4 from last month</Text>
            </View>
            
            <View style={styles.trendMetric}>
              <Text style={styles.trendLabel}>Calories</Text>
              <Text style={styles.trendValue}>
                {analyticsData.trends.monthly.calories[analyticsData.trends.monthly.calories.length - 1]}
              </Text>
              <Text style={styles.trendChange}>+450 from last month</Text>
            </View>
            
            <View style={styles.trendMetric}>
              <Text style={styles.trendLabel}>Steps</Text>
              <Text style={styles.trendValue}>
                {Math.round(analyticsData.trends.monthly.steps[analyticsData.trends.monthly.steps.length - 1] / 1000)}k
              </Text>
              <Text style={styles.trendChange}>+15k from last month</Text>
            </View>
          </View>
        </Card>

        {/* Performance Correlations */}
        <Card title="Performance Correlations" style={styles.correlationCard}>
          <View style={styles.correlationContainer}>
            {Object.entries(analyticsData.correlations).map(([key, value]) => (
              <View key={key} style={styles.correlationItem}>
                <View style={styles.correlationHeader}>
                  <Text style={styles.correlationLabel}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Text>
                  <Text style={styles.correlationValue}>
                    {Math.abs(value * 100).toFixed(0)}%
                  </Text>
                </View>
                <ProgressBar 
                  progress={Math.abs(value)} 
                  type={value > 0 ? "progress" : "workout"} 
                />
                <Text style={styles.correlationDescription}>
                  {value > 0 ? 'Positive correlation' : 'Negative correlation'}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Predictions */}
        <Card title="AI Predictions" style={styles.predictionCard}>
          <View style={styles.predictionContainer}>
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>Next Week Workouts</Text>
              <Text style={styles.predictionValue}>{analyticsData.predictions.nextWeekWorkouts}</Text>
            </View>
            
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>Goal Achievement</Text>
              <Text style={styles.predictionValue}>
                {new Date(analyticsData.predictions.goalAchievementDate).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.predictionItem}>
              <Text style={styles.predictionLabel}>Recommended Intensity</Text>
              <Text style={styles.predictionValue}>
                {analyticsData.predictions.recommendedIntensity.charAt(0).toUpperCase() + 
                 analyticsData.predictions.recommendedIntensity.slice(1)}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  const renderGoalsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card title="Goal Tracking" style={styles.goalCard}>
          <View style={styles.goalContainer}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Weekly Workouts</Text>
              <Text style={styles.goalProgress}>4/5 completed</Text>
              <ProgressBar progress={0.8} type="progress" />
            </View>
            
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Monthly Calories</Text>
              <Text style={styles.goalProgress}>8,750/12,000 burned</Text>
              <ProgressBar progress={0.73} type="progress" />
            </View>
            
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Daily Steps</Text>
              <Text style={styles.goalProgress}>8,432/10,000 steps</Text>
              <ProgressBar progress={0.84} type="progress" />
            </View>
          </View>
        </Card>

        <Card title="Goal Recommendations" style={styles.recommendationCard}>
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationText}>
              Based on your current progress, consider these goal adjustments:
            </Text>
            
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationTitle}>Increase Weekly Workouts</Text>
              <Text style={styles.recommendationDescription}>
                You're consistently completing 4 workouts per week. Try increasing to 5 for better results.
              </Text>
            </View>
            
            <View style={styles.recommendationItem}>
              <Text style={styles.recommendationTitle}>Optimize Workout Duration</Text>
              <Text style={styles.recommendationDescription}>
                Your average workout duration is 42 minutes. Consider 45-50 minute sessions for optimal results.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trends' && styles.activeTab]}
          onPress={() => setActiveTab('trends')}
        >
          <Text style={[styles.tabText, activeTab === 'trends' && styles.activeTabText]}>
            Trends
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
          onPress={() => setActiveTab('goals')}
        >
          <Text style={[styles.tabText, activeTab === 'goals' && styles.activeTabText]}>
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'trends' && renderTrendsTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent.primary,
  },
  tabText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  activeTabText: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: SIZES.spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.lg,
  },
  metricCard: {
    width: (width - SIZES.spacing.lg * 3) / 2,
    marginBottom: SIZES.spacing.md,
    padding: SIZES.spacing.md,
  },
  metricValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  metricLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.sm,
  },
  streakIndicator: {
    backgroundColor: COLORS.accent.success,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    alignSelf: 'flex-start',
  },
  streakText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
  },
  trendText: {
    color: COLORS.accent.success,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
  },
  chartCard: {
    marginBottom: SIZES.spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingVertical: SIZES.spacing.md,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: SIZES.radius.sm,
    marginBottom: SIZES.spacing.xs,
  },
  chartLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
  },
  chartValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
  },
  insightsCard: {
    marginBottom: SIZES.spacing.lg,
  },
  insightsContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.md,
  },
  insightIcon: {
    fontSize: FONTS.size.lg,
    marginRight: SIZES.spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  insightMessage: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  trendCard: {
    marginBottom: SIZES.spacing.lg,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.spacing.sm,
  },
  trendMetric: {
    alignItems: 'center',
    flex: 1,
  },
  trendLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  trendValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  trendChange: {
    color: COLORS.accent.success,
    fontSize: FONTS.size.xs,
  },
  correlationCard: {
    marginBottom: SIZES.spacing.lg,
  },
  correlationContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  correlationItem: {
    marginBottom: SIZES.spacing.md,
  },
  correlationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.xs,
  },
  correlationLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  correlationValue: {
    color: COLORS.accent.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  correlationDescription: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: SIZES.spacing.xs,
  },
  predictionCard: {
    marginBottom: SIZES.spacing.lg,
  },
  predictionContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  predictionLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
  },
  predictionValue: {
    color: COLORS.accent.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  goalCard: {
    marginBottom: SIZES.spacing.lg,
  },
  goalContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  goalItem: {
    marginBottom: SIZES.spacing.md,
  },
  goalLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.xs,
  },
  goalProgress: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  recommendationCard: {
    marginBottom: SIZES.spacing.lg,
  },
  recommendationContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  recommendationText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.md,
  },
  recommendationItem: {
    marginBottom: SIZES.spacing.md,
  },
  recommendationTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  recommendationDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  bottomPadding: {
    height: 80,
  },
});

export default AnalyticsDashboard;
