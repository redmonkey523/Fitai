import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { logoutUser, refreshToken } from '../store/slices/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('persist:root');
      if (token) {
        const parsedToken = JSON.parse(token);
        const authState = JSON.parse(parsedToken.auth);
        if (authState.token) {
          config.headers.Authorization = `Bearer ${authState.token}`;
        }
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from storage
        const token = await AsyncStorage.getItem('persist:root');
        if (token) {
          const parsedToken = JSON.parse(token);
          const authState = JSON.parse(parsedToken.auth);
          
          if (authState.refreshToken) {
            // Try to refresh token
            const response = await axios.post(
              `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
              { refreshToken: authState.refreshToken }
            );

            const { token: newToken, refreshToken: newRefreshToken } = response.data.data;

            // Update tokens in storage
            const updatedAuthState = {
              ...authState,
              token: newToken,
              refreshToken: newRefreshToken
            };

            await AsyncStorage.setItem('persist:root', JSON.stringify({
              ...parsedToken,
              auth: JSON.stringify(updatedAuthState)
            }));

            // Update store
            store.dispatch(refreshToken.fulfilled({
              data: { token: newToken, refreshToken: newRefreshToken }
            }, ''));

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, logout user
        store.dispatch(logoutUser());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (resetToken, newPassword) => api.post('/auth/reset-password', { resetToken, newPassword }),
  verifyEmail: (verificationToken) => api.post('/auth/verify-email', { verificationToken }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email })
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  updatePreferences: (preferences) => api.put('/users/preferences', preferences),
  updateSettings: (settings) => api.put('/users/settings', settings),
  deleteAccount: () => api.delete('/users/account'),
  uploadProfilePicture: (formData) => api.post('/users/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const workoutAPI = {
  getWorkouts: (params) => api.get('/workouts', { params }),
  getWorkout: (id) => api.get(`/workouts/${id}`),
  createWorkout: (workoutData) => api.post('/workouts', workoutData),
  updateWorkout: (id, workoutData) => api.put(`/workouts/${id}`, workoutData),
  deleteWorkout: (id) => api.delete(`/workouts/${id}`),
  startWorkout: (id) => api.post(`/workouts/${id}/start`),
  endWorkout: (id, completionData) => api.post(`/workouts/${id}/end`, completionData),
  getTemplates: () => api.get('/workouts/templates'),
  createTemplate: (templateData) => api.post('/workouts/templates', templateData),
  getRecommendations: () => api.get('/workouts/recommendations')
};

export const exerciseAPI = {
  getExercises: (params) => api.get('/exercises', { params }),
  getExercise: (id) => api.get(`/exercises/${id}`),
  searchExercises: (query) => api.get('/exercises/search', { params: { q: query } }),
  getExercisesByCategory: (category) => api.get(`/exercises/category/${category}`),
  getExercisesByMuscleGroup: (muscleGroup) => api.get(`/exercises/muscle-group/${muscleGroup}`),
  rateExercise: (id, rating) => api.post(`/exercises/${id}/rate`, rating)
};

export const nutritionAPI = {
  getNutritionLog: (date) => api.get('/nutrition/log', { params: { date } }),
  addFood: (foodData) => api.post('/nutrition/food', foodData),
  updateFood: (id, foodData) => api.put(`/nutrition/food/${id}`, foodData),
  deleteFood: (id) => api.delete(`/nutrition/food/${id}`),
  searchFood: (query) => api.get('/nutrition/search', { params: { q: query } }),
  getNutritionGoals: () => api.get('/nutrition/goals'),
  updateNutritionGoals: (goals) => api.put('/nutrition/goals', goals),
  getWaterIntake: (date) => api.get('/nutrition/water', { params: { date } }),
  addWaterIntake: (amount) => api.post('/nutrition/water', { amount })
};

export const progressAPI = {
  getProgress: (params) => api.get('/progress', { params }),
  addMeasurement: (measurementData) => api.post('/progress/measurements', measurementData),
  updateMeasurement: (id, measurementData) => api.put(`/progress/measurements/${id}`, measurementData),
  deleteMeasurement: (id) => api.delete(`/progress/measurements/${id}`),
  uploadProgressPhoto: (formData) => api.post('/progress/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getProgressPhotos: (params) => api.get('/progress/photos', { params }),
  deleteProgressPhoto: (id) => api.delete(`/progress/photos/${id}`),
  getAnalytics: (params) => api.get('/progress/analytics', { params })
};

export const socialAPI = {
  getFeed: (params) => api.get('/social/feed', { params }),
  createPost: (postData) => api.post('/social/posts', postData),
  likePost: (id) => api.post(`/social/posts/${id}/like`),
  unlikePost: (id) => api.delete(`/social/posts/${id}/like`),
  commentOnPost: (id, comment) => api.post(`/social/posts/${id}/comments`, { comment }),
  deleteComment: (postId, commentId) => api.delete(`/social/posts/${postId}/comments/${commentId}`),
  getFriends: () => api.get('/social/friends'),
  sendFriendRequest: (userId) => api.post('/social/friend-requests', { userId }),
  acceptFriendRequest: (requestId) => api.put(`/social/friend-requests/${requestId}/accept`),
  rejectFriendRequest: (requestId) => api.put(`/social/friend-requests/${requestId}/reject`),
  getChallenges: () => api.get('/social/challenges'),
  joinChallenge: (challengeId) => api.post(`/social/challenges/${challengeId}/join`),
  leaveChallenge: (challengeId) => api.delete(`/social/challenges/${challengeId}/join`)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getWorkoutStats: (params) => api.get('/analytics/workouts', { params }),
  getNutritionStats: (params) => api.get('/analytics/nutrition', { params }),
  getProgressStats: (params) => api.get('/analytics/progress', { params }),
  getInsights: () => api.get('/analytics/insights'),
  getPredictions: () => api.get('/analytics/predictions')
};

export { api };
