import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  Modal,
  ScrollView,
  Image,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Native modules loaded dynamically for web compat
// import * as ImagePicker from 'expo-image-picker';
// import { BarCodeScanner } from 'expo-barcode-scanner';
// import { Camera } from 'expo-camera';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { apiService } from '../services/api';

// Import VisionCamera with proper error handling
let VisionCamera = null;
let useCameraDevices = null;
let useCodeScanner = null;
let CameraPermissionStatus = null;

try {
  const visionCamera = require('react-native-vision-camera');
  VisionCamera = visionCamera.Camera;
  useCameraDevices = visionCamera.useCameraDevices;
  useCodeScanner = visionCamera.useCodeScanner;
  CameraPermissionStatus = visionCamera.CameraPermissionStatus;
} catch (error) {
  console.log('VisionCamera not available:', error.message);
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const UltraAIScanner = ({ 
  mode = 'food', // 'food' or 'barcode'
  onCapture, 
  onScan, 
  onClose,
  showResults = true
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [scanMode, setScanMode] = useState('auto'); // 'auto', 'vision', 'expo', 'picker'
  const [results, setResults] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  const cameraRef = useRef(null);
  const expoCameraRef = useRef(null);

  // Get camera devices for VisionCamera
  const devices = useCameraDevices ? useCameraDevices() : null;
  const device = devices?.back;

  // Setup code scanner for barcode mode
  const codeScanner = useCodeScanner ? useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93', 'qr'],
    onCodeScanned: (codes) => {
      if (codes && codes.length > 0 && !isProcessing) {
        handleBarCodeScanned(codes[0]);
      }
    },
  }) : null;

  // Request camera permission on mount
  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      // Try VisionCamera first
      if (VisionCamera) {
        const permission = await VisionCamera.requestCameraPermission();
        if (permission === 'granted') {
          setHasPermission(true);
          setScanMode('vision');
          return;
        }
      }

      // Fallback to Expo Camera
      const CameraModule = await import('expo-camera');
      const { status} = await CameraModule.Camera.requestCameraPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        setScanMode('expo');
        return;
      }

      // Fallback to image picker
      const pickerPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (pickerPermission.status === 'granted') {
        setHasPermission(true);
        setScanMode('picker');
        return;
      }

      setHasPermission(false);
      setError('Camera permission is required to use this feature');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
      setError('Failed to request camera permission');
    }
  };

  const handleCapture = async () => {
    if (!hasPermission) {
      handleDemoCapture();
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);

      let photo = null;

      if (scanMode === 'vision' && cameraRef.current) {
        photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'quality',
          flash: 'off',
        });
      } else if (scanMode === 'expo' && expoCameraRef.current) {
        photo = await expoCameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
      } else {
        // Fallback to image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          photo = { path: result.assets[0].uri };
        }
      }

      if (photo) {
        console.log('Photo captured:', photo.path);
        setIsCapturing(false);
        setIsProcessing(true);

        // Process the photo with AI
        const result = await processFoodImage(photo.path);
        
        setIsProcessing(false);
        setResults(result);
        
        if (showResults) {
          setShowResultModal(true);
        }
        
        if (onCapture) {
          onCapture(result);
        }
      } else {
        setIsCapturing(false);
        setError('Failed to capture photo');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      setIsCapturing(false);
      setIsProcessing(false);
      setError('Failed to capture photo. Please try again.');
    }
  };

  const handleBarCodeScanned = async (code) => {
    if (!code || !code.rawValue) {
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      console.log('Barcode scanned:', code.rawValue);
      
      // Process the barcode
      const result = await processBarcode(code.rawValue);
      
      setIsProcessing(false);
      setResults(result);
      
      if (showResults) {
        setShowResultModal(true);
      }
      
      if (onScan) {
        onScan(result);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      setIsProcessing(false);
      setError('Failed to process barcode. Please try again.');
    }
  };

  const handleDemoCapture = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Use demo AI service
      const result = await apiService.ai.getDemoFood();
      
      setIsProcessing(false);
      setResults(result.data);
      
      if (showResults) {
        setShowResultModal(true);
      }
      
      if (onCapture) {
        onCapture(result.data);
      }
    } catch (error) {
      console.error('Error in demo capture:', error);
      setIsProcessing(false);
      setError('Demo mode failed. Please try again.');
    }
  };

  const handleDemoScan = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Use demo barcode service
      const result = await apiService.ai.getDemoBarcode();
      
      setIsProcessing(false);
      setResults(result.data);
      
      if (showResults) {
        setShowResultModal(true);
      }
      
      if (onScan) {
        onScan(result.data);
      }
    } catch (error) {
      console.error('Error in demo scan:', error);
      setIsProcessing(false);
      setError('Demo mode failed. Please try again.');
    }
  };

  const processFoodImage = async (imagePath) => {
    try {
      // Create form data for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imagePath.startsWith('file://') ? imagePath : `file://${imagePath}`,
        type: 'image/jpeg',
        name: 'food-image.jpg'
      });

      const response = await apiService.ai.processFoodImage(formData);
      return response.data;
    } catch (error) {
      console.error('Error processing food image:', error);
      throw error;
    }
  };

  const processBarcode = async (barcode) => {
    try {
      const response = await apiService.ai.lookupBarcode(barcode);
      return response.data;
    } catch (error) {
      console.error('Error processing barcode:', error);
      throw error;
    }
  };

  const renderCamera = () => {
    if (scanMode === 'vision' && device && VisionCamera) {
      return (
        <VisionCamera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={mode === 'food'}
          codeScanner={mode === 'barcode' ? codeScanner : undefined}
        />
      );
    } else if (scanMode === 'expo') {
      // Note: Camera component loaded dynamically
      const CameraWrapper = ({ children, ...props }) => {
        const [Cam, setCam] = React.useState(null);
        React.useEffect(() => {
          import('expo-camera').then(m => setCam(() => m.Camera));
        }, []);
        if (!Cam) return null;
        return <Cam {...props}>{children}</Cam>;
      };
      return (
        <CameraWrapper
          ref={expoCameraRef}
          style={styles.camera}
          type="back"
        >
          {mode === 'barcode' && (
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          )}
        </CameraWrapper>
      );
    }
    return null;
  };

  const renderResultModal = () => {
    if (!results) return null;

    return (
      <Modal
        visible={showResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mode === 'food' ? 'Food Analysis' : 'Product Found'}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowResultModal(false)}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.resultCard}>
                <Text style={styles.foodName}>{results.name}</Text>
                {results.brand && (
                  <Text style={styles.brandName}>{results.brand}</Text>
                )}
                
                <View style={styles.nutritionSection}>
                  <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{results.nutrition?.calories || 0}</Text>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{results.nutrition?.protein || 0}g</Text>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{results.nutrition?.carbs || 0}g</Text>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{results.nutrition?.fat || 0}g</Text>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                    </View>
                  </View>
                </View>

                {results.ingredients && results.ingredients.length > 0 && (
                  <View style={styles.ingredientsSection}>
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    <Text style={styles.ingredientsText}>
                      {Array.isArray(results.ingredients) 
                        ? results.ingredients.join(', ')
                        : results.ingredients
                      }
                    </Text>
                  </View>
                )}

                {results.allergens && results.allergens.length > 0 && (
                  <View style={styles.allergensSection}>
                    <Text style={styles.sectionTitle}>Allergens</Text>
                    <Text style={styles.allergensText}>
                      {Array.isArray(results.allergens) 
                        ? results.allergens.join(', ')
                        : results.allergens
                      }
                    </Text>
                  </View>
                )}

                <View style={styles.sourceSection}>
                  <Text style={styles.sourceText}>Source: {results.source}</Text>
                  {results.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setShowResultModal(false);
                  // Here you would add the food to the user's log
                  Alert.alert('Success', 'Food added to your log!');
                }}
              >
                <Text style={styles.addButtonText}>Add to Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Show loading while checking permission
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Initializing scanner...</Text>
        </View>
      </View>
    );
  }

  // Show error if permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorText}>
            {error || 'Camera access is needed to scan food and barcodes.'}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={requestCameraPermission}
            >
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.demoButton]} 
              onPress={mode === 'food' ? handleDemoCapture : handleDemoScan}
            >
              <Text style={styles.buttonText}>Try Demo Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.closeButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Show camera if permission granted
  if (hasPermission && (device || scanMode === 'expo')) {
    return (
      <View style={styles.container}>
        {renderCamera()}
        
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {mode === 'food' ? 'Scan Food' : 'Scan Barcode'}
            </Text>
            <View style={styles.scanModeIndicator}>
              <Text style={styles.scanModeText}>
                {scanMode === 'vision' ? 'AI Camera' : scanMode === 'expo' ? 'Expo Camera' : 'Picker'}
              </Text>
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <View style={styles.controls}>
            {mode === 'food' && (
              <TouchableOpacity 
                style={[styles.captureButton, (isCapturing || isProcessing) && styles.disabledButton]} 
                onPress={handleCapture}
                disabled={isCapturing || isProcessing}
              >
                {isCapturing || isProcessing ? (
                  <ActivityIndicator size="large" color={COLORS.white} />
                ) : (
                  <Ionicons name="camera" size={32} color={COLORS.white} />
                )}
              </TouchableOpacity>
            )}
            
            {mode === 'barcode' && (
              <View style={styles.barcodeInfo}>
                <Text style={styles.barcodeText}>
                  {isProcessing ? 'Processing barcode...' : 'Point camera at barcode'}
                </Text>
                {isProcessing && <ActivityIndicator size="small" color={COLORS.white} />}
              </View>
            )}
          </View>
        </View>

        {renderResultModal()}
      </View>
    );
  }

  // Fallback to demo mode
  return (
    <View style={styles.container}>
      <View style={styles.demoContainer}>
        <Ionicons 
          name={mode === 'food' ? 'camera-outline' : 'barcode-outline'} 
          size={64} 
          color={COLORS.primary} 
        />
        <Text style={styles.demoTitle}>
          {mode === 'food' ? 'Food Scanner' : 'Barcode Scanner'}
        </Text>
        <Text style={styles.demoText}>
          Camera not available. Using demo mode.
        </Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={mode === 'food' ? handleDemoCapture : handleDemoScan}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Try Demo Mode</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.closeButton]} 
          onPress={onClose}
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {renderResultModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  scanModeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scanModeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: COLORS.error,
    padding: 10,
    margin: 20,
    borderRadius: 8,
  },
  errorBannerText: {
    color: COLORS.white,
    textAlign: 'center',
    fontSize: 14,
  },
  controls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
  barcodeInfo: {
    alignItems: 'center',
    padding: 20,
  },
  barcodeText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  demoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  demoTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  demoText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  demoButton: {
    backgroundColor: COLORS.secondary,
  },
  // closeButton removed (duplicate - defined at line 613)
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeModalButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 16,
  },
  nutritionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  ingredientsSection: {
    marginBottom: 16,
  },
  ingredientsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  allergensSection: {
    marginBottom: 16,
  },
  allergensText: {
    fontSize: 14,
    color: COLORS.error,
    lineHeight: 20,
  },
  sourceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightSuccess,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UltraAIScanner;
