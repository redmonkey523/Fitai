/**
 * MyLunchScreen - "My Lunch in One Day"
 * Single-day visual recap of meals & hydration
 * Shareable, photo-first, macro summary at a glance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useDailyMeals } from '../features/nutrition/hooks/useDailyMeals';
import { useDailyHydration } from '../features/nutrition/hooks/useDailyHydration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - SIZES.spacing.lg * 2 - SIZES.spacing.md * 2) / 3;

export default function MyLunchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get date from params or default to today
  const dateParam = (route.params as any)?.date;
  const [selectedDate] = useState(() => {
    if (dateParam) return dateParam;
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { data: mealsData, isLoading } = useDailyMeals(selectedDate);
  const { total: hydrationTotal } = useDailyHydration(selectedDate);

  const meals = mealsData?.meals || [];
  const totals = mealsData?.totals || { kcal: 0, protein: 0, carbs: 0, fat: 0 };

  const handleShare = async () => {
    try {
      const dateStr = new Date(selectedDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const message = `My Lunch - ${dateStr}\n\n` +
        `📊 ${totals.kcal} cal | ${Math.round(totals.protein)}g protein\n` +
        `${meals.length} meals | ${Math.floor(hydrationTotal / 250)} glasses water\n\n` +
        `Check out what I ate today! 🍽️`;

      await Share.share({
        message,
        title: `My Lunch - ${dateStr}`,
      });
    } catch (error) {
      console.error('[MyLunchScreen] Share failed:', error);
    }
  };

  const renderHeader = () => {
    const date = new Date(selectedDate);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Lunch</Text>
          <Text style={styles.headerSubtitle}>{dateStr}</Text>
        </View>

        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.accent.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMacroSummary = () => {
    const proteinPercent = totals.kcal > 0 ? Math.round((totals.protein * 4 / totals.kcal) * 100) : 0;
    const carbsPercent = totals.kcal > 0 ? Math.round((totals.carbs * 4 / totals.kcal) * 100) : 0;
    const fatPercent = totals.kcal > 0 ? Math.round((totals.fat * 9 / totals.kcal) * 100) : 0;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.caloriesRow}>
          <View style={styles.caloriesColumn}>
            <Text style={styles.caloriesValue}>{totals.kcal}</Text>
            <Text style={styles.caloriesLabel}>Calories</Text>
          </View>

          <View style={styles.macrosColumn}>
            <View style={styles.macroRow}>
              <View style={[styles.macroDot, { backgroundColor: COLORS.accent.primary }]} />
              <Text style={styles.macroText}>
                {Math.round(totals.protein)}g Protein ({proteinPercent}%)
              </Text>
            </View>
            <View style={styles.macroRow}>
              <View style={[styles.macroDot, { backgroundColor: COLORS.accent.secondary }]} />
              <Text style={styles.macroText}>
                {Math.round(totals.carbs)}g Carbs ({carbsPercent}%)
              </Text>
            </View>
            <View style={styles.macroRow}>
              <View style={[styles.macroDot, { backgroundColor: COLORS.accent.quaternary }]} />
              <Text style={styles.macroText}>
                {Math.round(totals.fat)}g Fat ({fatPercent}%)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.hydrationRow}>
          <Ionicons name="water" size={20} color={COLORS.accent.primary} />
          <Text style={styles.hydrationText}>
            {Math.floor(hydrationTotal / 250)} glasses ({hydrationTotal}ml)
          </Text>
        </View>
      </View>
    );
  };

  const renderMealTimeline = () => {
    if (meals.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color={COLORS.text.tertiary} />
          <Text style={styles.emptyTitle}>No meals logged</Text>
          <Text style={styles.emptySubtitle}>
            Add meals to see your daily recap
          </Text>
        </View>
      );
    }

    // Group meals by time period
    const getMealPeriod = (time: string) => {
      const hour = parseInt(time.split(':')[0]);
      if (hour < 12) return 'Breakfast';
      if (hour < 17) return 'Lunch';
      return 'Dinner';
    };

    const groupedMeals = meals.reduce((acc, meal) => {
      const period = getMealPeriod(meal.time);
      if (!acc[period]) acc[period] = [];
      acc[period].push(meal);
      return acc;
    }, {} as Record<string, typeof meals>);

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Timeline</Text>

        {Object.entries(groupedMeals).map(([period, periodMeals]) => (
          <View key={period} style={styles.periodSection}>
            <View style={styles.periodHeader}>
              <View style={styles.periodDot} />
              <Text style={styles.periodTitle}>{period}</Text>
              <Text style={styles.periodCalories}>
                {periodMeals.reduce((sum, m) => sum + m.kcal, 0)} cal
              </Text>
            </View>

            <View style={styles.mealsList}>
              {periodMeals.map((meal) => (
                <View key={meal.id} style={styles.mealItem}>
                  <View style={styles.mealTime}>
                    <Ionicons name="time-outline" size={14} color={COLORS.text.tertiary} />
                    <Text style={styles.mealTimeText}>{meal.time}</Text>
                  </View>

                  <Text style={styles.mealName}>{meal.name}</Text>

                  <View style={styles.mealMacros}>
                    <Text style={styles.mealMacroText}>{meal.kcal} cal</Text>
                    <Text style={styles.mealMacroSeparator}>•</Text>
                    <Text style={styles.mealMacroText}>
                      P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                    </Text>
                  </View>

                  {meal.serving && meal.serving !== 1 && (
                    <Text style={styles.mealServing}>
                      {meal.serving} {meal.unit || 'serving'}(s)
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderMacroSummary()}
        {renderMealTimeline()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💪 Keep it up! Every meal counts.
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    padding: SIZES.spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  headerSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.xxs,
  },
  shareButton: {
    padding: SIZES.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacing.lg,
  },
  summaryCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 16,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  caloriesColumn: {
    marginRight: SIZES.spacing.xl,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
    lineHeight: 52,
  },
  caloriesLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
  macrosColumn: {
    flex: 1,
    gap: SIZES.spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.primary,
  },
  hydrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
    paddingTop: SIZES.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  hydrationText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.lg,
  },
  timelineContainer: {
    marginBottom: SIZES.spacing.xl,
  },
  periodSection: {
    marginBottom: SIZES.spacing.xl,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  periodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accent.primary,
    marginRight: SIZES.spacing.sm,
  },
  periodTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    flex: 1,
  },
  periodCalories: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
  mealsList: {
    paddingLeft: SIZES.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.border.primary,
    gap: SIZES.spacing.md,
  },
  mealItem: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: SIZES.spacing.md,
  },
  mealTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.xs,
  },
  mealTimeText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  mealName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  mealMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  mealMacroText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
  },
  mealMacroSeparator: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  mealServing: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginTop: SIZES.spacing.xs,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xxl,
  },
  emptyTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.md,
  },
  emptySubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginTop: SIZES.spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.lg,
  },
  footerText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});

