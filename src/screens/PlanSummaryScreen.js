import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import { useGoals, useSummary } from '../hooks/useUserData';

export default function PlanSummaryScreen({ navigation }) {
  const { data: goals, isLoading: goalsLoading, error: goalsError } = useGoals();
  const { data: summary, isLoading: summaryLoading } = useSummary('7d');

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Your Plan</Text>
      <View style={styles.headerRight} />
    </View>
  );

  if (goalsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading your plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (goalsError || !goals) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.accent.error} />
          <Text style={styles.errorTitle}>Unable to Load Plan</Text>
          <Text style={styles.errorText}>
            {goalsError?.message || 'Please complete the goal quiz to see your plan.'}
          </Text>
          <Button
            title="Take Goal Quiz"
            onPress={() => navigation.navigate('GoalQuiz')}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const targets = goals.targets || {};

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Banner */}
        <View style={styles.successBanner}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.accent.success} />
          </View>
          <Text style={styles.successTitle}>Your Plan is Ready!</Text>
          <Text style={styles.successSubtitle}>
            Based on your goals and activity level
          </Text>
        </View>

        {/* Daily Targets */}
        <Card style={styles.targetsCard}>
          <Text style={styles.cardTitle}>Daily Nutrition Targets</Text>
          
          <View style={styles.targetRow}>
            <View style={styles.targetItem}>
              <Ionicons name="flame" size={32} color={COLORS.accent.primary} />
              <Text style={styles.targetValue}>{targets.dailyCalories || 2000}</Text>
              <Text style={styles.targetLabel}>Calories</Text>
            </View>
          </View>

          <View style={styles.macrosGrid}>
            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="fitness" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.macroValue}>{targets.proteinTarget || 150}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroPercent}>
                {Math.round((targets.proteinTarget || 150) * 4 / (targets.dailyCalories || 2000) * 100)}%
              </Text>
            </View>

            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: '#4ECDC420' }]}>
                <Ionicons name="nutrition" size={20} color="#4ECDC4" />
              </View>
              <Text style={styles.macroValue}>{targets.carbsTarget || 200}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroPercent}>
                {Math.round((targets.carbsTarget || 200) * 4 / (targets.dailyCalories || 2000) * 100)}%
              </Text>
            </View>

            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: '#FFE66D20' }]}>
                <Ionicons name="water" size={20} color="#FFE66D" />
              </View>
              <Text style={styles.macroValue}>{targets.fatTarget || 60}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroPercent}>
                {Math.round((targets.fatTarget || 60) * 9 / (targets.dailyCalories || 2000) * 100)}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Additional Targets */}
        <Card style={styles.additionalCard}>
          <Text style={styles.cardTitle}>Additional Targets</Text>
          
          <View style={styles.additionalGrid}>
            <View style={styles.additionalItem}>
              <Ionicons name="water-outline" size={24} color={COLORS.accent.primary} />
              <Text style={styles.additionalValue}>{targets.hydrationCups || 8} cups</Text>
              <Text style={styles.additionalLabel}>Water</Text>
            </View>

            <View style={styles.additionalItem}>
              <Ionicons name="leaf-outline" size={24} color={COLORS.accent.primary} />
              <Text style={styles.additionalValue}>{targets.fiberTarget || 25}g</Text>
              <Text style={styles.additionalLabel}>Fiber</Text>
            </View>

            <View style={styles.additionalItem}>
              <Ionicons name="walk-outline" size={24} color={COLORS.accent.primary} />
              <Text style={styles.additionalValue}>
                {(targets.dailySteps || 10000).toLocaleString()}
              </Text>
              <Text style={styles.additionalLabel}>Steps</Text>
            </View>
          </View>
        </Card>

        {/* Goal Information */}
        {goals.goalType && (
          <Card style={styles.infoCard}>
            <Text style={styles.cardTitle}>Your Goal</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoValue}>
                {goals.goalType === 'cut' ? 'Lose Weight' : 
                 goals.goalType === 'bulk' ? 'Gain Muscle' : 'Body Recomp'}
              </Text>
            </View>
            
            {goals.weeklyDelta && goals.weeklyDelta !== 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pace:</Text>
                <Text style={styles.infoValue}>
                  {Math.abs(goals.weeklyDelta).toFixed(2)} kg/week
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Activity Level:</Text>
              <Text style={styles.infoValue}>
                {goals.activityLevel?.charAt(0).toUpperCase() + goals.activityLevel?.slice(1) || 'Moderate'}
              </Text>
            </View>

            {goals.dietStyle && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Diet Style:</Text>
                <Text style={styles.infoValue}>
                  {goals.dietStyle.split('-').map(w => 
                    w.charAt(0).toUpperCase() + w.slice(1)
                  ).join(' ')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Auto-Set Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={16} color={COLORS.accent.primary} />
            <Text style={styles.badgeText}>
              Auto-set by Goal Quiz • {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title="View Progress"
            onPress={() => navigation.navigate('Progress')}
            style={styles.actionButton}
          />
          
          <Button
            title="Edit in Settings"
            variant="secondary"
            onPress={() => navigation.navigate('Profile', { openEditModal: true })}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    padding: SIZES.spacing.xs,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
  },
  errorTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  errorText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  errorButton: {
    minWidth: 200,
  },
  successBanner: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.lg,
  },
  successIconContainer: {
    marginBottom: SIZES.spacing.md,
  },
  successTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  successSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  targetsCard: {
    marginHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  targetItem: {
    alignItems: 'center',
  },
  targetValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxxl,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.sm,
  },
  targetLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  macroValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  macroLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  macroPercent: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  additionalCard: {
    marginHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  additionalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  additionalItem: {
    alignItems: 'center',
  },
  additionalValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.sm,
  },
  additionalLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  infoCard: {
    marginHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  infoLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  infoValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  badgeContainer: {
    alignItems: 'center',
    marginVertical: SIZES.spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.full,
    gap: SIZES.spacing.xs,
  },
  badgeText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  actionsContainer: {
    paddingHorizontal: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  bottomPadding: {
    height: 80,
  },
});

