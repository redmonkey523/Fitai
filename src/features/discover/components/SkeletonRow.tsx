import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES } from '../../../constants/theme';

export interface SkeletonRowProps {
  type?: 'program' | 'coach';
}

/**
 * Skeleton loader component for Discover lists
 * Shows animated loading placeholders while data is being fetched
 */
export function SkeletonRow({ type = 'program' }: SkeletonRowProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create pulsing animation
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
    outputRange: [0.3, 0.6],
  });

  if (type === 'coach') {
    return (
      <View style={styles.coachCard}>
        <View style={styles.coachContent}>
          <Animated.View style={[styles.avatar, { opacity }]} />
          <View style={styles.coachDetails}>
            <Animated.View style={[styles.textLine, styles.textLineLarge, { opacity }]} />
            <Animated.View style={[styles.textLine, styles.textLineMedium, { opacity, marginTop: 8 }]} />
            <Animated.View style={[styles.textLine, styles.textLineSmall, { opacity, marginTop: 8 }]} />
          </View>
        </View>
        <View style={styles.buttonRow}>
          <Animated.View style={[styles.button, styles.buttonHalf, { opacity }]} />
          <Animated.View style={[styles.button, styles.buttonHalf, { opacity }]} />
        </View>
      </View>
    );
  }

  // Program card skeleton
  return (
    <View style={styles.programCard}>
      <View style={styles.programContent}>
        <Animated.View style={[styles.thumbnail, { opacity }]} />
        <View style={styles.programDetails}>
          <Animated.View style={[styles.textLine, styles.textLineLarge, { opacity }]} />
          <Animated.View style={[styles.textLine, styles.textLineMedium, { opacity, marginTop: 8 }]} />
          <Animated.View style={[styles.textLine, styles.textLineSmall, { opacity, marginTop: 8 }]} />
        </View>
      </View>
      <View style={styles.programFooter}>
        <Animated.View style={[styles.textLine, styles.textLineSmall, { opacity }]} />
        <Animated.View style={[styles.button, { opacity }]} />
      </View>
    </View>
  );
}

/**
 * Multiple skeleton rows for initial loading state
 */
export function SkeletonList({ count = 5, type = 'program' }: { count?: number; type?: 'program' | 'coach' }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: SIZES.spacing.md,
    paddingTop: SIZES.spacing.md,
  },
  coachCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.spacing.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  programCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.spacing.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  coachContent: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.md,
  },
  programContent: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background.secondary,
    marginRight: SIZES.spacing.md,
  },
  thumbnail: {
    width: 88,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    marginRight: SIZES.spacing.md,
  },
  coachDetails: {
    flex: 1,
  },
  programDetails: {
    flex: 1,
  },
  textLine: {
    height: 12,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 4,
  },
  textLineSmall: {
    width: '40%',
  },
  textLineMedium: {
    width: '60%',
  },
  textLineLarge: {
    width: '80%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  button: {
    height: 36,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
    width: 120,
  },
  buttonHalf: {
    flex: 1,
  },
  programFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default SkeletonRow;

