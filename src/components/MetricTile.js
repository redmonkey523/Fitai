import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

/**
 * MetricTile component for displaying key metrics (Calories, Protein, Steps, etc.)
 * Used primarily on Progress and Home screens
 * 
 * @param {string} label - Metric label (e.g., "Calories", "Protein")
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {string} unit - Unit of measurement (e.g., "kcal", "g", "steps")
 * @param {string} color - Accent color for the metric
 * @param {string} icon - Icon name from Ionicons
 * @param {boolean} showProgress - Whether to show progress bar
 * @param {boolean} hidden - Whether the metric is hidden (e.g., Steps when not connected)
 * @param {function} onPress - Optional press handler
 * @param {object} style - Additional styles
 */
const MetricTile = ({
  label,
  current = 0,
  target = 0,
  unit = '',
  color = COLORS.accent.primary,
  icon,
  showProgress = true,
  hidden = false,
  onPress,
  style,
}) => {
  if (hidden) {
    return null;
  }

  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const percentage = Math.round(progress);

  // Determine if target is met
  const isComplete = current >= target && target > 0;

  const content = (
    <View style={[styles.container, SHADOWS.medium, style]}>
      {/* Header with icon and label */}
      <View style={styles.header}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={color}
            style={styles.icon}
          />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>

      {/* Value display */}
      <View style={styles.valueContainer}>
        <Text style={[styles.current, { color }]}>
          {typeof current === 'number' ? Math.round(current).toLocaleString() : current}
        </Text>
        {target > 0 && (
          <Text style={styles.target}>
            {' / '}{Math.round(target).toLocaleString()} {unit}
          </Text>
        )}
        {target === 0 && unit && (
          <Text style={styles.target}> {unit}</Text>
        )}
      </View>

      {/* Progress bar */}
      {showProgress && target > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
      )}

      {/* Success indicator */}
      {isComplete && (
        <View style={styles.completeIndicator}>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={COLORS.accent.success}
          />
          <Text style={styles.completeText}>Goal met!</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current} of ${target} ${unit}`}
        accessibilityHint="Double tap to view details"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

/**
 * MetricTileGrid component for displaying multiple metrics in a grid
 * 
 * @param {Array} metrics - Array of metric objects
 * @param {number} columns - Number of columns (default: 2)
 * @param {object} style - Additional styles
 */
export const MetricTileGrid = ({ metrics = [], columns = 2, style }) => {
  return (
    <View style={[styles.grid, style]}>
      {metrics.map((metric, index) => (
        <View
          key={metric.label || index}
          style={[
            styles.gridItem,
            { width: `${100 / columns - 2}%` },
          ]}
        >
          <MetricTile {...metric} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  icon: {
    marginRight: SIZES.spacing.xs,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SIZES.spacing.sm,
    flexWrap: 'wrap',
  },
  current: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
  },
  target: {
    fontSize: FONTS.size.md,
    color: COLORS.text.tertiary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.round,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: SIZES.radius.round,
  },
  percentage: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
    minWidth: 35,
    textAlign: 'right',
  },
  completeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.xs,
    gap: SIZES.spacing.xs,
  },
  completeText: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
    color: COLORS.accent.success,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.md,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
  },
});

export default MetricTile;




