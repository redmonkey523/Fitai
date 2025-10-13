import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { usePlans } from '../hooks/usePlans';
import { SkeletonList } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function PlansScreen({ navigation }) {
  const { data: plans = [], isLoading, isError, error, refetch } = usePlans();

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Plans</Text>
        </View>
        <SkeletonList count={5} itemHeight={100} />
      </SafeAreaView>
    );
  }

  // Render error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Plans</Text>
        </View>
        <ErrorState
          title="Failed to load plans"
          message={error?.message || 'Please try again'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  // Render empty state
  if (plans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Plans</Text>
        </View>
        <EmptyState
          icon="calendar-outline"
          title="No Plans Yet"
          message="You haven't subscribed to any programs. Browse the Discover tab to find the perfect plan for your goals."
          actionLabel="Browse Programs"
          onAction={() => navigation.navigate('Discover')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Plans</Text>
        <TouchableOpacity onPress={refetch} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => String(item._id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => navigation.navigate('PlanDetail', { id: item._id })}
          >
            <View style={styles.planHeader}>
              <View style={styles.planIcon}>
                <Ionicons name="barbell" size={24} color={COLORS.accent.primary} />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{item.name}</Text>
                <Text style={styles.planMeta}>
                  {item.goal} • {item.difficulty}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
            </View>

            {item.description && (
              <Text style={styles.planDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {item.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${item.progress}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{item.progress}% complete</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  refreshButton: {
    padding: SIZES.spacing.xs,
  },
  listContent: {
    padding: SIZES.spacing.lg,
  },
  planCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    ...SHADOWS.medium,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.spacing.md,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  planMeta: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  planDescription: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SIZES.spacing.md,
  },
  progressContainer: {
    marginTop: SIZES.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
  separator: {
    height: SIZES.spacing.md,
  },
});

