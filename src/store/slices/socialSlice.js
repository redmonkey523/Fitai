import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import { FEATURE_FEED } from '../../config/flags';

// Async thunks for social features
export const fetchPosts = createAsyncThunk(
  'social/fetchPosts',
  async (_, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.get('/social/posts');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'social/createPost',
  async (postData, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.post('/social/posts', postData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to create post');
    }
  }
);

export const likePost = createAsyncThunk(
  'social/likePost',
  async ({ postId, userId }, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.post(`/social/posts/${postId}/like`, { userId });
      return { postId, userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to like post');
    }
  }
);

export const commentOnPost = createAsyncThunk(
  'social/commentOnPost',
  async ({ postId, comment }, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.post(`/social/posts/${postId}/comments`, { comment });
      return { postId, comment: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to comment on post');
    }
  }
);

export const fetchChallenges = createAsyncThunk(
  'social/fetchChallenges',
  async (_, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.get('/social/challenges');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch challenges');
    }
  }
);

export const joinChallenge = createAsyncThunk(
  'social/joinChallenge',
  async ({ challengeId, userId }, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.post(`/social/challenges/${challengeId}/join`, { userId });
      return { challengeId, userId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to join challenge');
    }
  }
);

export const fetchFriends = createAsyncThunk(
  'social/fetchFriends',
  async (userId, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.get(`/social/friends/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch friends');
    }
  }
);

export const addFriend = createAsyncThunk(
  'social/addFriend',
  async ({ userId, friendId }, { rejectWithValue }) => {
    if (!FEATURE_FEED) {
      return rejectWithValue('Social feed feature is disabled');
    }
    try {
      const response = await api.post('/social/friends', { userId, friendId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add friend');
    }
  }
);

const initialState = {
  posts: [],
  challenges: [],
  friends: [],
  currentUser: null,
  loading: false,
  error: null,
  notifications: [],
  // Post creation state
  creatingPost: false,
  createPostError: null,
  // Challenge state
  joiningChallenge: false,
  joinChallengeError: null,
  // Friend state
  addingFriend: false,
  addFriendError: null,
  // Pagination
  hasMorePosts: true,
  currentPage: 1,
  postsPerPage: 10
};

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createPostError = null;
      state.joinChallengeError = null;
      state.addFriendError = null;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    updatePostLocally: (state, action) => {
      const { postId, updates } = action.payload;
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex] = { ...state.posts[postIndex], ...updates };
      }
    },
    removePostLocally: (state, action) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    },
    resetSocialState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts;
        state.hasMorePosts = action.payload.hasMore;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create Post
    builder
      .addCase(createPost.pending, (state) => {
        state.creatingPost = true;
        state.createPostError = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.creatingPost = false;
        state.posts.unshift(action.payload.post);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.creatingPost = false;
        state.createPostError = action.payload;
      });

    // Like Post
    builder
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, userId } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
          } else {
            post.likes.push(userId);
          }
        }
      });

    // Comment on Post
    builder
      .addCase(commentOnPost.fulfilled, (state, action) => {
        const { postId, comment } = action.payload;
        const post = state.posts.find(p => p.id === postId);
        if (post) {
          post.comments.push(comment);
        }
      });

    // Fetch Challenges
    builder
      .addCase(fetchChallenges.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChallenges.fulfilled, (state, action) => {
        state.loading = false;
        state.challenges = action.payload.challenges;
      })
      .addCase(fetchChallenges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Join Challenge
    builder
      .addCase(joinChallenge.pending, (state) => {
        state.joiningChallenge = true;
        state.joinChallengeError = null;
      })
      .addCase(joinChallenge.fulfilled, (state, action) => {
        state.joiningChallenge = false;
        const { challengeId, userId } = action.payload;
        const challenge = state.challenges.find(c => c.id === challengeId);
        if (challenge && !challenge.participants.includes(userId)) {
          challenge.participants.push(userId);
        }
      })
      .addCase(joinChallenge.rejected, (state, action) => {
        state.joiningChallenge = false;
        state.joinChallengeError = action.payload;
      });

    // Fetch Friends
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload.friends;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Friend
    builder
      .addCase(addFriend.pending, (state) => {
        state.addingFriend = true;
        state.addFriendError = null;
      })
      .addCase(addFriend.fulfilled, (state, action) => {
        state.addingFriend = false;
        state.friends.push(action.payload.friend);
      })
      .addCase(addFriend.rejected, (state, action) => {
        state.addingFriend = false;
        state.addFriendError = action.payload;
      });
  }
});

export const {
  clearError,
  setCurrentUser,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  updatePostLocally,
  removePostLocally,
  resetSocialState
} = socialSlice.actions;

// Selectors
export const selectPosts = (state) => state.social.posts;
export const selectChallenges = (state) => state.social.challenges;
export const selectFriends = (state) => state.social.friends;
export const selectCurrentUser = (state) => state.social.currentUser;
export const selectLoading = (state) => state.social.loading;
export const selectError = (state) => state.social.error;
export const selectNotifications = (state) => state.social.notifications;
export const selectUnreadNotifications = (state) => 
  state.social.notifications.filter(n => !n.read);
export const selectCreatingPost = (state) => state.social.creatingPost;
export const selectCreatePostError = (state) => state.social.createPostError;
export const selectJoiningChallenge = (state) => state.social.joiningChallenge;
export const selectJoinChallengeError = (state) => state.social.joinChallengeError;
export const selectAddingFriend = (state) => state.social.addingFriend;
export const selectAddFriendError = (state) => state.social.addFriendError;
export const selectHasMorePosts = (state) => state.social.hasMorePosts;
export const selectCurrentPage = (state) => state.social.currentPage;

export default socialSlice.reducer;
