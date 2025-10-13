import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// Async thunks for notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/notifications/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ userId, notificationId }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notifications/${userId}/${notificationId}/read`);
      return { notificationId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notifications/${userId}/read-all`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async ({ userId, notificationId }, { rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${userId}/${notificationId}`);
      return { notificationId };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete notification');
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async ({ userId, settings }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/notifications/${userId}/settings`, settings);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update notification settings');
    }
  }
);

export const subscribeToPushNotifications = createAsyncThunk(
  'notifications/subscribeToPush',
  async ({ pushToken, platform = 'expo', deviceId }, { rejectWithValue }) => {
    try {
      const apiModule = await import('../../services/api');
      const api = apiModule.default;
      const response = await api.registerPushToken(pushToken, platform, deviceId);
      return { pushToken, platform, ...response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to subscribe to push notifications');
    }
  }
);

export const testPushNotification = createAsyncThunk(
  'notifications/testPush',
  async (_, { rejectWithValue }) => {
    try {
      const apiModule = await import('../../services/api');
      const api = apiModule.default;
      const response = await api.testPushNotification();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send test notification');
    }
  }
);

const initialState = {
  notifications: [],
  settings: {
    pushEnabled: true,
    emailEnabled: true,
    workoutReminders: true,
    nutritionReminders: true,
    socialNotifications: true,
    challengeNotifications: true,
    achievementNotifications: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  },
  loading: false,
  error: null,
  // Action states
  markingAsRead: false,
  markingAllAsRead: false,
  deleting: false,
  updatingSettings: false,
  subscribingToPush: false,
  testingPush: false,
  // Pagination
  hasMoreNotifications: true,
  currentPage: 1,
  notificationsPerPage: 20,
  // Push notification state
  pushToken: null,
  pushSubscribed: false
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      // Keep only last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
    },
    updateNotificationLocally: (state, action) => {
      const { notificationId, updates } = action.payload;
      const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex !== -1) {
        state.notifications[notificationIndex] = { 
          ...state.notifications[notificationIndex], 
          ...updates 
        };
      }
    },
    removeNotificationLocally: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setPushToken: (state, action) => {
      state.pushToken = action.payload;
    },
    setPushSubscribed: (state, action) => {
      state.pushSubscribed = action.payload;
    },
    updateSettingsLocally: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetNotificationState: (state) => {
      return initialState;
    },
    // Real-time notification updates
    receiveNotification: (state, action) => {
      const newNotification = action.payload;
      // Check if notification already exists
      const exists = state.notifications.some(n => n.id === newNotification.id);
      if (!exists) {
        state.notifications.unshift(newNotification);
        // Keep only last 100 notifications
        if (state.notifications.length > 100) {
          state.notifications = state.notifications.slice(0, 100);
        }
      }
    },
    // Batch operations
    markMultipleAsRead: (state, action) => {
      const notificationIds = action.payload;
      state.notifications.forEach(notification => {
        if (notificationIds.includes(notification.id)) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
    },
    deleteMultipleNotifications: (state, action) => {
      const notificationIds = action.payload;
      state.notifications = state.notifications.filter(
        notification => !notificationIds.includes(notification.id)
      );
    }
  },
  extraReducers: (builder) => {
    // Fetch Notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.hasMoreNotifications = action.payload.hasMore;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Mark as Read
    builder
      .addCase(markNotificationAsRead.pending, (state) => {
        state.markingAsRead = true;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markingAsRead = false;
        const { notificationId } = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markingAsRead = false;
        state.error = action.payload;
      });

    // Mark All as Read
    builder
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.markingAllAsRead = true;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.markingAllAsRead = false;
        state.notifications.forEach(notification => {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        });
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.markingAllAsRead = false;
        state.error = action.payload;
      });

    // Delete Notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.deleting = false;
        const { notificationId } = action.payload;
        state.notifications = state.notifications.filter(n => n.id !== notificationId);
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });

    // Update Settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.updatingSettings = true;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.updatingSettings = false;
        state.settings = { ...state.settings, ...action.payload.settings };
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.updatingSettings = false;
        state.error = action.payload;
      });

    // Subscribe to Push
    builder
      .addCase(subscribeToPushNotifications.pending, (state) => {
        state.subscribingToPush = true;
      })
      .addCase(subscribeToPushNotifications.fulfilled, (state, action) => {
        state.subscribingToPush = false;
        state.pushSubscribed = true;
        state.pushToken = action.payload.pushToken;
      })
      .addCase(subscribeToPushNotifications.rejected, (state, action) => {
        state.subscribingToPush = false;
        state.error = action.payload;
      });

    // Test Push Notification
    builder
      .addCase(testPushNotification.pending, (state) => {
        state.testingPush = true;
        state.error = null;
      })
      .addCase(testPushNotification.fulfilled, (state) => {
        state.testingPush = false;
      })
      .addCase(testPushNotification.rejected, (state, action) => {
        state.testingPush = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearError,
  addNotification,
  updateNotificationLocally,
  removeNotificationLocally,
  setPushToken,
  setPushSubscribed,
  updateSettingsLocally,
  resetNotificationState,
  receiveNotification,
  markMultipleAsRead,
  deleteMultipleNotifications
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadNotifications = (state) => 
  state.notifications.notifications.filter(n => !n.read);
export const selectUnreadCount = (state) => 
  state.notifications.notifications.filter(n => !n.read).length;
export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectLoading = (state) => state.notifications.loading;
export const selectError = (state) => state.notifications.error;
export const selectMarkingAsRead = (state) => state.notifications.markingAsRead;
export const selectMarkingAllAsRead = (state) => state.notifications.markingAllAsRead;
export const selectDeleting = (state) => state.notifications.deleting;
export const selectUpdatingSettings = (state) => state.notifications.updatingSettings;
export const selectSubscribingToPush = (state) => state.notifications.subscribingToPush;
export const selectUnsubscribingFromPush = (state) => state.notifications.unsubscribingFromPush;
export const selectHasMoreNotifications = (state) => state.notifications.hasMoreNotifications;
export const selectCurrentPage = (state) => state.notifications.currentPage;
export const selectPushToken = (state) => state.notifications.pushToken;
export const selectPushSubscribed = (state) => state.notifications.pushSubscribed;

// Utility selectors
export const selectNotificationsByType = (state, type) => 
  state.notifications.notifications.filter(n => n.type === type);

export const selectRecentNotifications = (state, count = 5) => 
  state.notifications.notifications.slice(0, count);

export const selectNotificationStats = (state) => {
  const notifications = state.notifications.notifications;
  return {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {})
  };
};

export default notificationSlice.reducer;
