/**
 * Unified Health Service
 * Platform-agnostic health data integration
 * Abstracts HealthKit (iOS) and Google Fit (Android)
 */

import { Platform } from 'react-native';
import healthKitEnhanced from './healthKitEnhanced';
import googleFit from './googleFit';
import crashReporting from './crashReporting';

class UnifiedHealthService {
  constructor() {
    this.platform = Platform.OS;
    this.service = this.platform === 'ios' ? healthKitEnhanced : googleFit;
    this.initialized = false;
  }

  /**
   * Initialize health service
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      const status = this.service.getStatus();
      crashReporting.log('Health service initializing', 'info', { 
        platform: this.platform,
        available: status.isAvailable 
      });

      if (status.isAvailable) {
        // Check if already authorized
        const alreadyAuthorized = await this.service.checkPermissions();
        if (alreadyAuthorized) {
          crashReporting.log('Health permissions already granted', 'info');
          this.initialized = true;
          await this.service.fetchAllData();
        }
      }

      return status.isAvailable;
    } catch (error) {
      crashReporting.logError(error, { context: 'health_service_init' });
      return false;
    }
  }

  /**
   * Request permissions
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async requestPermissions() {
    try {
      const status = this.service.getStatus();
      
      if (!status.isAvailable) {
        return {
          success: false,
          message: this.platform === 'ios' 
            ? 'Apple Health is not available on this device'
            : 'Google Fit is not available on this device'
        };
      }

      const granted = await this.service.requestPermissions();
      
      if (granted) {
        this.initialized = true;
        return {
          success: true,
          message: 'Health permissions granted successfully'
        };
      } else {
        return {
          success: false,
          message: 'Health permissions were denied'
        };
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'health_request_permissions' });
      return {
        success: false,
        message: error.message || 'Failed to request health permissions'
      };
    }
  }

  /**
   * Get health service status
   * @returns {Object} Status object
   */
  getStatus() {
    const serviceStatus = this.service.getStatus();
    return {
      ...serviceStatus,
      initialized: this.initialized,
      serviceName: this.platform === 'ios' ? 'Apple Health' : 'Google Fit'
    };
  }

  /**
   * Fetch today's steps
   * @returns {Promise<number>}
   */
  async getSteps() {
    try {
      return await this.service.fetchTodaySteps();
    } catch (error) {
      crashReporting.logError(error, { context: 'health_get_steps' });
      return 0;
    }
  }

  /**
   * Fetch today's calories burned
   * @returns {Promise<number>}
   */
  async getCalories() {
    try {
      return await this.service.fetchTodayCalories();
    } catch (error) {
      crashReporting.logError(error, { context: 'health_get_calories' });
      return 0;
    }
  }

  /**
   * Fetch latest heart rate
   * @returns {Promise<number|null>}
   */
  async getHeartRate() {
    try {
      return await this.service.fetchLatestHeartRate();
    } catch (error) {
      crashReporting.logError(error, { context: 'health_get_heart_rate' });
      return null;
    }
  }

  /**
   * Fetch latest weight
   * @returns {Promise<number|null>}
   */
  async getWeight() {
    try {
      return await this.service.fetchLatestWeight();
    } catch (error) {
      crashReporting.logError(error, { context: 'health_get_weight' });
      return null;
    }
  }

