import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Text } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { COLORS } from './src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { initStorage } from './src/storage';
import { suppressKnownWarnings } from './src/utils/errorSuppressor';
import { hardenConsole } from './scripts/devConsole';
import QueryProvider from './src/providers/QueryProvider';
import crashReporting from './src/services/crashReporting';
import analyticsService from './src/services/analytics';

// Suppress known warnings to prevent console spam
suppressKnownWarnings();

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreenEnhanced';
import WorkoutLibraryScreen from './src/screens/WorkoutLibraryScreen';
import ProgressTrackingScreen from './src/screens/ProgressScreenEnhanced';
// Removed SocialScreen import due to FEATURE_FEED=false
import NutritionScreen from './src/screens/NutritionScreen';
import VoiceWorkoutScreen from './src/screens/VoiceWorkoutScreen';
import GoalQuizScreen from './src/screens/GoalQuizScreen';

// Import navigation
import TabNavigator from './src/navigation/TabNavigator';

// Import auth context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import toast
import Toast from 'react-native-toast-message';

// Import error boundary
import ErrorBoundary from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

// Loading screen component
const LoadingScreen = () => {
  return (
    <View style={{
      flex: 1,
      backgroundColor: COLORS.background.primary,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Ionicons name="fitness" size={64} color={COLORS.accent.primary} />
      <Text style={{
        color: COLORS.text.primary,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16
      }}>
        FitAI
      </Text>
    </View>
  );
};

// Main app component with auth logic
const AppContent = () => {
  const { user, isLoading } = useAuth();
  const routeNameRef = useRef();
  const navigationRef = useRef();

  // Set user context for crash reporting and analytics
  useEffect(() => {
    if (user) {
      crashReporting.setUser(user);
      analyticsService.setUserId(user.id || user._id);
      analyticsService.setUserProperties({
        email: user.email,
        name: user.name || user.username,
        createdAt: user.createdAt,
      });
      
      console.log('[App] User context set for crash reporting and analytics');
    } else {
      crashReporting.clearUser();
      analyticsService.setUserId(null);
      console.log('[App] User context cleared');
    }
  }, [user]);

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background.primary} />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: COLORS.background.primary }
          }}
        >
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName) {
          // Track screen view
          analyticsService.logScreenView(currentRouteName);
          crashReporting.trackScreen(currentRouteName);
        }

        // Save the current route name for next time
        routeNameRef.current = currentRouteName;
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.primary} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background.primary }
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main">
              {(props) => (
                <ErrorBoundary stackName="Main Navigation" fallbackRoute="Home">
                  <TabNavigator {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
            <Stack.Screen name="GoalQuiz">
              {(props) => (
                <ErrorBoundary stackName="Goal Quiz" fallbackRoute="Main">
                  <GoalQuizScreen {...props} />
                </ErrorBoundary>
              )}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Auth">
            {(props) => (
              <ErrorBoundary 
                stackName="Authentication"
                customMessage="We're having trouble loading the sign-in page. Please check your connection and try again."
              >
                <AuthScreen {...props} />
              </ErrorBoundary>
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root app component with providers
export default function App() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    // Initialize crash reporting and analytics
    console.log('[App] Initializing crash reporting and analytics...');
    crashReporting.init();
    analyticsService.init();

    // Initialize compliant storage system (silent)
    initStorage()
      .then(() => {
        setStorageReady(true);
        console.log('[App] Storage initialized');
      })
      .catch((error) => {
        console.error('[App] Storage initialization failed:', error);
        crashReporting.logError(error, { context: 'storage_init' });
        setStorageReady(true); // Continue anyway
      });

    // Dev console hardening temporarily disabled - was too aggressive
    // if (__DEV__) {
    //   hardenConsole();
    // }
  }, []);

  if (!storageReady) {
    return <LoadingScreen />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <AppContent />
              <Toast />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}
