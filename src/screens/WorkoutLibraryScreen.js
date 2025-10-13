import React, { useState, useEffect } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import api from '../services/api';
import { useRoutines, useDeleteRoutine } from '../features/workouts/hooks/useRoutines';
import { useStartWorkout } from '../features/workouts/hooks/useStartWorkout';
import Toast from 'react-native-toast-message';
import crashReporting from '../services/crashReporting';
import analyticsService from '../services/analytics';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const WorkoutLibraryScreen = () => {
  const navigation = useNavigation();
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hooks for routines
  const { data: routines = [], isLoading: routinesLoading, refetch: refetchRoutines } = useRoutines();
  const deleteRoutineMutation = useDeleteRoutine();
  const startWorkoutMutation = useStartWorkout();

  // Fetch workouts and calendar (assigned plans)
  const fetchWorkouts = async () => {
    try {
      const [workoutsRes, calendarRes] = await Promise.all([
        api.getWorkouts(),
        api.getMyCalendar().catch(() => ({ data: [] })),
      ]);

      const workoutsList =
        Array.isArray(workoutsRes.data?.data?.workouts)
          ? workoutsRes.data.data.workouts
          : Array.isArray(workoutsRes.data?.workouts)
          ? workoutsRes.data.workouts
          : Array.isArray(workoutsRes.data?.items)
          ? workoutsRes.data.items
          : Array.isArray(workoutsRes.data)
          ? workoutsRes.data
          : [];

      // Build calendar sessions list
      const calendarData = calendarRes.data || {};
      let calendarSessions = [];
      if (Array.isArray(calendarData.phases)) {
        calendarData.phases.forEach((phase, pIdx) => {
          (phase.sessions || []).forEach((session, sIdx) => {
            calendarSessions.push({
              _id: `${calendarData.planId || 'plan'}_${pIdx}_${sIdx}`,
              name: session.title || session.name || `Session ${sIdx + 1}`,
              category: session.type || 'plan',
              difficulty: calendarData.difficulty || 'intermediate',
              estimatedDuration: session.estimatedDuration || session.duration || 30,
              _isCalendar: true,
            });
          });
        });
      }

      setWorkouts([...calendarSessions, ...workoutsList]);
    } catch (error) {
      crashReporting.logError(error, { context: 'fetch_workouts' });
      setWorkouts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchWorkouts();
    refetchRoutines();
  };

  // Handle video attachment for workout demo
  const handleAttachVideo = async (workout) => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your media library to attach videos.');
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        
        Toast.show({
          type: 'info',
          text1: 'Uploading Video',
          text2: 'Please wait...',
        });

        // Upload video to server
        const uploadResult = await api.uploadFile(video);
        
        if (uploadResult && uploadResult.url) {
          // Update workout with video URL
          await api.updateWorkout(workout._id || workout.id, {
            videoUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnail
          });
          
          Toast.show({
            type: 'success',
            text1: 'Video Attached',
            text2: `Demo video added to "${workout.name || workout.title}"`,
          });
          
          // Refresh workouts list
          fetchWorkouts();
        } else {
          throw new Error('Upload did not return a URL');
        }
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'attach_workout_video' });
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Could not attach video. Please try again.',
      });
    }
  };

  const handleStartWorkout = async (routine) => {
    try {
      const session = await startWorkoutMutation.mutateAsync({
        routineId: routine.id,
        routineName: routine.name,
      });
      
      Toast.show({
        type: 'success',
        text1: 'Workout Started',
        text2: `Good luck with "${routine.name}"!`,
      });

      // Navigate to workout tracking screen (placeholder for now)
      crashReporting.log('Started workout session', 'info', { sessionId: session.id });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start workout',
      });
    }
  };

  const handleDeleteRoutine = async (routineId, routineName) => {
    try {
      await deleteRoutineMutation.mutateAsync(routineId);
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: `"${routineName}" has been deleted`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete routine',
      });
    }
  };

  // Mock data for exercise categories
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'arms', name: 'Arms' },
    { id: 'legs', name: 'Legs' },
    { id: 'core', name: 'Core' },
    { id: 'cardio', name: 'Cardio' },
    { id: 'hiit', name: 'HIIT' },
    { id: 'yoga', name: 'Yoga' },
    { id: 'stretching', name: 'Stretching' },
  ];

  // Filter workouts based on search query and active category
  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = workout.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workout.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' ||
                           workout.category === activeCategory ||
                           workout.difficulty?.toLowerCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle favorite status
  const toggleFavorite = (id) => {
    // In a real app, this would update state or call an API
    // Toggle favorite functionality
    analyticsService.logEvent('toggle_favorite', { exerciseId: id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.background.secondary, COLORS.background.primary]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Workout Library</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading your workouts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[COLORS.background.secondary, COLORS.background.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Workout Library</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.accent.primary]}
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search workouts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Categories Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory === category.id && styles.activeCategoryButton,
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === category.id && styles.activeCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workouts List */}
        <View style={styles.exercisesContainer}>
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <Card
                key={workout._id || workout.id}
                testID={`workout-card-${workout._id || workout.id}`}
                type={workout.category === 'hiit' ? 'workout' : 'default'}
                title={workout.name || workout.title}
                 subtitle={`${workout.difficulty || 'Intermediate'} • ${(workout.duration || workout.estimatedDuration || 30)} min`}
                 onPress={() => {
                   // Navigate to workout detail or start workout
                   navigation.navigate('NewWorkout', { workoutId: workout._id || workout.id });
                 }}
                style={styles.exerciseCard}
                rightAction={
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        workout.name || workout.title,
                        'Choose an action',
                        [
                          {
                            text: 'Attach Demo Video',
                            onPress: () => handleAttachVideo(workout)
                          },
                          {
                            text: 'Edit',
                            onPress: () => navigation.navigate('NewWorkout', { workoutId: workout._id || workout.id, mode: 'edit' })
                          },
                          {
                            text: 'Delete',
                            onPress: () => {
                              Alert.alert('Delete Workout', `Delete "${workout.name || workout.title}"?`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: async () => {
                                  try {
                                    await api.deleteWorkout(workout._id || workout.id);
                                    Toast.show({
                                      type: 'success',
                                      text1: 'Workout Deleted',
                                    });
                                    fetchWorkouts();
                                  } catch (error) {
                                    crashReporting.logError(error, { context: 'delete_workout' });
                                    Toast.show({
                                      type: 'error',
                                      text1: 'Delete Failed',
                                    });
                                  }
                                }}
                              ]);
                            },
                            style: 'destructive'
                          },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                    style={styles.overflowButton}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                }
              >
                <View style={styles.exerciseContent}>
                  {/* Workout thumbnail with shimmer effect */}
                  <View style={styles.videoThumbnail}>
                    {workout.thumbnailUrl ? (
                      <Image 
                        source={{ uri: workout.thumbnailUrl }} 
                        style={styles.thumbnailImage}
                      />
                    ) : (
                      <View style={styles.thumbnailShimmer}>
                        <Ionicons name="play-circle" size={48} color={COLORS.text.tertiary} />
                        <Text style={styles.thumbnailLabel}>{workout.category || 'Workout'}</Text>
                      </View>
                    )}
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color={COLORS.text.primary} />
                      <Text style={styles.durationText}>{workout.duration || workout.estimatedDuration || 30}m</Text>
                    </View>
                  </View>

                  <Text style={styles.exerciseMuscles}>
                    Category: {workout.category || 'General Fitness'}
                  </Text>

                  <Text style={styles.exerciseDescription}>
                    {workout.description || 'A great workout to improve your fitness level.'}
                  </Text>

                  <View style={styles.exerciseActions}>
                    <Button
                      type="primary"
                      label="START"
                      size="sm"
                      onPress={async () => {
                        try {
                          await startWorkoutMutation.mutateAsync({
                            routineId: workout._id || workout.id,
                            routineName: workout.name || workout.title,
                          });
                          Toast.show({
                            type: 'success',
                            text1: 'Workout Started',
                            text2: `Started: ${workout.name || workout.title}`,
                          });
                        } catch (error) {
                          console.error('Failed to start workout:', error);
                        }
                      }}
                      style={styles.actionButton}
                    />

                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => toggleFavorite(workout._id || workout.id)}
                    >
                      <View style={[
                        styles.favoriteIcon,
                        workout.isFavorite && styles.favoriteIconActive
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                {workouts.length === 0
                  ? "No workouts in your library yet. Follow some workouts from the Creator Studio to get started!"
                  : "No workouts found. Try a different search or category."
                }
              </Text>
            </View>
          )}
        </View>

        {/* Custom Routines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Routines</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateRoutine')} style={styles.createButton}>
              <Ionicons name="add-circle" size={24} color={COLORS.accent.primary} />
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>

          {routinesLoading ? (
            <ActivityIndicator size="small" color={COLORS.accent.primary} style={styles.routineLoader} />
          ) : routines.length > 0 ? (
            routines.map((routine) => (
              <Card key={routine.id} style={styles.routineCard}>
                <View style={styles.routineHeader}>
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    {routine.description && (
                      <Text style={styles.routineDescription}>{routine.description}</Text>
                    )}
                    <Text style={styles.routineDifficulty}>
                      {routine.difficulty || 'Intermediate'} • Custom Routine
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteRoutine(routine.id, routine.name)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.accent.error} />
                  </TouchableOpacity>
                </View>
                <Button
                  type="primary"
                  label="START WORKOUT"
                  onPress={() => handleStartWorkout(routine)}
                  style={styles.startButton}
                  disabled={startWorkoutMutation.isPending}
                />
              </Card>
            ))
          ) : (
            <Card type="secondary" style={styles.emptyRoutineCard}>
              <View style={styles.emptyRoutineContent}>
                <Ionicons name="fitness-outline" size={48} color={COLORS.text.tertiary} />
                <Text style={styles.emptyRoutineText}>
                  No custom routines yet
                </Text>
                <Text style={styles.emptyRoutineSubtext}>
                  Create your own workout routine to get started
                </Text>
                <Button
                  type="secondary"
                  label="CREATE ROUTINE"
                  onPress={() => navigation.navigate('CreateRoutine')}
                  style={styles.createRoutineButton}
                />
              </View>
            </Card>
          )}
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SIZES.spacing.lg,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    padding: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: SIZES.spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: SIZES.spacing.lg,
  },
  categoryButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.tertiary,
    marginRight: SIZES.spacing.sm,
  },
  activeCategoryButton: {
    backgroundColor: COLORS.accent.primary,
  },
  categoryText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  activeCategoryText: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weight.bold,
  },
  exercisesContainer: {
    padding: SIZES.spacing.lg,
    paddingTop: 0,
  },
  exerciseCard: {
    marginBottom: SIZES.spacing.md,
  },
  exerciseContent: {
    paddingVertical: SIZES.spacing.sm,
  },
  videoThumbnail: {
    height: 150,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.md,
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailShimmer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
  },
  thumbnailLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    marginTop: SIZES.spacing.xs,
    textTransform: 'uppercase',
  },
  durationBadge: {
    position: 'absolute',
    bottom: SIZES.spacing.sm,
    right: SIZES.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius.sm,
  },
  durationText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.semibold,
  },
  exerciseMuscles: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.sm,
  },
  exerciseDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.md,
  },
  exerciseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginRight: SIZES.spacing.md,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    width: 20,
    height: 20,
    borderRadius: SIZES.radius.round,
    borderWidth: 2,
    borderColor: COLORS.text.tertiary,
  },
  favoriteIconActive: {
    backgroundColor: COLORS.accent.secondary,
    borderColor: COLORS.accent.secondary,
  },
  noResultsContainer: {
    padding: SIZES.spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
  },
  section: {
    padding: SIZES.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  createButtonText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  routineLoader: {
    marginVertical: SIZES.spacing.lg,
  },
  routineCard: {
    marginBottom: SIZES.spacing.md,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.md,
  },
  routineInfo: {
    flex: 1,
    marginRight: SIZES.spacing.md,
  },
  routineName: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  routineDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.xs,
  },
  routineDifficulty: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent.primary,
    fontWeight: FONTS.weight.medium,
  },
  deleteButton: {
    padding: SIZES.spacing.xs,
  },
  startButton: {
    marginTop: SIZES.spacing.sm,
  },
  emptyRoutineCard: {
    marginBottom: SIZES.spacing.md,
  },
  emptyRoutineContent: {
    paddingVertical: SIZES.spacing.xl,
    alignItems: 'center',
  },
  emptyRoutineText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    textAlign: 'center',
    marginTop: SIZES.spacing.md,
  },
  emptyRoutineSubtext: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
    textAlign: 'center',
    marginTop: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.md,
  },
  createRoutineButton: {
    minWidth: 200,
  },
  bottomPadding: {
    height: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xl,
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
  },
});

export default WorkoutLibraryScreen;
