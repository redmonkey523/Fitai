/**
 * Enhanced HealthKit Service
 * Comprehensive Apple Health integration with multiple health data types
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crashReporting from './crashReporting';

// Lazy load react-native-health (only available on iOS device)
let AppleHealthKit = null;
try {
  if (Platform.OS === 'ios') {
    // Only require if running in a development build (not Expo Go)
    try {
      AppleHealthKit = require('react-native-health');
    } catch (e) {
      // Module not available - this is expected in Expo Go
      if (__DEV__) {
        console.log('[HealthKit] Running in Expo Go - native module not available. Build with EAS to enable.');
      }
    }
  }
} catch (error) {
  if (__DEV__) {
    console.log('[HealthKit] Not available:', error.message);
  }
}

const STORAGE_KEYS = {
  PERMISSIONS: '@healthkit_permissions_granted',
  STEPS_CACHE: '@healthkit_steps_cache',
  CALORIES_CACHE: '@healthkit_calories_cache',
  HEART_RATE_CACHE: '@healthkit_heart_rate_cache',
  WEIGHT_CACHE: '@healthkit_weight_cache',
};

class HealthKitEnhancedService {
  constructor() {
    this.isAvailable = false;
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
    this._checkAvailability();
  }

  /**
   * Check if HealthKit is available on this device
   */
  async _checkAvailability() {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      this.isAvailable = false;
      return;
    }

    try {
      AppleHealthKit.isAvailable((err, available) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_availability' });
          this.isAvailable = false;
          return;
        }
        this.isAvailable = available;
        crashReporting.log(`HealthKit available: ${available}`, 'info');
      });
    } catch (error) {
      crashReporting.logError(error, { context: 'healthkit_availability_check' });
      this.isAvailable = false;
    }
  }

  /**
   * Request comprehensive HealthKit permissions
   * @returns {Promise<boolean>}
   */
  async requestPermissions() {
    if (!this.isAvailable) {
      crashReporting.log('HealthKit not available, cannot request permissions', 'warning');
      return false;
    }

    return new Promise((resolve) => {
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.RestingHeartRate,
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.BodyMassIndex,
            AppleHealthKit.Constants.Permissions.BodyFatPercentage,
            AppleHealthKit.Constants.Permissions.Height,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Water,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.Water,
          ],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_permissions' });
          this.isAuthorized = false;
          AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS, 'false');
          resolve(false);
          return;
        }

        crashReporting.log('HealthKit permissions granted', 'info');
        this.isAuthorized = true;
        AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS, 'true');
        
        // Fetch initial data
        this.fetchAllData();
        
        resolve(true);
      });
    });
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
      this.isAuthorized = granted === 'true';
      return this.isAuthorized;
    } catch (error) {
      crashReporting.logError(error, { context: 'healthkit_check_permissions' });
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

    return new Promise((resolve) => {
      const options = {
        date: new Date().toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (err, results) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_fetch_steps' });
          this._loadFromCache(STORAGE_KEYS.STEPS_CACHE, 'steps').then(resolve);
          return;
        }

        const steps = results?.value || 0;
        this.cache.steps = steps;
        this._cacheData(STORAGE_KEYS.STEPS_CACHE, steps);
        this._notifyObservers('steps', steps);
        
        resolve(steps);
      });
    });
  }

  /**
   * Fetch today's calories burned (active + basal)
   * @returns {Promise<number>}
   */
  async fetchTodayCalories() {
    if (!this.isAvailable || !this.isAuthorized) {
      return this._loadFromCache(STORAGE_KEYS.CALORIES_CACHE, 'calories');
    }

    return new Promise(async (resolve) => {
      const options = {
        startDate: this._getStartOfDay().toISOString(),
        endDate: new Date().toISOString(),
      };

      // Fetch active calories
      AppleHealthKit.getActiveEnergyBurned(options, (err, activeResults) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_fetch_active_calories' });
          this._loadFromCache(STORAGE_KEYS.CALORIES_CACHE, 'calories').then(resolve);
          return;
        }

        // Fetch basal calories
        AppleHealthKit.getBasalEnergyBurned(options, (err2, basalResults) => {
          if (err2) {
            crashReporting.logError(err2, { context: 'healthkit_fetch_basal_calories' });
          }

          const activeCalories = activeResults?.value || 0;
          const basalCalories = basalResults?.value || 0;
          const totalCalories = Math.round(activeCalories + basalCalories);

          this.cache.calories = totalCalories;
          this._cacheData(STORAGE_KEYS.CALORIES_CACHE, totalCalories);
          this._notifyObservers('calories', totalCalories);
          
          resolve(totalCalories);
        });
      });
    });
  }

  /**
   * Fetch latest heart rate
   * @returns {Promise<number|null>}
   */
  async fetchLatestHeartRate() {
    if (!this.isAvailable || !this.isAuthorized) {
      return this._loadFromCache(STORAGE_KEYS.HEART_RATE_CACHE, 'heartRate');
    }

    return new Promise((resolve) => {
      const options = {
        startDate: this._getStartOfDay().toISOString(),
        endDate: new Date().toISOString(),
        limit: 1,
        ascending: false,
      };

      AppleHealthKit.getHeartRateSamples(options, (err, results) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_fetch_heart_rate' });
          this._loadFromCache(STORAGE_KEYS.HEART_RATE_CACHE, 'heartRate').then(resolve);
          return;
        }

        const heartRate = results && results.length > 0 ? Math.round(results[0].value) : null;
        this.cache.heartRate = heartRate;
        this._cacheData(STORAGE_KEYS.HEART_RATE_CACHE, heartRate);
        this._notifyObservers('heartRate', heartRate);
        
        resolve(heartRate);
      });
    });
  }

  /**
   * Fetch latest weight
   * @returns {Promise<number|null>}
   */
  async fetchLatestWeight() {
    if (!this.isAvailable || !this.isAuthorized) {
      return this._loadFromCache(STORAGE_KEYS.WEIGHT_CACHE, 'weight');
    }

    return new Promise((resolve) => {
      const options = {
        unit: 'kg',
      };

      AppleHealthKit.getLatestWeight(options, (err, results) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_fetch_weight' });
          this._loadFromCache(STORAGE_KEYS.WEIGHT_CACHE, 'weight').then(resolve);
          return;
        }

        const weight = results?.value ? Math.round(results.value * 10) / 10 : null;
        this.cache.weight = weight;
        this._cacheData(STORAGE_KEYS.WEIGHT_CACHE, weight);
        this._notifyObservers('weight', weight);
        
        resolve(weight);
      });
    });
  }

  /**
   * Fetch workouts for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async fetchWorkouts(startDate, endDate) {
    if (!this.isAvailable || !this.isAuthorized) {
      return [];
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSamples(options, (err, results) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_fetch_workouts' });
          resolve([]);
          return;
        }

        resolve(results || []);
      });
    });
  }

  /**
   * Save workout to HealthKit
   * @param {Object} workout - { type, startDate, endDate, energyBurned, distance }
   * @returns {Promise<boolean>}
   */
  async saveWorkout(workout) {
    if (!this.isAvailable || !this.isAuthorized) {
      return false;
    }

    return new Promise((resolve) => {
      const options = {
        type: workout.type || 'Other',
        startDate: workout.startDate.toISOString(),
        endDate: workout.endDate.toISOString(),
        energyBurned: workout.energyBurned || 0,
        energyBurnedUnit: 'kilocalorie',
        distance: workout.distance || 0,
        distanceUnit: 'meter',
      };

      AppleHealthKit.saveWorkout(options, (err) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_save_workout' });
          resolve(false);
          return;
        }

        crashReporting.log('Workout saved to HealthKit', 'info');
        resolve(true);
      });
    });
  }

  /**
   * Save weight to HealthKit
   * @param {number} weight - Weight in kg
   * @returns {Promise<boolean>}
   */
  async saveWeight(weight) {
    if (!this.isAvailable || !this.isAuthorized) {
      return false;
    }

    return new Promise((resolve) => {
      const options = {
        value: weight,
        unit: 'kg',
        date: new Date().toISOString(),
      };

      AppleHealthKit.saveWeight(options, (err) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_save_weight' });
          resolve(false);
          return;
        }

        crashReporting.log('Weight saved to HealthKit', 'info');
        this.cache.weight = weight;
        this._notifyObservers('weight', weight);
        resolve(true);
      });
    });
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
      crashReporting.logError(error, { context: 'healthkit_cache_data' });
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
      crashReporting.logError(error, { context: 'healthkit_load_cache' });
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
        crashReporting.logError(error, { context: 'healthkit_observer_callback' });
      }
    });
  }

  /**
   * Start background observer (polls every 5 minutes)
   */
  startObserver() {
    if (!this.isAvailable || !this.isAuthorized) {
      crashReporting.log('HealthKit observer not started - not available or authorized', 'warning');
      return;
    }

    this.fetchAllData();

    this.observerInterval = setInterval(() => {
      this.fetchAllData();
    }, 5 * 60 * 1000);

    crashReporting.log('HealthKit observer started', 'info');
  }

  /**
   * Stop background observer
   */
  stopObserver() {
    if (this.observerInterval) {
      clearInterval(this.observerInterval);
      this.observerInterval = null;
      crashReporting.log('HealthKit observer stopped', 'info');
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
    crashReporting.log('HealthKit authorization reset', 'info');
  }
}

// Export singleton
const healthKitEnhancedService = new HealthKitEnhancedService();
export default healthKitEnhancedService;

