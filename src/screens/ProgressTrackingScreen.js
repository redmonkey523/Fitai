import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const ProgressTrackingScreen = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('analytics');

  // Real user data (starts empty)
  const [progressStats, setProgressStats] = useState({
    weekly: [],
    monthly: {
      workouts: 0,
      calories: 0,
      steps: 0,
      activeMinutes: 0,
      completedChallenges: 0,
    },
  });

  const [photoProgress, setPhotoProgress] = useState([]);
  const [achievements, setAchievements] = useState([]);

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'stats':
        return renderStatsTab();
      case 'photos':
        return renderPhotosTab();
      case 'achievements':
        return renderAchievementsTab();
      default:
        return <AnalyticsDashboard />;
    }
  };

  // Render stats tab content
  const renderStatsTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Weekly Progress Card */}
        <Card
          type="progress"
          title="Weekly Progress"
          subtitle="Last 7 days"
          style={styles.card}
        >
          {progressStats.weekly.length > 0 ? (
            <View style={styles.weeklyStatsContainer}>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>Weekly Activity Chart</Text>
                
                {/* Simple bar representation */}
                <View style={styles.simpleBars}>
                  {progressStats.weekly.map((day, index) => (
                    <View key={index} style={styles.barColumn}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: day.calories / 10,
                            backgroundColor: day.workouts > 0 
                              ? COLORS.accent.success 
                              : COLORS.accent.tertiary
                          }
                        ]} 
                      />
                      <Text style={styles.barLabel}>{day.day}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.weeklyStatsDetails}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Workouts:</Text>
                  <Text style={styles.statValue}>
                    {progressStats.weekly.reduce((sum, day) => sum + day.workouts, 0)}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Calories:</Text>
                  <Text style={styles.statValue}>
                    {progressStats.weekly.reduce((sum, day) => sum + day.calories, 0)} kcal
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Steps:</Text>
                  <Text style={styles.statValue}>
                    {progressStats.weekly.reduce((sum, day) => sum + day.steps, 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="stats-chart-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No progress data yet</Text>
              <Text style={styles.emptyStateText}>
                Start working out to see your weekly progress and statistics here.
              </Text>
              <Button
                type="primary"
                label="START WORKOUT"
                onPress={() => {}}
                style={styles.emptyStateButton}
              />
            </View>
          )}
        </Card>

        {/* Monthly Summary Card */}
        <Card
          type="primary"
          title="Monthly Summary"
          subtitle="This month"
          style={styles.card}
        >
          {progressStats.monthly.workouts > 0 ? (
            <View style={styles.monthlyStatsContainer}>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyStatValue}>{progressStats.monthly.workouts}</Text>
                <Text style={styles.monthlyStatLabel}>Workouts</Text>
              </View>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyStatValue}>{progressStats.monthly.calories.toLocaleString()}</Text>
                <Text style={styles.monthlyStatLabel}>Calories</Text>
              </View>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyStatValue}>{progressStats.monthly.steps.toLocaleString()}</Text>
                <Text style={styles.monthlyStatLabel}>Steps</Text>
              </View>
              <View style={styles.monthlyStat}>
                <Text style={styles.monthlyStatValue}>{progressStats.monthly.activeMinutes}</Text>
                <Text style={styles.monthlyStatLabel}>Active Min</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No monthly data</Text>
              <Text style={styles.emptyStateText}>
                Complete your first workout to start building your monthly statistics.
              </Text>
            </View>
          )}
        </Card>
      </View>
    );
  };

  // Render photos tab content
  const renderPhotosTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card
          type="secondary"
          title="Progress Photos"
          subtitle="Track your visual progress"
          style={styles.card}
        >
          {photoProgress.length > 0 ? (
            <View style={styles.photosContainer}>
              <View style={styles.photosGrid}>
                {photoProgress.map((photo) => (
                  <View key={photo.id} style={styles.photoItem}>
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="image" size={32} color={COLORS.text.tertiary} />
                      <Text style={styles.photoDate}>{photo.date}</Text>
                      {photo.isPrivate && (
                        <View style={styles.privateBadge}>
                          <Ionicons name="lock-closed" size={12} color={COLORS.text.primary} />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="camera-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No progress photos yet</Text>
              <Text style={styles.emptyStateText}>
                Take photos to track your visual progress over time. Photos are private by default.
              </Text>
              <Button
                type="primary"
                label="TAKE PHOTO"
                onPress={() => {}}
                style={styles.emptyStateButton}
              />
            </View>
          )}
        </Card>
        
        <Card
          title="Photo Tips"
          style={styles.tipsCard}
        >
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Best Practices</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} />
              <Text style={styles.tipText}>Take photos in consistent lighting</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} />
              <Text style={styles.tipText}>Use the same pose and angle</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} />
              <Text style={styles.tipText}>Take photos monthly for best tracking</Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  // Render achievements tab content
  const renderAchievementsTab = () => {
    return (
      <View style={styles.tabContent}>
        <Card
          type="workout"
          title="Achievements"
          subtitle="Celebrate your milestones"
          style={styles.card}
        >
          {achievements.length > 0 ? (
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <View style={styles.achievementIcon}>
                    <Ionicons name={achievement.icon} size={24} color={COLORS.accent.primary} />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <Text style={styles.achievementDate}>{achievement.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="trophy-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateTitle}>No achievements yet</Text>
              <Text style={styles.emptyStateText}>
                Complete workouts and reach milestones to unlock achievements and badges.
              </Text>
              <Button
                type="primary"
                label="VIEW MILESTONES"
                onPress={() => {}}
                style={styles.emptyStateButton}
              />
            </View>
          )}
        </Card>
        
        <Card
          title="Upcoming Milestones"
          style={styles.milestonesCard}
        >
          <View style={styles.milestonesContent}>
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneIcon}>
                <Ionicons name="fitness" size={20} color={COLORS.accent.tertiary} />
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>First Workout</Text>
                <Text style={styles.milestoneDescription}>Complete your first workout</Text>
              </View>
              <View style={styles.milestoneProgress}>
                <ProgressBar progress={0} type="primary" />
              </View>
            </View>
            
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneIcon}>
                <Ionicons name="flame" size={20} color={COLORS.accent.quaternary} />
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Week Warrior</Text>
                <Text style={styles.milestoneDescription}>Complete 5 workouts in a week</Text>
              </View>
              <View style={styles.milestoneProgress}>
                <ProgressBar progress={0} type="workout" />
              </View>
            </View>
            
            <View style={styles.milestoneItem}>
              <View style={styles.milestoneIcon}>
                <Ionicons name="calendar" size={20} color={COLORS.accent.secondary} />
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Consistency King</Text>
                <Text style={styles.milestoneDescription}>Work out 3 days in a row</Text>
              </View>
              <View style={styles.milestoneProgress}>
                <ProgressBar progress={0} type="progress" />
              </View>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[COLORS.background.secondary, COLORS.background.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Progress Tracking</Text>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'analytics' && styles.activeTabText
            ]}
          >
            Analytics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'stats' && styles.activeTabText
            ]}
          >
            Stats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'photos' && styles.activeTabText
            ]}
          >
            Photos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'achievements' && styles.activeTabText
            ]}
          >
            Achievements
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
        
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SIZES.spacing.lg,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
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
    fontSize: FONTS.size.sm,
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
  card: {
    marginBottom: SIZES.spacing.md,
  },
  emptyStateContainer: {
    padding: SIZES.spacing.xl,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  emptyStateText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
    lineHeight: 24,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  weeklyStatsContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  chartPlaceholder: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  chartPlaceholderText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.md,
  },
  simpleBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 100,
    width: '100%',
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    width: 20,
    backgroundColor: COLORS.accent.tertiary,
    borderRadius: SIZES.radius.xs,
    marginBottom: SIZES.spacing.xs,
  },
  barLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
  },
  weeklyStatsDetails: {
    marginTop: SIZES.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.spacing.xs,
  },
  statLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  statValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  monthlyStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.spacing.md,
  },
  monthlyStat: {
    alignItems: 'center',
  },
  monthlyStatValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  monthlyStatLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  photosContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: '48%',
    marginBottom: SIZES.spacing.md,
  },
  photoPlaceholder: {
    height: 120,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  photoDate: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  privateBadge: {
    position: 'absolute',
    top: SIZES.spacing.xs,
    right: SIZES.spacing.xs,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: SIZES.radius.round,
    padding: 2,
  },
  tipsCard: {
    marginTop: SIZES.spacing.md,
  },
  tipsContent: {
    paddingVertical: SIZES.spacing.md,
  },
  tipsTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  tipText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginLeft: SIZES.spacing.sm,
  },
  achievementsContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  achievementDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  achievementDate: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
  },
  milestonesCard: {
    marginTop: SIZES.spacing.md,
  },
  milestonesContent: {
    paddingVertical: SIZES.spacing.md,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.xs,
  },
  milestoneDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  milestoneProgress: {
    width: 60,
  },
  bottomPadding: {
    height: 80,
  },
});

export default ProgressTrackingScreen;
