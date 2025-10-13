// Mock React Native modules for testing
// Stub DevMenu TurboModule to avoid invariant errors during tests
jest.mock('react-native/src/private/devmenu/DevMenu', () => ({}));
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeDevMenu', () => ({}));
jest.mock('react-native/src/private/specs_DEPRECATED/modules/NativeSettingsManager', () => ({
  getConstants: () => ({ settings: {} })
}));
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  getConstants: () => ({ settings: {} })
}));
jest.mock('react-native/Libraries/Utilities/DevSettings', () => ({
  addMenuItem: jest.fn(),
  setIsDebuggingRemotely: jest.fn(),
  setHotLoadingEnabled: jest.fn(),
}));
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return function NativeEventEmitter() {
    return {
      addListener: jest.fn(),
      removeAllListeners: jest.fn(),
      removeListener: jest.fn(),
    };
  };
});
import { StyleSheet } from 'react-native';

// Mock StyleSheet.create to return a simple object
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    StyleSheet: {
      ...RN.StyleSheet,
      create: (styles) => {
        // Return the styles object as-is for testing
        return styles;
      }
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    },
    PixelRatio: {
      get: jest.fn(() => 2),
      roundToNearestPixel: jest.fn((value) => Math.round(value)),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn((size) => size * 2)
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default)
    }
  };
});

// Mock Expo modules
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevices: jest.fn(() => ({ back: { id: 'back' } })),
  useCodeScanner: jest.fn(() => ({})),
  CameraPermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied'
  }
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {});

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn()
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 })
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
  Rect: 'Rect',
  Path: 'Path',
  Line: 'Line',
  Text: 'Text'
}));

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart'
}));

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn()
}));

// Mock expo modules
jest.mock('expo-camera', () => ({
  Camera: 'ExpoCamera',
  CameraType: {
    back: 'back',
    front: 'front'
  }
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: 'BarCodeScanner',
  BarCodeScannerResult: 'BarCodeScannerResult'
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  getAssetsAsync: jest.fn()
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar'
}));

// Mock Redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn())
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn()
  }),
  useRoute: () => ({
    params: {}
  })
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children
  })
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children
  })
}));

// Global test setup
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};


