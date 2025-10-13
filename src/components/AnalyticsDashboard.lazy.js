import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

// Lazy load the analytics dashboard to reduce initial bundle size
const AnalyticsDashboardComponent = lazy(() => import('./AnalyticsDashboard'));

/**
 * Lazy-loaded Analytics Dashboard wrapper
 * This reduces the initial bundle size by code-splitting the chart library
 */
export default function AnalyticsDashboard(props) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalyticsDashboardComponent {...props} />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.accent.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xl,
    minHeight: 200,
  },
});

