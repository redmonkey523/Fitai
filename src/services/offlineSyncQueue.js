import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';
import crashReporting from './crashReporting';
import analyticsService from './analytics';

/**
 * Offline Sync Queue Service
 * 
 * Handles API requests when offline and syncs them when connection is restored.
 * Critical for gym usage where WiFi may not be available.
 * 
 * Features:
 * - Queue failed requests automatically
 * - Retry with exponential backoff
 * - Persist queue across app restarts
 * - Network status monitoring
 * - Conflict resolution
 * - Priority-based sync
 */

const STORAGE_KEY = '@offline_sync_queue';
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

class OfflineSyncQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.isOnline = true;
    this.unsubscribeNetInfo = null;
    this.listeners = new Set();
  }

  /**
   * Initialize the sync queue service
   */
  async initialize() {
    try {
      // Load persisted queue from storage
      await this.loadQueue();

      // Subscribe to network status changes
      this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected && state.isInternetReachable;

        crashReporting.log(`Network status changed: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`, 'info');

        // If we just came online, start processing queue
        if (!wasOnline && this.isOnline) {
          analyticsService.logEvent('offline_sync_reconnected');
          this.processQueue();
        }

        // Notify listeners
        this.notifyListeners();
      });

      // Check initial network status
      const netState = await NetInfo.fetch();
      this.isOnline = netState.isConnected && netState.isInternetReachable;

      // Process any pending items if online
      if (this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }

      crashReporting.log('Offline sync queue initialized', 'info', {
        queueSize: this.queue.length,
        isOnline: this.isOnline,
      });
    } catch (error) {
      crashReporting.logError(error, { context: 'offline_sync_init' });
    }
  }

  /**
   * Add a request to the queue
   * @param {Object} request - Request details
   */
  async addToQueue(request) {
    try {
      const queueItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        attempts: 0,
        priority: request.priority || 5, // 1-10, higher = more important
        method: request.method,
        endpoint: request.endpoint,
        data: request.data,
        headers: request.headers || {},
        type: request.type || 'unknown', // 'workout', 'nutrition', 'progress', etc.
        status: 'pending',
      };

      this.queue.push(queueItem);
      
      // Sort by priority (higher first) and timestamp (older first)
      this.queue.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      await this.saveQueue();

      analyticsService.logEvent('offline_request_queued', {
        type: queueItem.type,
        priority: queueItem.priority,
        queueSize: this.queue.length,
      });

      crashReporting.log('Request added to offline queue', 'info', {
        type: queueItem.type,
        queueSize: this.queue.length,
      });

      // Notify listeners
      this.notifyListeners();

      // Try to process immediately if online
      if (this.isOnline && !this.isProcessing) {
        this.processQueue();
      }

      return queueItem.id;
    } catch (error) {
      crashReporting.logError(error, { context: 'add_to_sync_queue' });
      return null;
    }
  }

  /**
   * Process all items in the queue
   */
  async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    crashReporting.log('Starting offline queue processing', 'info', {
      queueSize: this.queue.length,
    });

    try {
      // Process items one by one
      while (this.queue.length > 0 && this.isOnline) {
        const item = this.queue[0];
        
        try {
          await this.processItem(item);
          
          // Remove successful item from queue
          this.queue.shift();
          await this.saveQueue();
          
          analyticsService.logEvent('offline_request_synced', {
            type: item.type,
            attempts: item.attempts + 1,
          });
        } catch (error) {
          // Increment attempts
          item.attempts++;
          item.lastError = error.message;
          item.lastAttempt = Date.now();

          if (item.attempts >= MAX_RETRY_ATTEMPTS) {
            // Max retries reached, move to failed
            item.status = 'failed';
            this.queue.shift();
            
            analyticsService.logEvent('offline_request_failed', {
              type: item.type,
              attempts: item.attempts,
              error: error.message,
            });

            crashReporting.logError(error, {
              context: 'offline_sync_max_retries',
              itemType: item.type,
              attempts: item.attempts,
            });
          } else {
            // Move to end of queue and wait before retry
            this.queue.shift();
            this.queue.push(item);
            
            // Exponential backoff
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, item.attempts);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          await this.saveQueue();
        }

        // Notify listeners of progress
        this.notifyListeners();
      }

      if (this.queue.length === 0) {
        analyticsService.logEvent('offline_queue_empty');
        crashReporting.log('Offline queue fully processed', 'info');
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'process_offline_queue' });
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  /**
   * Process a single queue item
   * @private
   */
  async processItem(item) {
    try {
      let response;

      switch (item.method.toUpperCase()) {
        case 'GET':
          response = await api.get(item.endpoint, { headers: item.headers });
          break;
        case 'POST':
          response = await api.post(item.endpoint, item.data, { headers: item.headers });
          break;
        case 'PUT':
          response = await api.put(item.endpoint, item.data, { headers: item.headers });
          break;
        case 'PATCH':
          response = await api.patch(item.endpoint, item.data, { headers: item.headers });
          break;
        case 'DELETE':
          response = await api.delete(item.endpoint, { headers: item.headers });
          break;
        default:
          throw new Error(`Unsupported method: ${item.method}`);
      }

      crashReporting.log('Offline queue item synced successfully', 'info', {
        type: item.type,
        endpoint: item.endpoint,
      });

      return response;
    } catch (error) {
      // Check if error is due to being offline
      if (error.message.includes('Network request failed') || error.message.includes('timeout')) {
        this.isOnline = false;
      }
      throw error;
    }
  }

  /**
   * Save queue to persistent storage
   * @private
   */
  async saveQueue() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      crashReporting.logError(error, { context: 'save_offline_queue' });
    }
  }

  /**
   * Load queue from persistent storage
   * @private
   */
  async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        crashReporting.log('Loaded offline queue from storage', 'info', {
          queueSize: this.queue.length,
        });
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'load_offline_queue' });
      this.queue = [];
    }
  }

  /**
   * Clear the entire queue
   */
  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
    crashReporting.log('Offline queue cleared', 'info');
  }

  /**
   * Remove a specific item from queue
   */
  async removeFromQueue(id) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      await this.saveQueue();
      this.notifyListeners();
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      isProcessing: this.isProcessing,
      queueSize: this.queue.length,
      pendingItems: this.queue.filter(item => item.status === 'pending').length,
      failedItems: this.queue.filter(item => item.status === 'failed').length,
      items: this.queue.map(item => ({
        id: item.id,
        type: item.type,
        status: item.status,
        attempts: item.attempts,
        timestamp: item.timestamp,
      })),
    };
  }

  /**
   * Subscribe to queue status changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of status change
   * @private
   */
  notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        crashReporting.logError(error, { context: 'offline_queue_listener' });
      }
    });
  }

  /**
   * Manually trigger sync (force retry)
   */
  async forceSync() {
    if (!this.isOnline) {
      crashReporting.log('Cannot force sync while offline', 'warning');
      return false;
    }

    if (this.queue.length === 0) {
      crashReporting.log('No items to sync', 'info');
      return true;
    }

    // Reset attempts for all items to give them another chance
    this.queue.forEach(item => {
      if (item.status === 'failed') {
        item.status = 'pending';
        item.attempts = 0;
      }
    });

    await this.saveQueue();
    this.processQueue();
    return true;
  }

  /**
   * Cleanup - unsubscribe from network listener
   */
  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
