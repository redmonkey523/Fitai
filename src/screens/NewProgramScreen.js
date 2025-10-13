import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

export default function NewProgramScreen({ navigation }) {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [autoProgressions, setAutoProgressions] = useState(true);
  const [pricingTier, setPricingTier] = useState('tier1');
  const [isFree, setIsFree] = useState(false);
  const [includeInSubscription, setIncludeInSubscription] = useState(true);
  const [hasCoupon, setHasCoupon] = useState(true);

  const [workouts, setWorkouts] = useState([
    { day: 'Monday', name: '', completed: false, isRest: false },
    { day: 'Tuesday', name: '', completed: false, isRest: false },
    { day: 'Wednesday', name: '', completed: false, isRest: false },
    { day: 'Thursday', name: '', completed: false, isRest: false },
    { day: 'Friday', name: '', completed: false, isRest: false },
    { day: 'Saturday', name: '', completed: false, isRest: false },
    { day: 'Sunday', name: '', completed: false, isRest: false },
  ]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>New Program</Text>
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWeekSelector = () => (
    <View style={styles.weekSelectorContainer}>
      <Text style={styles.weekTitle}>Week {currentWeek}</Text>
      <View style={styles.weekNavigation}>
        <TouchableOpacity 
          style={[styles.weekNavButton, currentWeek === 1 && styles.weekNavButtonDisabled]}
          onPress={() => currentWeek > 1 && setCurrentWeek(currentWeek - 1)}
        >
          <Ionicons name="chevron-back" size={20} color={currentWeek === 1 ? COLORS.text.tertiary : COLORS.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.weekNavButton}
          onPress={() => setCurrentWeek(currentWeek + 1)}
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWorkoutDay = (workout, index) => (
    <TouchableOpacity key={index} style={styles.workoutDayContainer}>
      <View style={styles.workoutDayHeader}>
        <Text style={styles.dayName}>{workout.day}</Text>
        {workout.completed && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
        )}
      </View>
      
      {workout.isRest ? (
        <Text style={styles.restDayText}>Rest Day</Text>
      ) : workout.name ? (
        <Text style={styles.workoutName}>{workout.name}</Text>
      ) : (
        <Text style={styles.emptyWorkout}>Add workout</Text>
      )}
    </TouchableOpacity>
  );

  const renderAutoProgressions = () => (
    <View style={styles.settingContainer}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingTitle}>Auto-progressions</Text>
        <Switch
          value={autoProgressions}
          onValueChange={setAutoProgressions}
          trackColor={{ false: COLORS.background.tertiary, true: COLORS.accent.primary }}
          thumbColor={COLORS.text.primary}
        />
      </View>
    </View>
  );

  const renderPricingSection = () => (
    <View style={styles.pricingContainer}>
      <Text style={styles.sectionTitle}>Pricing & Access</Text>
      
      <View style={styles.pricingTiers}>
        <TouchableOpacity 
          style={[styles.pricingTier, pricingTier === 'tier1' && styles.pricingTierActive]}
          onPress={() => setPricingTier('tier1')}
        >
          <Text style={styles.tierPrice}>$19.99</Text>
          <Text style={styles.tierLabel}>Tier 1</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.pricingOptions}>
        <View style={styles.pricingOption}>
          <View style={styles.pricingOptionHeader}>
            <Text style={styles.pricingOptionLabel}>Free</Text>
            <Switch
              value={isFree}
              onValueChange={setIsFree}
              trackColor={{ false: COLORS.background.tertiary, true: COLORS.accent.success }}
              thumbColor={COLORS.text.primary}
            />
          </View>
        </View>
        
        <View style={styles.pricingOption}>
          <View style={styles.pricingOptionHeader}>
            <Text style={styles.pricingOptionLabel}>Include in Subscription</Text>
            <Switch
              value={includeInSubscription}
              onValueChange={setIncludeInSubscription}
              trackColor={{ false: COLORS.background.tertiary, true: COLORS.accent.primary }}
              thumbColor={COLORS.text.primary}
            />
          </View>
        </View>
        
        <View style={styles.pricingOption}>
          <View style={styles.pricingOptionHeader}>
            <Text style={styles.pricingOptionLabel}>Coupon</Text>
            <Switch
              value={hasCoupon}
              onValueChange={setHasCoupon}
              trackColor={{ false: COLORS.background.tertiary, true: COLORS.accent.warning }}
              thumbColor={COLORS.text.primary}
            />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderWeekSelector()}
        
        <View style={styles.workoutSchedule}>
          {workouts.map((workout, index) => renderWorkoutDay(workout, index))}
        </View>
        
        {renderAutoProgressions()}
        {renderPricingSection()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  // Header
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
  saveButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
  },
  saveButtonText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: SIZES.spacing.md,
  },
  
  // Week Selector
  weekSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl,
  },
  weekTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
  },
  weekNavigation: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
  },
  weekNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  weekNavButtonDisabled: {
    opacity: 0.5,
  },
  
  // Workout Schedule
  workoutSchedule: {
    marginBottom: SIZES.spacing.xl,
  },
  workoutDayContainer: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  workoutDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  dayName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  workoutName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  restDayText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    fontStyle: 'italic',
  },
  emptyWorkout: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.md,
    fontStyle: 'italic',
  },
  
  // Settings
  settingContainer: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xl,
    ...SHADOWS.small,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  
  // Pricing Section
  pricingContainer: {
    marginBottom: SIZES.spacing.xl,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.lg,
  },
  pricingTiers: {
    marginBottom: SIZES.spacing.lg,
  },
  pricingTier: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  pricingTierActive: {
    borderColor: COLORS.accent.primary,
  },
  tierPrice: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  tierLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  
  // Pricing Options
  pricingOptions: {
    gap: SIZES.spacing.md,
  },
  pricingOption: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    ...SHADOWS.small,
  },
  pricingOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingOptionLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
});
