import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/api';

// API service with authentication
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = REQUEST_TIMEOUT;
  }

  // Get auth token from storage
  async getAuthToken() {
    try {
      const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
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

  // Make API request with error handling
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const headers = await this.createHeaders(options.includeAuth !== false);
      // Respect multipart: do not force JSON content-type
      if (!options.isMultipart) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }
      
      const config = {
        method: options.method || 'GET',
        headers,
        timeout: this.timeout,
        ...options,
      };

      if (options.isMultipart && options.body) {
        config.body = options.body; // FormData
      } else if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
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

  // User endpoints
  async getUserProfile() {
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

  async uploadProgressPhoto(photoData) {
    return this.makeRequest('/progress/photos', {
      method: 'POST',
      body: photoData,
    });
  }

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
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/social/feed?${queryString}` : '/social/feed';
    return this.makeRequest(endpoint);
  }

  async getFriends() {
    return this.makeRequest('/social/friends');
  }

  async getChallenges() {
    return this.makeRequest('/social/challenges');
  }

  async getLeaderboard() {
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

  async uploadProgressPhoto(photoData) {
    const form = new FormData();
    form.append('photos', photoData);
    return this.makeRequest('/upload/progress-photos', {
      method: 'POST',
      body: form,
      isMultipart: true,
    });
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;
