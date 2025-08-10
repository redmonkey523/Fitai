// Smart Notification System
// Provides contextual and intelligent notifications based on user behavior and external factors

export class SmartNotificationSystem {
  constructor() {
    this.userPreferences = {
      workoutReminders: true,
      nutritionReminders: true,
      hydrationReminders: true,
      progressReminders: true,
      socialReminders: true,
      quietHours: { start: 22, end: 7 }, // 10 PM to 7 AM
      timezone: 'local'
    };
    
    this.notificationHistory = [];
    this.userBehavior = {
      workoutTimes: [],
      mealTimes: [],
      responseRates: {},
      lastActive: null
    };
  }

  // Initialize notification system
  initialize(userData) {
    this.userPreferences = { ...this.userPreferences, ...userData.preferences };
    this.userBehavior = { ...this.userBehavior, ...userData.behavior };
  }

  // Check if it's quiet hours
  isQuietHours() {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = this.userPreferences.quietHours;
    
    if (start > end) {
      // Quiet hours span midnight (e.g., 10 PM to 7 AM)
      return currentHour >= start || currentHour < end;
    } else {
      // Quiet hours within same day
      return currentHour >= start && currentHour < end;
    }
  }

  // Generate contextual workout reminders
  generateWorkoutReminders() {
    if (!this.userPreferences.workoutReminders || this.isQuietHours()) {
      return [];
    }

    const reminders = [];
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay();

    // Analyze user's workout patterns
    const workoutPatterns = this.analyzeWorkoutPatterns();
    
    // Check if user typically works out on this day
    const typicalWorkoutDay = workoutPatterns.daysOfWeek.includes(dayOfWeek);
    const typicalWorkoutTime = this.isTypicalWorkoutTime(currentHour, workoutPatterns);
    
    // Generate appropriate reminders
    if (typicalWorkoutDay && typicalWorkoutTime) {
      reminders.push({
        id: `workout_${Date.now()}`,
        type: 'workout',
        title: 'Time for Your Workout! 💪',
        message: this.generateWorkoutMessage(workoutPatterns),
        priority: 'high',
        action: 'start_workout',
        data: { suggestedWorkout: this.getSuggestedWorkout() }
      });
    } else if (this.shouldEncourageWorkout(workoutPatterns)) {
      reminders.push({
        id: `workout_encourage_${Date.now()}`,
        type: 'workout',
        title: 'Ready for a Quick Workout?',
        message: 'Even 10 minutes can make a difference!',
        priority: 'medium',
        action: 'suggest_workout',
        data: { quickWorkout: true }
      });
    }

    return reminders;
  }

  // Generate nutrition reminders
  generateNutritionReminders() {
    if (!this.userPreferences.nutritionReminders || this.isQuietHours()) {
      return [];
    }

    const reminders = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Meal timing reminders
    const mealTimes = this.analyzeMealPatterns();
    
    if (currentHour >= 7 && currentHour <= 9 && !this.hasLoggedMeal('breakfast')) {
      reminders.push({
        id: `nutrition_breakfast_${Date.now()}`,
        type: 'nutrition',
        title: 'Breakfast Time! 🍳',
        message: 'Start your day with a healthy breakfast to fuel your metabolism.',
        priority: 'medium',
        action: 'log_meal',
        data: { mealType: 'breakfast' }
      });
    }
    
    if (currentHour >= 12 && currentHour <= 14 && !this.hasLoggedMeal('lunch')) {
      reminders.push({
        id: `nutrition_lunch_${Date.now()}`,
        type: 'nutrition',
        title: 'Lunch Break! 🥗',
        message: 'Time to refuel with a balanced lunch.',
        priority: 'medium',
        action: 'log_meal',
        data: { mealType: 'lunch' }
      });
    }
    
    if (currentHour >= 18 && currentHour <= 20 && !this.hasLoggedMeal('dinner')) {
      reminders.push({
        id: `nutrition_dinner_${Date.now()}`,
        type: 'nutrition',
        title: 'Dinner Time! 🍽️',
        message: 'Complete your day with a nutritious dinner.',
        priority: 'medium',
        action: 'log_meal',
        data: { mealType: 'dinner' }
      });
    }

    return reminders;
  }

  // Generate hydration reminders
  generateHydrationReminders() {
    if (!this.userPreferences.hydrationReminders || this.isQuietHours()) {
      return [];
    }

    const reminders = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check if user needs hydration reminder
    const lastHydration = this.getLastHydrationLog();
    const hoursSinceLastHydration = lastHydration ? 
      (now - lastHydration) / (1000 * 60 * 60) : 24;
    
    if (hoursSinceLastHydration >= 2) {
      reminders.push({
        id: `hydration_${Date.now()}`,
        type: 'hydration',
        title: 'Stay Hydrated! 💧',
        message: this.generateHydrationMessage(hoursSinceLastHydration),
        priority: 'medium',
        action: 'log_water',
        data: { suggestedAmount: 250 } // ml
      });
    }

    return reminders;
  }

