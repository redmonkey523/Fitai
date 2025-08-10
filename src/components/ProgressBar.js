import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

/**
 * ProgressBar component with cyberpunk styling
 * 
 * @param {number} progress - Progress value (0-1)
 * @param {string} type - 'primary', 'workout', 'progress', 'nutrition'
 * @param {string} label - Optional label to display
 * @param {string} value - Optional value to display (e.g. "75%")
 * @param {object} style - Additional styles
 */
const ProgressBar = ({
  progress = 0,
  type = 'primary',
  label,
  value,
  style,
}) => {
  // Ensure progress is between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Determine color based on type
  const getColor = () => {
    switch (type) {
      case 'workout':
        return COLORS.accent.quaternary;
      case 'progress':
        return COLORS.accent.success;
      case 'nutrition':
        return COLORS.accent.secondary;
      default:
        return COLORS.accent.primary;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label and value row */}
      {(label || value) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {value && <Text style={styles.value}>{value}</Text>}
        </View>
      )}
      
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${clampedProgress * 100}%`,
              backgroundColor: getColor() 
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.xs,
  },
  label: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  value: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  progressContainer: {
    height: 8,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: SIZES.radius.round,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: SIZES.radius.round,
  },
});

export default ProgressBar;
