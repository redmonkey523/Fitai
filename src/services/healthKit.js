import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy load react-native-health (only available on iOS device)
let AppleHealthKit = null;
try {
  if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health');
  }
} catch (error) {
  console.warn('[HealthKit] react-native-health not available:', error.message);
}

const STORAGE_KEY = '@healthkit_steps_cache';
const PERMISSIONS_KEY = '@healthkit_permissions_granted';

/**
 * HealthKit Service
 * Handles Apple Health integration for step tracking (read-only)
 */
class HealthKitService {
  constructor() {
    this.isAvailable = false;
    this.isAuthorized = false;
    this.observers = [];
    this.todaySteps = 0;
    this._checkAvailability();
  }

  /**
   * Check if HealthKit is available on this device
   * @private
   */
  async _checkAvailability() {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      this.isAvailable = false;
      return;
    }

    try {
      AppleHealthKit.isAvailable((err, available) => {
        if (err) {
          console.warn('[HealthKit] Availability check error:', err);
          this.isAvailable = false;
          return;
        }
        this.isAvailable = available;
        console.log('[HealthKit] Available:', available);
      });
    } catch (error) {
      console.warn('[HealthKit] Error checking availability:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Get whether HealthKit is available
   * @returns {boolean}
   */
  getIsAvailable() {
    return this.isAvailable;
  }

  /**
   * Get whether permissions have been granted
   * @returns {boolean}
   */
  getIsAuthorized() {
    return this.isAuthorized;
  }

  /**
   * Request HealthKit permissions
   * @returns {Promise<boolean>} Success status
   */
  async requestPermissions() {
    if (!this.isAvailable) {
      console.warn('[HealthKit] Not available, cannot request permissions');
      return false;
    }

    return new Promise((resolve) => {
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          ],
          write: [], // Read-only, no write permissions
        },
      };

      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) {
          console.error('[HealthKit] Permission request error:', err);
          this.isAuthorized = false;
          AsyncStorage.setItem(PERMISSIONS_KEY, 'false');
          resolve(false);
          return;
        }

        console.log('[HealthKit] Permissions granted');
        this.isAuthorized = true;
        AsyncStorage.setItem(PERMISSIONS_KEY, 'true');
        
        // Fetch initial steps data
        this.fetchTodaySteps();
        
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
      const granted = await AsyncStorage.getItem(PERMISSIONS_KEY);
      this.isAuthorized = granted === 'true';
      return this.isAuthorized;
    } catch (error) {
      console.error('[HealthKit] Error checking permissions:', error);
      return false;
    }
  }

  /**
   * Get start of day in local timezone
   * @returns {Date}
   */
  _getStartOfLocalDay() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  /**
   * Get end of day in local timezone
   * @returns {Date}
   */
  _getEndOfLocalDay() {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  }

  /**
   * Fetch today's step count from HealthKit
   * @returns {Promise<number>} Step count
   */
  async fetchTodaySteps() {
    if (!this.isAvailable || !this.isAuthorized) {
      console.warn('[HealthKit] Cannot fetch steps - not available or authorized');
      // Try to load from cache
      return this._loadCachedSteps();
    }

    return new Promise((resolve) => {
      const options = {
        date: new Date().toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getStepCount(options, (err, results) => {
        if (err) {
          console.error('[HealthKit] Error fetching steps:', err);
          this._loadCachedSteps().then(resolve);
          return;
        }

        const steps = results?.value || 0;
        console.log('[HealthKit] Steps fetched:', steps);
        
        this.todaySteps = steps;
        this._cacheSteps(steps);
        this._notifyObservers(steps);
        
        resolve(steps);
      });
    });
  }

  /**
   * Get aggregated steps for a date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>} Array of {date, value} objects
   */
  async getStepsForRange(startDate, endDate) {
    if (!this.isAvailable || !this.isAuthorized) {
      console.warn('[HealthKit] Cannot fetch step range - not available or authorized');
      return [];
    }

    return new Promise((resolve) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        includeManuallyAdded: true,
      };

      AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
        if (err) {
          console.error('[HealthKit] Error fetching step range:', err);
          resolve([]);
          return;
        }

        console.log('[HealthKit] Step range fetched:', results?.length || 0, 'days');
        resolve(results || []);
      });
    });
  }

  /**
   * Cache today's steps in local storage
   * @private
   * @param {number} steps
   */
  async _cacheSteps(steps) {
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const cache = { date: today, steps, timestamp: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('[HealthKit] Error caching steps:', error);
    }
  }

  /**
   * Load cached steps from local storage
   * @private
   * @returns {Promise<number>}
   */
  async _loadCachedSteps() {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (!cached) return 0;

      const { date, steps } = JSON.parse(cached);
      const today = new Date().toISOString().slice(0, 10);
      
      // Only return cached steps if they're from today
      if (date === today) {
        console.log('[HealthKit] Loaded cached steps:', steps);
        this.todaySteps = steps;
        return steps;
      }
      
      return 0;
    } catch (error) {
      console.error('[HealthKit] Error loading cached steps:', error);
      return 0;
    }
  }

  /**
   * Subscribe to step updates
   * @param {Function} callback - Called with updated step count
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.observers.push(callback);
    
    // Immediately call with current value
    callback(this.todaySteps);

    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all observers of step count change
   * @private
   * @param {number} steps
   */
  _notifyObservers(steps) {
    this.observers.forEach(callback => {
      try {
        callback(steps);
      } catch (error) {
        console.error('[HealthKit] Observer callback error:', error);
      }
    });
  }

  /**
   * Start background observer for step updates
   * Refreshes every 5 minutes when app is in foreground
   */
  startObserver() {
    if (!this.isAvailable || !this.isAuthorized) {
      console.warn('[HealthKit] Cannot start observer - not available or authorized');
      return;
    }

    // Initial fetch
    this.fetchTodaySteps();

    // Poll every 5 minutes
    this.observerInterval = setInterval(() => {
      this.fetchTodaySteps();
    }, 5 * 60 * 1000);

    console.log('[HealthKit] Observer started');
  }

  /**
   * Stop background observer
   */
  stopObserver() {
    if (this.observerInterval) {
      clearInterval(this.observerInterval);
      this.observerInterval = null;
      console.log('[HealthKit] Observer stopped');
    }
  }

  /**
   * Refresh steps data (call on app foreground)
   */
  async refresh() {
    console.log('[HealthKit] Refreshing steps...');
    return this.fetchTodaySteps();
  }

  /**
   * Get current step count (from memory)
   * @returns {number}
   */
  getCurrentSteps() {
    return this.todaySteps;
  }

  /**
   * Reset authorization status (for testing)
   */
  async resetAuthorization() {
    this.isAuthorized = false;
    await AsyncStorage.removeItem(PERMISSIONS_KEY);
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[HealthKit] Authorization reset');
  }
}

// Export singleton instance
const healthKitService = new HealthKitService();
export default healthKitService;

