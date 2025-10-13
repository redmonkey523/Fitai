import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView, StyleSheet, Image, ImageBackground, SafeAreaView, Alert, Platform, Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { API_BASE_URL } from '../config/api';
import Card from '../components/Card';
import Button from '../components/Button';
import TrialBanner from '../components/TrialBanner';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useTrendingPrograms, useCoaches, usePrograms, useDiscoverHome } from '../hooks/useDiscover';
import { SkeletonList, SkeletonCoachCard, SkeletonProgramCard } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const tabs = ['home', 'trending', 'coaches', 'programs'];
const { width } = Dimensions.get('window');

// Helper to ensure alerts work on web (fallback to window.alert)
const showAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (buttons && Array.isArray(buttons) && buttons[0] && typeof buttons[0].onPress === 'function') {
      buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function DiscoverScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [page, setPage] = useState(1);
  const [processingIds, setProcessingIds] = useState([]);
  const impressionsSent = useRef(new Set());
  
  // Active tab ref for impression tracking
  const activeTabRef = useRef(activeTab);
  React.useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Fetch data based on active tab using React Query
  const homeQuery = useDiscoverHome({ enabled: activeTab === 'home' });
  const trendingQuery = useTrendingPrograms({ enabled: activeTab === 'trending' });
  const coachesQuery = useCoaches({ 
    page, 
    limit: 20, 
    enabled: activeTab === 'coaches' 
  });
  const programsQuery = usePrograms({ 
    page, 
    limit: 20, 
    enabled: activeTab === 'programs' 
  });

  // Determine current query based on active tab
  const getCurrentQuery = () => {
    switch (activeTab) {
      case 'home': return homeQuery;
      case 'trending': return trendingQuery;
      case 'coaches': return coachesQuery;
      case 'programs': return programsQuery;
      default: return homeQuery;
    }
  };

  const currentQuery = getCurrentQuery();
  const { data, isLoading, isError, error, refetch } = currentQuery;

  // Get list data based on tab
  const getListData = () => {
    if (activeTab === 'home') return [];
    if (activeTab === 'trending') return data || [];
    if (activeTab === 'coaches') return data || [];
    if (activeTab === 'programs') return data || [];
    return [];
  };

  const listData = getListData();

  // Single stable viewability callback
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    try {
      viewableItems.forEach(v => {
        const id = v?.item?._id;
        if (id && !impressionsSent.current.has(id)) {
          impressionsSent.current.add(id);
          api.trackEvent('discover_impression', { id, tab: activeTabRef.current });
        }
      });
    } catch {}
  });

  // Load more handler for pagination
  const loadMore = useCallback(() => {
    if (activeTab === 'home' || isLoading) return;
    setPage(prev => prev + 1);
  }, [activeTab, isLoading]);

  // Reset page when tab changes
  React.useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>
      {activeTab === 'home' && (
        <ImageBackground
          source={{ uri: (() => {
            try {
              const server = (API_BASE_URL || '').replace(/\/api$/, '');
              return `${server}/uploads/seed/hero.jpg`;
            } catch { return 'https://picsum.photos/seed/hero/1200/800'; }
          })() }}
          resizeMode="cover"
          style={styles.heroBg}
          imageStyle={Platform.OS === 'web' ? { objectPosition: 'center 15%' } : { transform: [{ translateY: -30 }] }}
        >
          <LinearGradient colors={[ 'rgba(11,11,18,0.25)', 'rgba(11,11,18,0.95)' ]} style={styles.heroOverlay}>
            <Text style={styles.heroEyebrow}>Your transformation starts now</Text>
            <Text style={styles.heroTitle}>CHAMPION{"\n"}YOURSELF</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Programs')} style={styles.heroCta}>
              <LinearGradient colors={[ '#0ea5ff', '#7c3aed' ]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.heroCtaInner}>
                <Text style={styles.heroCtaText}>Join My Program</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </ImageBackground>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)} 
              style={[styles.tab, isActive && styles.activeTab]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCoachCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.coachCard}
      onPress={() => navigation.navigate('CoachProfile', { coach: item })}
    >
      <View style={styles.coachContent}>
        <Image source={{ uri: item.avatar }} style={styles.coachAvatar} />
        <View style={styles.coachDetails}>
          <View style={styles.coachTitleRow}>
            <Text style={styles.coachName}>{item.name}</Text>
            {item.isFree && (
              <Text style={styles.freeLabel}>Free</Text>
            )}
          </View>
          
          {item.verified && (
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.accent.success} />
              <Text style={styles.verifiedText}>Verified Coach</Text>
            </View>
          )}
          
          <Text style={styles.coachSpecialty}>{item.specialty}</Text>
          
          <View style={styles.coachMetrics}>
            <View style={styles.ratingRow}>
              {[1,2,3,4].map(i => (
                <Ionicons key={i} name="star" size={12} color={COLORS.accent.warning} />
              ))}
              <Ionicons name="star-outline" size={12} color={COLORS.text.tertiary} />
              <Text style={styles.ratingValue}>{item.rating || 4.3}k</Text>
            </View>
            {item.hot && (
              <View style={styles.hotBadge}>
                <Text style={styles.hotText}>Hot</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.coachButtonRow}>
        <Button
          label="Follow"
          type="outline"
          size="sm"
          onPress={(e) => {
            e.stopPropagation();
            console.log('Follow coach:', item.name);
          }}
          style={styles.followBtn}
        />
        <Button
          label={item.subscribed ? 'Subscribed' : processingIds.includes(item._id) ? 'Subscribing...' : 'Subscribe'}
          disabled={item.subscribed || processingIds.includes(item._id)}
          size="sm"
          onPress={async (e) => {
            e.stopPropagation();
            if (processingIds.includes(item._id)) return;
            setProcessingIds((p) => [...p, item._id]);
            try {
              if (/^[a-f0-9]{24}$/.test(item._id)) {
                await api.followCoach(item._id);
              }
              showAlert('Subscribed', `You are now following ${item.name}`, [
                {
                  text: 'Go to Workouts',
                  onPress: () => navigation?.navigate && navigation.navigate('Workouts'),
                },
                { text: 'OK' },
              ]);
              refetch();
            } catch (err) {
              console.error('Subscribe error', err);
              showAlert('Error', err.message || 'Failed to subscribe');
            } finally {
              setProcessingIds((p) => p.filter((id) => id !== item._id));
            }
          }}
          style={styles.subscribeBtn}
        />
      </View>
    </TouchableOpacity>
  );

  const renderProgramCard = ({ item }) => (
    <View style={styles.programCard}>
      <View style={styles.programContent}>
        <Image source={{ uri: item.media?.hero || item.thumbnail || 'https://via.placeholder.com/88x56/333333/FFFFFF?text=P' }} style={styles.programThumbnail} />
        <View style={styles.programDetails}>
          <View style={styles.programTitleSection}>
            {item.checkmark && (
              <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} style={styles.programCheckmark} />
            )}
            <View style={styles.programTitleContainer}>
              {item.isNew && <Text style={styles.newLabel}>New</Text>}
              {item.isFlat && <Text style={styles.flatLabel}>+ Flat</Text>}
              <Text style={styles.programTitle}>{item.name || item.title}</Text>
            </View>
          </View>
          
          <Text style={styles.programCoach}>{item.coach || (item.coachId ? 'Coach' : '')}</Text>
          
          <View style={styles.programMetaRow}>
            <View style={styles.programMetaItem}>
              <Ionicons name="time-outline" size={12} color={COLORS.text.secondary} />
              <Text style={styles.programMetaText}>{item.estimatedDuration ? `${item.estimatedDuration} min` : (item.duration || '')}</Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <View style={styles.programMetaItem}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.text.secondary} />
              <Text style={styles.programMetaText}>{item.phases?.length ? `${item.phases.length} phases` : (item.weeks || '')}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.programFooter}>
        <TouchableOpacity onPress={() => { api.trackEvent('program_click', { id: item._id }); navigation.navigate('ProgramDetail', { id: item._id }); }}>
          <Text style={styles.editorsPick}>View Details</Text>
        </TouchableOpacity>
        <Button
          label={item.added ? 'Added' : processingIds.includes(item._id) ? 'Adding...' : 'Add to My Page'}
          disabled={item.added || processingIds.includes(item._id)}
          size="sm"
          onPress={async () => {
            if (processingIds.includes(item._id)) return;
            setProcessingIds((p) => [...p, item._id]);
            try {
              const workoutData = {
                name: item.title || 'Program Session',
                type: 'other',
                category: 'program',
                difficulty: 'beginner',
                estimatedDuration: parseInt(item.duration) || 45,
                description: `Workout from ${item.title}`,
                exercises: [{
                  exerciseId: '000000000000000000000000',
                  sets: [{ reps: 10, weight: 0, restTime: 60 }],
                }],
              };
              await api.createWorkout(workoutData);
              showAlert('Added', `${item.title} has been added to your workout library`, [
                { text: 'Go to Workouts', onPress: () => navigation?.navigate && navigation.navigate('Workouts') },
                { text: 'OK' },
              ]);
              refetch();
            } catch (err) {
              console.error('Assign plan error', err);
              showAlert('Error', err.message || 'Failed to add plan');
            } finally {
              setProcessingIds((p) => p.filter((id) => id !== item._id));
            }
          }}
          style={styles.addToPageBtn}
        />
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    if (item.name) return renderCoachCard({ item });
    return renderProgramCard({ item });
  };

  // Render loading state with skeletons
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <SkeletonList count={6} itemHeight={120} />
      </SafeAreaView>
    );
  }

  // Render error state
  if (isError) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderTabs()}
        <ErrorState
          message={error?.message || 'Failed to load content'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  // Render empty state
  if (activeTab !== 'home' && listData.length === 0) {
    // Special handling for trending: fall back to top programs
    if (activeTab === 'trending') {
      const topPrograms = programsQuery.data || [];
      
      return (
        <SafeAreaView style={styles.container}>
          {renderHeader()}
          {renderTabs()}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.fallbackHeader}>
              <Ionicons name="trending-up-outline" size={32} color={COLORS.text.tertiary} />
              <Text style={styles.fallbackTitleSmall}>No trending programs right now</Text>
              <Text style={styles.fallbackSubtitleSmall}>Showing our top programs instead</Text>
            </View>
            {topPrograms.length > 0 ? (
              <FlatList
                data={topPrograms}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <EmptyState
                icon="barbell-outline"
                title="No programs available"
                message="Check back later"
                actionLabel="Refresh"
                onAction={() => {
                  trendingQuery.refetch();
                  programsQuery.refetch();
                }}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }
    
    // Programs tab empty: show top programs fallback
    if (activeTab === 'programs' && listData.length === 0) {
      const topPrograms = programsQuery.data || [];
      return (
        <SafeAreaView style={styles.container}>
          {renderHeader()}
          {renderTabs()}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.fallbackHeader}>
              <Text style={styles.fallbackTitleSmall}>No programs in this category</Text>
              <Text style={styles.fallbackSubtitleSmall}>Showing recommended programs instead</Text>
            </View>
            {topPrograms.length > 0 ? (
              <FlatList
                data={topPrograms}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <EmptyState
                icon="barbell-outline"
                title="No programs available yet"
                message="Check back later for new programs"
                actionLabel="Refresh"
                onAction={() => programsQuery.refetch()}
              />
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }
    
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

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      <Toast />
      
      {activeTab === 'home' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SIZES.spacing.xl }}>
          {data && <SpotlightGrid navigation={navigation} items={buildSpotlight(data.allCoaches || [])} />}
        </ScrollView>
      ) : (
        <FlatList
          key={`discover-${activeTab}`}
          data={listData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          onViewableItemsChanged={Platform.OS !== 'web' ? onViewableItemsChangedRef.current : undefined}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// Build hero-style spotlight grid
const buildSpotlight = (coaches = []) => {
  const ranked = [...coaches].sort((a,b) => (b.followers||0) - (a.followers||0));
  const server = (API_BASE_URL || '').replace(/\/api$/, '');
  return ranked.slice(0, 4).map((c, idx) => {
    const seededJpg = server ? `${server}/uploads/seed/coach${idx+1}.jpg` : null;
    return {
      _id: c._id || String(idx),
      title: c.name || 'Coach',
      subtitle: idx === 0 ? 'STRENGTH REDEFINED' : idx === 1 ? 'BUILD YOUR BEST SELF' : idx === 2 ? 'FITNESS UNLEASHED' : 'PUSHING THE LIMITS',
      badge: idx === 0 ? { label: 'TRENDING', color: '#ef4444' } : idx === 1 ? { label: 'TOP RATED', color: '#22c55e' } : idx === 2 ? { label: 'NEW', color: '#22c55e' } : { label: 'LIVE', color: '#ef4444' },
      avatar: c.avatar || seededJpg || `https://picsum.photos/seed/coach-${idx}/900/700`,
    };
  });
};

const SpotlightGrid = ({ items, navigation }) => {
  const gutter = 12;
  const sidePadding = 12;
  const columns = width >= 900 ? 4 : (width >= 700 ? 3 : 2);
  const cardWidth = (width - sidePadding * 2 - gutter * (columns - 1)) / columns;
  const cardHeight = width >= 700 ? 210 : 180;
  return (
    <View style={{ paddingHorizontal: sidePadding, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {items.map((it) => (
          <TouchableOpacity
            key={it._id}
            onPress={() => navigation.navigate('CoachProfile', { coach: { name: it.title, avatar: it.avatar, specialty: it.subtitle?.replace(/_/g,' ') } })}
            style={[styles.bigCard, { width: cardWidth, height: cardHeight, marginBottom: gutter, borderWidth: 1, borderColor: 'rgba(59,130,246,0.18)', ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(0,0,0,0.35)' } : {}) }]}
          >
            <Image source={{ uri: it.avatar }} resizeMode="cover" style={[styles.bigCardImg, Platform.OS === 'web' ? { objectPosition: 'center 15%' } : {}]} />
            <LinearGradient colors={[ 'rgba(2,6,23,0.1)', 'rgba(2,6,23,0.95)' ]} style={styles.bigCardOverlay} />
            <View style={[styles.bigCardBadge, { backgroundColor: it.badge.color }]}><Text style={styles.badgeText}>{it.badge.label}</Text></View>
            <Text style={[styles.bigCardTitle, { fontSize: 20 }]} numberOfLines={2}>{it.title}</Text>
            <Text style={[styles.bigCardSubtitle, { textTransform: 'uppercase', letterSpacing: 1 }]} numberOfLines={1}>{it.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.spacing.md, paddingVertical: SIZES.spacing.sm },
  headerTitle: { color: COLORS.text.primary, fontSize: FONTS.size.xxl, fontWeight: FONTS.weight.bold },
  searchButton: { padding: SIZES.spacing.xs },
  fallbackContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: SIZES.spacing.xl,
    gap: SIZES.spacing.md,
  },
  fallbackHeader: {
    padding: SIZES.spacing.lg,
    alignItems: 'center',
    gap: SIZES.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
    marginBottom: SIZES.spacing.sm,
  },
  fallbackTitleSmall: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
    marginTop: SIZES.spacing.xs,
  },
  fallbackSubtitleSmall: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    textAlign: 'center',
  },
  fallbackTitle: { 
    color: COLORS.text.primary, 
    fontSize: FONTS.size.xl, 
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
  },
  fallbackSubtitle: { 
    color: COLORS.text.secondary, 
    fontSize: FONTS.size.md,
    textAlign: 'center',
  },
  fallbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.lg,
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    marginTop: SIZES.spacing.md,
  },
  fallbackButtonText: {
    color: COLORS.background.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  heroBg: { marginHorizontal: SIZES.spacing.md, marginTop: 4, borderRadius: SIZES.radius.lg, height: 200, overflow: 'hidden' },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: SIZES.spacing.lg },
  heroEyebrow: { color: COLORS.text.secondary, marginBottom: 4 },
  heroTitle: { color: COLORS.text.primary, fontSize: 34, fontWeight: FONTS.weight.bold, letterSpacing: 1, lineHeight: 36 },
  heroCta: { marginTop: SIZES.spacing.md, alignSelf: 'flex-start' },
  heroCtaInner: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  heroCtaText: { color: COLORS.background.primary, fontWeight: FONTS.weight.bold },
  tabsContainer: { paddingVertical: SIZES.spacing.sm },
  tabsContent: { paddingHorizontal: SIZES.spacing.md },
  tab: { paddingHorizontal: SIZES.spacing.md, paddingVertical: SIZES.spacing.sm, marginRight: SIZES.spacing.lg, position: 'relative' },
  activeTab: {},
  tabText: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, fontWeight: FONTS.weight.medium },
  activeTabText: { color: COLORS.text.primary, fontWeight: FONTS.weight.bold },
  tabIndicator: { position: 'absolute', bottom: 0, left: SIZES.spacing.md, right: SIZES.spacing.md, height: 2, backgroundColor: COLORS.accent.primary, borderRadius: 1 },
  coachCard: { backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, padding: SIZES.spacing.lg, marginHorizontal: SIZES.spacing.md, marginBottom: SIZES.spacing.sm, ...SHADOWS.medium },
  coachContent: { flexDirection: 'row', marginBottom: SIZES.spacing.md },
  coachAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.background.secondary, marginRight: SIZES.spacing.md },
  coachDetails: { flex: 1 },
  coachTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SIZES.spacing.xs },
  coachName: { color: COLORS.text.primary, fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold },
  freeLabel: { color: COLORS.accent.success, fontSize: FONTS.size.sm, fontWeight: FONTS.weight.bold },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.spacing.xs },
  verifiedText: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, marginLeft: SIZES.spacing.xs },
  coachSpecialty: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, marginBottom: SIZES.spacing.sm },
  coachMetrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingValue: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, marginLeft: SIZES.spacing.xs },
  hotBadge: { backgroundColor: COLORS.accent.error, paddingHorizontal: SIZES.spacing.sm, paddingVertical: 4, borderRadius: SIZES.radius.sm },
  hotText: { color: COLORS.text.primary, fontSize: FONTS.size.xs, fontWeight: FONTS.weight.bold },
  coachButtonRow: { flexDirection: 'row', gap: SIZES.spacing.md },
  followBtn: { flex: 1 },
  subscribeBtn: { flex: 1 },
  programCard: { backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, padding: SIZES.spacing.lg, marginHorizontal: SIZES.spacing.md, marginBottom: SIZES.spacing.sm, ...SHADOWS.medium },
  programContent: { flexDirection: 'row', marginBottom: SIZES.spacing.md },
  programThumbnail: { width: 88, height: 56, borderRadius: SIZES.radius.sm, backgroundColor: COLORS.background.secondary, marginRight: SIZES.spacing.md },
  programDetails: { flex: 1 },
  programTitleSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.spacing.xs },
  programCheckmark: { marginRight: SIZES.spacing.sm, marginTop: 2 },
  programTitleContainer: { flex: 1 },
  newLabel: { color: COLORS.accent.success, fontSize: FONTS.size.xs, fontWeight: FONTS.weight.bold, marginBottom: 2 },
  flatLabel: { color: COLORS.accent.warning, fontSize: FONTS.size.xs, fontWeight: FONTS.weight.bold, marginBottom: 2 },
  programTitle: { color: COLORS.text.primary, fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold },
  programCoach: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, marginBottom: SIZES.spacing.sm },
  programMetaRow: { flexDirection: 'row', alignItems: 'center' },
  programMetaItem: { flexDirection: 'row', alignItems: 'center' },
  programMetaText: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, marginLeft: SIZES.spacing.xs },
  metaDivider: { color: COLORS.text.tertiary, fontSize: FONTS.size.sm, marginHorizontal: SIZES.spacing.sm },
  programFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editorsPick: { color: COLORS.text.tertiary, fontSize: FONTS.size.sm },
  addToPageBtn: {},
  itemSeparator: { height: SIZES.spacing.md },
  listContent: { paddingBottom: SIZES.spacing.xl },
  bigCard: { height: 180, borderRadius: SIZES.radius.md, overflow: 'hidden', backgroundColor: COLORS.background.card, ...SHADOWS.medium },
  bigCardImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bigCardOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  bigCardBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: COLORS.text.primary, fontWeight: FONTS.weight.bold, fontSize: FONTS.size.xs },
  bigCardTitle: { position: 'absolute', left: 10, right: 10, bottom: 28, color: COLORS.text.primary, fontWeight: FONTS.weight.bold, fontSize: FONTS.size.lg },
  bigCardSubtitle: { position: 'absolute', left: 10, right: 10, bottom: 8, color: COLORS.text.secondary, fontSize: FONTS.size.sm },
});

