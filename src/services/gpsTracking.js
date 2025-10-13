import * as Location from 'expo-location';
import { Platform } from 'react-native';
import crashReporting from './crashReporting';
import analyticsService from './analytics';

/**
 * GPS Tracking Service for Outdoor Workouts
 * 
 * Features:
 * - Real-time location tracking
 * - Route mapping
 * - Distance, pace, elevation calculation
 * - Background tracking support
 * - Battery-efficient tracking
 * - Pause/resume functionality
 * 
 * Use cases:
 * - Running
 * - Cycling
 * - Hiking
 * - Walking
 */

class GPSTrackingService {
  constructor() {
    this.isTracking = false;
    this.isPaused = false;
    this.locationSubscription = null;
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedTime = 0;
    
    // Route data
    this.coordinates = [];
    this.distances = []; // Cumulative distance at each point
    this.elevations = [];
    this.timestamps = [];
    this.speeds = [];
    
    // Permissions
    this.hasPermission = false;
    this.isAvailable = Platform.OS !== 'web'; // GPS not reliable on web
  }

  /**
   * Check if GPS tracking is available on this device
   */
  async checkAvailability() {
    try {
      const available = await Location.hasServicesEnabledAsync();
      this.isAvailable = available && Platform.OS !== 'web';
      return this.isAvailable;
    } catch (error) {
      crashReporting.logError(error, { context: 'gps_availability_check' });
      return false;
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions() {
    try {
      // First check if services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          granted: false,
          reason: 'Location services are disabled. Please enable them in your device settings.',
        };
      }

      // Request foreground permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return {
          granted: false,
          reason: 'Location permission is required to track your outdoor workouts.',
        };
      }

