/**
 * Google Fit Service
 * Comprehensive Google Fit integration for Android
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crashReporting from './crashReporting';

// Lazy load react-native-google-fit (only available on Android device)
let GoogleFit = null;
try {
  if (Platform.OS === 'android') {
    // Only require if running in a development build (not Expo Go)
    try {
      GoogleFit = require('react-native-google-fit').default;
    } catch (e) {
      // Module not available - this is expected in Expo Go
      if (__DEV__) {
        console.log('[GoogleFit] Running in Expo Go - native module not available. Build with EAS to enable.');
      }
    }
  }
} catch (error) {
  if (__DEV__) {
    console.log('[GoogleFit] Not available:', error.message);
  }
}

const STORAGE_KEYS = {
  PERMISSIONS: '@googlefit_permissions_granted',
  STEPS_CACHE: '@googlefit_steps_cache',
  CALORIES_CACHE: '@googlefit_calories_cache',
  HEART_RATE_CACHE: '@googlefit_heart_rate_cache',
  WEIGHT_CACHE: '@googlefit_weight_cache',
};

class GoogleFitService {
  constructor() {
    this.isAvailable = Platform.OS === 'android' && GoogleFit !== null;
    this.isAuthorized = false;
    this.observers = {
      steps: [],
      calories: [],
      heartRate: [],
      weight: [],
      workouts: [],
    };
    this.cache = {
      steps: 0,
      calories: 0,
      heartRate: null,
      weight: null,
    };
  }

  /**
   * Request Google Fit permissions
   * @returns {Promise<boolean>}
   */
  async requestPermissions() {
    if (!this.isAvailable) {
      crashReporting.log('Google Fit not available, cannot request permissions', 'warning');
      return false;
    }

    try {
      const options = {
        scopes: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.activity.write',
          'https://www.googleapis.com/auth/fitness.body.read',
          'https://www.googleapis.com/auth/fitness.body.write',
          'https://www.googleapis.com/auth/fitness.location.read',
          'https://www.googleapis.com/auth/fitness.nutrition.read',
          'https://www.googleapis.com/auth/fitness.sleep.read',
        ],
      };

      const authResult = await GoogleFit.authorize(options);

      if (authResult.success) {
        crashReporting.log('Google Fit permissions granted', 'info');
        this.isAuthorized = true;
        await AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS, 'true');
        
        // Fetch initial data
        await this.fetchAllData();
        
        return true;
      } else {
        crashReporting.log('Google Fit permissions denied', 'warning');
        this.isAuthorized = false;
        await AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS, 'false');
        return false;
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_permissions' });
      this.isAuthorized = false;
      return false;
    }
  }

  /**
   * Check if permissions were previously granted
   * @returns {Promise<boolean>}
   */
  async checkPermissions() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const granted = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      if (granted === 'true') {
        // Verify with Google Fit
        const authResult = await GoogleFit.checkIsAuthorized();
        this.isAuthorized = authResult === true;
        return this.isAuthorized;
      }
      return false;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_check_permissions' });
      return false;
    }
  }

  /**
   * Fetch all health data
   */
  async fetchAllData() {
    if (!this.isAvailable || !this.isAuthorized) {
      return;
    }

    await Promise.all([
      this.fetchTodaySteps(),
      this.fetchTodayCalories(),
      this.fetchLatestHeartRate(),
      this.fetchLatestWeight(),
    ]);
  }

  /**
   * Fetch today's step count
   * @returns {Promise<number>}
   */
  async fetchTodaySteps() {
    if (!this.isAvailable || !this.isAuthorized) {
      return this._loadFromCache(STORAGE_KEYS.STEPS_CACHE, 'steps');
    }

    try {
      const startDate = this._getStartOfDay();
      const endDate = new Date();

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const stepsData = await GoogleFit.getDailyStepCountSamples(options);
      
      // Google Fit returns data from multiple sources, we want the aggregated total
      let steps = 0;
      if (stepsData && stepsData.length > 0) {
        const todayData = stepsData[0];
        steps = todayData.steps || 0;
      }

      this.cache.steps = steps;
      this._cacheData(STORAGE_KEYS.STEPS_CACHE, steps);
      this._notifyObservers('steps', steps);
      
      return steps;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_fetch_steps' });
      return this._loadFromCache(STORAGE_KEYS.STEPS_CACHE, 'steps');
    }
  }

  /**
   * Fetch today's calories burned
   * @returns {Promise<number>}
   */
  async fetchTodayCalories() {
    if (!this.isAvailable || !this.isAuthorized) {
      return this._loadFromCache(STORAGE_KEYS.CALORIES_CACHE, 'calories');
    }

    try {
      const startDate = this._getStartOfDay();
      const endDate = new Date();

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        basalCalculation: true,
      };

      const caloriesData = await GoogleFit.getDailyCalorieSamples(options);
      
      let calories = 0;
      if (caloriesData && caloriesData.length > 0) {
        calories = Math.round(caloriesData[0].calorie || 0);
      }

      this.cache.calories = calories;
      this._cacheData(STORAGE_KEYS.CALORIES_CACHE, calories);
      this._notifyObservers('calories', calories);
      
      return calories;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_fetch_calories' });
      return this._loadFromCache(STORAGE_KEYS.CALORIES_CACHE, 'calories');
    }
  }

  /**
   * Fetch latest heart rate
   * @returns {Promise<number|null>}
   */
  async fetchLatestHeartRate() {
    if (!this.isAvailable || !this.isAuthorized) {
      return this._loadFromCache(STORAGE_KEYS.HEART_RATE_CACHE, 'heartRate');
    }

    try {
      const startDate = this._getStartOfDay();
      const endDate = new Date();

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const heartRateData = await GoogleFit.getHeartRateSamples(options);
      
      let heartRate = null;
      if (heartRateData && heartRateData.length > 0) {
        // Get the most recent reading
        const latest = heartRateData[heartRateData.length - 1];
        heartRate = Math.round(latest.value || 0);
      }

      this.cache.heartRate = heartRate;
      this._cacheData(STORAGE_KEYS.HEART_RATE_CACHE, heartRate);
      this._notifyObservers('heartRate', heartRate);
      
      return heartRate;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_fetch_heart_rate' });
      return this._loadFromCache(STORAGE_KEYS.HEART_RATE_CACHE, 'heartRate');
    }
  }

  /**
   * Fetch latest weight
   * @returns {Promise<number|null>}
   */
  async fetchLatestWeight() {
    if (!this.isAvailable || !this.isAuthorized) {
      return this._loadFromCache(STORAGE_KEYS.WEIGHT_CACHE, 'weight');
    }

    try {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1); // Look back 1 year
      const endDate = new Date();

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ascending: false,
        limit: 1,
      };

      const weightData = await GoogleFit.getWeightSamples(options);
      
      let weight = null;
      if (weightData && weightData.length > 0) {
        weight = Math.round(weightData[0].value * 10) / 10;
      }

      this.cache.weight = weight;
      this._cacheData(STORAGE_KEYS.WEIGHT_CACHE, weight);
      this._notifyObservers('weight', weight);
      
      return weight;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_fetch_weight' });
      return this._loadFromCache(STORAGE_KEYS.WEIGHT_CACHE, 'weight');
    }
  }

  /**
   * Fetch workouts/activities for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async fetchWorkouts(startDate, endDate) {
    if (!this.isAvailable || !this.isAuthorized) {
      return [];
    }

    try {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const activities = await GoogleFit.getActivitySamples(options);
      return activities || [];
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_fetch_workouts' });
      return [];
    }
  }

  /**
   * Save workout to Google Fit
   * @param {Object} workout - { type, startDate, endDate, calories, distance }
   * @returns {Promise<boolean>}
   */
  async saveWorkout(workout) {
    if (!this.isAvailable || !this.isAuthorized) {
      return false;
    }

    try {
      const options = {
        id: `fitness_${Date.now()}`,
        name: workout.name || 'Workout',
        type: workout.type || 'other',
        startDate: workout.startDate.toISOString(),
        endDate: workout.endDate.toISOString(),
        calories: workout.calories || 0,
        distance: workout.distance || 0,
      };

      await GoogleFit.saveActivity(options);
      crashReporting.log('Workout saved to Google Fit', 'info');
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_save_workout' });
      return false;
    }
  }

  /**
   * Save weight to Google Fit
   * @param {number} weight - Weight in kg
   * @returns {Promise<boolean>}
   */
  async saveWeight(weight) {
    if (!this.isAvailable || !this.isAuthorized) {
      return false;
    }

    try {
      const options = {
        value: weight,
        date: new Date().toISOString(),
      };

      await GoogleFit.saveWeight(options);
      crashReporting.log('Weight saved to Google Fit', 'info');
      this.cache.weight = weight;
      this._notifyObservers('weight', weight);
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_save_weight' });
      return false;
    }
  }

  /**
   * Cache data to AsyncStorage
   */
  async _cacheData(key, value) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const cache = { date: today, value, timestamp: Date.now() };
      await AsyncStorage.setItem(key, JSON.stringify(cache));
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_cache_data' });
    }
  }

  /**
   * Load cached data from AsyncStorage
   */
  async _loadFromCache(key, cacheKey) {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return cacheKey === 'steps' || cacheKey === 'calories' ? 0 : null;

      const { date, value } = JSON.parse(cached);
      const today = new Date().toISOString().slice(0, 10);
      
      if (date === today) {
        this.cache[cacheKey] = value;
        return value;
      }
      
      return cacheKey === 'steps' || cacheKey === 'calories' ? 0 : null;
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_load_cache' });
      return cacheKey === 'steps' || cacheKey === 'calories' ? 0 : null;
    }
  }

  /**
   * Subscribe to health data updates
   * @param {string} type - 'steps' | 'calories' | 'heartRate' | 'weight'
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(type, callback) {
    if (!this.observers[type]) {
      this.observers[type] = [];
    }

    this.observers[type].push(callback);
    
    // Immediately call with current value
    callback(this.cache[type] || (type === 'steps' || type === 'calories' ? 0 : null));

    return () => {
      this.observers[type] = this.observers[type].filter(cb => cb !== callback);
    };
  }

  /**
   * Notify observers of data change
   */
  _notifyObservers(type, value) {
    if (!this.observers[type]) return;

    this.observers[type].forEach(callback => {
      try {
        callback(value);
      } catch (error) {
        crashReporting.logError(error, { context: 'googlefit_observer_callback' });
      }
    });
  }

  /**
   * Start background observer (polls every 5 minutes)
   */
  startObserver() {
    if (!this.isAvailable || !this.isAuthorized) {
      crashReporting.log('Google Fit observer not started - not available or authorized', 'warning');
      return;
    }

    this.fetchAllData();

    this.observerInterval = setInterval(() => {
      this.fetchAllData();
    }, 5 * 60 * 1000);

    crashReporting.log('Google Fit observer started', 'info');
  }

  /**
   * Stop background observer
   */
  stopObserver() {
    if (this.observerInterval) {
      clearInterval(this.observerInterval);
      this.observerInterval = null;
      crashReporting.log('Google Fit observer stopped', 'info');
    }
  }

  /**
   * Disconnect from Google Fit
   */
  async disconnect() {
    if (!this.isAvailable) {
      return;
    }

    try {
      await GoogleFit.disconnect();
      this.isAuthorized = false;
      await AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS, 'false');
      crashReporting.log('Disconnected from Google Fit', 'info');
    } catch (error) {
      crashReporting.logError(error, { context: 'googlefit_disconnect' });
    }
  }

  /**
   * Utility: Get start of day
   */
  _getStartOfDay() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  /**
   * Get all current cached data
   */
  getAllData() {
    return { ...this.cache };
  }

  /**
   * Check availability and authorization status
   */
  getStatus() {
    return {
      isAvailable: this.isAvailable,
      isAuthorized: this.isAuthorized,
      platform: Platform.OS,
    };
  }

  /**
   * Reset authorization (for testing)
   */
  async resetAuthorization() {
    this.isAuthorized = false;
    await Promise.all(
      Object.values(STORAGE_KEYS).map(key => AsyncStorage.removeItem(key))
    );
    crashReporting.log('Google Fit authorization reset', 'info');
  }
}

// Export singleton
const googleFitService = new GoogleFitService();
export default googleFitService;

