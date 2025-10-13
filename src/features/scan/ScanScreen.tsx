/**
 * Scan Screen with native camera + barcode scanner
 * Web fallback: manual barcode entry
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useBarcode } from './hooks/useBarcode';

// Lazy load camera components
let Camera: any = null;
let BarCodeScanner: any = null;

const loadCameraModules = async () => {
  if (Platform.OS === 'web') return null;
  
  try {
    const [CameraModule, BarCodeScannerModule] = await Promise.all([
      import('expo-camera'),
      import('expo-barcode-scanner'),
    ]);
    Camera = CameraModule.Camera;
    BarCodeScanner = BarCodeScannerModule.BarCodeScanner;
    return { Camera, BarCodeScanner };
  } catch (error) {
    console.error('[ScanScreen] Failed to load camera modules:', error);
    return null;
  }
};

export default function ScanScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    hasPermission,
    isScanning,
    scannedData,
    error,
    requestPermission,
    startScanning,
    handleBarCodeScanned,
    submitManualBarcode,
    isWeb,
  } = useBarcode();

  const [manualBarcode, setManualBarcode] = useState('');
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!isWeb) {
        await loadCameraModules();
        if (mounted) setModulesLoaded(true);
      }
      
      const granted = await requestPermission();
      if (mounted && granted) {
        startScanning();
      }
      
      if (mounted) setLoading(false);
    };

    init().catch((err) => {
      console.error('[ScanScreen] Init failed:', err);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Navigate back with scanned data
  useEffect(() => {
    if (scannedData) {
      // Pass barcode back to the previous screen
      const returnTo = route.params?.returnTo || 'Nutrition';
      navigation.navigate(returnTo, { barcode: scannedData });
    }
  }, [scannedData, navigation, route.params]);

  const handleManualSubmit = () => {
    submitManualBarcode(manualBarcode);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Initializing scanner...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Web or permission denied: show manual entry
  if (isWeb || hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.manualContainer}>
          <Ionicons name="barcode-outline" size={80} color={COLORS.text.tertiary} />
          
          <Text style={styles.manualTitle}>Manual Barcode Entry</Text>
          <Text style={styles.manualSubtitle}>
            {isWeb
              ? 'Camera scanning is not available on web. Please enter the barcode manually.'
              : 'Camera permission is required to scan barcodes. You can enter the code manually below.'}
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter barcode (e.g., 012345678910)"
              placeholderTextColor={COLORS.text.tertiary}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="numeric"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !manualBarcode && styles.submitButtonDisabled]}
            onPress={handleManualSubmit}
            disabled={!manualBarcode}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.background.primary} />
          </TouchableOpacity>

          {!isWeb && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {
                // Open app settings
                console.log('Open settings to grant camera permission');
              }}
            >
              <Text style={styles.settingsButtonText}>Open Settings to Grant Permission</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Native camera scanner
  if (!modulesLoaded || !Camera || !BarCodeScanner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color={COLORS.accent.error} />
          <Text style={styles.errorTitle}>Camera Not Available</Text>
          <Text style={styles.errorSubtitle}>
            Unable to load camera modules. Please try restarting the app.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants?.Type?.back || 'back'}
        onBarCodeScanned={isScanning ? handleBarCodeScanned : undefined}
        barCodeScannerSettings={{
          barCodeTypes: [
            BarCodeScanner.Constants?.BarCodeType?.ean13,
            BarCodeScanner.Constants?.BarCodeType?.ean8,
            BarCodeScanner.Constants?.BarCodeType?.upc_a,
            BarCodeScanner.Constants?.BarCodeType?.upc_e,
            BarCodeScanner.Constants?.BarCodeType?.code128,
            BarCodeScanner.Constants?.BarCodeType?.code39,
          ],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>

          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>
              {isScanning ? 'Align barcode within the frame' : 'Scanning...'}
            </Text>
          </View>
        </View>
      </Camera>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.spacing.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: SIZES.spacing.xs,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.lg,
  },
  scanArea: {
    width: 300,
    height: 200,
    alignSelf: 'center',
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.accent.primary,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.accent.primary,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: COLORS.accent.primary,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: COLORS.accent.primary,
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
  },
  instructionText: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
  },
  manualTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.lg,
    textAlign: 'center',
  },
  manualSubtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginTop: SIZES.spacing.xl,
  },
  input: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    fontSize: FONTS.size.lg,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.xl,
    marginTop: SIZES.spacing.lg,
    width: '100%',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.background.primary,
    marginRight: SIZES.spacing.sm,
  },
  settingsButton: {
    marginTop: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.sm,
  },
  settingsButtonText: {
    fontSize: FONTS.size.md,
    color: COLORS.accent.primary,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
  },
  errorTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.lg,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    marginTop: SIZES.spacing.xl,
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.xl,
  },
  backButtonText: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.background.primary,
  },
  errorText: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent.error,
    marginTop: SIZES.spacing.md,
    textAlign: 'center',
  },
});

