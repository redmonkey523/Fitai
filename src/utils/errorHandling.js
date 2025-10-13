import crashReporting from '../services/crashReporting';
import Toast from 'react-native-toast-message';

/**
 * Enhanced Error Handling Utilities
 * 
 * Provides consistent error handling, user-friendly messages,
 * and automatic error reporting across the app.
 */

/**
 * Error types for classification
 */
export const ErrorType = {
  NETWORK: 'network',
  AUTH: 'authentication',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  UNKNOWN: 'unknown',
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',       // Non-critical, user can continue
  MEDIUM: 'medium', // Important but not blocking
  HIGH: 'high',     // Blocks current action
  CRITICAL: 'critical', // App-breaking, needs immediate attention
};

/**
 * Classify error type from error object
 */
export function classifyError(error) {
  const message = error?.message?.toLowerCase() || '';
  const status = error?.response?.status;

  // Network errors
  if (
    message.includes('network request failed') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('network error') ||
    !navigator.onLine
  ) {
    return ErrorType.NETWORK;
  }

  // Authentication errors
  if (
    status === 401 ||
    status === 403 ||
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('token')
  ) {
    return ErrorType.AUTH;
  }

  // Validation errors
  if (
    status === 400 ||
    status === 422 ||
    message.includes('validation') ||
    message.includes('invalid')
  ) {
    return ErrorType.VALIDATION;
  }

  // Permission errors
  if (
    message.includes('permission') ||
    message.includes('denied') ||
    message.includes('not authorized')
  ) {
    return ErrorType.PERMISSION;
  }

  // Not found errors
  if (status === 404 || message.includes('not found')) {
    return ErrorType.NOT_FOUND;
  }

  // Server errors
  if (status >= 500 || message.includes('server error')) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Determine error severity
 */
export function getErrorSeverity(errorType, context = {}) {
  switch (errorType) {
    case ErrorType.NETWORK:
      return context.offline ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    
    case ErrorType.AUTH:
      return ErrorSeverity.HIGH;
    
    case ErrorType.VALIDATION:
      return ErrorSeverity.LOW;
    
    case ErrorType.PERMISSION:
      return ErrorSeverity.HIGH;
    
    case ErrorType.NOT_FOUND:
      return ErrorSeverity.MEDIUM;
    
    case ErrorType.SERVER:
      return ErrorSeverity.CRITICAL;
    
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(errorType, error = null) {
  const messages = {
    [ErrorType.NETWORK]: {
      title: 'Connection Issue',
      message: 'Please check your internet connection and try again.',
      suggestion: 'Your data has been saved and will sync when you\'re back online.',
    },
    [ErrorType.AUTH]: {
      title: 'Authentication Required',
      message: 'Please log in again to continue.',
      suggestion: 'Your session may have expired.',
    },
    [ErrorType.VALIDATION]: {
      title: 'Invalid Input',
      message: error?.response?.data?.message || 'Please check your input and try again.',
      suggestion: 'Make sure all required fields are filled correctly.',
    },
    [ErrorType.PERMISSION]: {
      title: 'Permission Denied',
      message: 'This feature requires additional permissions.',
      suggestion: 'Please grant permission in your device settings.',
    },
    [ErrorType.NOT_FOUND]: {
      title: 'Not Found',
      message: 'The requested item could not be found.',
      suggestion: 'It may have been deleted or moved.',
    },
    [ErrorType.SERVER]: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      suggestion: 'Our team has been notified and is working on a fix.',
    },
    [ErrorType.UNKNOWN]: {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred.',
      suggestion: 'Please try again. If the problem persists, contact support.',
    },
  };

  return messages[errorType] || messages[ErrorType.UNKNOWN];
}

/**
 * Show error toast with appropriate styling
 */
export function showErrorToast(errorType, customMessage = null) {
  const friendlyMessage = getUserFriendlyMessage(errorType);
  const severity = getErrorSeverity(errorType);

  let toastType = 'error';
  if (severity === ErrorSeverity.LOW) toastType = 'info';
  if (severity === ErrorSeverity.MEDIUM) toastType = 'error';
  if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) toastType = 'error';

  Toast.show({
    type: toastType,
    text1: customMessage?.title || friendlyMessage.title,
    text2: customMessage?.message || friendlyMessage.message,
    visibilityTime: severity === ErrorSeverity.CRITICAL ? 6000 : 4000,
    position: 'top',
  });
}

/**
 * Main error handler - use this for all try/catch blocks
 * 
 * @param {Error} error - The error object
 * @param {Object} options - Configuration options
 * @param {string} options.context - Context where error occurred (for logging)
 * @param {string} options.fallbackMessage - Custom fallback message
 * @param {boolean} options.showToast - Whether to show toast (default: true)
 * @param {boolean} options.report - Whether to report to crashReporting (default: true)
 * @param {function} options.onRetry - Retry callback
 */
export function handleError(error, options = {}) {
  const {
    context = 'unknown',
    fallbackMessage = null,
    showToast = true,
    report = true,
    onRetry = null,
  } = options;

  // Classify error
  const errorType = classifyError(error);
  const severity = getErrorSeverity(errorType, { context });

  // Log to crash reporting service
  if (report) {
    crashReporting.logError(error, {
      context,
      errorType,
      severity,
      ...options,
    });
  }

  // Show user-friendly toast
  if (showToast) {
    const customMessage = fallbackMessage ? {
      title: 'Error',
      message: fallbackMessage,
    } : null;
    
    showErrorToast(errorType, customMessage);
  }

  // Return error details for component to use
  return {
    type: errorType,
    severity,
    message: getUserFriendlyMessage(errorType, error),
    canRetry: errorType === ErrorType.NETWORK || errorType === ErrorType.SERVER,
    onRetry,
  };
}

/**
 * Async error wrapper - wraps async functions with error handling
 * 
 * Usage:
 * const result = await withErrorHandling(
 *   async () => await api.fetchData(),
 *   { context: 'fetch_data' }
 * );
 */
export async function withErrorHandling(asyncFn, options = {}) {
  try {
    return await asyncFn();
  } catch (error) {
    const errorDetails = handleError(error, options);
    
    // Re-throw for component to handle if needed
    if (options.rethrow) {
      throw error;
    }
    
    return { error: errorDetails };
  }
}

/**
 * Create retry mechanism with exponential backoff
 */
export async function retryWithBackoff(
  asyncFn,
  options = {}
) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    context = 'retry',
    onAttempt = null,
  } = options;

  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (onAttempt) {
        onAttempt(attempt, maxAttempts);
      }
      
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      const errorType = classifyError(error);
      
      // Don't retry certain error types
      if (
        errorType === ErrorType.AUTH ||
        errorType === ErrorType.VALIDATION ||
        errorType === ErrorType.NOT_FOUND
      ) {
        throw error;
      }
      
      // If this was the last attempt, throw
      if (attempt === maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      crashReporting.log(
        `Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`,
        'info',
        { context, error: error.message }
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed
  throw lastError;
}

/**
 * Circuit breaker pattern - prevents repeated failed calls
 */
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = null;
  }

  async execute(asyncFn, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        // Circuit is open, return fallback
        crashReporting.log(
          `Circuit breaker ${this.name} is OPEN`,
          'warning'
        );
        
        if (fallback) {
          return fallback();
        }
        
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      } else {
        // Try to close circuit
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await asyncFn();
      
      // Success - reset circuit
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
        crashReporting.log(
          `Circuit breaker ${this.name} closed`,
          'info'
        );
      }
      
      return result;
    } catch (error) {
      this.failures++;
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.resetTimeout;
        
        crashReporting.log(
          `Circuit breaker ${this.name} opened after ${this.failures} failures`,
          'error'
        );
      }
      
      throw error;
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextAttempt = null;
  }
}

