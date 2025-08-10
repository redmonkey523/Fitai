import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import aiService from '../services/aiService';

// Import VisionCamera with proper error handling
let Camera = null;
let useCameraDevices = null;
let useCodeScanner = null;
let CameraPermissionStatus = null;

try {
  const visionCamera = require('react-native-vision-camera');
  Camera = visionCamera.Camera;
  useCameraDevices = visionCamera.useCameraDevices;
  useCodeScanner = visionCamera.useCodeScanner;
  CameraPermissionStatus = visionCamera.CameraPermissionStatus;
} catch (error) {
  console.log('VisionCamera not available:', error.message);
}

const CameraScanner = ({ 
  mode = 'food', // 'food' or 'barcode'
  onCapture, 
  onScan, 
  onClose 
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isVisionCameraAvailable, setIsVisionCameraAvailable] = useState(false);
  const cameraRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check if VisionCamera is available
  useEffect(() => {
    setIsVisionCameraAvailable(!!Camera);
  }, []);

  // Get camera devices if VisionCamera is available
  const devices = useCameraDevices ? useCameraDevices() : null;
  const device = devices?.back;

  // Setup code scanner for barcode mode
  const codeScanner = useCodeScanner ? useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93'],
    onCodeScanned: (codes) => {
      try {
        if (codes && codes.length > 0 && !isScanning && !isProcessing) {
          handleBarCodeScanned(codes[0]);
        }
      } catch (error) {
        console.error('Error in code scanner callback:', error);
        setError('Barcode scanning error. Please try again.');
      }
    },
  }) : null;

  useEffect(() => {
    (async () => {
      try {
        if (!Camera) {
          setHasPermission(false);
          return;
        }

        // Request camera permission
        const permission = await Camera.requestCameraPermission();
        setHasPermission(permission === 'granted' || permission === CameraPermissionStatus?.GRANTED);
        
        if (permission !== 'granted' && permission !== CameraPermissionStatus?.GRANTED) {
          setError('Camera permission is required to use this feature.');
        }
      } catch (error) {
        console.log('Camera permission request failed:', error);
        setHasPermission(false);
        setError('Camera permission denied. Please enable camera access in settings.');
      }
    })();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCapture = async () => {
    try {
      if (!cameraRef.current || isCapturing || isProcessing) {
        return;
      }

      setIsCapturing(true);
      setError(null);
      
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
        enableShutterSound: false,
      });
      
      setIsCapturing(false);
      setIsProcessing(true);
      
      // Process the photo with AI service
      const foodResults = await aiService.processFoodImage(photo.path);
      setIsProcessing(false);
      
      if (onCapture && typeof onCapture === 'function') {
        onCapture(foodResults);
      }
      
    } catch (error) {
      console.log('Camera capture error:', error);
      setIsCapturing(false);
      setIsProcessing(false);
      setError('Failed to capture photo. Please try again.');
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleBarCodeScanned = async (code) => {
    try {
      if (isScanning || isProcessing) {
        return;
      }

      // Validate barcode format
      if (!aiService.isValidBarcode(code.value)) {
        Alert.alert('Invalid Barcode', 'Please scan a valid product barcode.');
        return;
      }

      setIsScanning(true);
      setIsProcessing(true);
      setError(null);
      
      // Look up product in database
      const productData = await aiService.lookupProductByBarcode(code.value);
      setIsScanning(false);
      setIsProcessing(false);
      
      if (onScan && typeof onScan === 'function') {
        onScan(productData);
      }
    } catch (error) {
      console.log('Barcode lookup error:', error);
      setIsScanning(false);
      setIsProcessing(false);
      setError('Failed to look up product. Please try again.');
      Alert.alert('Error', 'Failed to look up product. Please try again.');
    }
  };

  const handleDemoCapture = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const foodResults = await aiService.processFoodImage('demo');
      setIsProcessing(false);
      
      if (onCapture && typeof onCapture === 'function') {
        onCapture(foodResults);
      }
    } catch (error) {
      console.error('Demo capture error:', error);
      setIsProcessing(false);
      setError('Demo failed. Please try again.');
    }
  };

  const handleDemoScan = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const productData = await aiService.lookupProductByBarcode('demo123');
      setIsProcessing(false);
      
      if (onScan && typeof onScan === 'function') {
        onScan(productData);
      }
    } catch (error) {
      console.error('Demo scan error:', error);
      setIsProcessing(false);
      setError('Demo failed. Please try again.');
    }
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // VisionCamera not available or permission denied
  if (hasPermission === false || !isVisionCameraAvailable) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color={COLORS.accent.error} />
        <Text style={styles.errorTitle}>
          {!isVisionCameraAvailable ? 'VisionCamera Not Available' : 'Camera Access Required'}
        </Text>
        <Text style={styles.errorText}>
          {!isVisionCameraAvailable 
            ? 'This feature requires a development build. You can still use the demo mode to test the feature.'
            : 'This feature requires camera access to ' + (mode === 'food' ? 'take photos of your food' : 'scan barcodes') + '.'
          }
        </Text>
        
        <TouchableOpacity 
          style={styles.demoButton} 
          onPress={mode === 'food' ? handleDemoCapture : handleDemoScan}
        >
          <Text style={styles.demoButtonText}>Try Demo Mode</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Camera device not available
  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent.primary} />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mode === 'food' ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={true}
          enableZoomGesture={true}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>AI Food Recognition</Text>
              <View style={styles.headerButton} />
            </View>

            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={COLORS.accent.primary} />
                <Text style={styles.processingText}>AI is analyzing your food...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorOverlay}>
                <Ionicons name="warning" size={32} color={COLORS.accent.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.frameContainer}>
              <View style={styles.frame} />
              <Text style={styles.frameText}>Position food in frame</Text>
            </View>

            <View style={styles.controls}>
              <View style={styles.controlButton} />
              
              <TouchableOpacity 
                style={[styles.captureButton, (isCapturing || isProcessing) && styles.captureButtonDisabled]}
                onPress={handleCapture}
                disabled={isCapturing || isProcessing}
              >
                {isCapturing ? (
                  <ActivityIndicator size="large" color={COLORS.text.primary} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
              
              <View style={styles.controlButton} />
            </View>
          </View>
        </Camera>
      ) : (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
          enableZoomGesture={true}
        >
          <View style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Barcode Scanner</Text>
              <View style={styles.headerButton} />
            </View>

            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={COLORS.accent.primary} />
                <Text style={styles.processingText}>Looking up product...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorOverlay}>
                <Ionicons name="warning" size={32} color={COLORS.accent.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.frameContainer}>
              <View style={styles.barcodeFrame} />
              <Text style={styles.frameText}>Position barcode in frame</Text>
            </View>

            <View style={styles.scanInfo}>
              <Text style={styles.scanInfoText}>
                {isScanning ? 'Processing barcode...' : 'Point camera at product barcode'}
              </Text>
              {isScanning && <ActivityIndicator size="small" color={COLORS.accent.primary} />}
            </View>
          </View>
        </Camera>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 100,
    left: SIZES.spacing.lg,
    right: SIZES.spacing.lg,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    zIndex: 1001,
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    backgroundColor: 'transparent',
  },
  barcodeFrame: {
    width: 300,
    height: 150,
    borderWidth: 2,
    borderColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    backgroundColor: 'transparent',
  },
  frameText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginTop: SIZES.spacing.md,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: SIZES.spacing.lg,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.text.primary,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.text.primary,
  },
  scanInfo: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: SIZES.spacing.lg,
    alignItems: 'center',
  },
  scanInfoText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  loadingText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
  },
  errorTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    marginBottom: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.lg,
  },
  demoButton: {
    backgroundColor: COLORS.accent.secondary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.md,
  },
  demoButtonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  closeButton: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
  },
  closeButtonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
});

export default CameraScanner;
