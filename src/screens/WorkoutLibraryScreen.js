import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const WorkoutLibraryScreen = () => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

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

  // Mock data for exercises
  const exercises = [
    {
      id: '1',
      name: 'Push-ups',
      category: 'arms',
      difficulty: 'Beginner',
      duration: '5 min',
      muscles: 'Chest, Triceps, Shoulders',
      description: 'A classic exercise that works your chest, triceps, and shoulders.',
      isFavorite: true,
    },
    {
      id: '2',
      name: 'Squats',
      category: 'legs',
      difficulty: 'Beginner',
      duration: '5 min',
      muscles: 'Quadriceps, Hamstrings, Glutes',
      description: 'A fundamental lower body exercise that targets multiple muscle groups.',
      isFavorite: false,
    },
    {
      id: '3',
      name: 'Plank',
      category: 'core',
      difficulty: 'Intermediate',
      duration: '3 min',
      muscles: 'Abs, Lower Back',
      description: 'An isometric core exercise that improves stability and posture.',
      isFavorite: true,
    },
    {
      id: '4',
      name: 'Burpees',
      category: 'hiit',
      difficulty: 'Advanced',
      duration: '10 min',
      muscles: 'Full Body',
      description: 'A high-intensity exercise that combines a squat, push-up, and jump.',
      isFavorite: false,
    },
    {
      id: '5',
      name: 'Downward Dog',
      category: 'yoga',
      difficulty: 'Beginner',
      duration: '5 min',
      muscles: 'Shoulders, Hamstrings, Calves',
      description: 'A yoga pose that stretches and strengthens the entire body.',
      isFavorite: false,
    },
  ];

  // Filter exercises based on search query and active category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || exercise.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle favorite status
  const toggleFavorite = (id) => {
    // In a real app, this would update state or call an API
    console.log(`Toggle favorite for exercise ${id}`);
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[COLORS.background.secondary, COLORS.background.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Workout Library</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search exercises..."
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

        {/* Exercise List */}
        <View style={styles.exercisesContainer}>
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <Card
                key={exercise.id}
                type={exercise.category === 'hiit' ? 'workout' : 'default'}
                title={exercise.name}
                subtitle={`${exercise.difficulty} • ${exercise.duration}`}
                onPress={() => {}}
                style={styles.exerciseCard}
              >
                <View style={styles.exerciseContent}>
                  {/* This would be a video thumbnail in a real app */}
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoPlaceholderText}>Video Demo</Text>
                  </View>
                  
                  <Text style={styles.exerciseMuscles}>
                    Targets: {exercise.muscles}
                  </Text>
                  
                  <Text style={styles.exerciseDescription}>
                    {exercise.description}
                  </Text>
                  
                  <View style={styles.exerciseActions}>
                    <Button
                      type="primary"
                      label="START"
                      size="sm"
                      onPress={() => {}}
                      style={styles.actionButton}
                    />
                    
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => toggleFavorite(exercise.id)}
                    >
                      <View style={[
                        styles.favoriteIcon,
                        exercise.isFavorite && styles.favoriteIconActive
                      ]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                No exercises found. Try a different search or category.
              </Text>
            </View>
          )}
        </View>

        {/* Custom Routines Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Routines</Text>
          <Card
            type="secondary"
            style={styles.createRoutineCard}
          >
            <View style={styles.createRoutineContent}>
              <Text style={styles.createRoutineText}>
                Create your own workout routine by combining exercises
              </Text>
              <Button
                type="secondary"
                label="CREATE ROUTINE"
                onPress={() => {}}
                style={styles.createRoutineButton}
              />
            </View>
          </Card>
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  videoPlaceholder: {
    height: 150,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: SIZES.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  videoPlaceholderText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
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
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  createRoutineCard: {
    marginBottom: SIZES.spacing.md,
  },
  createRoutineContent: {
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
  },
  createRoutineText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    marginBottom: SIZES.spacing.md,
  },
  createRoutineButton: {
    minWidth: 200,
  },
  bottomPadding: {
    height: 80,
  },
});

export default WorkoutLibraryScreen;