  /**
   * Fetch all health data at once
   * @returns {Promise<Object>}
   */
  async getAllData() {
    try {
      const [steps, calories, heartRate, weight] = await Promise.all([
        this.getSteps(),
        this.getCalories(),
        this.getHeartRate(),
        this.getWeight(),
      ]);

      return {
        steps,
        calories,
        heartRate,
        weight,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      crashReporting.logError(error, { context: 'health_get_all_data' });
      return {
        steps: 0,
        calories: 0,
        heartRate: null,
        weight: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get cached health data (no network call)
   * @returns {Object}
   */
  getCachedData() {
    return this.service.getAllData();
  }

  /**
   * Fetch workouts for date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async getWorkouts(startDate, endDate) {
    try {
      return await this.service.fetchWorkouts(startDate, endDate);
    } catch (error) {
      crashReporting.logError(error, { context: 'health_get_workouts' });
      return [];
    }
  }

  /**
   * Save workout to health platform
   * @param {Object} workout
   * @returns {Promise<boolean>}
   */
  async saveWorkout(workout) {
    try {
      if (!this.initialized) {
        crashReporting.log('Health service not initialized, cannot save workout', 'warning');
        return false;
      }

      // Normalize workout data for both platforms
      const normalizedWorkout = {
        type: workout.type || 'Other',
        name: workout.name || 'Workout',
        startDate: workout.startDate instanceof Date ? workout.startDate : new Date(workout.startDate),
        endDate: workout.endDate instanceof Date ? workout.endDate : new Date(workout.endDate),
        energyBurned: workout.calories || workout.energyBurned || 0,
        calories: workout.calories || workout.energyBurned || 0,
        distance: workout.distance || 0,
      };

      return await this.service.saveWorkout(normalizedWorkout);
    } catch (error) {
      crashReporting.logError(error, { context: 'health_save_workout' });
      return false;
    }
  }

  /**
   * Save weight to health platform
   * @param {number} weight - Weight in kg
   * @returns {Promise<boolean>}
   */
  async saveWeight(weight) {
    try {
      if (!this.initialized) {
        crashReporting.log('Health service not initialized, cannot save weight', 'warning');
        return false;
      }

      return await this.service.saveWeight(weight);
    } catch (error) {
      crashReporting.logError(error, { context: 'health_save_weight' });
      return false;
    }
  }

  /**
   * Subscribe to health data updates
   * @param {string} type - 'steps' | 'calories' | 'heartRate' | 'weight'
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(type, callback) {
    return this.service.subscribe(type, callback);
  }

  /**
   * Start background health data observer
   */
  startObserver() {
    if (!this.initialized) {
      crashReporting.log('Health service not initialized, cannot start observer', 'warning');
      return;
    }

    this.service.startObserver();
  }

  /**
   * Stop background health data observer
   */
  stopObserver() {
    this.service.stopObserver();
  }

  /**
   * Refresh all health data
   * @returns {Promise<Object>}
   */
  async refresh() {
    try {
      return await this.getAllData();
    } catch (error) {
      crashReporting.logError(error, { context: 'health_refresh' });
      return this.getCachedData();
    }
  }

  /**
   * Disconnect from health service (Android only)
   */
  async disconnect() {
    try {
      if (this.platform === 'android' && this.service.disconnect) {
        await this.service.disconnect();
        this.initialized = false;
        crashReporting.log('Disconnected from health service', 'info');
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'health_disconnect' });
    }
  }

  /**
   * Reset authorization (for testing)
   */
  async resetAuthorization() {
    try {
      await this.service.resetAuthorization();
      this.initialized = false;
      crashReporting.log('Health authorization reset', 'info');
    } catch (error) {
      crashReporting.logError(error, { context: 'health_reset_authorization' });
    }
  }

  /**
   * Check if specific permission is granted
   * @param {string} permission - Permission type
   * @returns {Promise<boolean>}
   */
  async checkSpecificPermission(permission) {
    try {
      // This is a placeholder - implement platform-specific checks
      return this.initialized;
    } catch (error) {
      crashReporting.logError(error, { context: 'health_check_specific_permission' });
      return false;
    }
  }

  /**
   * Get available health data types on this platform
   * @returns {Array<string>}
   */
  getAvailableDataTypes() {
    const commonTypes = ['steps', 'calories', 'heartRate', 'weight'];
    
    if (this.platform === 'ios') {
      return [
        ...commonTypes,
        'distance',
        'activeEnergyBurned',
        'basalEnergyBurned',
        'restingHeartRate',
        'bmi',
        'bodyFatPercentage',
        'height',
        'workouts',
        'sleepAnalysis',
        'water',
      ];
    } else {
      return [
        ...commonTypes,
        'distance',
        'activities',
        'nutrition',
        'sleep',
      ];
    }
  }

  /**
   * Check if health data is stale (older than 5 minutes)
   * @returns {boolean}
   */
  isDataStale() {
    const cachedData = this.getCachedData();
    // This is a simple check - enhance based on your needs
    return !cachedData.steps && !cachedData.calories;
  }
}

// Export singleton
const healthService = new UnifiedHealthService();
export default healthService;


