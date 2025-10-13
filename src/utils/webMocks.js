/**
 * Web-compatible mocks for native modules that cause bundling issues
 */

// Mock for expo-secure-store
export const getItemAsync = async (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setItemAsync = async (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore
  }
};

export const deleteItemAsync = async (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
};

// Mock for expo-notifications
export const requestPermissionsAsync = async () => ({
  status: 'granted',
  canAskAgain: true,
  granted: true,
});

export const getExpoPushTokenAsync = async () => ({
  data: 'ExponentPushToken[mock]',
});

export const setNotificationHandler = () => {};
export const addNotificationReceivedListener = () => ({ remove: () => {} });
export const addNotificationResponseReceivedListener = () => ({ remove: () => {} });

// Mock react-native-vision-camera for web
export const Camera = null;
export const useCameraDevices = () => ({ back: null, front: null });
export const useCodeScanner = () => null;
export const CameraPermissionStatus = {
  AUTHORIZED: 'authorized',
  DENIED: 'denied',
  NOT_DETERMINED: 'not-determined',
  RESTRICTED: 'restricted'
};

// Mock expo-document-picker for web
export const getDocumentAsync = async () => ({
  canceled: true,
  assets: []
});

// Mock expo-av for web (Audio/Video)
export const Audio = {
  Sound: class MockSound {
    static async createAsync() {
      return { sound: new MockSound(), status: {} };
    }
    async loadAsync() {}
    async playAsync() {}
    async pauseAsync() {}
    async stopAsync() {}
    async unloadAsync() {}
    async setPositionAsync() {}
    async setRateAsync() {}
    async setVolumeAsync() {}
  },
  setAudioModeAsync: async () => {},
};

export const Video = null;

// Mock expo-image-picker for web (will use native file input instead)
export const launchImageLibraryAsync = async () => ({
  canceled: true,
  assets: []
});

export const launchCameraAsync = async () => ({
  canceled: true,
  assets: []
});

export const MediaTypeOptions = {
  All: 'All',
  Images: 'Images',
  Videos: 'Videos',
};

// Mock @react-native-community/slider for web
// Simple div-based slider mock
export const Slider = ({ value, onValueChange, minimumValue = 0, maximumValue = 1, step, style, ...props }) => {
  const React = require('react');
  return React.createElement('input', {
    type: 'range',
    min: minimumValue,
    max: maximumValue,
    step: step || (maximumValue - minimumValue) / 100,
    value: value || 0,
    onChange: (e) => onValueChange && onValueChange(parseFloat(e.target.value)),
    style: { width: '100%', ...style },
    ...props
  });
};

// Mock expo-image-manipulator for web
export const manipulateAsync = async (uri, actions = [], options = {}) => {
  // Return the URI unchanged for web (browser can display as-is)
  return { uri, width: 0, height: 0 };
};

export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
};

export const FlipType = {
  Horizontal: 'horizontal',
  Vertical: 'vertical',
};

export const Action = {
  resize: 'resize',
  rotate: 'rotate',
  flip: 'flip',
  crop: 'crop',
};

// Mock expo-barcode-scanner for web
export const BarCodeScanner = null;
// requestPermissionsAsync already exported above

// Mock expo-camera for web
export const CameraView = null;

// Default export for compatibility
export default {
  Camera,
  CameraView,
  useCameraDevices,
  useCodeScanner,
  CameraPermissionStatus,
  getDocumentAsync,
  Audio,
  Video,
  launchImageLibraryAsync,
  launchCameraAsync,
  MediaTypeOptions,
  Slider,
  manipulateAsync,
  SaveFormat,
  FlipType,
  Action,
  BarCodeScanner,
  requestPermissionsAsync,
};
