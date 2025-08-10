import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, Text } from 'react-native';
import { COLORS } from './src/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import WorkoutLibraryScreen from './src/screens/WorkoutLibraryScreen';
import ProgressTrackingScreen from './src/screens/ProgressTrackingScreen';
import SocialScreen from './src/screens/SocialScreen';
import NutritionScreen from './src/screens/NutritionScreen';
import VoiceWorkoutScreen from './src/screens/VoiceWorkoutScreen';

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
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.primary} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.background.primary }
        }}
      >
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root app component with providers
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
        <Toast />
      </AuthProvider>
    </ErrorBoundary>
  );
}
