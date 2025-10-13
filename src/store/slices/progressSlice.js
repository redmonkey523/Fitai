import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks
export const fetchProgress = createAsyncThunk(
  'progress/fetchProgress',
  async ({ startDate, endDate, type }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (type) params.append('type', type);
      
      const response = await api.get(`/progress?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch progress');
    }
  }
);

export const addMeasurement = createAsyncThunk(
  'progress/addMeasurement',
  async (measurementData, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/measurements', measurementData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add measurement');
    }
  }
);

export const updateMeasurement = createAsyncThunk(
  'progress/updateMeasurement',
  async ({ id, measurementData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/progress/measurements/${id}`, measurementData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update measurement');
    }
  }
);

export const deleteMeasurement = createAsyncThunk(
  'progress/deleteMeasurement',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/progress/measurements/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete measurement');
    }
  }
);

export const addProgressPhoto = createAsyncThunk(
  'progress/addPhoto',
  async (photoData, { rejectWithValue }) => {
    try {
      const response = await api.post('/progress/photos', photoData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add photo');
    }
  }
);

export const fetchProgressPhotos = createAsyncThunk(
  'progress/fetchPhotos',
  async ({ startDate, endDate, category }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (category) params.append('category', category);
      
      const response = await api.get(`/progress/photos?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch photos');
    }
  }
);

export const deleteProgressPhoto = createAsyncThunk(
  'progress/deletePhoto',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/progress/photos/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete photo');
    }
  }
);

export const fetchProgressAnalytics = createAsyncThunk(
  'progress/fetchAnalytics',
  async ({ period = '30', type }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        period,
        ...(type && { type })
      });
      
      const response = await api.get(`/progress/analytics?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchProgressSummary = createAsyncThunk(
  'progress/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/progress/summary');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

// Initial state
const initialState = {
  // Measurements
  measurements: [],
  measurementsLoading: false,
  measurementsError: null,
  
  // Photos
  photos: [],
  photosLoading: false,
  photosError: null,
  
  // Analytics
  analytics: {
    weight: {
      current: 0,
      change: 0,
      trend: 'stable',
      history: []
    },
    bodyFat: {
      current: 0,
      change: 0,
      trend: 'stable',
      history: []
    },
    muscleMass: {
      current: 0,
      change: 0,
      trend: 'stable',
      history: []
    },
    measurements: {
      chest: { current: 0, change: 0, history: [] },
      waist: { current: 0, change: 0, history: [] },
      hips: { current: 0, change: 0, history: [] },
      arms: { current: 0, change: 0, history: [] },
      thighs: { current: 0, change: 0, history: [] }
    }
  },
  analyticsLoading: false,
  analyticsError: null,
  
  // Summary
  summary: {
    totalMeasurements: 0,
    totalPhotos: 0,
    lastMeasurement: null,
    lastPhoto: null,
    progressScore: 0,
    streak: 0
  },
  summaryLoading: false,
  summaryError: null,
  
  // UI state
  showAddMeasurementModal: false,
  showAddPhotoModal: false,
  showAnalyticsModal: false,
  selectedMeasurementId: null,
  selectedPhotoId: null,
  selectedDate: new Date().toISOString().split('T')[0],
  selectedCategory: null,
  selectedPeriod: '30'
};

// Slice
const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    // UI actions
    setShowAddMeasurementModal: (state, action) => {
      state.showAddMeasurementModal = action.payload ?? !state.showAddMeasurementModal;
    },
    setShowAddPhotoModal: (state, action) => {
      state.showAddPhotoModal = action.payload ?? !state.showAddPhotoModal;
    },
    setShowAnalyticsModal: (state, action) => {
      state.showAnalyticsModal = action.payload ?? !state.showAnalyticsModal;
    },
    setSelectedMeasurementId: (state, action) => {
      state.selectedMeasurementId = action.payload;
    },
    setSelectedPhotoId: (state, action) => {
      state.selectedPhotoId = action.payload;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSelectedPeriod: (state, action) => {
      state.selectedPeriod = action.payload;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.measurementsError = null;
      state.photosError = null;
      state.analyticsError = null;
      state.summaryError = null;
    },
    
    // Reset state
    resetProgress: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch progress
      .addCase(fetchProgress.pending, (state) => {
        state.measurementsLoading = true;
        state.measurementsError = null;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.measurementsLoading = false;
        state.measurements = action.payload.data.measurements;
      })
      .addCase(fetchProgress.rejected, (state, action) => {
        state.measurementsLoading = false;
        state.measurementsError = action.payload;
      })
      
      // Add measurement
      .addCase(addMeasurement.pending, (state) => {
        state.measurementsLoading = true;
        state.measurementsError = null;
      })
      .addCase(addMeasurement.fulfilled, (state, action) => {
        state.measurementsLoading = false;
        state.measurements.unshift(action.payload.data.measurement);
        state.showAddMeasurementModal = false;
      })
      .addCase(addMeasurement.rejected, (state, action) => {
        state.measurementsLoading = false;
        state.measurementsError = action.payload;
      })
      
      // Update measurement
      .addCase(updateMeasurement.pending, (state) => {
        state.measurementsLoading = true;
        state.measurementsError = null;
      })
      .addCase(updateMeasurement.fulfilled, (state, action) => {
        state.measurementsLoading = false;
        const index = state.measurements.findIndex(m => m._id === action.payload.data.measurement._id);
        if (index !== -1) {
          state.measurements[index] = action.payload.data.measurement;
        }
      })
      .addCase(updateMeasurement.rejected, (state, action) => {
        state.measurementsLoading = false;
        state.measurementsError = action.payload;
      })
      
      // Delete measurement
      .addCase(deleteMeasurement.pending, (state) => {
        state.measurementsLoading = true;
        state.measurementsError = null;
      })
      .addCase(deleteMeasurement.fulfilled, (state, action) => {
        state.measurementsLoading = false;
        state.measurements = state.measurements.filter(m => m._id !== action.payload);
      })
      .addCase(deleteMeasurement.rejected, (state, action) => {
        state.measurementsLoading = false;
        state.measurementsError = action.payload;
      })
      
      // Add photo
      .addCase(addProgressPhoto.pending, (state) => {
        state.photosLoading = true;
        state.photosError = null;
      })
      .addCase(addProgressPhoto.fulfilled, (state, action) => {
        state.photosLoading = false;
        state.photos.unshift(action.payload.data.photo);
        state.showAddPhotoModal = false;
      })
      .addCase(addProgressPhoto.rejected, (state, action) => {
        state.photosLoading = false;
        state.photosError = action.payload;
      })
      
      // Fetch photos
      .addCase(fetchProgressPhotos.pending, (state) => {
        state.photosLoading = true;
        state.photosError = null;
      })
      .addCase(fetchProgressPhotos.fulfilled, (state, action) => {
        state.photosLoading = false;
        state.photos = action.payload.data.photos;
      })
      .addCase(fetchProgressPhotos.rejected, (state, action) => {
        state.photosLoading = false;
        state.photosError = action.payload;
      })
      
      // Delete photo
      .addCase(deleteProgressPhoto.pending, (state) => {
        state.photosLoading = true;
        state.photosError = null;
      })
      .addCase(deleteProgressPhoto.fulfilled, (state, action) => {
        state.photosLoading = false;
        state.photos = state.photos.filter(p => p._id !== action.payload);
      })
      .addCase(deleteProgressPhoto.rejected, (state, action) => {
        state.photosLoading = false;
        state.photosError = action.payload;
      })
      
      // Fetch analytics
      .addCase(fetchProgressAnalytics.pending, (state) => {
        state.analyticsLoading = true;
        state.analyticsError = null;
      })
      .addCase(fetchProgressAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload.data.analytics;
      })
      .addCase(fetchProgressAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsError = action.payload;
      })
      
      // Fetch summary
      .addCase(fetchProgressSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchProgressSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload.data.summary;
      })
      .addCase(fetchProgressSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      });
  }
});

