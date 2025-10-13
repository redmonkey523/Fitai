import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/settings', settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'user/searchUsers',
  async ({ query, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/search?q=${query}&limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'user/sendFriendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/friends/request', { userId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send friend request');
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'user/acceptFriendRequest',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/friends/accept', { userId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept friend request');
    }
  }
);

export const removeFriend = createAsyncThunk(
  'user/removeFriend',
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/users/friends/${userId}`);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove friend');
    }
  }
);

export const fetchFriends = createAsyncThunk(
  'user/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/friends');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch friends');
    }
  }
);

export const fetchFriendRequests = createAsyncThunk(
  'user/fetchFriendRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/friends/requests');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch friend requests');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/users/account');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
    }
  }
);

// Initial state
const initialState = {
  // User profile
  profile: {
    _id: null,
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    profilePicture: '',
    bio: '',
    dateOfBirth: null,
    gender: '',
    height: null,
    weight: null,
    fitnessLevel: 'beginner',
    goals: [],
    preferences: {}
  },
  profileLoading: false,
  profileError: null,
  
  // Settings
  settings: {
    notifications: {
      push: true,
      email: true,
      workoutReminders: true,
      nutritionReminders: true,
      socialUpdates: true
    },
    privacy: {
      profileVisibility: 'public',
      workoutVisibility: 'friends',
      progressVisibility: 'private',
      allowFriendRequests: true
    },
    units: {
      weight: 'kg',
      height: 'cm',
      distance: 'km'
    },
    theme: 'light',
    language: 'en'
  },
  settingsLoading: false,
  settingsError: null,
  
  // Friends
  friends: [],
  friendsLoading: false,
  friendsError: null,
  
  // Friend requests
  friendRequests: [],
  friendRequestsLoading: false,
  friendRequestsError: null,
  
  // Search
  searchResults: [],
  searchLoading: false,
  searchError: null,
  
  // UI state
  showProfileModal: false,
  showSettingsModal: false,
  showFriendsModal: false,
  selectedUserId: null
};

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // UI actions
    setShowProfileModal: (state, action) => {
      state.showProfileModal = action.payload ?? !state.showProfileModal;
    },
    setShowSettingsModal: (state, action) => {
      state.showSettingsModal = action.payload ?? !state.showSettingsModal;
    },
    setShowFriendsModal: (state, action) => {
      state.showFriendsModal = action.payload ?? !state.showFriendsModal;
    },
    setSelectedUserId: (state, action) => {
      state.selectedUserId = action.payload;
    },
    
    // Clear search results
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.profileError = null;
      state.settingsError = null;
      state.friendsError = null;
      state.friendRequestsError = null;
      state.searchError = null;
    },
    
    // Reset state
    resetUser: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload.data.user;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      })
      
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload.data.user;
        state.showProfileModal = false;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      })
      
      // Update settings
      .addCase(updateUserSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload.data.settings;
        state.showSettingsModal = false;
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload;
      })
      
      // Search users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.data.users;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })
      
      // Send friend request
      .addCase(sendFriendRequest.pending, (state) => {
        state.friendsLoading = true;
        state.friendsError = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.friendsLoading = false;
        // Update search results to show request sent
        const userIndex = state.searchResults.findIndex(user => user._id === action.payload.data.userId);
        if (userIndex !== -1) {
          state.searchResults[userIndex].friendRequestSent = true;
        }
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.friendsLoading = false;
        state.friendsError = action.payload;
      })
      
      // Accept friend request
      .addCase(acceptFriendRequest.pending, (state) => {
        state.friendsLoading = true;
        state.friendsError = null;
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.friendsLoading = false;
        // Remove from friend requests and add to friends
        state.friendRequests = state.friendRequests.filter(request => request.userId !== action.payload.data.userId);
        state.friends.push(action.payload.data.friend);
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.friendsLoading = false;
        state.friendsError = action.payload;
      })
      
      // Remove friend
      .addCase(removeFriend.pending, (state) => {
        state.friendsLoading = true;
        state.friendsError = null;
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friendsLoading = false;
        state.friends = state.friends.filter(friend => friend._id !== action.payload);
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.friendsLoading = false;
        state.friendsError = action.payload;
      })
      
      // Fetch friends
      .addCase(fetchFriends.pending, (state) => {
        state.friendsLoading = true;
        state.friendsError = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friendsLoading = false;
        state.friends = action.payload.data.friends;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.friendsLoading = false;
        state.friendsError = action.payload;
      })
      
      // Fetch friend requests
      .addCase(fetchFriendRequests.pending, (state) => {
        state.friendRequestsLoading = true;
        state.friendRequestsError = null;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.friendRequestsLoading = false;
        state.friendRequests = action.payload.data.requests;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.friendRequestsLoading = false;
        state.friendRequestsError = action.payload;
      })
      
      // Delete account
      .addCase(deleteAccount.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.profileLoading = false;
        // Reset to initial state
        return initialState;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload;
      });
  }
});

// Export actions
export const {
  setShowProfileModal,
  setShowSettingsModal,
  setShowFriendsModal,
  setSelectedUserId,
  clearSearchResults,
  clearErrors,
  resetUser
} = userSlice.actions;

// Export selectors
export const selectUserProfile = (state) => state.user.profile;
export const selectUserSettings = (state) => state.user.settings;
export const selectFriends = (state) => state.user.friends;
export const selectFriendRequests = (state) => state.user.friendRequests;
export const selectSearchResults = (state) => state.user.searchResults;
export const selectProfileLoading = (state) => state.user.profileLoading;
export const selectSettingsLoading = (state) => state.user.settingsLoading;
export const selectFriendsLoading = (state) => state.user.friendsLoading;
export const selectSearchLoading = (state) => state.user.searchLoading;
export const selectProfileError = (state) => state.user.profileError;
export const selectSettingsError = (state) => state.user.settingsError;
export const selectFriendsError = (state) => state.user.friendsError;
export const selectSearchError = (state) => state.user.searchError;
export const selectShowProfileModal = (state) => state.user.showProfileModal;
export const selectShowSettingsModal = (state) => state.user.showSettingsModal;
export const selectShowFriendsModal = (state) => state.user.showFriendsModal;
export const selectSelectedUserId = (state) => state.user.selectedUserId;

// Export reducer
export default userSlice.reducer;
