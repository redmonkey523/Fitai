import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks
export const fetchWorkouts = createAsyncThunk(
  'workout/fetchWorkouts',
  async ({ page = 1, limit = 10, type, difficulty, status, search, sortBy = 'createdAt', sortOrder = 'desc' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        sortBy,
        sortOrder,
        ...(type && { type }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        ...(search && { search })
      });
      
      const response = await api.get(`/workouts?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workouts');
    }
  }
);

export const fetchWorkout = createAsyncThunk(
  'workout/fetchWorkout',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workouts/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workout');
    }
  }
);

export const createWorkout = createAsyncThunk(
  'workout/createWorkout',
  async (workoutData, { rejectWithValue }) => {
    try {
      const response = await api.post('/workouts', workoutData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create workout');
    }
  }
);

export const updateWorkout = createAsyncThunk(
  'workout/updateWorkout',
  async ({ id, workoutData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/workouts/${id}`, workoutData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update workout');
    }
  }
);

export const deleteWorkout = createAsyncThunk(
  'workout/deleteWorkout',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/workouts/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete workout');
    }
  }
);

export const startWorkout = createAsyncThunk(
  'workout/startWorkout',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workouts/${id}/start`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start workout');
    }
  }
);

export const completeSet = createAsyncThunk(
  'workout/completeSet',
  async ({ id, exerciseIndex, setIndex, actualData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/workouts/${id}/complete-set`, {
        exerciseIndex,
        setIndex,
        actualData
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete set');
    }
  }
);

export const completeWorkout = createAsyncThunk(
  'workout/completeWorkout',
  async ({ id, notes, rating }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workouts/${id}/complete`, { notes, rating });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete workout');
    }
  }
);

export const fetchWorkoutTemplates = createAsyncThunk(
  'workout/fetchTemplates',
  async ({ category, difficulty, limit = 10 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        limit,
        ...(category && { category }),
        ...(difficulty && { difficulty })
      });
      
      const response = await api.get(`/workouts/templates?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workout templates');
    }
  }
);

