import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import api from '../services/api';
import Button from '../components/Button';
import crashReporting from '../services/crashReporting';
import Toast from 'react-native-toast-message';

export default function CreatorHubScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchStats = async () => {
      try {
        const res = await api.getCreatorStats();
      setStats(res.data || res);
      } catch (e) {
        console.error('Stats error', e);
      setStats(null);
      } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Creator Studio</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('CreatorProfileEditor')}>
          <Ionicons name="person-circle-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => {
            // Navigate to Profile screen which has settings
            navigation.navigate('Profile');
          }}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.totals?.followers?.toLocaleString() || '0'}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.totals?.programs || '0'}</Text>
        <Text style={styles.statLabel}>Programs</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats?.totals?.views?.toLocaleString() || '0'}</Text>
        <Text style={styles.statLabel}>Views</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>${(stats?.totals?.revenue || 0).toFixed(0)}</Text>
        <Text style={styles.statLabel}>Revenue</Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity 
        style={styles.quickActionPrimary}
        onPress={() => navigation.navigate('NewWorkout')}
      >
        <Text style={styles.quickActionPrimaryText}>Quick Create</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.quickActionSecondary}
        onPress={() => navigation.navigate('CreatorDrafts')}
      >
        <Text style={styles.quickActionSecondaryText}>Drafts</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.quickActionSecondary}
        onPress={() => navigation.navigate('MediaLibrary', { bulkAttach: true })}
      >
        <Text style={styles.quickActionSecondaryText}>Media Library</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.quickActionSecondary}
        onPress={handleUploadAsset}
        disabled={uploading}
      >
        <Text style={styles.quickActionSecondaryText}>{uploading ? 'Uploading…' : 'Upload Media'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddBlockSection = (title, description, onAddPress) => (
    <View style={styles.addBlockSection}>
      <View style={styles.addBlockHeader}>
        <Text style={styles.addBlockTitle}>{title}</Text>
        <TouchableOpacity onPress={onAddPress} style={styles.addBlockButton}>
          <Text style={styles.addBlockButtonText}>Add Block</Text>
        </TouchableOpacity>
      </View>
      {description && (
        <Text style={styles.addBlockDescription}>{description}</Text>
      )}
    </View>
  );

  const renderProgramItem = (program) => (
    <View key={program.id} style={styles.programItem}>
      <View style={styles.programInfo}>
        <Text style={styles.programTitle}>{program.title}</Text>
        <Text style={styles.programDescription}>{program.description}</Text>
        <View style={styles.programMeta}>
          <Text style={styles.programPrice}>${program.price}</Text>
          <Text style={styles.programDuration}>{program.duration}</Text>
          <Text style={styles.programLevel}>{program.level}</Text>
          {program.views && <Text style={styles.programViews}>• {program.views} views</Text>}
        </View>
      </View>
      <View style={styles.programActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('NewWorkout', { workoutId: program.id, mode: 'edit' })}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.accent.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statsButton}
          onPress={() => navigation.navigate('CreatorAnalytics', { 
            programId: program.id || program._id, 
            programTitle: program.title 
          })}
        >
          <Ionicons name="bar-chart-outline" size={18} color={COLORS.text.secondary} />
          <Text style={styles.statsButtonText}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => Alert.alert(program.title, 'More options', [
            { text: 'Preview (Public)', onPress: () => {
              // Navigate to public program preview
              navigation.navigate('ProgramDetail', { programId: program.id || program._id, preview: true });
            }},
            { text: 'Share Link', onPress: async () => {
              const shareUrl = `https://app.fitness.com/program/${program.id || program._id}`;
              if (Platform.OS === 'web') {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  Alert.alert('Link Copied', shareUrl);
                } catch (e) {
                  Alert.alert('Share Link', shareUrl);
                }
              } else {
                const { default: Share } = await import('react-native');
                Share.share({ message: shareUrl, url: shareUrl });
              }
            }},
            { text: 'Duplicate', onPress: async () => {
              try {
                await api.duplicateProgram(program.id || program._id);
                Toast.show({ type: 'success', text1: 'Program Duplicated' });
                refetch();
              } catch (error) {
                crashReporting.logError(error, { context: 'duplicate_program' });
                Toast.show({ type: 'error', text1: 'Failed to duplicate' });
              }
            }},
            ...(program.published ? [{ 
              text: 'Unpublish', 
              onPress: () => Alert.alert('Unpublish?', 'Hide this program from public?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Unpublish', style: 'destructive', onPress: async () => {
                  try {
                    await api.unpublishProgram(program.id || program._id);
                    Toast.show({ type: 'success', text1: 'Program Unpublished' });
                    refetch();
                  } catch (error) {
                    crashReporting.logError(error, { context: 'unpublish_program' });
                    Toast.show({ type: 'error', text1: 'Failed to unpublish' });
                  }
                }}
              ])
            }] : []),
            { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Delete?', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                  await api.deleteProgram(program.id || program._id);
                  Toast.show({ type: 'success', text1: 'Program Deleted' });
                  refetch();
                } catch (error) {
                  crashReporting.logError(error, { context: 'delete_program' });
                  Toast.show({ type: 'error', text1: 'Failed to delete' });
                }
              }}
            ])},
            { text: 'Cancel', style: 'cancel' }
          ])}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleUploadAsset = async () => {
    try {
      // Require auth for uploads
      const token = await api.getAuthToken();
      if (!token) {
        Alert.alert('Sign in required', 'Please log in to upload media.');
        return;
      }
      setUploading(true);
      let file;
      if (Platform.OS === 'web') {
        // Web fallback: use input element
        file = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*,video/*';
          input.multiple = false;
          const cleanup = () => {
            if (input && input.parentNode) input.parentNode.removeChild(input);
          };
          input.addEventListener('change', () => {
            try {
              const f = input.files && input.files[0];
              cleanup();
              if (!f) return reject(new Error('No file selected'));
              resolve({ uri: URL.createObjectURL(f), name: f.name, type: f.type, _raw: f });
            } catch (e) {
              cleanup();
              reject(e);
            }
          });
          input.style.position = 'fixed';
          input.style.left = '-10000px';
          document.body.appendChild(input);
          input.click();
        });
      } else {
        const moduleName='expo-document-picker'; const picker=await import(moduleName); const {getDocumentAsync}=picker;
        const pick = await getDocumentAsync({ type: ['image/*', 'video/*'], multiple: false });
        if (pick.canceled) { setUploading(false); return; }
        const asset = pick.assets?.[0];
        if (!asset) throw new Error('No file selected');
        file = asset;
      }

      // Build file object compatible with FormData
      const filePart = Platform.OS === 'web'
        ? file._raw // pass the real File object on web
        : { uri: file.uri, name: file.name || 'upload', type: file.mimeType || 'application/octet-stream' };

      const res = await api.uploadFile(filePart);
      const url = res?.file?.url || res?.data?.file?.url || res?.url;
      console.log('Upload response:', res);
      if (!url) throw new Error('Upload did not return a URL');
      // Save to Media Library and let user choose next action; do not auto-attach or force navigation
      try {
        const { addMediaItem } = await import('../services/mediaLibrary');
        const guessedType = (file?.type || '').startsWith('image') ? 'image' : 'video';
        await addMediaItem({ url, name: file?.name || 'upload', type: guessedType, cloudinaryId: res?.file?.cloudinaryId || null, status: 'ready' });
        // Also create server-backed media record for cross-device sync
        try {
          await api.createMediaItem({
            url,
            type: guessedType,
            name: file?.name || 'upload',
            status: 'ready',
            cloudinaryId: res?.file?.cloudinaryId || null,
          });
        } catch (e) {
          // non-blocking
        }
      } catch {}

      const actions = [
        { text: 'Open Library', onPress: () => navigation.navigate('MediaLibrary') },
        { text: 'Copy URL', onPress: () => { try { navigator.clipboard?.writeText(url); } catch {} } },
        { text: 'Close' },
      ];
      Alert.alert('Upload Complete', 'Saved to your Media Library.', Platform.OS === 'web' ? undefined : actions);
      if (Platform.OS === 'web') {
        // Web Alert lacks buttons: provide a gentle nudge via clipboard
        try { navigator.clipboard?.writeText(url); } catch {}
      }
    } catch (e) {
      console.error('Upload failed:', e);
      Alert.alert('Upload Failed', e?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading Creator Studio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="create-outline" size={64} color={COLORS.accent.primary} />
          <Text style={styles.emptyTitle}>Not a creator yet</Text>
          <Text style={styles.emptyText}>Apply to become a creator and start building your fitness programs</Text>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => navigation.navigate('CreatorApply')}
          >
            <Text style={styles.applyButtonText}>Apply to be Creator</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent.primary} />
      }>
        {renderHeader()}
        {renderStatsCards()}
        {renderQuickActions()}
        
        {/* Add Block Sections */}
        {renderAddBlockSection(
          'Quick Create',
          'Create workouts and programs quickly',
          () => navigation.navigate('NewWorkout')
        )}
        
        {renderAddBlockSection(
          'Drafts & WIP',
          'Continue working on your saved drafts',
          () => navigation.navigate('CreatorDrafts')
        )}
        
        {/* Active Programs */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Programs</Text>
          {stats?.activePrograms?.map(program => renderProgramItem(program))}
        </View>
        
        {/* Programs List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Bodyweight Basics</Text>
          <Text style={styles.sectionSubtitle}>$19.99 • 2 Workouts</Text>
          
          <View style={styles.programsList}>
            {renderProgramItem({
              id: 'mock-program-1',
              title: 'Upper Body Pump',
              description: 'Intense upper body workout focusing on chest, shoulders, and arms. Perfect for building strength and muscle definition.',
              price: 19.99,
              duration: '45 min',
              level: 'Intermediate',
              views: 1234,
              completions: 89,
              revenue: 399.80
            })}
            
            {renderProgramItem({
              id: 'mock-program-2',
              title: 'Core Crusher',
              description: 'High-intensity core workout that targets all abdominal muscles. Build a strong, stable core with dynamic movements.',
              price: 14.99,
              duration: '30 min',
              level: 'Beginner',
              views: 892,
              completions: 56,
              revenue: 209.85
            })}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.analyticsButton}
          onPress={() => navigation.navigate('CreatorAnalytics')}
        >
          <Ionicons name="analytics-outline" size={20} color={COLORS.text.primary} />
          <Text style={styles.analyticsButtonText}>View Analytics</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
  },
  settingsButton: {
    padding: SIZES.spacing.xs,
  },
  
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.lg,
    gap: SIZES.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  statValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxxl,
    fontWeight: FONTS.weight.black,
    marginBottom: SIZES.spacing.xs,
  },
  statLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  
  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.xl,
    gap: SIZES.spacing.md,
  },
  quickActionPrimary: {
    flex: 1,
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  quickActionPrimaryText: {
    color: COLORS.background.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  quickActionSecondary: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  quickActionSecondaryText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  
  // Content Sections
  sectionContainer: {
    marginBottom: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.md,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  sectionSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.lg,
  },
  
  // Add Block Sections
  addBlockSection: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.lg,
    ...SHADOWS.medium,
  },
  addBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  addBlockTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  addBlockButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
  },
  addBlockButtonText: {
    color: COLORS.background.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  addBlockDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  
  // Program Items
  programsList: {
    gap: SIZES.spacing.md,
  },
  programItem: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    ...SHADOWS.small,
  },
  programInfo: {
    marginBottom: SIZES.spacing.md,
  },
  programTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  programDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.sm,
    lineHeight: 18,
  },
  programMeta: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  programPrice: {
    color: COLORS.accent.success,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  programDuration: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  programLevel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  programDate: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  programActions: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
    alignItems: 'center',
  },
  programViews: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  editButtonText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  statsButtonText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  moreButton: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  
  // Analytics Button
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.lg,
    backgroundColor: COLORS.background.card,
    marginHorizontal: SIZES.spacing.md,
    marginBottom: SIZES.spacing.xl,
    borderRadius: SIZES.radius.md,
    ...SHADOWS.medium,
  },
  analyticsButtonText: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    marginLeft: SIZES.spacing.md,
  },
  
  // Loading States
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
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
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
    marginBottom: SIZES.spacing.xl,
  },
  applyButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.md,
  },
  applyButtonText: {
    color: COLORS.background.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
});



