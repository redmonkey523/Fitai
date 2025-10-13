import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import api from '../services/api';
import { addMediaItem, getMediaLibrary } from '../services/mediaLibrary';

export default function NewWorkoutScreen({ navigation, route }) {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('strength');
  const [exercises, setExercises] = useState([]);
  const [blockVideos, setBlockVideos] = useState({}); // index -> url
  const [coverBlockIndex, setCoverBlockIndex] = useState(null);
  const [workoutVideoUrl, setWorkoutVideoUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const justUploaded = route?.params?.mediaUrl;
    const assignBlockIndex = route?.params?.assignBlockIndex;
    const bulkBlockMedia = route?.params?.bulkBlockMedia; // [{url, cover, trimStartS, trimEndS, order}]
    if (justUploaded) {
      if (typeof assignBlockIndex === 'number') {
        setBlockVideos((prev) => ({ ...prev, [assignBlockIndex]: justUploaded }));
      } else {
        setWorkoutVideoUrl(justUploaded);
      }
    }
    if (bulkBlockMedia && typeof assignBlockIndex === 'number') {
      // Apply first as cover if specified; otherwise first item wins
      const coverEntry = bulkBlockMedia.find((m) => m.cover) || bulkBlockMedia[0];
      if (coverEntry?.url) setCoverBlockIndex(assignBlockIndex);
      // Store only main URL per block for now; trims would be saved in block_media meta
      const firstUrl = coverEntry?.url || bulkBlockMedia[0]?.url;
      if (firstUrl) setBlockVideos((prev) => ({ ...prev, [assignBlockIndex]: firstUrl }));
    }
  }, [route?.params?.mediaUrl]);

  const handleSaveWorkout = async () => {
    const effectiveName = workoutName && workoutName.trim().length > 0
      ? workoutName.trim()
      : (workoutVideoUrl ? 'Video Workout' : 'New Workout');

    setSaving(true);
    try {
      // Ensure video URL doesn't violate description length validation; store in set notes instead
      const baseSets = exercises.length
        ? exercises.map((ex, idx) => [{
            reps: ex.reps || 10,
            weight: ex.weight || 0,
            restTime: ex.restTime || 60,
            ...(blockVideos[idx] ? { notes: `video:${blockVideos[idx]}` } : {})
          }])
        : [[{ reps: 10, restTime: 60 }]];

      // Attach video URL to the first set's notes if present
      if (workoutVideoUrl) {
        if (!baseSets[0][0]) baseSets[0][0] = { reps: 10, restTime: 60 };
        baseSets[0][0] = { ...baseSets[0][0], notes: `video:${workoutVideoUrl}` };
      }

      const workoutData = {
        name: effectiveName,
        type: selectedCategory || 'custom',
        difficulty: 'intermediate',
        duration: 45,
        exercises: (exercises.length
          ? exercises
          : [{ id: 'default' }]
        ).map((ex, index) => ({
          exerciseId: ex.exerciseId || ex.exercise || '000000000000000000000000',
          sets: baseSets[index] || [{ reps: 10, restTime: 60 }],
          order: index + 1,
        })),
        // Keep description human-readable but short
        description: workoutVideoUrl ? 'Video attached' : undefined,
      };

      // Optional metadata for future server support
      if (Object.keys(blockVideos).length > 0) {
        workoutData.block_media = Object.entries(blockVideos).map(([idx, url]) => ({
          blockIndex: Number(idx),
          url,
          cover: Number(idx) === coverBlockIndex,
        }));
      }

      console.log('Saving workout with payload:', workoutData);
      await api.createWorkout(workoutData);

      if (Platform.OS === 'web') {
        // RN Web Alert doesn't support button callbacks; navigate immediately
        try { alert('Workout created successfully!'); } catch {}
        // Give the alert a tick before navigating
        setTimeout(() => navigation.goBack(), 50);
      } else {
        Alert.alert('Success', 'Workout created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Save workout error:', error);
      Alert.alert('Error', error?.message || 'Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>New Workout</Text>
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSaveWorkout}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );

  const handlePickAndUploadVideo = async () => {
    try {
      setUploading(true);
      let picked;
      if (Platform.OS === 'web') {
        picked = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/*';
          const cleanup = () => { if (input && input.parentNode) input.parentNode.removeChild(input); };
          input.addEventListener('change', () => {
            try {
              const f = input.files && input.files[0];
              cleanup();
              if (!f) return reject(new Error('No file selected'));
              resolve(f);
            } catch (err) { cleanup(); reject(err); }
          });
          input.style.position = 'fixed';
          input.style.left = '-10000px';
          document.body.appendChild(input);
          input.click();
        });
      } else {
        // Dynamic import for native platforms only
        const moduleName = 'expo-document-picker';  // Variable prevents Metro static analysis
        const picker = await import(moduleName);
        const pick = await picker.getDocumentAsync({ type: 'video/*', multiple: false });
        if (pick.canceled) { setUploading(false); return; }
        const asset = pick.assets?.[0];
        picked = { uri: asset.uri, name: asset.name || 'workout.mp4', type: asset.mimeType || 'video/mp4' };
      }
      const filePart = Platform.OS === 'web' ? picked : picked; // web gets the File directly
      const res = await api.uploadFile(filePart);
      const url = res?.file?.url || res?.data?.file?.url || res?.url;
      if (!url) throw new Error('Upload did not return a URL');
      setWorkoutVideoUrl(url);
      if (Platform.OS === 'web') { try { navigator.clipboard?.writeText(url); } catch {} }
      Alert.alert('Upload complete', 'Video URL attached to this workout');
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderVideoUpload = () => (
    <View style={styles.videoUploadContainer}>
      <TouchableOpacity
        style={styles.videoUploadButton}
        onPress={handlePickAndUploadVideo}
        disabled={uploading}
      >
        <View style={styles.playIcon}>
          <Ionicons name="play" size={32} color={COLORS.text.primary} />
        </View>
        <Text style={styles.uploadVideoText}>{uploading ? 'Uploading…' : 'Upload Video'}</Text>
      </TouchableOpacity>
      {workoutVideoUrl ? (
        <View style={styles.videoRow}>
          <Ionicons name="link" size={16} color={COLORS.text.secondary} />
          <Text style={styles.videoUrl} numberOfLines={1} onPress={() => Linking.openURL(workoutVideoUrl)}>
            {workoutVideoUrl}
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderExerciseSection = (title, idx, isExpanded = false) => (
    <View style={styles.exerciseSection}>
      <TouchableOpacity style={styles.exerciseSectionHeader}>
        <Text style={styles.exerciseSectionTitle}>{title}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={COLORS.text.secondary} 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.exerciseDetails}>
          <View style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>Deadlift</Text>
          </View>
          
          <View style={styles.exerciseMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Sets</Text>
              <Text style={styles.metricValue}>9</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Reps</Text>
              <Text style={styles.metricValue}>8-1-1</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>RPE</Text>
              <Text style={styles.metricValue}>RPE</Text>
            </View>
          </View>
          
          <View style={styles.blockActionsRow}>
            <TouchableOpacity
              style={styles.blockAttachButton}
              onPress={() => handlePickAndUploadVideoForBlock(idx)}
            >
              <Ionicons name="link" size={16} color={COLORS.accent.primary} />
              <Text style={styles.blockAttachText}>{blockVideos[idx] ? 'Change Video' : 'Attach Video'}</Text>
            </TouchableOpacity>
            {blockVideos[idx] ? (
              <TouchableOpacity
                style={[styles.blockAttachButton, (coverBlockIndex === idx) && { borderColor: COLORS.accent.primary }]}
                onPress={() => setCoverBlockIndex(idx)}
              >
                <Ionicons name="image" size={16} color={COLORS.accent.primary} />
                <Text style={styles.blockAttachText}>{coverBlockIndex === idx ? 'Cover Set' : 'Set as Cover'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {blockVideos[idx] ? (
            <View style={styles.blockVideoRow}>
              <Ionicons name="videocam" size={16} color={COLORS.text.secondary} />
              <Text style={styles.blockVideoUrl} numberOfLines={1} onPress={() => Linking.openURL(blockVideos[idx])}>{blockVideos[idx]}</Text>
            </View>
          ) : null}

          <View style={styles.equipmentRow}>
            <Text style={styles.equipmentLabel}>Equipment</Text>
            <TouchableOpacity style={styles.equipmentSelector}>
              <Text style={styles.equipmentText}>Barbell</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const handleAddExercise = () => {
    const newExercise = {
      id: Date.now().toString(),
      name: '',
      sets: 1,
      reps: 1,
      weight: 0,
      restTime: 60
    };
    setExercises([...exercises, newExercise]);
  };

  // Per-block attach helper
  const handlePickAndUploadVideoForBlock = async (index) => {
    try {
      setUploading(true);
      let picked;
      if (Platform.OS === 'web') {
        picked = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/*';
          const cleanup = () => { if (input && input.parentNode) input.parentNode.removeChild(input); };
          input.addEventListener('change', () => {
            try {
              const f = input.files && input.files[0];
              cleanup();
              if (!f) return reject(new Error('No file selected'));
              resolve(f);
            } catch (err) { cleanup(); reject(err); }
          });
          input.style.position = 'fixed';
          input.style.left = '-10000px';
          document.body.appendChild(input);
          input.click();
        });
      } else {
        // Dynamic import for native platforms only
        const moduleName = 'expo-document-picker';  // Variable prevents Metro static analysis
        const picker = await import(moduleName);
        const pick = await picker.getDocumentAsync({ type: 'video/*', multiple: false });
        if (pick.canceled) { setUploading(false); return; }
        const asset = pick.assets?.[0];
        picked = { uri: asset.uri, name: asset.name || 'block-video.mp4', type: asset.mimeType || 'video/mp4' };
      }
      const filePart = Platform.OS === 'web' ? picked : picked;
      const res = await api.uploadFile(filePart);
      const url = res?.file?.url || res?.data?.file?.url || res?.url;
      if (!url) throw new Error('Upload did not return a URL');
      setBlockVideos((prev) => ({ ...prev, [index]: url }));
      // Save to client media library
      try { await addMediaItem({ url, type: 'video', name: filePart.name || 'video' }); } catch {}
      if (Platform.OS === 'web') { try { navigator.clipboard?.writeText(url); } catch {} }
      Alert.alert('Attached', 'Video attached to this block');
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderAddBlockButton = () => (
    <TouchableOpacity 
      style={styles.addBlockButton}
      onPress={handleAddExercise}
    >
      <Ionicons name="add" size={20} color={COLORS.accent.primary} />
      <Text style={styles.addBlockText}>Add Block</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderVideoUpload()}

        {/* Exercise Sections */}
        {exercises.map((exercise, index) => (
          <View key={exercise.id || index}>
            {renderExerciseSection(exercise.name || `Exercise ${index + 1}`, index, index === 0)}
          </View>
        ))}
        
        {exercises.length === 0 && (
          <View style={styles.emptyExercises}>
            <Text style={styles.emptyText}>No exercises added yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add Block" to create your first exercise</Text>
          </View>
        )}
        
        {renderAddBlockButton()}
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
  saveButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
  },
  saveButtonText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: SIZES.spacing.md,
  },
  
  // Video Upload
  videoUploadContainer: {
    marginVertical: SIZES.spacing.xl,
    alignItems: 'center',
  },
  videoUploadButton: {
    width: 200,
    height: 120,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border.primary,
    borderStyle: 'dashed',
  },
  playIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  uploadVideoText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  
  // Exercise Sections
  exerciseSection: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.md,
    ...SHADOWS.small,
  },
  exerciseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
  },
  exerciseSectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  
  // Exercise Details
  exerciseDetails: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  exerciseRow: {
    paddingVertical: SIZES.spacing.sm,
  },
  exerciseName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  
  // Exercise Metrics
  exerciseMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.spacing.md,
    marginVertical: SIZES.spacing.sm,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.spacing.md,
  },
  blockActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.sm,
  },
  blockAttachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
  },
  blockAttachText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
  },
  blockVideoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SIZES.spacing.sm,
  },
  blockVideoUrl: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  metricValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  
  // Equipment
  equipmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.sm,
  },
  equipmentLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  equipmentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
  },
  equipmentText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    marginRight: SIZES.spacing.sm,
  },
  
  // Add Block Button
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.lg,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderStyle: 'dashed',
  },
  addBlockText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    marginLeft: SIZES.spacing.sm,
  },
  
  // Empty State
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl,
    marginVertical: SIZES.spacing.lg,
  },
  emptyText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    marginBottom: SIZES.spacing.xs,
  },
  emptySubtext: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    textAlign: 'center',
  },
});
