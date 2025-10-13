import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import crashReporting from './crashReporting';
import analyticsService from './analytics';
import api from './api';

/**
 * Sleep Tracking Service
 * 
 * Features:
 * - Manual sleep logging
 * - Sleep quality ratings
 * - Sleep duration tracking
 * - Sleep patterns and trends
 * - Integration with Apple Health / Google Fit
 * - Recovery score calculation
 * - Sleep debt tracking
 * 
 * Sleep data is crucial for:
 * - Recovery assessment
 * - Workout recommendations
 * - Performance optimization
 * - Overtraining prevention
 */

const STORAGE_KEY = '@sleep_logs';
const SLEEP_GOAL_HOURS = 8; // Default recommended sleep

class SleepTrackingService {
  constructor() {
    this.logs = [];
    this.isHealthKitAvailable = false;
    this.isGoogleFitAvailable = false;
  }

  /**
   * Initialize sleep tracking
   */
  async initialize() {
    try {
      await this.loadLogs();
      
      // Check for health platform availability
      if (Platform.OS === 'ios') {
        try {
          const AppleHealthKit = require('react-native-health');
          this.isHealthKitAvailable = true;
          crashReporting.log('HealthKit available for sleep tracking', 'info');
        } catch (e) {
          this.isHealthKitAvailable = false;
        }
      } else if (Platform.OS === 'android') {
        // Google Fit would be initialized here
        this.isGoogleFitAvailable = false; // Not implemented yet
      }

      crashReporting.log('Sleep tracking initialized', 'info', {
        logCount: this.logs.length,
        healthKitAvailable: this.isHealthKitAvailable,
      });
    } catch (error) {
      crashReporting.logError(error, { context: 'sleep_tracking_init' });
    }
  }