  // Generate progress reminders
  generateProgressReminders() {
    if (!this.userPreferences.progressReminders || this.isQuietHours()) {
      return [];
    }

    const reminders = [];
    const progressData = this.getProgressData();
    
    // Weekly progress summary
    if (this.shouldShowWeeklySummary()) {
      reminders.push({
        id: `progress_weekly_${Date.now()}`,
        type: 'progress',
        title: 'Weekly Progress Summary 📊',
        message: this.generateWeeklySummaryMessage(progressData),
        priority: 'low',
        action: 'view_progress',
        data: { period: 'weekly' }
      });
    }
    
    // Streak maintenance
    if (this.shouldEncourageStreak()) {
      reminders.push({
        id: `progress_streak_${Date.now()}`,
        type: 'progress',
        title: 'Maintain Your Streak! 🔥',
        message: `You're on a ${progressData.currentStreak}-day workout streak!`,
        priority: 'medium',
        action: 'start_workout',
        data: { streakMotivation: true }
      });
    }

    return reminders;
  }

  // Generate social reminders
  generateSocialReminders() {
    if (!this.userPreferences.socialReminders || this.isQuietHours()) {
      return [];
    }

    const reminders = [];
    const socialData = this.getSocialData();
    
    // Challenge check-ins
    if (this.hasActiveChallenges()) {
      reminders.push({
        id: `social_challenge_${Date.now()}`,
        type: 'social',
        title: 'Challenge Check-in! 🎯',
        message: 'Don\'t forget to check in for your active challenges.',
        priority: 'medium',
        action: 'view_challenges',
        data: { activeChallenges: true }
      });
    }
    
    // Friend activity
    if (this.hasFriendActivity()) {
      reminders.push({
        id: `social_friends_${Date.now()}`,
        type: 'social',
        title: 'Friends Are Active! 👥',
        message: 'Your friends have been working out. Join the motivation!',
        priority: 'low',
        action: 'view_social',
        data: { friendActivity: true }
      });
    }

    return reminders;
  }

  // Generate all notifications
  generateAllNotifications() {
    const notifications = [
      ...this.generateWorkoutReminders(),
      ...this.generateNutritionReminders(),
      ...this.generateHydrationReminders(),
      ...this.generateProgressReminders(),
      ...this.generateSocialReminders()
    ];

    // Sort by priority and remove duplicates
    return this.deduplicateAndSort(notifications);
  }

  // Analyze workout patterns
  analyzeWorkoutPatterns() {
    const workouts = this.userBehavior.workoutTimes;
    
    if (workouts.length === 0) {
      return {
        daysOfWeek: [1, 3, 5], // Default: Mon, Wed, Fri
        preferredHours: [6, 18], // Default: 6 AM and 6 PM
        frequency: 'moderate'
      };
    }

    const daysOfWeek = [...new Set(workouts.map(w => new Date(w).getDay()))];
    const hours = workouts.map(w => new Date(w).getHours());
    const preferredHours = this.getMostCommonHours(hours);
    
    const frequency = this.calculateWorkoutFrequency(workouts);

    return {
      daysOfWeek,
      preferredHours,
      frequency
    };
  }

  // Analyze meal patterns
  analyzeMealPatterns() {
    const meals = this.userBehavior.mealTimes;
    
    if (meals.length === 0) {
      return {
        breakfast: '08:00',
        lunch: '12:30',
        dinner: '19:00'
      };
    }

    // Group meals by type and find average times
    const mealGroups = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    meals.forEach(meal => {
      const hour = new Date(meal.timestamp).getHours();
      if (hour >= 6 && hour <= 10) mealGroups.breakfast.push(hour);
      else if (hour >= 11 && hour <= 15) mealGroups.lunch.push(hour);
      else if (hour >= 17 && hour <= 21) mealGroups.dinner.push(hour);
    });

    return {
      breakfast: this.averageHour(mealGroups.breakfast) || 8,
      lunch: this.averageHour(mealGroups.lunch) || 12,
      dinner: this.averageHour(mealGroups.dinner) || 19
    };
  }

  // Check if it's a typical workout time
  isTypicalWorkoutTime(currentHour, patterns) {
    return patterns.preferredHours.some(hour => 
      Math.abs(currentHour - hour) <= 1
    );
  }

  // Check if user should be encouraged to workout
  shouldEncourageWorkout(patterns) {
    const lastWorkout = this.getLastWorkout();
    if (!lastWorkout) return true;

    const daysSinceLastWorkout = (new Date() - lastWorkout) / (1000 * 60 * 60 * 24);
    
    // Encourage if it's been more than 2 days
    return daysSinceLastWorkout >= 2;
  }

