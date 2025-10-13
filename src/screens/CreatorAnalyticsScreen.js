import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import api from '../services/api';

export default function CreatorAnalyticsScreen({ navigation, route }) {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // Get programId from route params (if viewing program-specific analytics)
  const programId = route?.params?.programId;
  const programTitle = route?.params?.programTitle;

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, programId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch analytics data from API
      // If programId exists, fetch program-specific analytics
      // Otherwise fetch global creator analytics
      const response = programId 
        ? await api.getAnalyticsDashboard({ programId }) 
        : await api.getAnalyticsDashboard();
      setAnalyticsData(response.data || response);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{programTitle || 'Analytics'}</Text>
        {programTitle && <Text style={styles.headerSubtitle}>Program Analytics</Text>}
      </View>
      <View style={styles.headerRight} />
    </View>
  );

  const renderRangeChips = () => {
    const ranges = [
      { id: '7d', label: '7 Days' },
      { id: '30d', label: '30 Days' },
      { id: 'month', label: 'This Month' },
    ];

    return (
      <View style={styles.rangeChipsContainer}>
        {ranges.map(range => (
          <TouchableOpacity
            key={range.id}
            style={[styles.rangeChip, selectedPeriod === range.id && styles.rangeChipActive]}
            onPress={() => setSelectedPeriod(range.id)}
          >
            <Text style={[styles.rangeChipText, selectedPeriod === range.id && styles.rangeChipTextActive]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPricingCard = () => (
    <View style={styles.pricingCard}>
      <View style={styles.pricingHeader}>
        <Text style={styles.pricingLabel}>Revenue</Text>
        <Text style={styles.pricingValue}>
          ${analyticsData?.revenue?.current?.toFixed(2) || '0.00'}
        </Text>
      </View>
      <Text style={styles.pricingSubtext}>
        {analyticsData?.revenue?.period || 'this month'}
      </Text>
      {analyticsData?.revenue?.growth && (
        <Text style={styles.growthText}>
          {analyticsData.revenue.growth}
        </Text>
      )}
    </View>
  );

  const renderPricingAccessSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Pricing & Access</Text>
      
      <View style={styles.pricingRow}>
        <View style={styles.pricingToggle}>
          <View style={[styles.toggleOption, styles.toggleOptionActive]}>
            <Text style={styles.toggleOptionText}>Price</Text>
          </View>
          <View style={styles.toggleOption}>
            <Text style={[styles.toggleOptionText, styles.toggleOptionTextInactive]}>Free</Text>
          </View>
        </View>
        <Text style={styles.pricingAmount}>
          ${analyticsData?.pricing?.current?.toFixed(2) || '0.00'}
        </Text>
      </View>
    </View>
  );

  const renderSubscribersSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Subscribers</Text>
      
      <View style={styles.subscribersList}>
        {analyticsData?.subscribers?.map((subscriber, index) => (
          <View key={subscriber.id} style={styles.subscriberItem}>
            <View style={styles.subscriberAvatar}>
              <Text style={styles.subscriberAvatarText}>{subscriber.avatar}</Text>
            </View>
            <View style={styles.subscriberInfo}>
              <Text style={styles.subscriberName}>{subscriber.name}</Text>
              <Text style={styles.subscriberJoined}>
                {subscriber.joinedDays} day{subscriber.joinedDays !== 1 ? 's' : ''} ago
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAnalyticsChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartGrid}>
        {analyticsData?.chartData?.map((point, index) => (
          <View
            key={index}
            style={[
              styles.chartDot,
              {
                left: point.x,
                top: point.y,
                backgroundColor: point.color,
              }
            ]}
          />
        )) || (
          <View style={styles.noChartData}>
            <Text style={styles.noChartText}>No analytics data available</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderRangeChips()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {analyticsData ? (
          <>
            {renderPricingCard()}
            {renderAnalyticsChart()}
            {renderPricingAccessSection()}
            {renderSubscribersSection()}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={64} color={COLORS.accent.primary} />
            <Text style={styles.emptyTitle}>No Analytics Data</Text>
            <Text style={styles.emptyText}>
              Analytics data will appear here once you have active programs and subscribers.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    padding: SIZES.spacing.xs,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  headerSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  headerRight: {
    width: 40, // Same width as back button for centering
  },
  
  // Range Chips
  rangeChipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.md,
    gap: SIZES.spacing.sm,
  },
  rangeChip: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  rangeChipActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  rangeChipText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  rangeChipTextActive: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weight.bold,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: SIZES.spacing.md,
  },
  
  // Pricing Card
  pricingCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.xl,
    marginVertical: SIZES.spacing.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  pricingLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.xs,
  },
  pricingValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxxl,
    fontWeight: FONTS.weight.black,
  },
  pricingSubtext: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginVertical: SIZES.spacing.sm,
  },
  pricingOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
  },
  pricingOption: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.sm,
  },
  pricingOptionText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  
  // Analytics Chart
  chartContainer: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
    height: 200,
    ...SHADOWS.medium,
  },
  chartGrid: {
    flex: 1,
    position: 'relative',
  },
  chartDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  
  // Sections
  section: {
    marginBottom: SIZES.spacing.xl,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.lg,
  },
  
  // Pricing Row
  pricingRow: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  pricingToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.sm,
    padding: 2,
  },
  toggleOption: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.accent.primary,
  },
  toggleOptionText: {
    color: COLORS.background.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
  },
  toggleOptionTextInactive: {
    color: COLORS.text.secondary,
  },
  pricingAmount: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  
  // Subscribers
  subscribersList: {
    gap: SIZES.spacing.md,
  },
  subscriberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    ...SHADOWS.small,
  },
  subscriberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  subscriberAvatarText: {
    fontSize: 20,
  },
  subscriberInfo: {
    flex: 1,
  },
  subscriberName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    marginBottom: SIZES.spacing.xs,
  },
  subscriberJoined: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.xxl,
  },
  emptyTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  emptyText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  noChartData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChartText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  growthText: {
    color: COLORS.accent.success,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    marginTop: SIZES.spacing.xs,
  },
});