  /**
   * Log a sleep session
   * @param {Object} sleepData
   */
  async logSleep(sleepData) {
    try {
      const sleepLog = {
        id: `sleep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: sleepData.date || new Date().toISOString().split('T')[0],
        bedTime: sleepData.bedTime, // ISO string
        wakeTime: sleepData.wakeTime, // ISO string
        duration: sleepData.duration || this._calculateDuration(sleepData.bedTime, sleepData.wakeTime),
        quality: sleepData.quality || 3, // 1-5 scale
        notes: sleepData.notes || '',
        interruptions: sleepData.interruptions || 0,
        feltRested: sleepData.feltRested || false,
        mood: sleepData.mood || 'neutral', // 'poor', 'neutral', 'good', 'great'
        source: sleepData.source || 'manual', // 'manual', 'healthkit', 'googlefit'
        synced: false,
        createdAt: new Date().toISOString(),
      };

      this.logs.push(sleepLog);
      
      // Sort logs by date (newest first)
      this.logs.sort((a, b) => new Date(b.date) - new Date(a.date));

      await this.saveLogs();
      
      // Sync to backend
      this.syncToBackend(sleepLog);

      analyticsService.logEvent('sleep_logged', {
        duration: sleepLog.duration,
        quality: sleepLog.quality,
        source: sleepLog.source,
      });

      crashReporting.log('Sleep session logged', 'info', {
        date: sleepLog.date,
        duration: sleepLog.duration,
        quality: sleepLog.quality,
      });

      return sleepLog;
    } catch (error) {
      crashReporting.logError(error, { context: 'log_sleep' });
      throw error;
    }
  }

  /**
   * Update an existing sleep log
   */
  async updateSleep(id, updates) {
    try {
      const index = this.logs.findIndex(log => log.id === id);
      if (index === -1) {
        throw new Error('Sleep log not found');
      }

      // Recalculate duration if times changed
      if (updates.bedTime || updates.wakeTime) {
        const bedTime = updates.bedTime || this.logs[index].bedTime;
        const wakeTime = updates.wakeTime || this.logs[index].wakeTime;
        updates.duration = this._calculateDuration(bedTime, wakeTime);
      }

      this.logs[index] = {
        ...this.logs[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.saveLogs();
      this.syncToBackend(this.logs[index]);

      analyticsService.logEvent('sleep_updated', { id });

      return this.logs[index];
    } catch (error) {
      crashReporting.logError(error, { context: 'update_sleep' });
      throw error;
    }
  }

  /**
   * Delete a sleep log
   */
  async deleteSleep(id) {
    try {
      const index = this.logs.findIndex(log => log.id === id);
      if (index === -1) {
        throw new Error('Sleep log not found');
      }

      this.logs.splice(index, 1);
      await this.saveLogs();

      // Delete from backend
      try {
        await api.deleteSleepLog(id);
      } catch (e) {
        crashReporting.logError(e, { context: 'delete_sleep_backend' });
      }

      analyticsService.logEvent('sleep_deleted', { id });

      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'delete_sleep' });
      throw error;
    }
  }

  /**
   * Get sleep logs for a date range
   */
  getLogsForRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= start && logDate <= end;
    });
  }

  /**
   * Get sleep log for a specific date
   */
  getLogForDate(date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return this.logs.find(log => log.date === dateStr);
  }

  /**
   * Get sleep statistics for a period
   */
  getStats(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = this.getLogsForRange(startDate, endDate);

      if (logs.length === 0) {
        return {
          averageDuration: 0,
          averageQuality: 0,
          totalSleep: 0,
          daysLogged: 0,
          sleepDebt: SLEEP_GOAL_HOURS * days,
          consistency: 0,
          recoveryScore: 0,
        };
      }

      const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
      const averageDuration = totalDuration / logs.length;
      const averageQuality = logs.reduce((sum, log) => sum + log.quality, 0) / logs.length;
      
      // Calculate sleep debt (hours below goal)
      const goalSleep = SLEEP_GOAL_HOURS * logs.length;
      const sleepDebt = Math.max(0, goalSleep - totalDuration);

      // Calculate consistency (how close each night is to the average)
      const variance = logs.reduce((sum, log) => {
        return sum + Math.pow(log.duration - averageDuration, 2);
      }, 0) / logs.length;
      const consistency = Math.max(0, 100 - Math.sqrt(variance) * 10);

      // Calculate recovery score (0-100)
      const recoveryScore = this._calculateRecoveryScore(averageDuration, averageQuality, consistency, sleepDebt);

      return {
        averageDuration: averageDuration, // hours
        averageQuality: averageQuality, // 1-5
        totalSleep: totalDuration, // hours
        daysLogged: logs.length,
        sleepDebt: sleepDebt, // hours
        consistency: consistency, // 0-100
        recoveryScore: recoveryScore, // 0-100
        logs: logs,
      };
    } catch (error) {
      crashReporting.logError(error, { context: 'get_sleep_stats' });
      return null;
    }
  }

  /**
   * Calculate recovery score based on sleep data
   * @private
   */
  _calculateRecoveryScore(avgDuration, avgQuality, consistency, sleepDebt) {
    // Duration score (0-40 points): 8 hours = full points
    const durationScore = Math.min(40, (avgDuration / SLEEP_GOAL_HOURS) * 40);

    // Quality score (0-30 points): 5/5 quality = full points
    const qualityScore = (avgQuality / 5) * 30;

    // Consistency score (0-20 points)
    const consistencyScore = (consistency / 100) * 20;

    // Sleep debt penalty (0-10 points deducted)
    const debtPenalty = Math.min(10, (sleepDebt / SLEEP_GOAL_HOURS) * 10);

    const total = durationScore + qualityScore + consistencyScore - debtPenalty;
    return Math.max(0, Math.min(100, total));
  }

  /**
   * Get sleep trends (weekly comparison)
   */
  getTrends() {
    const thisWeek = this.getStats(7);
    const lastWeek = this.getStats(14); // Last 14 days, then we'll extract the first 7

    // Get logs from 14-7 days ago
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 7);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    
    const lastWeekLogs = this.getLogsForRange(startDate, endDate);
    const lastWeekAvgDuration = lastWeekLogs.length > 0
      ? lastWeekLogs.reduce((sum, log) => sum + log.duration, 0) / lastWeekLogs.length
      : 0;

    return {
      thisWeek: thisWeek,
      lastWeek: {
        averageDuration: lastWeekAvgDuration,
      },
      improvement: {
        duration: thisWeek.averageDuration - lastWeekAvgDuration,
        recoveryScore: thisWeek.recoveryScore,
      },
    };
  }

  /**
   * Get formatted sleep recommendation
   */
  getRecommendation() {
    const stats = this.getStats(7);

    if (stats.daysLogged === 0) {
      return {
        type: 'info',
        title: 'Start Tracking Sleep',
        message: 'Track your sleep for 7 days to get personalized recommendations.',
      };
    }

    if (stats.sleepDebt > 10) {
      return {
        type: 'warning',
        title: 'High Sleep Debt',
        message: `You're ${stats.sleepDebt.toFixed(1)} hours behind on sleep. Consider going to bed earlier tonight.`,
        action: 'Set bedtime reminder',
      };
    }

    if (stats.averageDuration < 7) {
      return {
        type: 'warning',
        title: 'Insufficient Sleep',
        message: 'Aim for 7-9 hours of sleep per night for optimal recovery and performance.',
        action: 'Adjust sleep schedule',
      };
    }

    if (stats.consistency < 60) {
      return {
        type: 'info',
        title: 'Inconsistent Sleep',
        message: 'Try to maintain a consistent sleep schedule for better sleep quality.',
        action: 'Set sleep routine',
      };
    }

    if (stats.averageQuality < 3) {
      return {
        type: 'info',
        title: 'Poor Sleep Quality',
        message: 'Consider factors affecting your sleep: environment, stress, caffeine intake.',
        action: 'Sleep hygiene tips',
      };
    }

    return {
      type: 'success',
      title: 'Great Sleep!',
      message: `You're averaging ${stats.averageDuration.toFixed(1)} hours with good quality. Keep it up!`,
    };
  }