      // Request background permissions (for continuous tracking)
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        const bgStatus = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus.status !== 'granted') {
          crashReporting.log('Background location permission not granted', 'warning');
          // Continue anyway - foreground tracking still works
        }
      }

      this.hasPermission = true;
      analyticsService.logEvent('gps_permission_granted');
      return { granted: true };
    } catch (error) {
      crashReporting.logError(error, { context: 'gps_request_permissions' });
      return {
        granted: false,
        reason: 'Failed to request location permissions.',
      };
    }
  }

  /**
   * Start GPS tracking for a workout
   * @param {Object} options - Tracking options
   * @param {function} onUpdate - Callback for location updates
   */
  async startTracking(options = {}, onUpdate = null) {
    try {
      if (this.isTracking) {
        crashReporting.log('GPS tracking already active', 'warning');
        return false;
      }

      if (!this.hasPermission) {
        const permResult = await this.requestPermissions();
        if (!permResult.granted) {
          return false;
        }
      }

      // Reset tracking data
      this.coordinates = [];
      this.distances = [0];
      this.elevations = [];
      this.timestamps = [];
      this.speeds = [];
      this.totalPausedTime = 0;
      this.startTime = Date.now();
      this.pauseTime = null;

      // Configure tracking settings
      const trackingOptions = {
        accuracy: options.accuracy || Location.Accuracy.High,
        timeInterval: options.interval || 2000, // Update every 2 seconds
        distanceInterval: options.distanceInterval || 5, // Update every 5 meters
        showsBackgroundLocationIndicator: true,
      };

      // Start tracking
      this.locationSubscription = await Location.watchPositionAsync(
        trackingOptions,
        (location) => {
          if (!this.isPaused) {
            this._processLocationUpdate(location);
            
            // Call onUpdate callback with current stats
            if (onUpdate) {
              onUpdate(this.getCurrentStats());
            }
          }
        }
      );

      this.isTracking = true;
      this.isPaused = false;
      
      analyticsService.logEvent('gps_tracking_started', {
        accuracy: trackingOptions.accuracy,
        interval: trackingOptions.timeInterval,
      });

      crashReporting.log('GPS tracking started', 'info');
      return true;
    } catch (error) {
      crashReporting.logError(error, { context: 'gps_start_tracking' });
      return false;
    }
  }

  /**
   * Pause tracking (stops collecting points but keeps timer running)
   */
  pauseTracking() {
    if (!this.isTracking || this.isPaused) return;
    
    this.isPaused = true;
    this.pauseTime = Date.now();
    
    analyticsService.logEvent('gps_tracking_paused');
    crashReporting.log('GPS tracking paused', 'info');
  }

  /**
   * Resume tracking after pause
   */
  resumeTracking() {
    if (!this.isTracking || !this.isPaused) return;
    
    if (this.pauseTime) {
      this.totalPausedTime += Date.now() - this.pauseTime;
    }
    
    this.isPaused = false;
    this.pauseTime = null;
    
    analyticsService.logEvent('gps_tracking_resumed');
    crashReporting.log('GPS tracking resumed', 'info');
  }

  /**
   * Stop tracking and return final stats
   */
  async stopTracking() {
    try {
      if (!this.isTracking) return null;

      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      this.isTracking = false;
      this.isPaused = false;

      const finalStats = this.getCurrentStats();
      
      analyticsService.logEvent('gps_tracking_stopped', {
        duration: finalStats.duration,
        distance: finalStats.distance,
        points: finalStats.points,
      });

      crashReporting.log('GPS tracking stopped', 'info', {
        distance: finalStats.distance,
        duration: finalStats.duration,
      });

      return finalStats;
    } catch (error) {
      crashReporting.logError(error, { context: 'gps_stop_tracking' });
      return null;
    }
  }

  /**
   * Process incoming location update
   * @private
   */
  _processLocationUpdate(location) {
    const { coords, timestamp } = location;
    const { latitude, longitude, altitude, speed } = coords;

    // Add coordinate
    this.coordinates.push({
      latitude,
      longitude,
      altitude: altitude || 0,
      timestamp,
    });

    // Calculate distance from previous point
    if (this.coordinates.length > 1) {
      const prevCoord = this.coordinates[this.coordinates.length - 2];
      const distance = this._calculateDistance(
        prevCoord.latitude,
        prevCoord.longitude,
        latitude,
        longitude
      );
      
      const prevDistance = this.distances[this.distances.length - 1] || 0;
      this.distances.push(prevDistance + distance);
    }

    // Store elevation, speed, timestamp
    this.elevations.push(altitude || 0);
    this.speeds.push(speed || 0);
    this.timestamps.push(timestamp);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this._toRadians(lat2 - lat1);
    const dLon = this._toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRadians(lat1)) *
        Math.cos(this._toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  _toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get current tracking statistics
   */
  getCurrentStats() {
    const now = Date.now();
    const elapsedTime = this.startTime ? now - this.startTime - this.totalPausedTime : 0;
    const activeTime = this.isPaused ? elapsedTime - (now - this.pauseTime) : elapsedTime;
    
    const totalDistance = this.distances.length > 0 
      ? this.distances[this.distances.length - 1] 
      : 0;
    
    const averageSpeed = activeTime > 0 
      ? (totalDistance / (activeTime / 1000)) // m/s
      : 0;
    
    const pace = averageSpeed > 0 
      ? (1000 / 60) / averageSpeed // min/km
      : 0;
    
    // Calculate elevation gain/loss
    let elevationGain = 0;
    let elevationLoss = 0;
    for (let i = 1; i < this.elevations.length; i++) {
      const diff = this.elevations[i] - this.elevations[i - 1];
      if (diff > 0) elevationGain += diff;
      else elevationLoss += Math.abs(diff);
    }

    return {
      distance: totalDistance, // meters
      duration: elapsedTime, // milliseconds
      activeDuration: activeTime, // milliseconds (excluding paused time)
      averageSpeed: averageSpeed, // m/s
      currentSpeed: this.speeds.length > 0 ? this.speeds[this.speeds.length - 1] : 0, // m/s
      pace: pace, // min/km
      elevationGain: elevationGain, // meters
      elevationLoss: elevationLoss, // meters
      points: this.coordinates.length,
      coordinates: this.coordinates,
      isPaused: this.isPaused,
      isTracking: this.isTracking,
    };
  }

  /**
   * Get route coordinates for map display
   */
  getRouteCoordinates() {
    return this.coordinates.map(coord => ({
      latitude: coord.latitude,
      longitude: coord.longitude,
    }));
  }

  /**
   * Export route data (for saving to backend)
   */
  exportRouteData() {
    return {
      coordinates: this.coordinates,
      distances: this.distances,
      elevations: this.elevations,
      speeds: this.speeds,
      timestamps: this.timestamps,
      stats: this.getCurrentStats(),
    };
  }

  /**
   * Get formatted stats for display
   */
  getFormattedStats() {
    const stats = this.getCurrentStats();
    
    return {
      distance: `${(stats.distance / 1000).toFixed(2)} km`,
      duration: this._formatDuration(stats.duration),
      activeDuration: this._formatDuration(stats.activeDuration),
      pace: `${Math.floor(stats.pace)}:${String(Math.floor((stats.pace % 1) * 60)).padStart(2, '0')} /km`,
      speed: `${(stats.averageSpeed * 3.6).toFixed(1)} km/h`,
      elevationGain: `${Math.round(stats.elevationGain)} m`,
      elevationLoss: `${Math.round(stats.elevationLoss)} m`,
    };
  }

  _formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Clear all tracking data
   */
  clearData() {
    this.coordinates = [];
    this.distances = [];
    this.elevations = [];
    this.timestamps = [];
    this.speeds = [];
    this.startTime = null;
    this.pauseTime = null;
    this.totalPausedTime = 0;
  }
}

// Export singleton instance
const gpsTracking = new GPSTrackingService();
export default gpsTracking;


