/**
 * EmptyProgress - Empty state for Progress screen
 * Shows CTAs to get started
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';

interface EmptyProgressProps {
  onAddMeal?: () => void;
  onSetGoals?: () => void;
  onStartWorkout?: () => void;
}

export function EmptyProgress({ onAddMeal, onSetGoals, onStartWorkout }: EmptyProgressProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="bar-chart-outline" size={80} color={COLORS.text.tertiary} />
      
      <Text style={styles.title}>No Progress Data Yet</Text>
      <Text style={styles.subtitle}>
        Start tracking to see your progress
      </Text>

      <View style={styles.ctaGrid}>
        <TouchableOpacity style={styles.ctaCard} onPress={onSetGoals}>
          <View style={styles.ctaIcon}>
            <Ionicons name="flag-outline" size={32} color={COLORS.accent.primary} />
          </View>
          <Text style={styles.ctaTitle}>Set Goals</Text>
          <Text style={styles.ctaText}>
            Define your fitness goals and get personalized targets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaCard} onPress={onAddMeal}>
          <View style={styles.ctaIcon}>
            <Ionicons name="restaurant-outline" size={32} color={COLORS.accent.secondary} />
          </View>
          <Text style={styles.ctaTitle}>Log Meals</Text>
          <Text style={styles.ctaText}>
            Track your nutrition to see calorie trends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaCard} onPress={onStartWorkout}>
          <View style={styles.ctaIcon}>
            <Ionicons name="fitness-outline" size={32} color={COLORS.accent.quaternary} />
          </View>
          <Text style={styles.ctaTitle}>Start Workout</Text>
          <Text style={styles.ctaText}>
            Begin training to track workout frequency
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.xxl,
  },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xs,
  },
  subtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginBottom: SIZES.spacing.xxl,
  },
  ctaGrid: {
    width: '100%',
    gap: SIZES.spacing.md,
  },
  ctaCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    alignItems: 'center',
  },
  ctaIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.spacing.md,
  },
  ctaTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  ctaText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
});