  /**
   * Calculate duration in hours from timestamps
   * @private
   */
  _calculateDuration(bedTime, wakeTime) {
    const start = new Date(bedTime);
    const end = new Date(wakeTime);
    const durationMs = end - start;
    return durationMs / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Sync sleep log to backend
   * @private
   */
  async syncToBackend(sleepLog) {
    try {
      await api.logSleep(sleepLog);
      
      // Update synced status
      const index = this.logs.findIndex(log => log.id === sleepLog.id);
      if (index !== -1) {
        this.logs[index].synced = true;
        await this.saveLogs();
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'sync_sleep_to_backend' });
    }
  }

  /**
   * Import sleep data from HealthKit (iOS)
   */
  async importFromHealthKit(startDate, endDate) {
    if (!this.isHealthKitAvailable) {
      throw new Error('HealthKit not available');
    }

    try {
      const AppleHealthKit = require('react-native-health');
      
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      AppleHealthKit.getSleepSamples(options, async (err, results) => {
        if (err) {
          crashReporting.logError(err, { context: 'healthkit_sleep_import' });
          return;
        }

        // Process and log each sleep session
        for (const sample of results) {
          await this.logSleep({
            date: new Date(sample.startDate).toISOString().split('T')[0],
            bedTime: sample.startDate,
            wakeTime: sample.endDate,
            source: 'healthkit',
          });
        }

        analyticsService.logEvent('sleep_imported_healthkit', {
          count: results.length,
        });
      });
    } catch (error) {
      crashReporting.logError(error, { context: 'import_healthkit_sleep' });
      throw error;
    }
  }

  /**
   * Save logs to local storage
   * @private
   */
  async saveLogs() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      crashReporting.logError(error, { context: 'save_sleep_logs' });
    }
  }

  /**
   * Load logs from local storage
   * @private
   */
  async loadLogs() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'load_sleep_logs' });
      this.logs = [];
    }
  }

  /**
   * Clear all sleep data
   */
  async clearAll() {
    this.logs = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
    crashReporting.log('Sleep data cleared', 'info');
  }
}

// Export singleton instance
const sleepTracking = new SleepTrackingService();
export default sleepTracking;


