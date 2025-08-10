import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

/**
 * StatCard component with cyberpunk styling
 * 
 * @param {string} title - Stat title
 * @param {string} value - Stat value
 * @param {string} unit - Stat unit (optional)
 * @param {string} type - 'steps', 'calories', 'active', 'custom'
 * @param {object} style - Additional styles
 */
const StatCard = ({
  title,
  value,
  unit,
  type = 'custom',
  style,
}) => {
  // Determine icon color based on type
  const getColor = () => {
    switch (type) {
      case 'steps':
        return COLORS.accent.tertiary; // Electric blue
      case 'calories':
        return COLORS.accent.quaternary; // Neon orange
      case 'active':
        return COLORS.accent.success; // Neon green
      default:
        return COLORS.accent.primary; // Cyan
    }
  };

  return (
    <View style={[styles.container, SHADOWS.medium, style]}>
      <View style={[styles.iconIndicator, { backgroundColor: getColor() }]} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  iconIndicator: {
    width: 4,
    height: '80%',
    borderRadius: SIZES.radius.round,
    marginRight: SIZES.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginRight: SIZES.spacing.xs,
  },
  unit: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
  },
});

export default StatCard;
