// AI Workout Recommendation System
// This system analyzes user data to provide personalized workout suggestions

export class AIWorkoutRecommender {
  constructor() {
    this.userProfile = null;
    this.workoutHistory = [];
    this.fitnessGoals = [];
    this.preferences = {};
  }

  // Initialize user profile
  initializeUser(userData) {
    this.userProfile = {
      fitnessLevel: userData.fitnessLevel || 'beginner', // beginner, intermediate, advanced
      age: userData.age || 25,
      weight: userData.weight || 70,
      height: userData.height || 170,
      goals: userData.goals || ['general_fitness'], // weight_loss, muscle_gain, endurance, strength
      availableTime: userData.availableTime || 30, // minutes
      availableEquipment: userData.availableEquipment || ['bodyweight'], // bodyweight, dumbbells, gym
      injuries: userData.injuries || [],
      preferences: userData.preferences || {
        workoutTypes: ['strength', 'cardio', 'flexibility'],
        intensity: 'moderate',
        musicPreference: 'upbeat'
      }
    };
  }

  // Add workout to history
  addWorkoutToHistory(workout) {
    this.workoutHistory.push({
      ...workout,
      timestamp: new Date(),
      completionRate: workout.completionRate || 1.0,
      difficulty: workout.difficulty || 'moderate',
      enjoyment: workout.enjoyment || 3 // 1-5 scale
    });
  }

  // Analyze user patterns
  analyzeUserPatterns() {
    const recentWorkouts = this.workoutHistory.slice(-10);
    
    const analysis = {
      preferredWorkoutTypes: this.getPreferredWorkoutTypes(recentWorkouts),
      optimalWorkoutDuration: this.getOptimalDuration(recentWorkouts),
      bestTimeOfDay: this.getBestTimeOfDay(recentWorkouts),
      recoveryPattern: this.getRecoveryPattern(recentWorkouts),
      progressTrend: this.getProgressTrend(recentWorkouts)
    };

    return analysis;
  }

  // Get preferred workout types based on completion and enjoyment
  getPreferredWorkoutTypes(workouts) {
    const typeStats = {};
    
    workouts.forEach(workout => {
      if (!typeStats[workout.type]) {
        typeStats[workout.type] = { count: 0, totalEnjoyment: 0, completionRate: 0 };
      }
      typeStats[workout.type].count++;
      typeStats[workout.type].totalEnjoyment += workout.enjoyment;
      typeStats[workout.type].completionRate += workout.completionRate;
    });

    // Calculate averages and sort by preference score
    const preferences = Object.entries(typeStats).map(([type, stats]) => ({
      type,
      preferenceScore: (stats.totalEnjoyment / stats.count) * (stats.completionRate / stats.count)
    }));

    return preferences.sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  // Get optimal workout duration
  getOptimalDuration(workouts) {
    const completedWorkouts = workouts.filter(w => w.completionRate > 0.8);
    if (completedWorkouts.length === 0) return 30;

    const avgDuration = completedWorkouts.reduce((sum, w) => sum + w.duration, 0) / completedWorkouts.length;
    return Math.round(avgDuration);
  }

  // Get best time of day for workouts
  getBestTimeOfDay(workouts) {
    const timeStats = { morning: 0, afternoon: 0, evening: 0 };
    
    workouts.forEach(workout => {
      const hour = new Date(workout.timestamp).getHours();
      if (hour < 12) timeStats.morning += workout.completionRate;
      else if (hour < 17) timeStats.afternoon += workout.completionRate;
      else timeStats.evening += workout.completionRate;
    });

    return Object.entries(timeStats).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  // Get recovery pattern
  getRecoveryPattern(workouts) {
    if (workouts.length < 2) return 'standard';
    
    const intervals = [];
    for (let i = 1; i < workouts.length; i++) {
      const interval = (workouts[i].timestamp - workouts[i-1].timestamp) / (1000 * 60 * 60 * 24); // days
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    if (avgInterval < 1) return 'high_frequency';
    if (avgInterval < 2) return 'moderate_frequency';
    return 'low_frequency';
  }

  // Get progress trend
  getProgressTrend(workouts) {
    if (workouts.length < 3) return 'insufficient_data';
    
    const recent = workouts.slice(-3);
    const older = workouts.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, w) => sum + w.completionRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, w) => sum + w.completionRate, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.1) return 'improving';
    if (recentAvg < olderAvg * 0.9) return 'declining';
    return 'stable';
  }

  // Generate personalized workout recommendations
  generateRecommendations() {
    const analysis = this.analyzeUserPatterns();
    const recommendations = [];

    // Generate 3-5 workout recommendations
    const numRecommendations = Math.min(5, Math.max(3, this.userProfile.availableTime / 10));

    for (let i = 0; i < numRecommendations; i++) {
      const recommendation = this.createWorkoutRecommendation(analysis, i);
      recommendations.push(recommendation);
    }

    return {
      recommendations,
      analysis,
      confidence: this.calculateConfidence(analysis)
    };
  }

