/**
 * Product Analytics Service
 * Tracks user behavior and app usage metrics
 */

import { Platform } from 'react-native';
import crashReporting from './crashReporting';

// Lazy load Firebase Analytics (optional)
let analytics = null;
try {
  const firebase = require('@react-native-firebase/analytics');
  analytics = firebase.default();
} catch (error) {
  console.warn('[Analytics] Firebase Analytics not available:', error.message);
}

const IS_DEV = __DEV__;

class AnalyticsService {
  constructor() {
    this.enabled = false;
    this.initialized = false;
  }

  /**
   * Initialize analytics
   */
  async init() {
    if (this.initialized) return;

    if (analytics && !IS_DEV) {
      try {
        await analytics.setAnalyticsCollectionEnabled(true);
        this.enabled = true;
        console.log('[Analytics] Firebase Analytics initialized');
      } catch (error) {
        console.error('[Analytics] Failed to initialize:', error);
      }
    } else if (IS_DEV) {
      console.log('[Analytics] Analytics disabled in development');
    }

    this.initialized = true;
  }

  /**
   * Set user properties
   * @param {Object} properties - User properties
   */
  async setUserProperties(properties) {
    if (!this.enabled || !analytics) return;

    try {
      // Firebase limits: max 25 properties, 36 char keys, 100 char values
      const sanitized = {};
      Object.keys(properties).forEach((key) => {
        const sanitizedKey = key.slice(0, 36).replace(/[^a-zA-Z0-9_]/g, '_');
        const value = properties[key];
        if (typeof value === 'string') {
          sanitized[sanitizedKey] = value.slice(0, 100);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          sanitized[sanitizedKey] = value.toString();
        }
      });

      await analytics.setUserProperties(sanitized);
      console.log('[Analytics] User properties set:', Object.keys(sanitized));
    } catch (error) {
      console.error('[Analytics] Failed to set user properties:', error);
      crashReporting.logError(error, { context: 'setUserProperties' });
    }
  }

  /**
   * Set user ID
   * @param {string} userId - User ID
   */
  async setUserId(userId) {
    if (!this.enabled || !analytics) return;

    try {
      await analytics.setUserId(userId?.toString() || null);
      console.log('[Analytics] User ID set:', userId);
    } catch (error) {
      console.error('[Analytics] Failed to set user ID:', error);
    }
  }

  /**
   * Log an event
   * @param {string} eventName - Event name (max 40 chars, alphanumeric + underscore)
   * @param {Object} params - Event parameters (max 25 params, 40 char keys, 100 char values)
   */
  async logEvent(eventName, params = {}) {
    if (!this.enabled || !analytics) {
      console.log(`[Analytics] Event (offline): ${eventName}`, params);
      return;
    }

    try {
      // Sanitize event name: max 40 chars, alphanumeric + underscore
      const sanitizedName = eventName
        .slice(0, 40)
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase();

      // Sanitize params
      const sanitizedParams = {};
      Object.keys(params).slice(0, 25).forEach((key) => {
        const sanitizedKey = key.slice(0, 40).replace(/[^a-zA-Z0-9_]/g, '_');
        const value = params[key];
        
        if (typeof value === 'string') {
          sanitizedParams[sanitizedKey] = value.slice(0, 100);
        } else if (typeof value === 'number') {
          sanitizedParams[sanitizedKey] = value;
        } else if (typeof value === 'boolean') {
          sanitizedParams[sanitizedKey] = value;
        } else if (value !== null && value !== undefined) {
          sanitizedParams[sanitizedKey] = JSON.stringify(value).slice(0, 100);
        }
      });

      await analytics.logEvent(sanitizedName, sanitizedParams);
      console.log(`[Analytics] Event logged: ${sanitizedName}`, sanitizedParams);

      // Also add to crash reporting breadcrumbs
      crashReporting.addBreadcrumb({
        message: sanitizedName,
        category: 'analytics',
        data: sanitizedParams,
      });
    } catch (error) {
      console.error('[Analytics] Failed to log event:', error);
    }
  }

  /**
   * Log a screen view
   * @param {string} screenName - Screen name
   * @param {string} screenClass - Screen class/component name
   */
  async logScreenView(screenName, screenClass = null) {
    if (!this.enabled || !analytics) return;

    try {
      await analytics.logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      
      console.log(`[Analytics] Screen view: ${screenName}`);
      crashReporting.trackScreen(screenName);
    } catch (error) {
      console.error('[Analytics] Failed to log screen view:', error);
    }
  }

  // Common events for fitness app
  
  async logSignUp(method) {
    await this.logEvent('sign_up', { method });
  }

  async logLogin(method) {
    await this.logEvent('login', { method });
  }

  async logWorkoutStarted(workoutType, duration) {
    await this.logEvent('workout_started', { 
      workout_type: workoutType,
      duration_minutes: duration,
    });
  }

  async logWorkoutCompleted(workoutType, duration, caloriesBurned) {
    await this.logEvent('workout_completed', {
      workout_type: workoutType,
      duration_minutes: duration,
      calories_burned: caloriesBurned,
    });
  }

  async logMealLogged(mealType, calories, source) {
    await this.logEvent('meal_logged', {
      meal_type: mealType,
      calories,
      source, // 'manual', 'camera', 'barcode', 'voice'
    });
  }

  async logGoalSet(goalType, targetValue) {
    await this.logEvent('goal_set', {
      goal_type: goalType,
      target_value: targetValue,
    });
  }

  async logQuizCompleted(goalType, activityLevel) {
    await this.logEvent('quiz_completed', {
      goal_type: goalType,
      activity_level: activityLevel,
    });
  }

  async logFeatureUsed(featureName, context = {}) {
    await this.logEvent('feature_used', {
      feature_name: featureName,
      ...context,
    });
  }

  async logSearch(searchTerm, category, resultsCount) {
    await this.logEvent('search', {
      search_term: searchTerm.slice(0, 50),
      category,
      results_count: resultsCount,
    });
  }

  async logShare(contentType, method) {
    await this.logEvent('share', {
      content_type: contentType,
      method,
    });
  }

  async logSubscription(planType, method) {
    await this.logEvent('subscribe', {
      plan_type: planType,
      method,
    });
  }

  async logError(errorType, errorMessage, screen) {
    await this.logEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage.slice(0, 100),
      screen,
    });
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;

