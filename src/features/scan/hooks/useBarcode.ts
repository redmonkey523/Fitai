/**
 * Hook for barcode scanning with camera permission handling
 */

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { eventService } from '../../../services/events';

let Camera: any = null;
let BarCodeScanner: any = null;

const getModules = async () => {
  if (Platform.OS === 'web') {
    // Web doesn't support camera scanning
    return { Camera: null, BarCodeScanner: null };
  }

  if (!Camera) {
    try {
      Camera = await import('expo-camera');
      BarCodeScanner = await import('expo-barcode-scanner');
    } catch (error) {
      console.warn('[useBarcode] Camera modules not available:', error);
      return { Camera: null, BarCodeScanner: null };
    }
  }

  return { Camera, BarCodeScanner };
};

export function useBarcode() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request camera permission
  const requestPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        setError('Camera scanning is not supported on web. Please enter barcode manually.');
        eventService.emit('scan_failure', { reason: 'web_not_supported' });
        return false;
      }

      const { Camera: CameraModule } = await getModules();
      if (!CameraModule) {
        setError('Camera module not available.');
        eventService.emit('scan_failure', { reason: 'camera_not_available' });
        return false;
      }

      const { status } = await CameraModule.Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        setError('Camera permission is required to scan barcodes.');
        eventService.emit('scan_failure', { reason: 'permission_denied' });
        return false;
      }

      eventService.emit('scan_permission_granted', {});
      return true;
    } catch (err) {
      console.error('[useBarcode] Permission request failed:', err);
      setError('Failed to request camera permission.');
      eventService.emit('scan_failure', { reason: 'permission_error', error: err?.message });
      return false;
    }
  };

  // Handle barcode scanned
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!isScanning) return;

    setIsScanning(false);
    setScannedData(data);

    eventService.emit('scan_success', {
      type,
      data,
      timestamp: Date.now(),
    });
  };

  // Start scanning
  const startScanning = () => {
    setIsScanning(true);
    setScannedData(null);
    setError(null);
  };

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false);
  };

  // Reset state
  const reset = () => {
    setIsScanning(false);
    setScannedData(null);
    setError(null);
  };

  // Manual barcode entry (fallback for web)
  const submitManualBarcode = (barcode: string) => {
    if (!barcode || barcode.trim().length === 0) {
      setError('Please enter a valid barcode.');
      return;
    }

    setScannedData(barcode.trim());
    eventService.emit('scan_success', {
      type: 'manual',
      data: barcode.trim(),
      timestamp: Date.now(),
    });
  };

  return {
    hasPermission,
    isScanning,
    scannedData,
    error,
    requestPermission,
    startScanning,
    stopScanning,
    reset,
    handleBarCodeScanned,
    submitManualBarcode,
    isWeb: Platform.OS === 'web',
  };
}

