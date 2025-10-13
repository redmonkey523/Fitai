/**
 * DevAnalyticsPanel - Development-only analytics dashboard
 * Shows recent events, timing metrics, and performance stats
 * 
 * Access: Only available in __DEV__ mode
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import eventService from '../services/events';

interface EventLog {
  name: string;
  payload: Record<string, any>;
  ts: number;
}

interface MetricStat {
  count: number;
  median: number;
  p90: number;
  min: number;
  max: number;
}

export default function DevAnalyticsPanel({ navigation }: any) {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const loadEvents = () => {
    const recent = eventService.getRecentEvents(100);
    setEvents(recent);
  };
  
  useEffect(() => {
    loadEvents();
  }, []);
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
    setRefreshing(false);
  };
  
  const handleClearEvents = () => {
    eventService.clear();
    loadEvents();
  };
  
  // Calculate meal add timing stats
  const calculateMealAddStats = (): MetricStat | null => {
    const mealConfirmEvents = events.filter(e => e.name === 'meal_add_confirm');
    
    if (mealConfirmEvents.length === 0) return null;
    
    const durations = mealConfirmEvents
      .map(e => e.payload.duration_ms)
      .filter(d => typeof d === 'number')
      .sort((a, b) => a - b);
    
    if (durations.length === 0) return null;
    
    const median = durations[Math.floor(durations.length / 2)];
    const p90 = durations[Math.floor(durations.length * 0.9)];
    
    return {
      count: durations.length,
      median,
      p90,
      min: durations[0],
      max: durations[durations.length - 1],
    };
  };
  
  // Calculate discover first row timing
  const calculateDiscoverTiming = () => {
    const discoverEvents = events.filter(e => 
      e.name === 'discover_view' || e.name === 'discover_impression'
    );
    
    const timings: number[] = [];
    
    for (let i = 0; i < discoverEvents.length - 1; i++) {
      if (discoverEvents[i].name === 'discover_view' && 
          discoverEvents[i + 1].name === 'discover_impression') {
        timings.push(discoverEvents[i + 1].ts - discoverEvents[i].ts);
      }
    }
    
    if (timings.length === 0) return null;
    
    timings.sort((a, b) => a - b);
    
    return {
      count: timings.length,
      median: timings[Math.floor(timings.length / 2)],
      p90: timings[Math.floor(timings.length * 0.9)],
      min: timings[0],
      max: timings[timings.length - 1],
    };
  };
  
  // Count scan events
  const getScanStats = () => {
    const success = events.filter(e => e.name === 'scan_success').length;
    const failure = events.filter(e => e.name === 'scan_failure').length;
    
    return { success, failure, total: success + failure };
  };
  
  const mealAddStats = calculateMealAddStats();
  const discoverTiming = calculateDiscoverTiming();
  const scanStats = getScanStats();
  
  const renderMetricCard = (
    title: string,
    stats: MetricStat | null,
    threshold?: { median: number; p90: number }
  ) => {
    if (!stats) {
      return (
        <View style={styles.metricCard}>
          <Text style={styles.metricTitle}>{title}</Text>
          <Text style={styles.metricNoData}>No data yet</Text>
        </View>
      );
    }
    
    const medianPassed = !threshold || stats.median <= threshold.median;
    const p90Passed = !threshold || stats.p90 <= threshold.p90;
    
    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricSamples}>{stats.count} samples</Text>
        
        <View style={styles.metricRow}>
          <View style={styles.metricStat}>
            <Text style={styles.metricLabel}>Median</Text>
            <Text style={[styles.metricValue, medianPassed && styles.metricPass]}>
              {stats.median}ms
            </Text>
            {threshold && (
              <Text style={styles.metricThreshold}>
                {medianPassed ? '✓' : '✗'} ≤{threshold.median}ms
              </Text>
            )}
          </View>
          
          <View style={styles.metricStat}>
            <Text style={styles.metricLabel}>P90</Text>
            <Text style={[styles.metricValue, p90Passed && styles.metricPass]}>
              {stats.p90}ms
            </Text>
            {threshold && (
              <Text style={styles.metricThreshold}>
                {p90Passed ? '✓' : '✗'} ≤{threshold.p90}ms
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.metricRow}>
          <View style={styles.metricStat}>
            <Text style={styles.metricLabel}>Min</Text>
            <Text style={styles.metricValueSmall}>{stats.min}ms</Text>
          </View>
          
          <View style={styles.metricStat}>
            <Text style={styles.metricLabel}>Max</Text>
            <Text style={styles.metricValueSmall}>{stats.max}ms</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderScanStats = () => {
    return (
      <View style={styles.metricCard}>
        <Text style={styles.metricTitle}>Scan Events</Text>
        
        <View style={styles.scanStatsRow}>
          <View style={styles.scanStat}>
            <Text style={styles.scanStatValue}>{scanStats.success}</Text>
            <Text style={styles.scanStatLabel}>Success</Text>
          </View>
          
          <View style={styles.scanStat}>
            <Text style={[styles.scanStatValue, { color: COLORS.utility.error }]}>
              {scanStats.failure}
            </Text>
            <Text style={styles.scanStatLabel}>Failure</Text>
          </View>
          
          <View style={styles.scanStat}>
            <Text style={styles.scanStatValue}>{scanStats.total}</Text>
            <Text style={styles.scanStatLabel}>Total</Text>
          </View>
        </View>
      </View>
    );
  };
  
  const renderEventList = () => {
    const displayEvents = events.slice(0, 50);
    
    return (
      <View style={styles.eventsSection}>
        <View style={styles.eventsSectionHeader}>
          <Text style={styles.sectionTitle}>Recent Events ({events.length})</Text>
          <TouchableOpacity onPress={handleClearEvents} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        {displayEvents.map((event, idx) => {
          const timeAgo = Math.floor((Date.now() - event.ts) / 1000);
          
          return (
            <View key={`${event.name}-${idx}`} style={styles.eventItem}>
              <View style={styles.eventLeft}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventTime}>
                  {timeAgo < 60 ? `${timeAgo}s ago` : `${Math.floor(timeAgo / 60)}m ago`}
                </Text>
              </View>
              
              {Object.keys(event.payload).length > 0 && (
                <Text style={styles.eventPayload} numberOfLines={1}>
                  {JSON.stringify(event.payload)}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dev Analytics</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.warningBanner}>
          🛠️ DEV ONLY - Not visible in production
        </Text>
        
        {renderMetricCard('AddMeal Flow', mealAddStats, { median: 5000, p90: 8000 })}
        {renderMetricCard('Discover TTFB', discoverTiming, { median: 500, p90: 1000 })}
        {renderScanStats()}
        {renderEventList()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
  },
  backButton: {
    padding: SIZES.spacing.xs,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.spacing.lg,
  },
  warningBanner: {
    backgroundColor: COLORS.accent.quaternary,
    padding: SIZES.spacing.md,
    borderRadius: 8,
    textAlign: 'center',
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    marginBottom: SIZES.spacing.lg,
  },
  metricCard: {
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.lg,
    borderRadius: 12,
    marginBottom: SIZES.spacing.lg,
  },
  metricTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  metricSamples: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginBottom: SIZES.spacing.md,
  },
  metricNoData: {
    fontSize: FONTS.size.md,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SIZES.spacing.sm,
  },
  metricStat: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginBottom: SIZES.spacing.xxs,
  },
  metricValue: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  metricPass: {
    color: COLORS.utility.success,
  },
  metricThreshold: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.xxs,
  },
  metricValueSmall: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
  },
  scanStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SIZES.spacing.md,
  },
  scanStat: {
    alignItems: 'center',
  },
  scanStatValue: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.utility.success,
  },
  scanStatLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginTop: SIZES.spacing.xs,
  },
  eventsSection: {
    marginTop: SIZES.spacing.md,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  clearButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
    backgroundColor: COLORS.accent.error,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.onAccent,
  },
  eventItem: {
    backgroundColor: COLORS.background.tertiary,
    padding: SIZES.spacing.md,
    borderRadius: 8,
    marginBottom: SIZES.spacing.sm,
  },
  eventLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  eventName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    fontFamily: 'monospace',
  },
  eventTime: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  eventPayload: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
  },
});

