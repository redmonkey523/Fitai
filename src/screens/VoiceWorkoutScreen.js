import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

// Import components
import VoiceGuidedWorkout from '../components/VoiceGuidedWorkout';
import Card from '../components/Card';
import Button from '../components/Button';

const VoiceWorkoutScreen = () => {
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Mock workout data
  const availableWorkouts = [
    {
      id: '1',
      title: 'Quick HIIT Blast',
      duration: 20,
      difficulty: 'Intermediate',
      exercises: [
        { name: 'Jumping Jacks', duration: 300, instructions: 'Start with feet together, jump to spread legs and raise arms' },
        { name: 'Mountain Climbers', duration: 300, instructions: 'In plank position, alternate bringing knees to chest' },
        { name: 'Burpees', duration: 240, instructions: 'Squat, jump back to plank, do push-up, jump forward, jump up' },
        { name: 'High Knees', duration: 300, instructions: 'Run in place, bringing knees up to waist level' },
        { name: 'Plank Hold', duration: 300, instructions: 'Hold plank position with straight body line' }
      ],
      estimatedCalories: 180
    },
    {
      id: '2',
      title: 'Strength Builder',
      duration: 35,
      difficulty: 'Beginner',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 10, rest: 60, instructions: 'Lower body to ground, push back up' },
        { name: 'Squats', sets: 3, reps: 15, rest: 60, instructions: 'Lower body as if sitting back, keep chest up' },
        { name: 'Lunges', sets: 3, reps: 12, rest: 60, instructions: 'Step forward, lower back knee toward ground' },
        { name: 'Plank', sets: 3, duration: 30, rest: 45, instructions: 'Hold body in straight line from head to heels' },
        { name: 'Glute Bridges', sets: 3, reps: 15, rest: 60, instructions: 'Lie on back, lift hips up and down' }
      ],
      estimatedCalories: 220
    },
    {
      id: '3',
      title: 'Yoga Flow',
      duration: 45,
      difficulty: 'Beginner',
      exercises: [
        { name: 'Sun Salutation A', duration: 300, instructions: 'Flow through basic yoga sequence' },
        { name: 'Warrior Sequence', duration: 600, instructions: 'Hold warrior poses for strength and balance' },
        { name: 'Balance Poses', duration: 300, instructions: 'Practice tree pose and other balance poses' },
        { name: 'Cool Down Stretches', duration: 300, instructions: 'Gentle stretching to relax muscles' }
      ],
      estimatedCalories: 150
    }
  ];

  const handleWorkoutComplete = () => {
    setSelectedWorkout(null);
    // In a real app, you'd save the workout data
    console.log('Workout completed!');
  };

  const handleWorkoutPause = (isPaused) => {
    console.log('Workout paused:', isPaused);
  };

  if (selectedWorkout) {
    return (
      <VoiceGuidedWorkout
        workout={selectedWorkout}
        onComplete={handleWorkoutComplete}
        onPause={handleWorkoutPause}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[COLORS.background.secondary, COLORS.background.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Voice-Guided Workouts</Text>
        <Text style={styles.headerSubtitle}>
          Hands-free workouts with audio instructions
        </Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Feature Introduction */}
        <View style={styles.section}>
          <Card type="primary" style={styles.introCard}>
            <View style={styles.introContent}>
              <Text style={styles.introTitle}>🎤 Voice-Guided Experience</Text>
              <Text style={styles.introDescription}>
                Get real-time audio instructions during your workouts. Perfect for hands-free training and maintaining proper form.
              </Text>
              
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Audio exercise instructions</Text>
                <Text style={styles.featureItem}>• Timer announcements</Text>
                <Text style={styles.featureItem}>• Form reminders</Text>
                <Text style={styles.featureItem}>• Motivational cues</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Available Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Workouts</Text>
          <View style={styles.workoutsContainer}>
            {availableWorkouts.map((workout) => (
              <Card
                key={workout.id}
                type="workout"
                title={workout.title}
                subtitle={`${workout.duration} min • ${workout.difficulty}`}
                onPress={() => setSelectedWorkout(workout)}
                style={styles.workoutCard}
              >
                <View style={styles.workoutCardContent}>
                  <Text style={styles.workoutDescription}>
                    {workout.exercises.length} exercises with voice guidance
                  </Text>
                  
                  <View style={styles.workoutStats}>
                    <Text style={styles.workoutStat}>
                      ⏱️ {workout.duration} min
                    </Text>
                    <Text style={styles.workoutStat}>
                      💪 {workout.estimatedCalories} cal
                    </Text>
                    <Text style={styles.workoutStat}>
                      🎤 Voice-guided
                    </Text>
                  </View>
                  
                  <Button
                    type="workout"
                    label="START WITH VOICE"
                    onPress={() => setSelectedWorkout(workout)}
                    style={styles.startButton}
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Voice Settings */}
        <View style={styles.section}>
          <Card title="Voice Settings" style={styles.settingsCard}>
            <View style={styles.settingsContent}>
              <Text style={styles.settingsDescription}>
                Customize your voice-guided workout experience
              </Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Voice Instructions</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Timer Announcements</Text>
                <Text style={styles.settingValue}>Every 30 seconds</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Form Reminders</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Motivational Cues</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
              
              <Button
                type="outline"
                label="CUSTOMIZE SETTINGS"
                onPress={() => {}}
                style={styles.settingsButton}
              />
            </View>
          </Card>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Card type="secondary" style={styles.tipsCard}>
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>💡 Voice Workout Tips</Text>
              
              <View style={styles.tipItem}>
                <Text style={styles.tipNumber}>1</Text>
                <Text style={styles.tipText}>
                  Ensure your device volume is at a comfortable level
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Text style={styles.tipNumber}>2</Text>
                <Text style={styles.tipText}>
                  Use headphones for the best audio experience
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Text style={styles.tipNumber}>3</Text>
                <Text style={styles.tipText}>
                  You can pause or stop the workout at any time
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Text style={styles.tipNumber}>4</Text>
                <Text style={styles.tipText}>
                  Follow the voice instructions for proper form
                </Text>
              </View>
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
  headerSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.md,
  },
  introCard: {
    marginBottom: SIZES.spacing.lg,
  },
  introContent: {
    paddingVertical: SIZES.spacing.sm,
  },
  introTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  introDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    lineHeight: 22,
    marginBottom: SIZES.spacing.md,
  },
  featureList: {
    marginTop: SIZES.spacing.sm,
  },
  featureItem: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  workoutsContainer: {
    marginTop: SIZES.spacing.sm,
  },
  workoutCard: {
    marginBottom: SIZES.spacing.md,
  },
  workoutCardContent: {
    paddingVertical: SIZES.spacing.sm,
  },
  workoutDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.md,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.md,
  },
  workoutStat: {
    color: COLORS.accent.secondary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
  },
  startButton: {
    marginTop: SIZES.spacing.sm,
  },
  settingsCard: {
    marginBottom: SIZES.spacing.lg,
  },
  settingsContent: {
    paddingVertical: SIZES.spacing.sm,
  },
  settingsDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  settingLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
  },
  settingValue: {
    color: COLORS.accent.secondary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  settingsButton: {
    marginTop: SIZES.spacing.md,
  },
  tipsCard: {
    marginBottom: SIZES.spacing.lg,
  },
  tipsContent: {
    paddingVertical: SIZES.spacing.sm,
  },
  tipsTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.spacing.md,
  },
  tipNumber: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginRight: SIZES.spacing.sm,
    minWidth: 20,
  },
  tipText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    flex: 1,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 80,
  },
});

export default VoiceWorkoutScreen;