  // Generate workout message
  generateWorkoutMessage(patterns) {
    const messages = [
      "Your body is ready for action!",
      "Time to crush your fitness goals!",
      "Let's get that energy flowing!",
      "Your workout is calling your name!",
      "Ready to feel amazing?"
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Generate hydration message
  generateHydrationMessage(hoursSinceLastHydration) {
    if (hoursSinceLastHydration >= 4) {
      return "You haven't had water in a while. Time to hydrate!";
    } else if (hoursSinceLastHydration >= 2) {
      return "Stay on top of your hydration goals!";
    } else {
      return "Keep up the great hydration!";
    }
  }

  // Generate weekly summary message
  generateWeeklySummaryMessage(progressData) {
    const { workouts, calories, streak } = progressData;
    
    if (workouts >= 5) {
      return `Amazing week! ${workouts} workouts and ${calories} calories burned!`;
    } else if (workouts >= 3) {
      return `Good progress! ${workouts} workouts completed this week.`;
    } else {
      return `You've completed ${workouts} workouts this week. Keep going!`;
    }
  }

  // Check if user has logged a specific meal
  hasLoggedMeal(mealType) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMeals = this.userBehavior.mealTimes.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      mealDate.setHours(0, 0, 0, 0);
      return mealDate.getTime() === today.getTime() && meal.type === mealType;
    });

    return todayMeals.length > 0;
  }

  // Get last hydration log
  getLastHydrationLog() {
    // This would typically come from the nutrition tracking system
    return null; // Placeholder
  }

  // Get progress data
  getProgressData() {
    // This would typically come from the progress tracking system
    return {
      workouts: 3,
      calories: 1200,
      currentStreak: 5
    };
  }

  // Check if should show weekly summary
  shouldShowWeeklySummary() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    // Show on Sunday evening or Monday morning
    return (dayOfWeek === 0 && hour >= 18) || (dayOfWeek === 1 && hour <= 10);
  }

  // Check if should encourage streak
  shouldEncourageStreak() {
    const progressData = this.getProgressData();
    return progressData.currentStreak >= 3;
  }

  // Check if user has active challenges
  hasActiveChallenges() {
    // This would typically come from the social system
    return true; // Placeholder
  }

  // Check if friends are active
  hasFriendActivity() {
    // This would typically come from the social system
    return true; // Placeholder
  }

  // Get suggested workout
  getSuggestedWorkout() {
    // This would integrate with the AI recommender
    return {
      type: 'strength',
      duration: 30,
      title: 'Quick Strength Session'
    };
  }

  // Get most common hours from array
  getMostCommonHours(hours) {
    const frequency = {};
    hours.forEach(hour => {
      frequency[hour] = (frequency[hour] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => parseInt(hour));
  }

  // Calculate average hour
  averageHour(hours) {
    if (hours.length === 0) return null;
    return Math.round(hours.reduce((sum, hour) => sum + hour, 0) / hours.length);
  }

  // Calculate workout frequency
  calculateWorkoutFrequency(workouts) {
    if (workouts.length < 2) return 'low';
    
    const recentWorkouts = workouts.slice(-7);
    const daysBetweenWorkouts = [];
    
    for (let i = 1; i < recentWorkouts.length; i++) {
      const days = (recentWorkouts[i] - recentWorkouts[i-1]) / (1000 * 60 * 60 * 24);
      daysBetweenWorkouts.push(days);
    }
    
    const avgDays = daysBetweenWorkouts.reduce((sum, days) => sum + days, 0) / daysBetweenWorkouts.length;
    
    if (avgDays <= 1) return 'high';
    if (avgDays <= 2) return 'moderate';
    return 'low';
  }

  // Get last workout
  getLastWorkout() {
    const workouts = this.userBehavior.workoutTimes;
    return workouts.length > 0 ? new Date(workouts[workouts.length - 1]) : null;
  }

  // Deduplicate and sort notifications
  deduplicateAndSort(notifications) {
    const seen = new Set();
    const unique = notifications.filter(notification => {
      const key = `${notification.type}_${notification.action}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return unique.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  // Record notification interaction
  recordInteraction(notificationId, action) {
    this.notificationHistory.push({
      id: notificationId,
      action,
      timestamp: new Date()
    });
  }

  // Update user behavior
  updateBehavior(activity) {
    switch (activity.type) {
      case 'workout':
        this.userBehavior.workoutTimes.push(activity.timestamp);
        break;
      case 'meal':
        this.userBehavior.mealTimes.push(activity.timestamp);
        break;
      case 'hydration':
        // Update hydration tracking
        break;
    }
    
    this.userBehavior.lastActive = new Date();
  }

  // Get notification statistics
  getNotificationStats() {
    const total = this.notificationHistory.length;
    const responded = this.notificationHistory.filter(n => n.action === 'responded').length;
    const ignored = this.notificationHistory.filter(n => n.action === 'ignored').length;
    
    return {
      total,
      responded,
      ignored,
      responseRate: total > 0 ? (responded / total) * 100 : 0
    };
  }
}

// Export singleton instance
export const smartNotifications = new SmartNotificationSystem();
