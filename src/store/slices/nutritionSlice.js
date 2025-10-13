import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks
export const fetchNutritionEntries = createAsyncThunk(
  'nutrition/fetchEntries',
  async ({ date, mealType, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...(date && { date }),
        ...(mealType && { mealType })
      });
      
      const response = await api.get(`/nutrition/entries?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nutrition entries');
    }
  }
);

export const addNutritionEntry = createAsyncThunk(
  'nutrition/addEntry',
  async (entryData, { rejectWithValue }) => {
    try {
      const response = await api.post('/nutrition/entries', entryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add nutrition entry');
    }
  }
);

export const updateNutritionEntry = createAsyncThunk(
  'nutrition/updateEntry',
  async ({ id, entryData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/nutrition/entries/${id}`, entryData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update nutrition entry');
    }
  }
);

export const deleteNutritionEntry = createAsyncThunk(
  'nutrition/deleteEntry',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/nutrition/entries/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete nutrition entry');
    }
  }
);

export const fetchNutritionSummary = createAsyncThunk(
  'nutrition/fetchSummary',
  async ({ date, startDate, endDate }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/nutrition/summary?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nutrition summary');
    }
  }
);

export const fetchNutritionGoals = createAsyncThunk(
  'nutrition/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/nutrition/goals');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch nutrition goals');
    }
  }
);

export const updateNutritionGoals = createAsyncThunk(
  'nutrition/updateGoals',
  async (goals, { rejectWithValue }) => {
    try {
      const response = await api.put('/nutrition/goals', goals);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update nutrition goals');
    }
  }
);

export const addWaterIntake = createAsyncThunk(
  'nutrition/addWater',
  async ({ amount, unit = 'ml' }, { rejectWithValue }) => {
    try {
      const response = await api.post('/nutrition/water', { amount, unit });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add water intake');
    }
  }
);

export const fetchWaterIntake = createAsyncThunk(
  'nutrition/fetchWater',
  async ({ date }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      
      const response = await api.get(`/nutrition/water?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch water intake');
    }
  }
);

export const searchFoods = createAsyncThunk(
  'nutrition/searchFoods',
  async ({ query, limit = 10 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        q: query,
        limit
      });
      
      const response = await api.get(`/nutrition/search?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search foods');
    }
  }
);

// Initial state
const initialState = {
  // Entries
  entries: [],
  entriesLoading: false,
  entriesError: null,
  
  // Summary
  summary: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    entries: 0
  },
  summaryLoading: false,
  summaryError: null,
  
  // Goals
  goals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 25,
    sugar: 50,
    sodium: 2300,
    water: 2000
  },
  goalsLoading: false,
  goalsError: null,
  
  // Water
  waterIntake: {
    total: 0,
    goal: 2000,
    percentage: 0,
    entries: []
  },
  waterLoading: false,
  waterError: null,
  
  // Search
  searchResults: [],
  searchLoading: false,
  searchError: null,
  
  // UI state
  selectedDate: new Date().toISOString().split('T')[0],
  selectedMealType: null,
  showAddEntryModal: false,
  showGoalsModal: false
};