// Export circuit breaker for external use
export const circuitBreakers = new Map();

/**
 * Get or create a circuit breaker
 */
export function getCircuitBreaker(name, options = {}) {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, options));
  }
  return circuitBreakers.get(name);
}

/**
 * Validate input with user-friendly errors
 */
export function validateInput(value, rules) {
  const errors = [];

  if (rules.required && (!value || value.toString().trim() === '')) {
    errors.push(`${rules.fieldName || 'Field'} is required`);
  }

  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${rules.fieldName || 'Field'} must be at least ${rules.minLength} characters`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${rules.fieldName || 'Field'} must be at most ${rules.maxLength} characters`);
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || `${rules.fieldName || 'Field'} format is invalid`);
  }

  if (rules.min !== undefined && Number(value) < rules.min) {
    errors.push(`${rules.fieldName || 'Field'} must be at least ${rules.min}`);
  }

  if (rules.max !== undefined && Number(value) > rules.max) {
    errors.push(`${rules.fieldName || 'Field'} must be at most ${rules.max}`);
  }

  if (rules.custom && !rules.custom(value)) {
    errors.push(rules.customMessage || `${rules.fieldName || 'Field'} is invalid`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Batch validation for multiple fields
 */
export function validateForm(formData, validationRules) {
  const results = {};
  let isValid = true;

  Object.keys(validationRules).forEach(fieldName => {
    const value = formData[fieldName];
    const rules = { ...validationRules[fieldName], fieldName };
    const result = validateInput(value, rules);
    
    results[fieldName] = result;
    if (!result.isValid) {
      isValid = false;
    }
  });

  return {
    isValid,
    fields: results,
    errors: Object.entries(results)
      .filter(([_, result]) => !result.isValid)
      .reduce((acc, [field, result]) => ({
        ...acc,
        [field]: result.errors,
      }), {}),
  };
}

export default {
  ErrorType,
  ErrorSeverity,
  classifyError,
  getErrorSeverity,
  getUserFriendlyMessage,
  showErrorToast,
  handleError,
  withErrorHandling,
  retryWithBackoff,
  getCircuitBreaker,
  validateInput,
  validateForm,
};