  // Create individual workout recommendation
  createWorkoutRecommendation(analysis, index) {
    const workoutTypes = ['strength', 'cardio', 'flexibility', 'hiit', 'yoga'];
    const selectedType = analysis.preferredWorkoutTypes[index % analysis.preferredWorkoutTypes.length]?.type || 
                        workoutTypes[index % workoutTypes.length];

    const duration = this.calculateOptimalDuration(analysis, selectedType);
    const intensity = this.calculateIntensity(analysis, selectedType);
    const exercises = this.getExercisesForType(selectedType, duration, intensity);

    return {
      id: `rec_${Date.now()}_${index}`,
      type: selectedType,
      title: this.generateWorkoutTitle(selectedType, intensity),
      duration: duration,
      intensity: intensity,
      exercises: exercises,
      reason: this.generateReason(analysis, selectedType),
      estimatedCalories: this.estimateCalories(duration, intensity),
      difficulty: this.calculateDifficulty(intensity),
      equipment: this.getRequiredEquipment(selectedType),
      tags: this.generateTags(selectedType, intensity)
    };
  }

  // Calculate optimal duration based on type and user patterns
  calculateOptimalDuration(analysis, workoutType) {
    const baseDuration = analysis.optimalWorkoutDuration;
    
    switch (workoutType) {
      case 'hiit':
        return Math.min(baseDuration, 25); // HIIT should be shorter
      case 'yoga':
        return Math.max(baseDuration, 45); // Yoga benefits from longer sessions
      case 'strength':
        return Math.max(baseDuration, 40); // Strength training needs more time
      default:
        return baseDuration;
    }
  }

  // Calculate intensity based on user patterns and goals
  calculateIntensity(analysis, workoutType) {
    let baseIntensity = 'moderate';
    
    if (analysis.progressTrend === 'improving') {
      baseIntensity = 'high';
    } else if (analysis.progressTrend === 'declining') {
      baseIntensity = 'low';
    }

    // Adjust based on recovery pattern
    if (analysis.recoveryPattern === 'high_frequency') {
      baseIntensity = 'low';
    }

    return baseIntensity;
  }

  // Get exercises for specific workout type
  getExercisesForType(type, duration, intensity) {
    const exerciseDatabase = {
      strength: [
        { name: 'Push-ups', sets: 3, reps: 10, rest: 60 },
        { name: 'Squats', sets: 3, reps: 15, rest: 60 },
        { name: 'Plank', sets: 3, duration: 30, rest: 45 },
        { name: 'Lunges', sets: 3, reps: 12, rest: 60 },
        { name: 'Dumbbell Rows', sets: 3, reps: 10, rest: 60 }
      ],
      cardio: [
        { name: 'Jumping Jacks', duration: 300, rest: 30 },
        { name: 'High Knees', duration: 300, rest: 30 },
        { name: 'Mountain Climbers', duration: 300, rest: 30 },
        { name: 'Burpees', duration: 240, rest: 60 }
      ],
      hiit: [
        { name: 'Sprint in Place', duration: 30, rest: 30, rounds: 8 },
        { name: 'Jump Squats', duration: 30, rest: 30, rounds: 8 },
        { name: 'Push-up Burpees', duration: 30, rest: 30, rounds: 6 }
      ],
      yoga: [
        { name: 'Sun Salutation A', duration: 300 },
        { name: 'Warrior Sequence', duration: 600 },
        { name: 'Balance Poses', duration: 300 },
        { name: 'Cool Down Stretches', duration: 300 }
      ],
      flexibility: [
        { name: 'Dynamic Stretching', duration: 300 },
        { name: 'Static Stretching', duration: 600 },
        { name: 'Mobility Work', duration: 300 }
      ]
    };

    return exerciseDatabase[type] || exerciseDatabase.strength;
  }

  // Generate workout title
  generateWorkoutTitle(type, intensity) {
    const titles = {
      strength: {
        low: 'Gentle Strength Builder',
        moderate: 'Balanced Strength Training',
        high: 'Power Strength Blast'
      },
      cardio: {
        low: 'Light Cardio Flow',
        moderate: 'Cardio Boost',
        high: 'Intense Cardio Burn'
      },
      hiit: {
        low: 'HIIT Starter',
        moderate: 'HIIT Power',
        high: 'HIIT Inferno'
      },
      yoga: {
        low: 'Gentle Yoga Flow',
        moderate: 'Balanced Yoga',
        high: 'Power Yoga'
      },
      flexibility: {
        low: 'Relaxing Stretch',
        moderate: 'Flexibility Flow',
        high: 'Deep Stretch'
      }
    };

    return titles[type]?.[intensity] || 'Custom Workout';
  }

  // Generate reason for recommendation
  generateReason(analysis, workoutType) {
    const reasons = {
      strength: 'Based on your strength training preferences and current progress trend',
      cardio: 'To improve your cardiovascular fitness and burn calories',
      hiit: 'For maximum efficiency and calorie burn in minimal time',
      yoga: 'To improve flexibility and reduce stress',
      flexibility: 'To enhance mobility and prevent injuries'
    };

    return reasons[workoutType] || 'Personalized recommendation based on your fitness profile';
  }

