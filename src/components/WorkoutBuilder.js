import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { createWorkout, fetchExercises } from '../store/slices/workoutSlice';
import Button from './Button';
import Input from './Input';
import Card from './Card';

const WorkoutBuilder = () => {
  const dispatch = useDispatch();
  const { exercises, loading, error } = useSelector(state => state.workout);
  const { user } = useSelector(state => state.auth);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutType, setWorkoutType] = useState('strength');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');

  const workoutTypes = [
    { key: 'strength', label: 'Strength', icon: 'barbell' },
    { key: 'cardio', label: 'Cardio', icon: 'fitness' },
    { key: 'flexibility', label: 'Flexibility', icon: 'body' },
    { key: 'hiit', label: 'HIIT', icon: 'flash' },
    { key: 'yoga', label: 'Yoga', icon: 'leaf' }
  ];

  const muscleGroups = [
    { key: 'all', label: 'All Muscles' },
    { key: 'chest', label: 'Chest' },
    { key: 'back', label: 'Back' },
    { key: 'shoulders', label: 'Shoulders' },
    { key: 'arms', label: 'Arms' },
    { key: 'legs', label: 'Legs' },
    { key: 'core', label: 'Core' },
    { key: 'fullbody', label: 'Full Body' }
  ];

  useEffect(() => {
    dispatch(fetchExercises());
  }, [dispatch]);

  const handleAddExercise = (exercise) => {
    const exerciseWithSets = {
      ...exercise,
      sets: [
        { reps: 10, weight: 0, rest: 60 }
      ]
    };
    setSelectedExercises([...selectedExercises, exerciseWithSets]);
    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (index) => {
    const updatedExercises = selectedExercises.filter((_, i) => i !== index);
    setSelectedExercises(updatedExercises);
  };

  const handleUpdateSet = (exerciseIndex, setIndex, field, value) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    setSelectedExercises(updatedExercises);
  };

  const handleAddSet = (exerciseIndex) => {
    const updatedExercises = [...selectedExercises];
    const lastSet = updatedExercises[exerciseIndex].sets[updatedExercises[exerciseIndex].sets.length - 1];
    updatedExercises[exerciseIndex].sets.push({
      reps: lastSet.reps,
      weight: lastSet.weight,
      rest: lastSet.rest
    });
    setSelectedExercises(updatedExercises);
  };

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    const updatedExercises = [...selectedExercises];
    if (updatedExercises[exerciseIndex].sets.length > 1) {
      updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
      setSelectedExercises(updatedExercises);
    }
  };

  const handleSaveWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const workoutData = {
      userId: user.id,
      name: workoutName.trim(),
      type: workoutType,
      exercises: selectedExercises,
      estimatedDuration: calculateEstimatedDuration(),
      difficulty: calculateDifficulty(),
      createdAt: new Date().toISOString()
    };

    dispatch(createWorkout(workoutData));
    resetForm();
    Alert.alert('Success', 'Workout created successfully!');
  };

  const resetForm = () => {
    setWorkoutName('');
    setWorkoutType('strength');
    setSelectedExercises([]);
  };

  const calculateEstimatedDuration = () => {
    let totalTime = 0;
    selectedExercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        totalTime += set.rest || 60; // Rest time
        totalTime += 30; // Exercise time
      });
    });
    return Math.ceil(totalTime / 60); // Convert to minutes
  };

  const calculateDifficulty = () => {
    if (selectedExercises.length === 0) return 'beginner';
    
    const totalSets = selectedExercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const avgWeight = selectedExercises.reduce((sum, exercise) => {
      const exerciseWeight = exercise.sets.reduce((setSum, set) => setSum + (set.weight || 0), 0);
      return sum + exerciseWeight;
    }, 0) / totalSets;

    if (totalSets > 20 || avgWeight > 100) return 'expert';
    if (totalSets > 15 || avgWeight > 50) return 'advanced';
    if (totalSets > 10 || avgWeight > 20) return 'intermediate';
    return 'beginner';
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscleGroup === 'all' || exercise.muscleGroups.includes(selectedMuscleGroup);
    return matchesSearch && matchesMuscle;
  });

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => handleAddExercise(item)}
    >
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMuscles}>{item.muscleGroups.join(', ')}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color={COLORS.accent.primary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Workout Details Card */}
      <Card style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Workout Details</Text>
        
        <Input
          label="Workout Name"
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Enter workout name"
        />

        <Text style={styles.label}>Workout Type</Text>
        <View style={styles.typeContainer}>
          {workoutTypes.map(type => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeButton,
                workoutType === type.key && styles.selectedTypeButton
              ]}
              onPress={() => setWorkoutType(type.key)}
            >
              <Ionicons 
                name={type.icon} 
                size={20} 
                color={workoutType === type.key ? COLORS.white : COLORS.text.primary} 
              />
              <Text style={[
                styles.typeButtonText,
                workoutType === type.key && styles.selectedTypeButtonText
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Exercises</Text>
            <Text style={styles.statValue}>{selectedExercises.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{calculateEstimatedDuration()} min</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Difficulty</Text>
            <Text style={styles.statValue}>{calculateDifficulty()}</Text>
          </View>
        </View>
      </Card>

      {/* Selected Exercises */}
      {selectedExercises.length > 0 && (
        <Card style={styles.exercisesCard}>
          <Text style={styles.sectionTitle}>Selected Exercises</Text>
          
          {selectedExercises.map((exercise, exerciseIndex) => (
            <View key={exerciseIndex} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveExercise(exerciseIndex)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>

              {exercise.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                  
                  <Input
                    value={set.reps.toString()}
                    onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'reps', parseInt(value) || 0)}
                    placeholder="Reps"
                    keyboardType="numeric"
                    style={styles.setInput}
                  />
                  
                  <Input
                    value={set.weight.toString()}
                    onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'weight', parseFloat(value) || 0)}
                    placeholder="Weight"
                    keyboardType="numeric"
                    style={styles.setInput}
                  />
                  
                  <Input
                    value={set.rest.toString()}
                    onChangeText={(value) => handleUpdateSet(exerciseIndex, setIndex, 'rest', parseInt(value) || 0)}
                    placeholder="Rest (s)"
                    keyboardType="numeric"
                    style={styles.setInput}
                  />

                  {exercise.sets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveSet(exerciseIndex, setIndex)}
                      style={styles.removeSetButton}
                    >
                      <Ionicons name="remove" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                onPress={() => handleAddSet(exerciseIndex)}
                style={styles.addSetButton}
              >
                <Ionicons name="add" size={16} color={COLORS.accent.primary} />
                <Text style={styles.addSetText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}

      {/* Add Exercise Button */}
      <TouchableOpacity
        style={styles.addExerciseButton}
        onPress={() => setShowExerciseModal(true)}
      >
        <Ionicons name="add" size={24} color={COLORS.white} />
        <Text style={styles.addExerciseText}>Add Exercise</Text>
      </TouchableOpacity>

      {/* Save Workout Button */}
      {selectedExercises.length > 0 && (
        <Button
          title="Save Workout"
          onPress={handleSaveWorkout}
          style={styles.saveButton}
        />
      )}

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exercise</Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              style={styles.searchInput}
            />

            <Text style={styles.label}>Muscle Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleGroupContainer}>
              {muscleGroups.map(group => (
                <TouchableOpacity
                  key={group.key}
                  style={[
                    styles.muscleGroupButton,
                    selectedMuscleGroup === group.key && styles.selectedMuscleGroupButton
                  ]}
                  onPress={() => setSelectedMuscleGroup(group.key)}
                >
                  <Text style={[
                    styles.muscleGroupText,
                    selectedMuscleGroup === group.key && styles.selectedMuscleGroupText
                  ]}>
                    {group.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={filteredExercises}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  detailsCard: {
    margin: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  selectedTypeButton: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  selectedTypeButtonText: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  exercisesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
  },
  exerciseCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  removeButton: {
    padding: 4,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    fontSize: 14,
    color: COLORS.text.secondary,
    width: 50,
  },
  setInput: {
    flex: 1,
    height: 40,
  },
  removeSetButton: {
    padding: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
    borderRadius: 4,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 14,
    color: COLORS.accent.primary,
    marginLeft: 4,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 8,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  saveButton: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  searchInput: {
    marginBottom: 16,
  },
  muscleGroupContainer: {
    marginBottom: 16,
  },
  muscleGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  selectedMuscleGroupButton: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  muscleGroupText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  selectedMuscleGroupText: {
    color: COLORS.white,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  exerciseMuscles: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});

export default WorkoutBuilder;
