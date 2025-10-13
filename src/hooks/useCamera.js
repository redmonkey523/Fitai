import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Camera from 'expo-camera';
import * as FileSystem from 'expo-file-system';

/**
 * Hook for managing camera permissions and functionality
 */
export function useCamera() {
  const [hasPermission, setHasPermission] = useState(null);
  const [permissionError, setPermissionError] = useState(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      // Web doesn't support expo-camera
      if (Platform.OS === 'web') {
        setHasPermission(false);
        setPermissionError('Camera not available on web. Please use the mobile app.');
        return;
      }

      const { status } = await Camera.Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        setPermissionError('Camera permission is required to use this feature.');
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      setHasPermission(false);
      setPermissionError('Failed to request camera permission.');
    }
  };

  return {
    hasPermission,
    permissionError,
    requestPermission: requestCameraPermission,
  };
}

/**
 * Hook for handling camera image capture with proper file storage
 */
export function useCameraCapture() {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Capture and save image to persistent storage
   * @param {object} cameraRef - Reference to camera component
   * @returns {Promise<string>} - Path to saved image
   */
  const captureImage = async (cameraRef) => {
    if (!cameraRef) {
      throw new Error('Camera reference is required');
    }

    setIsProcessing(true);
    try {
      // Take photo
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      // Copy from cache to document directory for persistence
      const fileName = `photo_${Date.now()}.jpg`;
      const documentPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: photo.uri,
        to: documentPath,
      });

      return documentPath;
    } catch (error) {
      console.error('Image capture error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Delete captured image
   * @param {string} uri - File URI to delete
   */
  const deleteImage = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Image delete error:', error);
    }
  };

  return {
    captureImage,
    deleteImage,
    isProcessing,
  };
}

