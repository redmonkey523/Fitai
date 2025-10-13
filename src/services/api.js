import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/api';
import Toast from 'react-native-toast-message';
import crashReporting from './crashReporting';

// Custom API Error class with typed error codes
class ApiError extends Error {
  constructor(code, details) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// API service with authentication
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = REQUEST_TIMEOUT;
  }

  // Internal: perform multipart upload with progress
  async _multipartUploadWithProgress(endpoint, formData, onProgress) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();
    // Native: use expo-file-system uploadAsync for progress
    try {
      const { Platform } = require('react-native');
      if (Platform?.OS && Platform.OS !== 'web') {
        const FileSystem = require('expo-file-system');
        return await FileSystem.uploadAsync(url, formData, {
          fieldName: 'file',
          httpMethod: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
          onUploadProgress: onProgress
            ? ({ totalBytesSent, totalBytesExpectedToSend }) => {
                try {
                  const pct = totalBytesExpectedToSend ? Math.min(1, totalBytesSent / totalBytesExpectedToSend) : 0;
                  onProgress(pct);
                } catch (e) {
                  crashReporting.logMessage('[API] Progress callback error', 'warning', { error: e });
                }
              }
            : undefined,
        }).then((res) => {
          // expo-file-system returns body as string
          try { return JSON.parse(res?.body || '{}'); } catch (e) { 
            crashReporting.logMessage('[API] Failed to parse FileSystem response', 'warning', { error: e });
            return { success: false }; 
          }
        });
      }
    } catch (e) {
      crashReporting.logMessage('[API] FileSystem upload not available', 'warning', { error: e });
    }

    // Web: XMLHttpRequest to track upload progress
    const xhr = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
      xhr.open('POST', url);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          try {
            const json = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300) resolve(json);
            else reject(new Error(json?.message || `HTTP ${xhr.status}`));
          } catch (e) {
            reject(e);
          }
        }
      };
      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          try {
            const pct = e.lengthComputable ? Math.min(1, e.loaded / e.total) : 0;
            onProgress(pct);
          } catch (err) {
            crashReporting.logMessage('[API] XHR progress callback error', 'warning', { error: err });
          }
        };
      }
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
    return promise;
  }

  // Cancellable multipart upload (web only cancellation)
  _multipartUploadWithProgressCancellable(endpoint, formData, onProgress) {
    const url = `${this.baseURL}${endpoint}`;
    const xhr = new XMLHttpRequest();
    const getTokenAndSend = async () => {
      const token = await this.getAuthToken();
      return token;
    };
    
    const promise = new Promise((resolve, reject) => {
      getTokenAndSend().then((token) => {
        xhr.open('POST', url);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            try {
              const json = JSON.parse(xhr.responseText || '{}');
              if (xhr.status >= 200 && xhr.status < 300) resolve(json);
              else reject(new Error(json?.message || `HTTP ${xhr.status}`));
            } catch (e) {
              reject(e);
            }
          }
        };
        if (onProgress && xhr.upload) {
          xhr.upload.onprogress = (e) => {
            try {
              const pct = e.lengthComputable ? Math.min(1, e.loaded / e.total) : 0;
              onProgress(pct);
            } catch (err) {
              crashReporting.logMessage('[API] XHR upload progress callback error', 'warning', { error: err });
            }
          };
        }
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
      }).catch((e) => {
        reject(e);
      });
    });
    return { promise, cancel: () => { try { xhr.abort(); } catch (e) { console.warn('[API] XHR abort failed:', e); } } };
  }

  async uploadFileWithProgress(file, fieldName = 'file', onProgress) {
    const form = new FormData();
    try {
      const filename = file?.name || file?.filename || undefined;
      if (filename) form.append(fieldName, file, filename);
      else form.append(fieldName, file);
    } catch (_) {
      form.append(fieldName, file);
    }
    return this._multipartUploadWithProgress('/upload/single', form, onProgress);
  }

  // Cancellable flavor
  uploadFileWithProgressCancellable(file, fieldName = 'file', onProgress) {
    const form = new FormData();
    try {
      const filename = file?.name || file?.filename || undefined;
      if (filename) form.append(fieldName, file, filename);
      else form.append(fieldName, file);
    } catch (_) {
      form.append(fieldName, file);
    }
    return this._multipartUploadWithProgressCancellable('/upload/single', form, onProgress);
  }

  async uploadFilesWithProgress(files = [], fieldName = 'files', onFileProgress) {
    const uploaded = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const onProgress = onFileProgress ? (pct) => onFileProgress(i, pct) : undefined;
      const result = await this.uploadFileWithProgress(file, fieldName === 'files' ? 'file' : fieldName, onProgress);
      uploaded.push(result);
    }
    return uploaded;
  }

  // Optimistic social activity creation with media uploads
  async createSocialActivityOptimistic({ content = '', tags = [], location = null }, mediaFiles = [], onProgress) {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    const mediaResults = [];
    if (Array.isArray(mediaFiles) && mediaFiles.length) {
      for (let i = 0; i < mediaFiles.length; i += 1) {
        const progressCb = onProgress ? (pct) => onProgress(i, pct) : undefined;
        const res = await this.uploadFileWithProgress(mediaFiles[i], 'file', progressCb);
        const url = res?.file?.url || res?.data?.file?.url || res?.url;
        const type = (url || '').match(/\.(mp4|mov|avi|mkv)$/i) ? 'video' : 'image';
        if (url) mediaResults.push({ url, type });
      }
    }
    const payload = { type: 'post', content, tags, location, media: mediaResults };
    const server = await this.createSocialActivity(payload);
    return server;
  }

  async getActivityComments(activityId, params = {}) {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    const qs = new URLSearchParams(params).toString();
    const suffix = qs ? `?${qs}` : '';
    return this.makeRequest(`/social/activity/${activityId}/comments${suffix}`);
  }

  // Notifications
  async registerPushToken(token, platform = 'web', deviceId = null) {
    return this.makeRequest('/notifications/registerToken', { method: 'POST', body: { token, platform, deviceId } });
  }
  async sendTestPush() {
    return this.makeRequest('/notifications/test', { method: 'POST' });
  }

  // Retry helper with exponential backoff and jitter (auto-wraps any API call)
  async withRetries(fn, { retries = 3, endpoint = '' } = {}) {
    let delay = 500;
    let lastError = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        
        // Retry on rate limit errors (429) or network errors
        const shouldRetry = (
          (err instanceof ApiError && err.code === 'RATE_LIMIT') ||
          (err?.message || '').includes('Network') ||
          (err?.message || '').includes('Failed to fetch') ||
          (err?.message || '').includes('timeout')
        );
        
        if (shouldRetry && i < retries - 1) {
          const jitter = Math.random() * 250;
          const waitTime = delay + jitter;
          
          console.log(`[API] Error on ${endpoint}, retrying in ${waitTime.toFixed(0)}ms (attempt ${i + 1}/${retries})`);
          
          // Show toast on first retry
          if (i === 0) {
            const message = err instanceof ApiError && err.code === 'RATE_LIMIT'
              ? 'Server busy—retrying…'
              : 'Connection error—retrying…';
            
            Toast.show({
              type: 'info',
              text1: 'Retrying',
              text2: message,
              visibilityTime: 2000,
            });
          }
          
          await new Promise(r => setTimeout(r, waitTime));
          delay *= 2;
          continue;
        }
        
        // Don't retry other errors or if we've exhausted retries
        throw err;
      }
    }
    
    throw lastError;
  }

  // Get auth token from storage
  async getAuthToken() {
    // 1) Web: use localStorage immediately if available (avoids dynamic import problems)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const token = window.localStorage.getItem('token');
        if (token) return token;
      } catch {}
    }

    // 2) Native (or fallback): AsyncStorage (dynamically imported to keep bundle small)
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Create headers with authentication
  async createHeaders(includeAuth = true) {
    const headers = {};

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Centralized error to user-friendly message mapping
  _mapErrorToMessage(error, endpoint = '') {
    if (error instanceof ApiError) {
      switch (error.code) {
        case 'RATE_LIMIT':
          return 'Too many requests. Please wait a moment and try again.';
        case 'BAD_JSON':
          return 'Server returned invalid data. Please try again.';
        case 'NON_JSON':
          return 'Server error. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }
    
    const message = error?.message || '';
    
    if (message.includes('Network') || message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection.';
    }
    if (message.includes('timeout') || message.includes('Timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Session expired. Please log in again.';
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'Access denied.';
    }
    if (message.includes('404') || message.includes('Not Found')) {
      return 'Resource not found.';
    }
    if (message.includes('500') || message.includes('Internal Server')) {
      return 'Server error. Please try again later.';
    }
    
    return message || 'An error occurred. Please try again.';
  }

  // Show user-friendly toast for errors
  _showErrorToast(error, endpoint = '') {
    const message = this._mapErrorToMessage(error, endpoint);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      visibilityTime: 4000,
    });
  }

  // Make API request with hardened error handling
  async makeRequest(endpoint, options = {}) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = this.timeout && controller ? setTimeout(() => controller.abort(), this.timeout) : null;
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      let headers = await this.createHeaders(options.includeAuth !== false);
      
      // Set Accept header to ensure we request JSON
      headers['Accept'] = 'application/json';
      
      // Respect multipart: do not force JSON content-type
      if (!options.isMultipart) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }
      
      const config = {
        method: options.method || 'GET',
        headers,
        timeout: this.timeout,
        signal: controller?.signal,
        ...options,
      };

      if (options.isMultipart && options.body) {
        config.body = options.body; // FormData
      } else if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      let response = await fetch(url, config);
      
      // Read response as text first to handle non-JSON gracefully
      const contentType = response.headers.get('content-type') || '';
      const rawText = await response.text();
      
      // Log snippet for debugging non-JSON or error responses
      if (!options.silent && (!contentType.includes('application/json') || !response.ok)) {
        console.log(`[API] ${endpoint} - Status: ${response.status}, Content-Type: ${contentType}, Body: ${rawText.slice(0, 200)}`);
      }
      
      // Check for rate limiting (429 or "too many requests" in body)
      if (response.status === 429 || /too many requests/i.test(rawText)) {
        const error = new ApiError('RATE_LIMIT', {
          status: response.status,
          bodySnippet: rawText.slice(0, 200),
          path: endpoint,
        });
        
        // Show toast immediately for rate limit
        if (!options.silent) {
          Toast.show({
            type: 'info',
            text1: 'Rate Limited',
            text2: 'Server busy. Retrying...',
            visibilityTime: 2000,
          });
        }
        
        throw error;
      }
      
      // Parse JSON if content-type indicates JSON
      let data;
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          const error = new ApiError('BAD_JSON', {
            status: response.status,
            bodySnippet: rawText.slice(0, 200),
            path: endpoint,
            parseError: parseError.message,
          });
          
          if (!options.silent) {
            this._showErrorToast(error, endpoint);
          }
          
          throw error;
        }
      } else {
        // Non-JSON response (HTML error pages, proxies, etc.)
        const error = new ApiError('NON_JSON', {
          status: response.status,
          bodySnippet: rawText.slice(0, 200),
          path: endpoint,
          contentType,
        });
        
        if (!options.silent) {
          this._showErrorToast(error, endpoint);
        }
        
        throw error;
      }

      // Handle non-OK responses
      if (!response.ok) {
        // Build helpful error message from server validation if present
        const validationMessages = Array.isArray(data?.errors)
          ? data.errors.map(e => e.msg || e.message).filter(Boolean)
          : [];
        const baseMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
        const serverDetail =
          (typeof data?.error === 'string' && data.error) ||
          (data?.error && (data.error.message || JSON.stringify(data.error))) ||
          '';
        const extra = [validationMessages.join('; '), serverDetail].filter(Boolean).join(' — ');
        const composedMessage = extra ? `${baseMessage} — ${extra}` : baseMessage;
        
        // Attempt 401 refresh once
        if (response.status === 401 && options.includeAuth !== false && !options._retried) {
          try {
            const { refreshAccessToken } = await import('./authService');
            const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken) {
              const refreshed = await refreshAccessToken(refreshToken);
              await AsyncStorage.setItem('token', refreshed.token);
              if (refreshed.refreshToken) {
                await AsyncStorage.setItem('refreshToken', refreshed.refreshToken);
              }
              // Retry with new token
              return this.makeRequest(endpoint, { ...options, _retried: true });
            }
          } catch (e) {
            console.warn('[API] Token refresh failed:', e);
            // fallthrough to error
          }
        }
        
        const err = new Error(composedMessage);
        err.status = response.status;
        err.data = data;
        
        if (!options.silent) {
          console.error(`[API] Request failed for ${endpoint}:`, err);
          this._showErrorToast(err, endpoint);
        }
        
        throw err;
      }

      return data;
    } catch (error) {
      // Re-throw ApiError as-is (already handled above)
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network/timeout errors
      if (!options.silent) {
        console.error(`[API] Request failed for ${endpoint}:`, error);
        
        // Only show toast if it wasn't already shown
        if (!(error?.message || '').includes('HTTP')) {
          this._showErrorToast(error, endpoint);
        }
      }
      
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: userData,
      includeAuth: false,
    });
  }

  async login(credentials) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: credentials,
      includeAuth: false,
    });
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.makeRequest('/auth/me');
  }

  async updateProfile(profileData) {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
  }

  // User endpoints (legacy - use Goal Quiz endpoints below)
  async getUserProfileLegacy() {
    return this.makeRequest('/users/profile');
  }

  async getUserStats() {
    return this.makeRequest('/users/stats');
  }

  async updateUserSettings(settings) {
    return this.makeRequest('/users/settings', {
      method: 'PUT',
      body: settings,
    });
  }

  // Workout endpoints
  async getWorkouts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/workouts?${queryString}` : '/workouts';
    return this.makeRequest(endpoint);
  }

  async getWorkout(id) {
    return this.makeRequest(`/workouts/${id}`);
  }

  async createWorkout(workoutData) {
    return this.makeRequest('/workouts', {
      method: 'POST',
      body: workoutData,
    });
  }

  async updateWorkout(id, workoutData) {
    return this.makeRequest(`/workouts/${id}`, {
      method: 'PUT',
      body: workoutData,
    });
  }

  async deleteWorkout(id) {
    return this.makeRequest(`/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  async startWorkout(id) {
    return this.makeRequest(`/workouts/${id}/start`, {
      method: 'POST',
    });
  }

  async completeWorkout(id, completionData) {
    return this.makeRequest(`/workouts/${id}/complete`, {
      method: 'POST',
      body: completionData,
    });
  }

  // Nutrition endpoints
  async logNutrition(nutritionData) {
    return this.makeRequest('/nutrition/entries', {
      method: 'POST',
      body: nutritionData,
    });
  }

  async getNutritionHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/nutrition/entries?${queryString}` : '/nutrition/entries';
    return this.makeRequest(endpoint);
  }

  async getNutritionGoals() {
    return this.makeRequest('/nutrition/goals');
  }

  async updateNutritionGoals(goals) {
    return this.makeRequest('/nutrition/goals', {
      method: 'PUT',
      body: goals,
    });
  }

  async searchNutrition(query) {
    return this.makeRequest(`/nutrition/search?q=${encodeURIComponent(query)}`);
  }

  // Progress endpoints
  async trackProgress(progressData) {
    return this.makeRequest('/progress/entries', {
      method: 'POST',
      body: progressData,
    });
  }

  async getProgressHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/progress/entries?${queryString}` : '/progress/entries';
    return this.makeRequest(endpoint);
  }

  // Removed duplicate uploadProgressPhoto - see line ~647

  async getProgressPhotos() {
    return this.makeRequest('/progress/photos');
  }

  async updateMeasurements(measurements) {
    return this.makeRequest('/progress/measurements', {
      method: 'PUT',
      body: measurements,
    });
  }

  // Social endpoints
  async getSocialFeed(params = {}) {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/social/feed?${queryString}` : '/social/feed';
    return this.makeRequest(endpoint);
  }

  async getSocialExplore(params = {}) {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/social/explore?${queryString}` : '/social/explore';
    return this.makeRequest(endpoint);
  }

  async createSocialActivity(payload) {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    return this.makeRequest('/social/activity', {
      method: 'POST',
      body: payload,
    });
  }

  async likeActivity(activityId) {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    return this.makeRequest(`/social/activity/${activityId}/like`, { method: 'POST' });
  }

  async commentActivity(activityId, content) {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    return this.makeRequest(`/social/activity/${activityId}/comment`, { method: 'POST', body: { content } });
  }

  async emitSocket(event, payload) {
    try {
      // If a dedicated realtime service exists later, adapt this
      return await this.makeRequest('/analytics/events', { method: 'POST', body: { event, payload, ts: Date.now() } });
    } catch (e) {
      return { success: false };
    }
  }

  async getFriends() {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    return this.makeRequest('/social/friends');
  }

  async getChallenges() {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    return this.makeRequest('/social/challenges');
  }

  async getLeaderboard() {
    const { FEATURE_FEED } = require('../config/flags');
    if (!FEATURE_FEED) {
      throw new Error('Social feed feature is disabled');
    }
    return this.makeRequest('/social/leaderboard');
  }

  // Analytics endpoints
  async getAnalyticsDashboard() {
    return this.makeRequest('/analytics/dashboard');
  }

  async getWorkoutAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/workouts?${queryString}` : '/analytics/workouts';
    return this.makeRequest(endpoint);
  }

  async getNutritionAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/nutrition?${queryString}` : '/analytics/nutrition';
    return this.makeRequest(endpoint);
  }

  async getProgressAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/analytics/progress?${queryString}` : '/analytics/progress';
    return this.makeRequest(endpoint);
  }

  async getAnalyticsInsights(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const endpoint = qs ? `/analytics/insights?${qs}` : '/analytics/insights';
    return this.makeRequest(endpoint);
  }

  // AI endpoints
  async scanFood(imageData) {
    return this.makeRequest('/ai/food-recognition', {
      method: 'POST',
      body: imageData,
      isMultipart: true,
    });
  }

  async scanBarcode(barcodeData) {
    return this.makeRequest('/ai/barcode-scan', {
      method: 'POST',
      body: barcodeData,
    });
  }

  async getWorkoutRecommendation(preferences) {
    return this.makeRequest('/ai/recommend-workout', {
      method: 'POST',
      body: preferences,
    });
  }

  async analyzeProgress(progressData) {
    return this.makeRequest('/ai/analyze-progress', {
      method: 'POST',
      body: progressData,
    });
  }

  // Upload endpoints
  async uploadImage(imageData) {
    const form = new FormData();
    form.append('file', imageData);
    return this.makeRequest('/upload/single', {
      method: 'POST',
      body: form,
      isMultipart: true,
    });
  }

  // Avatar endpoints
  async uploadAvatar(file, onProgress) {
    const form = new FormData();
    try {
      const filename = file?.name || file?.filename || 'avatar.jpg';
      form.append('avatar', file, filename);
    } catch (_) {
      form.append('avatar', file);
    }
    // Use web/native progress helper
    return this._multipartUploadWithProgress('/users/avatar', form, onProgress);
  }

  async deleteAvatar() {
    return this.makeRequest('/users/avatar', { method: 'DELETE' });
  }

  async uploadProgressPhoto(photoData) {
    const form = new FormData();
    form.append('photos', photoData);
    return this.makeRequest('/upload/progress-photos', {
      method: 'POST',
      body: form,
      isMultipart: true,
    });
  }

  // Upload multiple progress photos with per-file append
  async uploadProgressPhotos(photos = []) {
    const form = new FormData();
    for (const p of photos) {
      try {
        const filename = p?.name || p?.filename || 'photo.jpg';
        form.append('photos', p, filename);
      } catch (_) {
        form.append('photos', p);
      }
    }
    return this.makeRequest('/upload/progress-photos', {
      method: 'POST',
      body: form,
      isMultipart: true,
    });
  }

  async uploadFile(file, fieldName = 'file') {
    const form = new FormData();
    try {
      // Prefer preserving filename when available (especially on web)
      const filename = file?.name || file?.filename || undefined;
      if (filename) {
        form.append(fieldName, file, filename);
      } else {
        form.append(fieldName, file);
      }
    } catch (_) {
      form.append(fieldName, file);
    }
    return this.makeRequest('/upload/single', {
      method: 'POST',
      body: form,
      isMultipart: true,
    });
  }

  // Video processing (Cloudinary-backed). Returns processed video and optional thumbnail
  async processClip(params) {
    // params: { cloudinaryId, trimStartS, trimEndS, muted, speed, coverAtS }
    return this.makeRequest('/upload/process-clip', {
      method: 'POST',
      body: params,
    });
  }

  // Plans endpoints
  async getPlans(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const endpoint = qs ? `/plans?${qs}` : '/plans';
    return this.makeRequest(endpoint);
  }

  async getPlan(planId) {
    return this.makeRequest(`/plans/${planId}`);
  }

  async assignPlan(planId, startDate) {
    return this.makeRequest(`/plans/${planId}/assign`, {
      method: 'POST',
      body: startDate ? { startDate } : {},
    });
  }

  async purchaseProgram(programId) {
    return this.makeRequest('/commerce/purchase', {
      method: 'POST',
      body: { programId },
    });
  }

  async purchasePro() {
    return this.makeRequest('/commerce/purchase-pro', {
      method: 'POST',
      body: {},
    });
  }

  async getEntitlements() {
    try {
      return await this.makeRequest('/commerce/entitlements', { silent: true });
    } catch (e) {
      // Swallow if backend hasn’t mounted commerce yet or running minimal server
      return { success: false, data: { pro: false, programs: [], isAdmin: false }, error: e?.message };
    }
  }

  async getMyCalendar() {
    return this.makeRequest('/plans/me/calendar');
  }

  // Meals endpoints
  async createRecipe(recipe) {
    return this.makeRequest('/meals/recipes', {
      method: 'POST',
      body: recipe,
    });
  }

  async searchRecipes(query, params = {}) {
    const search = new URLSearchParams({ q: query || '', ...params }).toString();
    return this.makeRequest(`/meals/recipes?${search}`);
  }

  async upsertMealPlan(plan) {
    return this.makeRequest('/meals/plan', {
      method: 'PUT',
      body: plan,
    });
  }

  async getMealPlan(range = {}) {
    const qs = new URLSearchParams(range).toString();
    const endpoint = qs ? `/meals/plan?${qs}` : '/meals/plan';
    return this.makeRequest(endpoint);
  }

  // Program create (creator)
  async createProgram(body) {
    return this.makeRequest('/plans', { method: 'POST', body });
  }

  // Discover & Coaches
  async getDiscover(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const endpoint = qs ? `/discover?${qs}` : '/discover';
    return this.makeRequest(endpoint);
  }

  async trackEvent(eventName, payload = {}) {
    // Graceful no-op backend placeholder: post to /analytics/events if exists
    try {
      return await this.makeRequest('/analytics/events', {
        method: 'POST',
        body: { event: eventName, payload, ts: Date.now() },
      });
    } catch (e) {
      // Swallow if endpoint not present
      return { success: false, skipped: true };
    }
  }

  async getCoaches(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const endpoint = qs ? `/coaches?${qs}` : '/coaches';
    return this.makeRequest(endpoint);
  }

  async getCoach(id) {
    return this.makeRequest(`/coaches/${id}`);
  }

  async followCoach(id) {
    return this.makeRequest(`/coaches/${id}/follow`, { method: 'POST' });
  }

  async unfollowCoach(id) {
    return this.makeRequest(`/coaches/${id}/follow`, { method: 'DELETE' });
  }

  // Creator
  async applyCreator(application) {
    return this.makeRequest('/creator/apply', { method: 'POST', body: application });
  }

  async getCreatorStats() {
    return this.makeRequest('/creator/stats');
  }

  async getMyCreatorProfile() {
    return this.makeRequest('/creators/me');
  }

  async updateMyCreatorProfile(patch) {
    return this.makeRequest('/creators/me', { method: 'PUT', body: patch });
  }

  async uploadCreatorAvatar(file) {
    const form = new FormData();
    try {
      const filename = file?.name || file?.filename || undefined;
      if (filename) form.append('avatar', file, filename); else form.append('avatar', file);
    } catch (_) { form.append('avatar', file); }
    return this.makeRequest('/creators/me/avatar', { method: 'POST', body: form, isMultipart: true });
  }

  async uploadCreatorBanner(file) {
    const form = new FormData();
    try {
      const filename = file?.name || file?.filename || undefined;
      if (filename) form.append('banner', file, filename); else form.append('banner', file);
    } catch (_) { form.append('banner', file); }
    return this.makeRequest('/creators/me/banner', { method: 'POST', body: form, isMultipart: true });
  }

  async addCertification(cert) {
    return this.makeRequest('/creators/me/certifications', { method: 'POST', body: cert });
  }

  async removeCertification(id) {
    return this.makeRequest(`/creators/me/certifications/${id}`, { method: 'DELETE' });
  }

  // Program updates
  async patchPlan(planId, update) {
    return this.makeRequest(`/plans/${planId}`, { method: 'PATCH', body: update });
  }

  // Media library
  async getMediaItems() {
    return this.makeRequest('/media');
  }

  async createMediaItem(item) {
    return this.makeRequest('/media', { method: 'POST', body: item });
  }

  async updateMediaItem(id, patch) {
    return this.makeRequest(`/media/${id}`, { method: 'PATCH', body: patch });
  }

  async deleteMediaItem(id) {
    return this.makeRequest(`/media/${id}`, { method: 'DELETE' });
  }

  // Food search and meal logging (Agent 2 - Nutrition)
  async apiFoodSearch(q, limit = 20) {
    const query = encodeURIComponent(q);
    return this.makeRequest(`/api/foods/search?q=${query}&limit=${limit}`);
  }

  async apiCreateMeal(meal) {
    return this.makeRequest('/api/meals', {
      method: 'POST',
      body: meal,
    });
  }

  async apiGetMeals(date) {
    const dateParam = date ? `?date=${date}` : '';
    return this.makeRequest(`/api/meals${dateParam}`);
  }

  async apiUpdateMeal(id, meal) {
    return this.makeRequest(`/api/meals/${id}`, {
      method: 'PUT',
      body: meal,
    });
  }

  async apiDeleteMeal(id) {
    return this.makeRequest(`/api/meals/${id}`, {
      method: 'DELETE',
    });
  }

  async apiCreateHydration(entry) {
    return this.makeRequest('/api/hydration', {
      method: 'POST',
      body: entry,
    });
  }

  async apiGetHydration(date) {
    const dateParam = date ? `?date=${date}` : '';
    return this.makeRequest(`/api/hydration${dateParam}`);
  }

  async apiGetGoals() {
    return this.makeRequest('/api/goals');
  }

  async apiSaveGoal(goal) {
    return this.makeRequest('/api/goals', {
      method: 'POST',
      body: goal,
    });
  }

  // User Profile and Goals endpoints (for Goal Quiz integration)
  async getUserProfile() {
    return this.makeRequest('/users/me/profile');
  }

  async updateUserProfile(profileData) {
    return this.makeRequest('/users/me/profile', {
      method: 'PATCH',
      body: profileData,
    });
  }

  async getUserGoals() {
    return this.makeRequest('/users/me/goals');
  }

  async updateUserGoals(goalsData) {
    return this.makeRequest('/users/me/goals', {
      method: 'PUT',
      body: goalsData,
    });
  }

  async getUserSummary(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users/me/summary?${queryString}` : '/users/me/summary';
    return this.makeRequest(endpoint);
  }

  // Combined save for quiz results (profile + goals in one transaction)
  async saveQuizResults({ profile, goals }) {
    // Save profile data first
    const profileResponse = await this.updateUserProfile(profile);
    
    // Then save goals with targets
    const goalsResponse = await this.updateUserGoals(goals);
    
    return {
      profile: profileResponse,
      goals: goalsResponse,
    };
  }

  // Sleep Tracking APIs
  async logSleep(sleepData) {
    return this.post('/sleep', sleepData);
  }

  async getSleepLogs(params = {}) {
    return this.get('/sleep', params);
  }

  async getSleepStats(days = 7) {
    return this.get('/sleep/stats', { days });
  }

  async updateSleepLog(id, updates) {
    return this.put(`/sleep/${id}`, updates);
  }

  async deleteSleepLog(id) {
    return this.delete(`/sleep/${id}`);
  }

  // Program management APIs
  async duplicateProgram(programId) {
    return this.post(`/programs/${programId}/duplicate`);
  }

  async unpublishProgram(programId) {
    return this.patch(`/programs/${programId}/unpublish`);
  }

  async deleteProgram(programId) {
    return this.delete(`/programs/${programId}`);
  }

  // Enhanced workout APIs
  async updateWorkout(workoutId, updates) {
    return this.put(`/workouts/${workoutId}`, updates);
  }

  async deleteWorkout(workoutId) {
    return this.delete(`/workouts/${workoutId}`);
  }

  // GPS workout route APIs
  async saveWorkoutRoute(routeData) {
    return this.post('/workouts/route', routeData);
  }

  async getWorkoutRoutes() {
    return this.get('/workouts/routes');
  }

  // Body measurements APIs
  async logBodyMeasurement(measurementData) {
    return this.post('/progress/measurements', measurementData);
  }

  async getBodyMeasurements(params = {}) {
    return this.get('/progress/measurements', params);
  }

  async deleteBodyMeasurement(id) {
    return this.delete(`/progress/measurements/${id}`);
  }

  // Meal Planning APIs
  async getMealPlans(params = {}) {
    return this.get('/nutrition/meal-plans', params);
  }

  async getMealPlanForDate(date) {
    return this.get(`/nutrition/meal-plans/${date}`);
  }

  async saveMealPlan(mealPlan) {
    return this.post('/nutrition/meal-plans', mealPlan);
  }

  async deleteMealPlan(date) {
    return this.delete(`/nutrition/meal-plans/${date}`);
  }

  async generateWeeklyMealPlan(preferences) {
    return this.post('/nutrition/meal-plans/generate', preferences);
  }

  // Recipe APIs
  async searchRecipes(filters = {}) {
    return this.get('/nutrition/recipes/search', filters);
  }

  async getRecipe(recipeId) {
    return this.get(`/nutrition/recipes/${recipeId}`);
  }

  async createRecipe(recipe) {
    return this.post('/nutrition/recipes', recipe);
  }

  async updateRecipe(recipeId, updates) {
    return this.put(`/nutrition/recipes/${recipeId}`, updates);
  }

  async deleteRecipe(recipeId) {
    return this.delete(`/nutrition/recipes/${recipeId}`);
  }

  async toggleRecipeFavorite(recipeId, isFavorite) {
    if (isFavorite) {
      return this.delete(`/nutrition/recipes/${recipeId}/favorite`);
    } else {
      return this.post(`/nutrition/recipes/${recipeId}/favorite`);
    }
  }

  async getFavoriteRecipes() {
    return this.get('/nutrition/recipes/favorites');
  }

  // Grocery List APIs
  async getGroceryList() {
    return this.get('/nutrition/grocery-list');
  }

  async generateGroceryList(params) {
    return this.post('/nutrition/grocery-list/generate', params);
  }

  async addGroceryItem(item) {
    return this.post('/nutrition/grocery-list/items', item);
  }

  async updateGroceryItem(itemId, updates) {
    return this.put(`/nutrition/grocery-list/items/${itemId}`, updates);
  }

  async deleteGroceryItem(itemId) {
    return this.delete(`/nutrition/grocery-list/items/${itemId}`);
  }

  async clearCheckedGroceryItems() {
    return this.delete('/nutrition/grocery-list/checked');
  }

  async clearGroceryList() {
    return this.delete('/nutrition/grocery-list');
  }

  // Offline sync support - mark request as queued
  _markAsQueued(endpoint, method, data) {
    return {
      _queued: true,
      _queuedAt: Date.now(),
      endpoint,
      method,
      data,
      message: 'Request queued for sync when online',
    };
  }
}

// Create and export singleton instance
const apiService = new ApiService();

// Named exports for compatibility
export const api = apiService;
export { apiService, ApiError };

// Default export
export default apiService;
