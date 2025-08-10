import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import slices
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import workoutSlice from './slices/workoutSlice';
import nutritionSlice from './slices/nutritionSlice';
import progressSlice from './slices/progressSlice';
import socialSlice from './slices/socialSlice';
import notificationSlice from './slices/notificationSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'workout', 'nutrition', 'progress'], // Only persist these slices
  blacklist: ['notification'] // Don't persist notifications
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(persistConfig, authSlice);
const persistedUserReducer = persistReducer(persistConfig, userSlice);
const persistedWorkoutReducer = persistReducer(persistConfig, workoutSlice);
const persistedNutritionReducer = persistReducer(persistConfig, nutritionSlice);
const persistedProgressReducer = persistReducer(persistConfig, progressSlice);
const persistedSocialReducer = persistReducer(persistConfig, socialSlice);

// Configure store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: persistedUserReducer,
    workout: persistedWorkoutReducer,
    nutrition: persistedNutritionReducer,
    progress: persistedProgressReducer,
    social: persistedSocialReducer,
    notification: notificationSlice
  },
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

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
