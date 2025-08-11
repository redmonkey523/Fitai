// API Configuration - Environment-driven (no literals)
const resolveApiBaseUrl = () => {
  let resolved = undefined;
  try {
    const Constants = require('expo-constants').default;
    // Prefer app.config.js runtime extra.apiUrl
    if (Constants?.expoConfig?.extra?.apiUrl) {
      resolved = Constants.expoConfig.extra.apiUrl;
    }
  } catch (err) {
    // non-Expo runtime
  }
  // Env fallbacks
  resolved =
    resolved ||
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    process.env.API_BASE_URL ||
    '';

  if (!resolved) {
    console.warn('API base URL not set. Set EXPO_PUBLIC_API_URL for mobile/web or API_BASE_URL for backend.');
  }
  console.log('🌐 API Base URL:', resolved);
  return resolved;
};

export const API_BASE_URL = resolveApiBaseUrl();

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
  },
  
  // Users
  USERS: {
    PROFILE: '/users/profile',
    SETTINGS: '/users/settings',
    STATS: '/users/stats',
  },
  
  // Workouts
  WORKOUTS: {
    LIST: '/workouts',
    CREATE: '/workouts',
    DETAIL: (id) => `/workouts/${id}`,
    UPDATE: (id) => `/workouts/${id}`,
    DELETE: (id) => `/workouts/${id}`,
    START: (id) => `/workouts/${id}/start`,
    COMPLETE: (id) => `/workouts/${id}/complete`,
  },
  
  // Nutrition
  NUTRITION: {
    LOG: '/nutrition/log',
    HISTORY: '/nutrition/history',
    GOALS: '/nutrition/goals',
    SEARCH: '/nutrition/search',
  },
  
  // Progress
  PROGRESS: {
    TRACK: '/progress/track',
    HISTORY: '/progress/history',
    PHOTOS: '/progress/photos',
    MEASUREMENTS: '/progress/measurements',
  },
  
  // Social
  SOCIAL: {
    FEED: '/social/feed',
    FRIENDS: '/social/friends',
    CHALLENGES: '/social/challenges',
    LEADERBOARD: '/social/leaderboard',
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    WORKOUTS: '/analytics/workouts',
    NUTRITION: '/analytics/nutrition',
    PROGRESS: '/analytics/progress',
  },
  
  // AI
  AI: {
    SCAN_FOOD: '/ai/scan-food',
    SCAN_BARCODE: '/ai/scan-barcode',
    RECOMMEND_WORKOUT: '/ai/recommend-workout',
    ANALYZE_PROGRESS: '/ai/analyze-progress',
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    PROGRESS_PHOTO: '/upload/progress-photo',
  },
};

// Request timeout (30 seconds)
export const REQUEST_TIMEOUT = 30000;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  BACKOFF_MULTIPLIER: 2,
};
