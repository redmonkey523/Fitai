import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

// Import components
import Card from './Card';
import Button from './Button';
import ProgressBar from './ProgressBar';

const VoiceGuidedWorkout = ({ workout, onComplete, onPause }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [workoutPhase, setWorkoutPhase] = useState('preparation'); // preparation, exercise, rest, complete
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (workout && workout.exercises) {
      initializeWorkout();
    }
  }, [workout]);

  useEffect(() => {
    if (isActive && !isPaused) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [isActive, isPaused]);

  const initializeWorkout = () => {
    const firstExercise = workout.exercises[0];
    if (firstExercise.duration) {
      setTimeRemaining(firstExercise.duration);
    }
    setWorkoutPhase('preparation');
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleExerciseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleExerciseComplete = () => {
    const currentExerciseData = workout.exercises[currentExercise];
    
    if (currentExerciseData.sets && currentSet < currentExerciseData.sets) {
      // Move to next set
      setCurrentSet(prev => prev + 1);
      setCurrentRep(1);
      if (currentExerciseData.rest) {
        setTimeRemaining(currentExerciseData.rest);
        setWorkoutPhase('rest');
        speakInstruction(`Rest for ${currentExerciseData.rest} seconds. Get ready for set ${currentSet + 1}.`);
      } else {
        startNextSet();
      }
    } else if (currentExercise < workout.exercises.length - 1) {
      // Move to next exercise
      setCurrentExercise(prev => prev + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      const nextExercise = workout.exercises[currentExercise + 1];
      if (nextExercise.duration) {
        setTimeRemaining(nextExercise.duration);
      }
      setWorkoutPhase('exercise');
      speakInstruction(`Next exercise: ${nextExercise.name}. Get ready.`);
    } else {
      // Workout complete
      setWorkoutPhase('complete');
      speakInstruction('Congratulations! Workout complete. Great job!');
      onComplete && onComplete();
    }
  };

  const startNextSet = () => {
    const currentExerciseData = workout.exercises[currentExercise];
    if (currentExerciseData.duration) {
      setTimeRemaining(currentExerciseData.duration);
    }
    setWorkoutPhase('exercise');
    speakInstruction(`Starting set ${currentSet}. ${currentExerciseData.name}.`);
  };

  const handleStart = () => {
    setIsActive(true);
    setWorkoutPhase('exercise');
    speakInstruction(`Starting workout: ${workout.title}. First exercise: ${workout.exercises[0].name}.`);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      speakInstruction('Workout paused.');
    } else {
      speakInstruction('Resuming workout.');
    }
    onPause && onPause(!isPaused);
  };

  const handleStop = () => {
    Alert.alert(
      'Stop Workout',
      'Are you sure you want to stop this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive',
          onPress: () => {
            stopTimer();
            setIsActive(false);
            setIsPaused(false);
            speakInstruction('Workout stopped.');
          }
        }
      ]
    );
  };

  const handleVoiceToggle = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      speakInstruction('Voice guidance enabled.');
    } else {
      speakInstruction('Voice guidance disabled.');
    }
  };

  const speakInstruction = (text) => {
    if (!voiceEnabled) return;
    
    // In a real app, this would use Text-to-Speech
    console.log('Voice instruction:', text);
    
    // For demo purposes, we'll use a simple alert
    // In production, you'd use expo-speech or react-native-tts
    if (__DEV__) {
      console.log('🔊', text);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentExercise = () => {
    return workout.exercises[currentExercise];
  };

  const getProgress = () => {
    const totalExercises = workout.exercises.length;
    return (currentExercise + 1) / totalExercises;
  };

  const renderPreparation = () => {
    return (
      <View style={styles.phaseContainer}>
        <Card style={styles.workoutInfoCard}>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <Text style={styles.workoutSubtitle}>
            {workout.exercises.length} exercises • {workout.duration} minutes
          </Text>
          
          <View style={styles.exercisePreview}>
            <Text style={styles.previewTitle}>Workout Preview:</Text>
            {workout.exercises.slice(0, 3).map((exercise, index) => (
              <Text key={index} style={styles.previewExercise}>
                {index + 1}. {exercise.name}
              </Text>
            ))}
            {workout.exercises.length > 3 && (
              <Text style={styles.previewMore}>
                ... and {workout.exercises.length - 3} more exercises
              </Text>
            )}
          </View>
        </Card>

        <View style={styles.controlsContainer}>
          <Button
            type="workout"
            label="START WORKOUT"
            onPress={handleStart}
            fullWidth
            style={styles.startButton}
          />
          
          <Button
            type="outline"
            label={voiceEnabled ? "DISABLE VOICE" : "ENABLE VOICE"}
            onPress={handleVoiceToggle}
            style={styles.voiceButton}
          />
        </View>
      </View>
    );
  };

  const renderExercise = () => {
    const exercise = getCurrentExercise();
    
    return (
      <View style={styles.phaseContainer}>
        {/* Timer Display */}
        <Card style={styles.timerCard}>
          <Text style={styles.timerLabel}>
            {workoutPhase === 'rest' ? 'Rest Time' : 'Exercise Time'}
          </Text>
          <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
          <ProgressBar 
            progress={1 - (timeRemaining / (exercise.duration || 60))} 
            type="workout" 
          />
        </Card>

        {/* Current Exercise */}
        <Card style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseDetails}>
            {exercise.sets ? `Set ${currentSet} of ${exercise.sets}` : 'Duration-based'}
          </Text>
          
          {exercise.reps && (
            <Text style={styles.repCounter}>
              Reps: {currentRep} / {exercise.reps}
            </Text>
          )}
          
          {exercise.instructions && (
            <Text style={styles.instructions}>{exercise.instructions}</Text>
          )}
        </Card>

        {/* Workout Progress */}
        <Card style={styles.progressCard}>
          <Text style={styles.progressLabel}>
            Exercise {currentExercise + 1} of {workout.exercises.length}
          </Text>
          <ProgressBar progress={getProgress()} type="progress" />
        </Card>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <Button
            type={isPaused ? "workout" : "outline"}
            label={isPaused ? "RESUME" : "PAUSE"}
            onPress={handlePause}
            style={styles.controlButton}
          />
          
          <Button
            type="outline"
            label="STOP"
            onPress={handleStop}
            style={styles.controlButton}
          />
        </View>
      </View>
    );
  };

  const renderComplete = () => {
    return (
      <View style={styles.phaseContainer}>
        <Card style={styles.completionCard}>
          <Text style={styles.completionTitle}>🎉 Workout Complete!</Text>
          <Text style={styles.completionSubtitle}>
            Great job completing {workout.title}
          </Text>
          
          <View style={styles.completionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.exercises.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.duration}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.estimatedCalories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>
        </Card>

        <View style={styles.controlsContainer}>
          <Button
            type="workout"
            label="SAVE WORKOUT"
            onPress={() => onComplete && onComplete()}
            fullWidth
            style={styles.saveButton}
          />
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (workoutPhase) {
      case 'preparation':
        return renderPreparation();
      case 'exercise':
      case 'rest':
        return renderExercise();
      case 'complete':
        return renderComplete();
      default:
        return renderPreparation();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  phaseContainer: {
    padding: SIZES.spacing.lg,
  },
  workoutInfoCard: {
    marginBottom: SIZES.spacing.lg,
  },
  workoutTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  workoutSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.md,
  },
  exercisePreview: {
    marginTop: SIZES.spacing.md,
  },
  previewTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  previewExercise: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  previewMore: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
    fontStyle: 'italic',
  },
  controlsContainer: {
    marginTop: SIZES.spacing.lg,
  },
  startButton: {
    marginBottom: SIZES.spacing.md,
  },
  voiceButton: {
    marginBottom: SIZES.spacing.md,
  },
  timerCard: {
    marginBottom: SIZES.spacing.lg,
    alignItems: 'center',
  },
  timerLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.sm,
  },
  timerValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  exerciseCard: {
    marginBottom: SIZES.spacing.lg,
  },
  exerciseName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  exerciseDetails: {
    color: COLORS.accent.secondary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.sm,
  },
  repCounter: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.sm,
  },
  instructions: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
  },
  progressCard: {
    marginBottom: SIZES.spacing.lg,
  },
  progressLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.sm,
  },
  controlButton: {
    marginBottom: SIZES.spacing.sm,
  },
  completionCard: {
    marginBottom: SIZES.spacing.lg,
    alignItems: 'center',
  },
  completionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  completionSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.lg,
  },
  completionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.accent.secondary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  statLabel: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
  },
  saveButton: {
    marginBottom: SIZES.spacing.md,
  },
});

export default VoiceGuidedWorkout;
