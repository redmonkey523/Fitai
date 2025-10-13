import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

/**
 * Reusable skeleton loader component
 */
export default function SkeletonLoader({ 
  width = '100%', 
  height = 16, 
  borderRadius = 8,
  style 
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton for list items
 */
export function SkeletonList({ count = 5, itemHeight = 120, style }) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.skeletonCard, { height: itemHeight }]}>
          <View style={styles.skeletonRow}>
            <SkeletonLoader width={88} height={56} borderRadius={SIZES.radius.sm} />
            <View style={styles.skeletonDetails}>
              <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="60%" height={12} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="40%" height={12} />
            </View>
          </View>
          <View style={styles.skeletonFooter}>
            <SkeletonLoader width={100} height={28} borderRadius={14} />
            <SkeletonLoader width={120} height={28} borderRadius={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton for coach cards
 */
export function SkeletonCoachCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <SkeletonLoader width={56} height={56} borderRadius={28} />
        <View style={styles.skeletonDetails}>
          <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="50%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="30%" height={12} />
        </View>
      </View>
      <View style={styles.skeletonFooter}>
        <SkeletonLoader width="48%" height={36} borderRadius={SIZES.radius.md} />
        <SkeletonLoader width="48%" height={36} borderRadius={SIZES.radius.md} />
      </View>
    </View>
  );
}

/**
 * Skeleton for program cards
 */
export function SkeletonProgramCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <SkeletonLoader width={88} height={56} borderRadius={SIZES.radius.sm} />
        <View style={styles.skeletonDetails}>
          <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="60%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="40%" height={12} />
        </View>
      </View>
      <View style={styles.skeletonFooter}>
        <SkeletonLoader width={100} height={28} borderRadius={14} />
        <SkeletonLoader width={120} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

/**
 * Skeleton for circular progress rings
 */
export function SkeletonRing({ size = 120 }) {
  return (
    <View style={[styles.skeletonRingContainer, { width: size, height: size }]}>
      <SkeletonLoader width={size} height={size} borderRadius={size / 2} />
      <View style={styles.skeletonRingCenter}>
        <SkeletonLoader width={size * 0.4} height={16} style={{ marginBottom: 4 }} />
        <SkeletonLoader width={size * 0.3} height={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton for charts
 */
export function SkeletonChart({ height = 200 }) {
  return (
    <View style={[styles.skeletonCard, { height }]}>
      <SkeletonLoader width="60%" height={20} style={{ marginBottom: SIZES.spacing.md }} />
      <View style={styles.skeletonChartBars}>
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonLoader
            key={index}
            width={30}
            height={Math.random() * 100 + 50}
            borderRadius={SIZES.radius.sm}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Skeleton for card with header and content
 */
export function SkeletonCard({ height = 120 }) {
  return (
    <View style={[styles.skeletonCard, { height }]}>
      <SkeletonLoader width="40%" height={16} style={{ marginBottom: SIZES.spacing.md }} />
      <SkeletonLoader width="100%" height={height - 60} borderRadius={SIZES.radius.sm} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.background.secondary,
  },
  skeletonCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  skeletonDetails: {
    flex: 1,
    marginLeft: SIZES.spacing.md,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonRingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skeletonRingCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  skeletonChartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
  },
});

