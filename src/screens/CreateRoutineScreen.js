import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useCreateRoutine } from '../features/workouts/hooks/useRoutines';
import { eventService } from '../services/events';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from 'react-native-toast-message';

export default function CreateRoutineScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');
  const [duration, setDuration] = useState('30');
  const [exercises, setExercises] = useState([]);
  const [errors, setErrors] = useState({});

  const createRoutineMutation = useCreateRoutine();

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Routine name is required';
    }

    if (!duration || isNaN(duration) || parseInt(duration) <= 0) {
      newErrors.duration = 'Duration must be a positive number';
    }

    if (exercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: '',
        sets: 3,
        reps: 10,
        weight: 0,
        restTime: 60,
      },
    ]);
  };

  const handleUpdateExercise = (id, field, value) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const handleRemoveExercise = (id) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before saving',
      });
      return;
    }

    const routineData = {
      name: name.trim(),
      description: description.trim(),
      difficulty,
      days: [
        {
          day: 1,
          exercises: exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restTime: ex.restTime,
          })),
        },
      ],
    };

    try {
      await createRoutineMutation.mutateAsync(routineData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Routine created successfully!',
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Create routine error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to create routine',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Routine</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Input
            label="Routine Name"
            placeholder="Enter routine name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />

          <Input
            label="Description (Optional)"
            placeholder="Describe your routine"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ marginTop: SIZES.spacing.md }}
          />

          <Input
            label="Duration (minutes)"
            placeholder="30"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            error={errors.duration}
            style={{ marginTop: SIZES.spacing.md }}
          />
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty Level</Text>
          <View style={styles.difficultyButtons}>
            {difficulties.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  difficulty === level && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty(level)}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    difficulty === level && styles.difficultyTextActive,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            <TouchableOpacity onPress={handleAddExercise} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color={COLORS.accent.primary} />
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {errors.exercises && (
            <Text style={styles.errorText}>{errors.exercises}</Text>
          )}

          {exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>Exercise {index + 1}</Text>
                <TouchableOpacity onPress={() => handleRemoveExercise(exercise.id)}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.accent.error} />
                </TouchableOpacity>
              </View>

              <Input
                placeholder="Exercise name"
                value={exercise.name}
                onChangeText={(value) => handleUpdateExercise(exercise.id, 'name', value)}
              />

              <View style={styles.exerciseRow}>
                <View style={{ flex: 1, marginRight: SIZES.spacing.sm }}>
                  <Input
                    label="Sets"
                    placeholder="3"
                    value={String(exercise.sets)}
                    onChangeText={(value) =>
                      handleUpdateExercise(exercise.id, 'sets', parseInt(value) || 0)
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: SIZES.spacing.sm }}>
                  <Input
                    label="Reps"
                    placeholder="10"
                    value={String(exercise.reps)}
                    onChangeText={(value) =>
                      handleUpdateExercise(exercise.id, 'reps', parseInt(value) || 0)
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.exerciseRow}>
                <View style={{ flex: 1, marginRight: SIZES.spacing.sm }}>
                  <Input
                    label="Weight (kg)"
                    placeholder="0"
                    value={String(exercise.weight)}
                    onChangeText={(value) =>
                      handleUpdateExercise(exercise.id, 'weight', parseFloat(value) || 0)
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: SIZES.spacing.sm }}>
                  <Input
                    label="Rest (sec)"
                    placeholder="60"
                    value={String(exercise.restTime)}
                    onChangeText={(value) =>
                      handleUpdateExercise(exercise.id, 'restTime', parseInt(value) || 0)
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          ))}

          {exercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Ionicons name="fitness-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyText}>No exercises added yet</Text>
              <Text style={styles.emptySubtext}>Tap "Add Exercise" to get started</Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <Button
          label={createRoutineMutation.isPending ? 'Saving...' : 'Save Routine'}
          onPress={handleSave}
          disabled={createRoutineMutation.isPending}
          style={styles.saveButton}
        />
      </ScrollView>

      <Toast />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    padding: SIZES.spacing.xs,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  content: {
    padding: SIZES.spacing.lg,
  },
  section: {
    marginBottom: SIZES.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.md,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: COLORS.accent.primary,
  },
  difficultyText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  difficultyTextActive: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    color: COLORS.accent.primary,
    marginLeft: SIZES.spacing.xs,
  },
  exerciseCard: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    ...SHADOWS.small,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  exerciseNumber: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  exerciseRow: {
    flexDirection: 'row',
    marginTop: SIZES.spacing.md,
  },
  emptyExercises: {
    alignItems: 'center',
    padding: SIZES.spacing.xxl,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
  },
  emptyText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.md,
  },
  emptySubtext: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginTop: SIZES.spacing.xs,
  },
  saveButton: {
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xl,
  },
  errorText: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent.error,
    marginBottom: SIZES.spacing.sm,
  },
});