export const cloneWorkout = createAsyncThunk(
  'workout/cloneWorkout',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workouts/${id}/clone`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clone workout');
    }
  }
);

export const fetchWorkoutStats = createAsyncThunk(
  'workout/fetchStats',
  async ({ period = '30' }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workouts/stats/summary?period=${period}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workout stats');
    }
  }
);

// Initial state
const initialState = {
  // Workouts list
  workouts: [],
  workoutsLoading: false,
  workoutsError: null,
  
  // Current workout
  currentWorkout: null,
  currentWorkoutLoading: false,
  currentWorkoutError: null,
  
  // Templates
  templates: [],
  templatesLoading: false,
  templatesError: null,
  
  // Stats
  stats: {
    totalWorkouts: 0,
    totalDuration: 0,
    totalSets: 0,
    totalReps: 0,
    totalWeight: 0,
    averageRating: 0
  },
  statsLoading: false,
  statsError: null,
  
  // Active workout session
  activeSession: null,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  
  // UI state
  showCreateModal: false,
  showEditModal: false,
  showTemplatesModal: false,
  selectedWorkoutId: null,
  filters: {
    type: null,
    difficulty: null,
    status: null,
    search: ''
  },
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

// Slice
const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    // UI actions
    setShowCreateModal: (state, action) => {
      state.showCreateModal = action.payload ?? !state.showCreateModal;
    },
    setShowEditModal: (state, action) => {
      state.showEditModal = action.payload ?? !state.showEditModal;
    },
    setShowTemplatesModal: (state, action) => {
      state.showTemplatesModal = action.payload ?? !state.showTemplatesModal;
    },
    setSelectedWorkoutId: (state, action) => {
      state.selectedWorkoutId = action.payload;
    },
    
    // Filter actions
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = {
        type: null,
        difficulty: null,
        status: null,
        search: ''
      };
    },
    
    // Sort actions
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    
    // Active session actions
    setActiveSession: (state, action) => {
      state.activeSession = action.payload;
    },
    setCurrentExerciseIndex: (state, action) => {
      state.currentExerciseIndex = action.payload;
    },
    setCurrentSetIndex: (state, action) => {
      state.currentSetIndex = action.payload;
    },
    nextSet: (state) => {
      if (state.activeSession && state.activeSession.exercises) {
        const currentExercise = state.activeSession.exercises[state.currentExerciseIndex];
        if (currentExercise && state.currentSetIndex < currentExercise.sets.length - 1) {
          state.currentSetIndex++;
        } else if (state.currentExerciseIndex < state.activeSession.exercises.length - 1) {
          state.currentExerciseIndex++;
          state.currentSetIndex = 0;
        }
      }
    },
    previousSet: (state) => {
      if (state.currentSetIndex > 0) {
        state.currentSetIndex--;
      } else if (state.currentExerciseIndex > 0) {
        state.currentExerciseIndex--;
        const previousExercise = state.activeSession.exercises[state.currentExerciseIndex];
        state.currentSetIndex = previousExercise ? previousExercise.sets.length - 1 : 0;
      }
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.workoutsError = null;
      state.currentWorkoutError = null;
      state.templatesError = null;
      state.statsError = null;
    },
    
    // Reset state
    resetWorkout: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch workouts
      .addCase(fetchWorkouts.pending, (state) => {
        state.workoutsLoading = true;
        state.workoutsError = null;
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.workoutsLoading = false;
        state.workouts = action.payload.data.workouts;
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.workoutsLoading = false;
        state.workoutsError = action.payload;
      })
      
      // Fetch single workout
      .addCase(fetchWorkout.pending, (state) => {
        state.currentWorkoutLoading = true;
        state.currentWorkoutError = null;
      })
      .addCase(fetchWorkout.fulfilled, (state, action) => {
        state.currentWorkoutLoading = false;
        state.currentWorkout = action.payload.data.workout;
      })
      .addCase(fetchWorkout.rejected, (state, action) => {
        state.currentWorkoutLoading = false;
        state.currentWorkoutError = action.payload;
      })
      
      // Create workout
      .addCase(createWorkout.pending, (state) => {
        state.workoutsLoading = true;
        state.workoutsError = null;
      })
      .addCase(createWorkout.fulfilled, (state, action) => {
        state.workoutsLoading = false;
        state.workouts.unshift(action.payload.data.workout);
        state.showCreateModal = false;
      })
      .addCase(createWorkout.rejected, (state, action) => {
        state.workoutsLoading = false;
        state.workoutsError = action.payload;
      })
      
      // Update workout
      .addCase(updateWorkout.pending, (state) => {
        state.workoutsLoading = true;
        state.workoutsError = null;
      })
      .addCase(updateWorkout.fulfilled, (state, action) => {
        state.workoutsLoading = false;
        const index = state.workouts.findIndex(workout => workout._id === action.payload.data.workout._id);
        if (index !== -1) {
          state.workouts[index] = action.payload.data.workout;
        }
        if (state.currentWorkout && state.currentWorkout._id === action.payload.data.workout._id) {
          state.currentWorkout = action.payload.data.workout;
        }
        state.showEditModal = false;
      })
      .addCase(updateWorkout.rejected, (state, action) => {
        state.workoutsLoading = false;
        state.workoutsError = action.payload;
      })
      
      // Delete workout
      .addCase(deleteWorkout.pending, (state) => {
        state.workoutsLoading = true;
        state.workoutsError = null;
      })
      .addCase(deleteWorkout.fulfilled, (state, action) => {
        state.workoutsLoading = false;
        state.workouts = state.workouts.filter(workout => workout._id !== action.payload);
        if (state.currentWorkout && state.currentWorkout._id === action.payload) {
          state.currentWorkout = null;
        }
      })
      .addCase(deleteWorkout.rejected, (state, action) => {
        state.workoutsLoading = false;
        state.workoutsError = action.payload;
      })
      
      // Start workout
      .addCase(startWorkout.pending, (state) => {
        state.currentWorkoutLoading = true;
        state.currentWorkoutError = null;
      })
      .addCase(startWorkout.fulfilled, (state, action) => {
        state.currentWorkoutLoading = false;
        state.activeSession = action.payload.data.session;
        state.currentExerciseIndex = 0;
        state.currentSetIndex = 0;
      })
      .addCase(startWorkout.rejected, (state, action) => {
        state.currentWorkoutLoading = false;
        state.currentWorkoutError = action.payload;
      })
      
      // Complete set
      .addCase(completeSet.pending, (state) => {
        state.currentWorkoutLoading = true;
        state.currentWorkoutError = null;
      })
      .addCase(completeSet.fulfilled, (state, action) => {
        state.currentWorkoutLoading = false;
        // Update the set in the active session
        if (state.activeSession && state.activeSession.exercises) {
          const exercise = state.activeSession.exercises[state.currentExerciseIndex];
          if (exercise && exercise.sets) {
            exercise.sets[state.currentSetIndex] = action.payload.data.set;
          }
        }
      })
      .addCase(completeSet.rejected, (state, action) => {
        state.currentWorkoutLoading = false;
        state.currentWorkoutError = action.payload;
      })
      
      // Complete workout
      .addCase(completeWorkout.pending, (state) => {
        state.currentWorkoutLoading = true;
        state.currentWorkoutError = null;
      })
      .addCase(completeWorkout.fulfilled, (state, action) => {
        state.currentWorkoutLoading = false;
        state.activeSession = null;
        state.currentExerciseIndex = 0;
        state.currentSetIndex = 0;
        // Update the workout in the list
        const index = state.workouts.findIndex(workout => workout._id === state.selectedWorkoutId);
        if (index !== -1) {
          state.workouts[index].status = 'completed';
          state.workouts[index].completedAt = new Date().toISOString();
        }
      })
      .addCase(completeWorkout.rejected, (state, action) => {
        state.currentWorkoutLoading = false;
        state.currentWorkoutError = action.payload;
      })
      
      // Fetch templates
      .addCase(fetchWorkoutTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.templatesError = null;
      })
      .addCase(fetchWorkoutTemplates.fulfilled, (state, action) => {
        state.templatesLoading = false;
        state.templates = action.payload.data.templates;
      })
      .addCase(fetchWorkoutTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.templatesError = action.payload;
      })
      
      // Clone workout
      .addCase(cloneWorkout.pending, (state) => {
        state.workoutsLoading = true;
        state.workoutsError = null;
      })
      .addCase(cloneWorkout.fulfilled, (state, action) => {
        state.workoutsLoading = false;
        state.workouts.unshift(action.payload.data.workout);
        state.showTemplatesModal = false;
      })
      .addCase(cloneWorkout.rejected, (state, action) => {
        state.workoutsLoading = false;
        state.workoutsError = action.payload;
      })
      
      // Fetch stats
      .addCase(fetchWorkoutStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchWorkoutStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.data.summary;
      })
      .addCase(fetchWorkoutStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      });
  }
});

// Export actions
export const {
  setShowCreateModal,
  setShowEditModal,
  setShowTemplatesModal,
  setSelectedWorkoutId,
  setFilter,
  clearFilters,
  setSortBy,
  setSortOrder,
  setActiveSession,
  setCurrentExerciseIndex,
  setCurrentSetIndex,
  nextSet,
  previousSet,
  clearErrors,
  resetWorkout
} = workoutSlice.actions;

// Export selectors
export const selectWorkouts = (state) => state.workout.workouts;
export const selectCurrentWorkout = (state) => state.workout.currentWorkout;
export const selectTemplates = (state) => state.workout.templates;
export const selectStats = (state) => state.workout.stats;
export const selectActiveSession = (state) => state.workout.activeSession;
export const selectCurrentExerciseIndex = (state) => state.workout.currentExerciseIndex;
export const selectCurrentSetIndex = (state) => state.workout.currentSetIndex;
export const selectWorkoutsLoading = (state) => state.workout.workoutsLoading;
export const selectWorkoutsError = (state) => state.workout.workoutsError;
export const selectShowCreateModal = (state) => state.workout.showCreateModal;
export const selectShowEditModal = (state) => state.workout.showEditModal;
export const selectShowTemplatesModal = (state) => state.workout.showTemplatesModal;
export const selectSelectedWorkoutId = (state) => state.workout.selectedWorkoutId;
export const selectFilters = (state) => state.workout.filters;
export const selectSortBy = (state) => state.workout.sortBy;
export const selectSortOrder = (state) => state.workout.sortOrder;

// Export reducer
export default workoutSlice.reducer;
