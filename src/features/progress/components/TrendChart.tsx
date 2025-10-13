/**
 * TrendChart - Simple trend chart for progress metrics
 * Shows 7-day or 30-day trends
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';

interface DataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  color?: string;
}

const CHART_HEIGHT = 180;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - SIZES.spacing.lg * 4;

export function TrendChart({ title, data, unit = '', color = COLORS.accent.primary }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const pointWidth = CHART_WIDTH / (data.length - 1 || 1);

  const points = data.map((point, index) => {
    const x = index * pointWidth;
    const normalizedValue = (point.value - minValue) / range;
    const y = CHART_HEIGHT - normalizedValue * CHART_HEIGHT;
    return { x, y, value: point.value };
  });

  // Build SVG path
  const pathData = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const average = values.reduce((a, b) => a + b, 0) / values.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.stats}>
          <Text style={styles.statLabel}>Avg</Text>
          <Text style={styles.statValue}>
            {average.toFixed(1)}
            {unit}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Simple dot-based chart (no SVG for simplicity) */}
        <View style={styles.chartArea}>
          {points.map((point, index) => (
            <View
              key={index}
              style={[
                styles.chartDot,
                {
                  left: point.x,
                  bottom: point.y,
                  backgroundColor: color,
                },
              ]}
            />
          ))}
        </View>

        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{maxValue.toFixed(0)}</Text>
          <Text style={styles.yLabel}>{((maxValue + minValue) / 2).toFixed(0)}</Text>
          <Text style={styles.yLabel}>{minValue.toFixed(0)}</Text>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {data.map((point, index) => {
            if (index % Math.ceil(data.length / 4) === 0 || index === data.length - 1) {
              const date = new Date(point.date);
              return (
                <Text key={index} style={styles.xLabel}>
                  {date.getMonth() + 1}/{date.getDate()}
                </Text>
              );
            }
            return null;
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  title: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
  },
  stats: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  statValue: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
  },
  chartContainer: {
    height: CHART_HEIGHT + 40,
  },
  chartArea: {
    height: CHART_HEIGHT,
    width: CHART_WIDTH,
    position: 'relative',
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius.md,
    marginLeft: 32,
  },
  chartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    transform: [{ translateX: -4 }, { translateY: -4 }],
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.spacing.sm,
    marginLeft: 32,
    width: CHART_WIDTH,
  },
  xLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius.md,
  },
  emptyText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
});

