import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useTrendingPrograms } from './hooks/useTrendingPrograms';
import { useCoaches } from './hooks/useCoaches';
import { usePrograms } from './hooks/usePrograms';
import { ProgramCard } from './components/ProgramCard';
import { CoachCard } from './components/CoachCard';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { SkeletonList } from './components/SkeletonRow';
import { Program, Coach } from '../../services/api';
import { trackImpression } from '../../services/events';

type Tab = 'trending' | 'coaches' | 'programs';

export interface DiscoverScreenProps {
  navigation?: any;
}

/**
 * Discover Screen with Trending, Coaches, and Programs tabs
 * 
 * Features:
 * - Region-aware trending programs
 * - Virtualized lists for performance
 * - Skeleton loading states (>= 200ms)
 * - Error states with retry
 * - Empty states
 * - Analytics tracking (impressions, clicks)
 * - Smooth tab transitions
 */
export default function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('trending');
  const [region, setRegion] = useState('global');
  const [page, setPage] = useState(1);
  
  // Track impressions (avoid duplicates)
  const impressionsSent = useRef(new Set<string>());
  const activeTabRef = useRef<Tab>(activeTab);
  
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Fetch data based on active tab
  const trendingQuery = useTrendingPrograms({
    region,
    enabled: activeTab === 'trending',
  });
  
  const coachesQuery = useCoaches({
    page,
    limit: 20,
    enabled: activeTab === 'coaches',
  });
  
  const programsQuery = usePrograms({
    page,
    limit: 20,
    enabled: activeTab === 'programs',
  });

  // Get current query based on active tab
  const currentQuery = activeTab === 'trending' 
    ? trendingQuery 
    : activeTab === 'coaches' 
    ? coachesQuery 
    : programsQuery;

  const { data, isLoading, isError, error, refetch } = currentQuery;

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    impressionsSent.current.clear();
  }, [activeTab]);

  // Handle viewable items changed (for impression tracking)
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    try {
      viewableItems.forEach((v) => {
        const item = v.item as Program | Coach;
        const id = item.id;
        const type = 'name' in item ? 'coach' : 'program';
        
        if (id && !impressionsSent.current.has(id)) {
          impressionsSent.current.add(id);
          trackImpression(id, type, activeTabRef.current, v.index ?? undefined);
        }
      });
    } catch (err) {
      // Silently fail impression tracking
      if (__DEV__) console.warn('Impression tracking error:', err);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 500,
  }).current;

  // Handle program press
  const handleProgramPress = useCallback((program: Program) => {
    navigation?.navigate?.('ProgramDetail', { id: program.id });
  }, [navigation]);

  // Handle program add
  const handleProgramAdd = useCallback(async (program: Program) => {
    // TODO: Implement add to library
    console.log('Add program:', program.title);
  }, []);

  // Handle coach press
  const handleCoachPress = useCallback((coach: Coach) => {
    navigation?.navigate?.('CoachProfile', { id: coach.id, coach });
  }, [navigation]);

  // Handle coach follow
  const handleCoachFollow = useCallback(async (coach: Coach) => {
    // TODO: Implement follow coach
    console.log('Follow coach:', coach.name);
  }, []);

  // Load more for pagination
  const handleLoadMore = useCallback(() => {
    if (activeTab === 'trending' || isLoading) return;
    setPage((prev) => prev + 1);
  }, [activeTab, isLoading]);

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Discover</Text>
      <TouchableOpacity style={styles.searchButton}>
        <Ionicons name="search" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
    </View>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {(['trending', 'coaches', 'programs'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, isActive && styles.activeTab]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {activeTab === 'trending' && (
        <View style={styles.regionSelector}>
          <TouchableOpacity
            style={[styles.regionButton, region === 'global' && styles.regionButtonActive]}
            onPress={() => setRegion('global')}
          >
            <Text style={[styles.regionText, region === 'global' && styles.regionTextActive]}>
              Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.regionButton, region === 'US' && styles.regionButtonActive]}
            onPress={() => setRegion('US')}
          >
            <Text style={[styles.regionText, region === 'US' && styles.regionTextActive]}>
              US
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render item based on type
  const renderItem = useCallback(({ item, index }: { item: Program | Coach; index: number }) => {
    if ('name' in item) {
      // Coach
      return (
        <CoachCard
          coach={item}
          source={activeTab as 'coaches'}
          onPress={handleCoachPress}
          onFollow={handleCoachFollow}
          position={index}
        />
      );
    } else {
      // Program
      return (
        <ProgramCard
          program={item}
          source={activeTab as 'trending' | 'programs'}
          onPress={handleProgramPress}
          onAdd={handleProgramAdd}
          position={index}
        />
      );
    }
  }, [activeTab, handleProgramPress, handleProgramAdd, handleCoachPress, handleCoachFollow]);

  // Show loading skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <SkeletonList 
          count={6} 
          type={activeTab === 'coaches' ? 'coach' : 'program'} 
        />
      </SafeAreaView>
    );
  }

  // Show error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <ErrorState
          message={error?.message || 'Failed to load content'}
          error={error}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <EmptyState
          icon={activeTab === 'coaches' ? 'people-outline' : 'barbell-outline'}
          title={`No ${activeTab} found`}
          message={`Check back later for new ${activeTab}`}
          actionLabel="Refresh"
          onAction={refetch}
        />
      </SafeAreaView>
    );
  }

  // Render main list
  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={Platform.OS !== 'web' ? onViewableItemsChanged : undefined}
        viewabilityConfig={viewabilityConfig}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={10}
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
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  searchButton: {
    padding: SIZES.spacing.xs,
  },
  tabsContainer: {
    paddingVertical: SIZES.spacing.sm,
  },
  tabsContent: {
    paddingHorizontal: SIZES.spacing.md,
  },
  tab: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    marginRight: SIZES.spacing.lg,
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  activeTabText: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: SIZES.spacing.md,
    right: SIZES.spacing.md,
    height: 2,
    backgroundColor: COLORS.accent.primary,
    borderRadius: 1,
  },
  regionSelector: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.md,
    paddingTop: SIZES.spacing.sm,
    gap: SIZES.spacing.sm,
  },
  regionButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: 16,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  regionButtonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  regionText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weight.medium,
  },
  regionTextActive: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weight.bold,
  },
  listContent: {
    paddingHorizontal: SIZES.spacing.md,
    paddingTop: SIZES.spacing.md,
    paddingBottom: SIZES.spacing.xl,
  },
});