  // Estimate calories burned
  estimateCalories(duration, intensity) {
    const baseCalories = duration * 5; // Base rate of 5 calories per minute
    
    const intensityMultiplier = {
      low: 0.7,
      moderate: 1.0,
      high: 1.3
    };

    return Math.round(baseCalories * intensityMultiplier[intensity]);
  }

  // Calculate difficulty level
  calculateDifficulty(intensity) {
    const difficultyMap = {
      low: 'beginner',
      moderate: 'intermediate',
      high: 'advanced'
    };

    return difficultyMap[intensity] || 'intermediate';
  }

  // Get required equipment
  getRequiredEquipment(workoutType) {
    const equipmentMap = {
      strength: ['dumbbells', 'resistance_bands'],
      cardio: ['none'],
      hiit: ['none'],
      yoga: ['yoga_mat'],
      flexibility: ['none']
    };

    return equipmentMap[workoutType] || ['none'];
  }

  // Generate tags for workout
  generateTags(workoutType, intensity) {
    const tags = [workoutType, intensity];
    
    if (workoutType === 'strength') tags.push('muscle_building');
    if (workoutType === 'cardio') tags.push('endurance');
    if (workoutType === 'hiit') tags.push('fat_burning');
    if (workoutType === 'yoga') tags.push('mindfulness');
    if (workoutType === 'flexibility') tags.push('recovery');

    return tags;
  }

  // Calculate confidence score for recommendations
  calculateConfidence(analysis) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on data quality
    if (this.workoutHistory.length >= 10) confidence += 0.2;
    if (this.workoutHistory.length >= 20) confidence += 0.1;

    // Adjust based on consistency
    if (analysis.preferredWorkoutTypes.length > 0) confidence += 0.1;
    if (analysis.progressTrend !== 'insufficient_data') confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  // Get workout suggestions for specific goal
  getGoalBasedSuggestions(goal) {
    const goalWorkouts = {
      weight_loss: ['hiit', 'cardio', 'strength'],
      muscle_gain: ['strength', 'hiit'],
      endurance: ['cardio', 'hiit'],
      flexibility: ['yoga', 'flexibility'],
      strength: ['strength', 'hiit']
    };

    return goalWorkouts[goal] || ['strength', 'cardio'];
  }

  // Update user preferences
  updatePreferences(newPreferences) {
    this.userProfile.preferences = { ...this.userProfile.preferences, ...newPreferences };
  }

  // Get user insights
  getUserInsights() {
    const analysis = this.analyzeUserPatterns();
    
    return {
      strengths: this.identifyStrengths(analysis),
      areasForImprovement: this.identifyImprovementAreas(analysis),
      recommendations: this.generateRecommendations(),
      progressSummary: this.getProgressSummary()
    };
  }

  // Identify user strengths
  identifyStrengths(analysis) {
    const strengths = [];
    
    if (analysis.preferredWorkoutTypes.length > 0) {
      strengths.push(`Strong performance in ${analysis.preferredWorkoutTypes[0].type} workouts`);
    }
    
    if (analysis.progressTrend === 'improving') {
      strengths.push('Consistent improvement in workout performance');
    }
    
    if (analysis.recoveryPattern === 'moderate_frequency') {
      strengths.push('Good workout frequency and recovery balance');
    }

    return strengths;
  }

  // Identify areas for improvement
  identifyImprovementAreas(analysis) {
    const areas = [];
    
    if (analysis.progressTrend === 'declining') {
      areas.push('Consider reducing workout intensity to prevent burnout');
    }
    
    if (analysis.recoveryPattern === 'high_frequency') {
      areas.push('More rest days may improve performance and recovery');
    }
    
    if (analysis.preferredWorkoutTypes.length < 2) {
      areas.push('Try diversifying workout types for balanced fitness');
    }

    return areas;
  }

  // Get progress summary
  getProgressSummary() {
    if (this.workoutHistory.length === 0) {
      return 'Start your fitness journey to see progress insights';
    }

    const recentWorkouts = this.workoutHistory.slice(-7);
    const totalWorkouts = recentWorkouts.length;
    const avgCompletion = recentWorkouts.reduce((sum, w) => sum + w.completionRate, 0) / totalWorkouts;
    const totalCalories = recentWorkouts.reduce((sum, w) => sum + (w.estimatedCalories || 0), 0);

    return {
      recentWorkouts: totalWorkouts,
      avgCompletion: Math.round(avgCompletion * 100),
      totalCalories: totalCalories,
      streak: this.calculateStreak()
    };
  }

  // Calculate current workout streak
  calculateStreak() {
    if (this.workoutHistory.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = this.workoutHistory.length - 1; i >= 0; i--) {
      const workoutDate = new Date(this.workoutHistory[i].timestamp);
      workoutDate.setHours(0, 0, 0, 0);
      
      const daysDiff = (today - workoutDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

// Export singleton instance
export const aiRecommender = new AIWorkoutRecommender();