// Slice
const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState,
  reducers: {
    // UI actions
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setSelectedMealType: (state, action) => {
      state.selectedMealType = action.payload;
    },
    toggleAddEntryModal: (state, action) => {
      state.showAddEntryModal = action.payload ?? !state.showAddEntryModal;
    },
    toggleGoalsModal: (state, action) => {
      state.showGoalsModal = action.payload ?? !state.showGoalsModal;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.entriesError = null;
      state.summaryError = null;
      state.goalsError = null;
      state.waterError = null;
      state.searchError = null;
    },
    
    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    
    // Reset state
    resetNutrition: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch entries
      .addCase(fetchNutritionEntries.pending, (state) => {
        state.entriesLoading = true;
        state.entriesError = null;
      })
      .addCase(fetchNutritionEntries.fulfilled, (state, action) => {
        state.entriesLoading = false;
        state.entries = action.payload.data.entries;
      })
      .addCase(fetchNutritionEntries.rejected, (state, action) => {
        state.entriesLoading = false;
        state.entriesError = action.payload;
      })
      
      // Add entry
      .addCase(addNutritionEntry.pending, (state) => {
        state.entriesLoading = true;
        state.entriesError = null;
      })
      .addCase(addNutritionEntry.fulfilled, (state, action) => {
        state.entriesLoading = false;
        state.entries.unshift(action.payload.data.entry);
        state.showAddEntryModal = false;
      })
      .addCase(addNutritionEntry.rejected, (state, action) => {
        state.entriesLoading = false;
        state.entriesError = action.payload;
      })
      
      // Update entry
      .addCase(updateNutritionEntry.pending, (state) => {
        state.entriesLoading = true;
        state.entriesError = null;
      })
      .addCase(updateNutritionEntry.fulfilled, (state, action) => {
        state.entriesLoading = false;
        const index = state.entries.findIndex(entry => entry._id === action.payload.data.entry._id);
        if (index !== -1) {
          state.entries[index] = action.payload.data.entry;
        }
      })
      .addCase(updateNutritionEntry.rejected, (state, action) => {
        state.entriesLoading = false;
        state.entriesError = action.payload;
      })
      
      // Delete entry
      .addCase(deleteNutritionEntry.pending, (state) => {
        state.entriesLoading = true;
        state.entriesError = null;
      })
      .addCase(deleteNutritionEntry.fulfilled, (state, action) => {
        state.entriesLoading = false;
        state.entries = state.entries.filter(entry => entry._id !== action.payload);
      })
      .addCase(deleteNutritionEntry.rejected, (state, action) => {
        state.entriesLoading = false;
        state.entriesError = action.payload;
      })
      
      // Fetch summary
      .addCase(fetchNutritionSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchNutritionSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload.data.summary;
        state.goals = action.payload.data.goals;
      })
      .addCase(fetchNutritionSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      })
      
      // Fetch goals
      .addCase(fetchNutritionGoals.pending, (state) => {
        state.goalsLoading = true;
        state.goalsError = null;
      })
      .addCase(fetchNutritionGoals.fulfilled, (state, action) => {
        state.goalsLoading = false;
        state.goals = action.payload.data.goals;
      })
      .addCase(fetchNutritionGoals.rejected, (state, action) => {
        state.goalsLoading = false;
        state.goalsError = action.payload;
      })
      
      // Update goals
      .addCase(updateNutritionGoals.pending, (state) => {
        state.goalsLoading = true;
        state.goalsError = null;
      })
      .addCase(updateNutritionGoals.fulfilled, (state, action) => {
        state.goalsLoading = false;
        state.goals = action.payload.data.goals;
        state.showGoalsModal = false;
      })
      .addCase(updateNutritionGoals.rejected, (state, action) => {
        state.goalsLoading = false;
        state.goalsError = action.payload;
      })
      
      // Add water
      .addCase(addWaterIntake.pending, (state) => {
        state.waterLoading = true;
        state.waterError = null;
      })
      .addCase(addWaterIntake.fulfilled, (state, action) => {
        state.waterLoading = false;
        state.waterIntake.entries.unshift(action.payload.data.entry);
        state.waterIntake.total += action.payload.data.entry.servingSize.amount;
        state.waterIntake.percentage = (state.waterIntake.total / state.waterIntake.goal) * 100;
      })
      .addCase(addWaterIntake.rejected, (state, action) => {
        state.waterLoading = false;
        state.waterError = action.payload;
      })
      
      // Fetch water
      .addCase(fetchWaterIntake.pending, (state) => {
        state.waterLoading = true;
        state.waterError = null;
      })
      .addCase(fetchWaterIntake.fulfilled, (state, action) => {
        state.waterLoading = false;
        state.waterIntake = action.payload.data;
      })
      .addCase(fetchWaterIntake.rejected, (state, action) => {
        state.waterLoading = false;
        state.waterError = action.payload;
      })
      
      // Search foods
      .addCase(searchFoods.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchFoods.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.data.foods;
      })
      .addCase(searchFoods.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });
  }
});

// Export actions
export const {
  setSelectedDate,
  setSelectedMealType,
  toggleAddEntryModal,
  toggleGoalsModal,
  clearErrors,
  clearSearchResults,
  resetNutrition
} = nutritionSlice.actions;

// Export selectors
export const selectNutritionEntries = (state) => state.nutrition.entries;
export const selectNutritionSummary = (state) => state.nutrition.summary;
export const selectNutritionGoals = (state) => state.nutrition.goals;
export const selectWaterIntake = (state) => state.nutrition.waterIntake;
export const selectSearchResults = (state) => state.nutrition.searchResults;
export const selectNutritionLoading = (state) => state.nutrition.entriesLoading;
export const selectNutritionError = (state) => state.nutrition.entriesError;
export const selectSelectedDate = (state) => state.nutrition.selectedDate;
export const selectSelectedMealType = (state) => state.nutrition.selectedMealType;
export const selectShowAddEntryModal = (state) => state.nutrition.showAddEntryModal;
export const selectShowGoalsModal = (state) => state.nutrition.showGoalsModal;

// Export reducer
export default nutritionSlice.reducer;