// Export actions
export const {
  setShowAddMeasurementModal,
  setShowAddPhotoModal,
  setShowAnalyticsModal,
  setSelectedMeasurementId,
  setSelectedPhotoId,
  setSelectedDate,
  setSelectedCategory,
  setSelectedPeriod,
  clearErrors,
  resetProgress
} = progressSlice.actions;

// Export selectors
export const selectMeasurements = (state) => state.progress.measurements;
export const selectPhotos = (state) => state.progress.photos;
export const selectAnalytics = (state) => state.progress.analytics;
export const selectSummary = (state) => state.progress.summary;
export const selectMeasurementsLoading = (state) => state.progress.measurementsLoading;
export const selectPhotosLoading = (state) => state.progress.photosLoading;
export const selectAnalyticsLoading = (state) => state.progress.analyticsLoading;
export const selectSummaryLoading = (state) => state.progress.summaryLoading;
export const selectMeasurementsError = (state) => state.progress.measurementsError;
export const selectPhotosError = (state) => state.progress.photosError;
export const selectAnalyticsError = (state) => state.progress.analyticsError;
export const selectSummaryError = (state) => state.progress.summaryError;
export const selectShowAddMeasurementModal = (state) => state.progress.showAddMeasurementModal;
export const selectShowAddPhotoModal = (state) => state.progress.showAddPhotoModal;
export const selectShowAnalyticsModal = (state) => state.progress.showAnalyticsModal;
export const selectSelectedMeasurementId = (state) => state.progress.selectedMeasurementId;
export const selectSelectedPhotoId = (state) => state.progress.selectedPhotoId;
export const selectSelectedDate = (state) => state.progress.selectedDate;
export const selectSelectedCategory = (state) => state.progress.selectedCategory;
export const selectSelectedPeriod = (state) => state.progress.selectedPeriod;

// Export reducer
export default progressSlice.reducer;
