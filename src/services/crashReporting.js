/**
 * Unified Crash Reporting and Error Tracking Service
 * Integrates Sentry and Firebase Crashlytics
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Lazy load Firebase (optional - only if configured)
let crashlytics = null;
try {
  const firebase = require('@react-native-firebase/crashlytics');
  crashlytics = firebase.default();
} catch (error) {
  console.warn('[CrashReporting] Firebase Crashlytics not available:', error.message);
}

const IS_DEV = __DEV__;
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN;

class CrashReportingService {
  constructor() {
    this.initialized = false;
    this.sentryEnabled = false;
    this.crashlyticsEnabled = false;
  }

  /**
   * Initialize crash reporting services
   */
  init() {
    if (this.initialized) return;

    // Initialize Sentry
    if (SENTRY_DSN && !IS_DEV) {
      try {
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: IS_DEV ? 'development' : 'production',
          enabled: !IS_DEV,
          enableAutoSessionTracking: true,
          sessionTrackingIntervalMillis: 30000,
          
          // Performance monitoring
          tracesSampleRate: 0.2, // 20% of transactions
          
          // Privacy
          beforeSend(event) {
            // Strip sensitive data
            if (event.request?.cookies) {
              delete event.request.cookies;
            }
            if (event.user?.email) {
              event.user.email = event.user.email.replace(/(.{2}).*(@.*)/, '$1***$2');
            }
            return event;
          },
          
          // Integrations
          integrations: [
            new Sentry.ReactNativeTracing({
              routingInstrumentation: Sentry.reactNavigationIntegration,
              tracingOrigins: ['localhost', /^\//],
            }),
          ],
        });
        
        this.sentryEnabled = true;
        console.log('[CrashReporting] Sentry initialized');
      } catch (error) {
        console.error('[CrashReporting] Failed to initialize Sentry:', error);
      }
    } else if (IS_DEV) {
      console.log('[CrashReporting] Sentry disabled in development');
    } else {
      console.warn('[CrashReporting] Sentry DSN not configured');
    }

    // Initialize Firebase Crashlytics
    if (crashlytics) {
      try {
        // Enable Crashlytics collection (can be disabled for privacy)
        crashlytics.setCrashlyticsCollectionEnabled(!IS_DEV);
        this.crashlyticsEnabled = !IS_DEV;
        
        if (this.crashlyticsEnabled) {
          console.log('[CrashReporting] Firebase Crashlytics initialized');
        }
      } catch (error) {
        console.error('[CrashReporting] Failed to initialize Crashlytics:', error);
      }
    }

    this.initialized = true;
  }

  /**
   * Set user context for error reports
   * @param {Object} user - User object with id, email, etc.
   */
  setUser(user) {
    if (!user) {
      this.clearUser();
      return;
    }

    const userInfo = {
      id: user.id || user._id,
      email: user.email,
      username: user.username || user.name,
    };

    // Sentry
    if (this.sentryEnabled) {
      Sentry.setUser(userInfo);
    }

    // Crashlytics
    if (this.crashlyticsEnabled && crashlytics) {
      crashlytics.setUserId(userInfo.id?.toString() || '');
      crashlytics.setAttribute('email', userInfo.email || '');
      crashlytics.setAttribute('username', userInfo.username || '');
    }

    console.log('[CrashReporting] User context set:', userInfo.id);
  }

  /**
   * Clear user context
   */
  clearUser() {
    // Sentry
    if (this.sentryEnabled) {
      Sentry.setUser(null);
    }

    // Crashlytics
    if (this.crashlyticsEnabled && crashlytics) {
      crashlytics.setUserId('');
    }

    console.log('[CrashReporting] User context cleared');
  }

  /**
   * Log a non-fatal error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  logError(error, context = {}) {
    try {
      console.error('[CrashReporting] Error:', error, context);

      // Only send to external services if initialized
      if (!this.initialized) return;

      // Sentry
      if (this.sentryEnabled && Sentry) {
        Sentry.withScope((scope) => {
          Object.keys(context).forEach((key) => {
            scope.setExtra(key, context[key]);
          });
          Sentry.captureException(error);
        });
      }

      // Crashlytics
      if (this.crashlyticsEnabled && crashlytics) {
        crashlytics.recordError(error);
        Object.keys(context).forEach((key) => {
          crashlytics.setAttribute(key, JSON.stringify(context[key]));
        });
      }
    } catch (logError) {
      // Fallback to console if there's any error in logging
      console.error('[CrashReporting] Error:', error);
      console.error('[CrashReporting] Error in logError:', logError);
    }
  }

  /**
   * Log a message (for debugging/tracking)
   * @param {string} message - Log message
   * @param {string} level - Log level: 'debug' | 'info' | 'warning' | 'error'
   * @param {Object} context - Additional context data
   */
  logMessage(message, level = 'info', context = {}) {
    try {
      const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
      console.log(`[CrashReporting] ${level.toUpperCase()}: ${message}${contextStr}`);

      // Only send to external services if initialized
      if (!this.initialized) return;

      // Sentry
      if (this.sentryEnabled && Sentry) {
        Sentry.withScope((scope) => {
          Object.keys(context).forEach((key) => {
            scope.setExtra(key, context[key]);
          });
          Sentry.captureMessage(message, level);
        });
      }

      // Crashlytics
      if (this.crashlyticsEnabled && crashlytics) {
        crashlytics.log(message);
        Object.keys(context).forEach((key) => {
          crashlytics.setAttribute(key, JSON.stringify(context[key]));
        });
      }
    } catch (error) {
      // Fallback to console if there's any error in logging
      console.log(`[CrashReporting] ${level.toUpperCase()}: ${message}`);
      console.error('[CrashReporting] Error in logMessage:', error);
    }
  }

  /**
   * Alias for logMessage() - shorter syntax
   * @param {string} message - Log message
   * @param {string} level - Log level: 'debug' | 'info' | 'warning' | 'error'
   * @param {Object} context - Additional context data
   */
  log(message, level = 'info', context = {}) {
    return this.logMessage(message, level, context);
  }

  /**
   * Add breadcrumb for debugging context
   * @param {Object} breadcrumb - Breadcrumb object
   */
  addBreadcrumb(breadcrumb) {
    // Sentry
    if (this.sentryEnabled) {
      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category || 'default',
        level: breadcrumb.level || 'info',
        data: breadcrumb.data || {},
      });
    }

    // Crashlytics (logs only)
    if (this.crashlyticsEnabled && crashlytics) {
      crashlytics.log(`[${breadcrumb.category}] ${breadcrumb.message}`);
    }
  }

  /**
   * Track navigation/screen view
   * @param {string} screenName - Name of the screen
   * @param {Object} params - Screen parameters
   */
  trackScreen(screenName, params = {}) {
    this.addBreadcrumb({
      message: `Screen: ${screenName}`,
      category: 'navigation',
      data: params,
    });
  }

  /**
   * Set custom attribute/tag
   * @param {string} key - Attribute key
   * @param {string} value - Attribute value
   */
  setAttribute(key, value) {
    // Sentry
    if (this.sentryEnabled) {
      Sentry.setTag(key, value);
    }

    // Crashlytics
    if (this.crashlyticsEnabled && crashlytics) {
      crashlytics.setAttribute(key, value);
    }
  }

  /**
   * Test crash reporting (for debugging)
   * WARNING: This will cause a real crash!
   */
  testCrash() {
    if (IS_DEV) {
      console.warn('[CrashReporting] Test crash requested (disabled in dev)');
      return;
    }

    if (this.crashlyticsEnabled && crashlytics) {
      crashlytics.crash();
    } else {
      throw new Error('Test crash from CrashReportingService');
    }
  }
}

// Export singleton instance
const crashReportingInstance = new CrashReportingService();

// Verify the instance has the log method
if (typeof crashReportingInstance.log !== 'function') {
  console.error('[CrashReporting] ERROR: log method not found on instance!');
}

// Export both as default and named export for compatibility
export default crashReportingInstance;
export { crashReportingInstance as crashReporting };

