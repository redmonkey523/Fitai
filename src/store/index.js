import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import slices
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import workoutSlice from './slices/workoutSlice';
import nutritionSlice from './slices/nutritionSlice';
import progressSlice from './slices/progressSlice';
import socialSlice from './slices/socialSlice';
import notificationSlice from './slices/notificationSlice';

// Web-compatible storage
const createWebStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }
  return {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
  };
};

// Use web storage for web platform, AsyncStorage for native
const storage = Platform.OS === 'web' ? createWebStorage() : AsyncStorage;

// Combine all reducers
const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  workout: workoutSlice,
  nutrition: nutritionSlice,
  progress: progressSlice,
  social: socialSlice,
  notification: notificationSlice
});

// Persist configuration - persist the root reducer once
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'user', 'workout', 'nutrition', 'progress'], // Only persist these slices
  blacklist: ['notification', 'social'] // Don't persist notifications and social (real-time data)
};

// Create persisted root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['persist']
      }
    })
});

// Create persistor
export const persistor = persistStore(store);

// Export types (TypeScript - use in .ts files, not .js)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