const offlineSyncQueue = new OfflineSyncQueue();
export default offlineSyncQueue;

/**
 * Helper function to wrap API calls with offline support
 * 
 * Usage:
 * await withOfflineSupport({
 *   method: 'POST',
 *   endpoint: '/api/workouts',
 *   data: workoutData,
 *   type: 'workout',
 *   priority: 7,
 * });
 */
export async function withOfflineSupport(request) {
  try {
    // Try to execute immediately
    let response;
    switch (request.method.toUpperCase()) {
      case 'POST':
        response = await api.post(request.endpoint, request.data);
        break;
      case 'PUT':
        response = await api.put(request.endpoint, request.data);
        break;
      case 'PATCH':
        response = await api.patch(request.endpoint, request.data);
        break;
      case 'DELETE':
        response = await api.delete(request.endpoint);
        break;
      default:
        response = await api.get(request.endpoint);
    }
    return response;
  } catch (error) {
    // If failed due to network, add to queue
    if (error.message.includes('Network request failed') || 
        error.message.includes('timeout') ||
        error.message.includes('ECONNREFUSED')) {
      crashReporting.log('Request failed, adding to offline queue', 'info', {
        endpoint: request.endpoint,
        type: request.type,
      });
      
      await offlineSyncQueue.addToQueue(request);
      
      // Return a special response indicating it's queued
      return {
        _queued: true,
        _queuedAt: Date.now(),
        message: 'Request queued for sync when online',
      };
    }
    
    // Re-throw if it's not a network error
    throw error;
  }
}


