// API Configuration - Environment-driven with smart LAN fallback for mobile
const resolveApiBaseUrl = () => {
  let resolved = undefined;
  let devHost = undefined;
  try {
    const Constants = require('expo-constants').default;
    // Prefer app.config.js runtime extra.apiUrl
    const extraUrl = Constants?.expoConfig?.extra?.apiUrl;
    if (extraUrl && typeof extraUrl === 'string' && !/^\$\{.+\}$/.test(extraUrl)) {
      resolved = extraUrl;
    }
    // Derive dev host (LAN) from hostUri/debuggerHost for physical devices
    const rawHostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || Constants?.manifest2?.extra?.expoClient?.hostUri;
    if (rawHostUri && typeof rawHostUri === 'string') {
      devHost = String(rawHostUri).split(':')[0];
    }
  } catch (err) {
    // non-Expo runtime
  }
  // Env fallbacks
  resolved =
    resolved ||
    (process.env.EXPO_PUBLIC_API_URL && !/^\$\{.+\}$/.test(process.env.EXPO_PUBLIC_API_URL) ? process.env.EXPO_PUBLIC_API_URL : undefined) ||
    process.env.REACT_APP_API_URL ||
    process.env.API_BASE_URL ||
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:5000/api' : '');

  // On native mobile, replace localhost with LAN IP if available
  try {
    const { Platform } = require('react-native');
    if (resolved && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(resolved) && Platform?.OS !== 'web' && devHost) {
      const withoutProto = resolved.replace(/^(http|https):\/\//, '');
      const tail = withoutProto.replace(/^(localhost|127\.0\.0\.1)/, '');
      resolved = `http://${devHost}${tail}`;
    }
  } catch {
    // ignore
  }

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
    LOG: '/nutrition/entries',
    HISTORY: '/nutrition/entries',
    GOALS: '/nutrition/goals',
    SEARCH: '/nutrition/search',
  },
  
  // Progress
  PROGRESS: {
    TRACK: '/progress/entries',
    HISTORY: '/progress/entries',
    PHOTOS: '/upload/progress-photos',
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
    SCAN_FOOD: '/ai/food-recognition',
    SCAN_BARCODE: '/ai/barcode-scan',
    RECOMMEND_WORKOUT: '/ai/recommend-workout',
    ANALYZE_PROGRESS: '/ai/analyze-progress',
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/upload/single',
    PROGRESS_PHOTO: '/upload/progress-photos',
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

// Feature flags
export const COMMERCE_ENTITLEMENTS_ENABLED = (
  String(process.env.EXPO_PUBLIC_ENABLE_COMMERCE || '').toLowerCase() === '1' ||
  String(process.env.EXPO_PUBLIC_ENABLE_COMMERCE || '').toLowerCase() === 'true'
);