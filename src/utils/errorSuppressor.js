import { LogBox } from 'react-native';

/**
 * Suppress known warnings that don't affect functionality
 */
export function suppressKnownWarnings() {
  LogBox.ignoreLogs([
    // Expo AV deprecation (we know about this)
    'expo-av has been deprecated',
    
    // Vision Camera (not available in Expo Go)
    'VisionCamera not available',
    'react-native-vision-camera is not supported in Expo Go',
    
    // Google Sign-In (not available in Expo Go)
    'RNGoogleSignin could not be found',
    'Google Sign-In',
    
    // SQLite (not available in Expo Go)
    'expo-sqlite not available',
    'Database not available',
    
    // File system deprecation warnings
    'getInfoAsync imported from "expo-file-system" is deprecated',
    
    // Storage initialization
    'Storage initialization',
    'Migration',
    
    // Network timeouts (backend may not be running)
    'Network request failed',
    'Network request timed out',
  ]);
}

