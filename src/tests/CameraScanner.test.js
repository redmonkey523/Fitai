import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import CameraScanner from '../components/CameraScanner';

// Mock the required dependencies
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevices: () => ({
    back: { id: 'back', name: 'Back Camera' }
  }),
  useCodeScanner: () => ({
    codeTypes: ['ean-13', 'ean-8'],
    onCodeScanned: jest.fn()
  }),
  CameraPermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied'
  }
}));

jest.mock('../services/aiService', () => ({
  __esModule: true,
  default: {
    processFoodImage: jest.fn().mockResolvedValue({
      name: 'Test Food',
      confidence: 0.85,
      nutrition: { calories: 300, protein: 25, carbs: 30, fat: 10 },
      ingredients: ['test ingredients'],
      allergens: [],
      verified: false,
      source: 'Test Mode'
    }),
    lookupProductByBarcode: jest.fn().mockResolvedValue({
      name: 'Test Product',
      brand: 'Test Brand',
      nutrition: { calories: 200, protein: 15, carbs: 25, fat: 8 },
      ingredients: ['test ingredients'],
      allergens: [],
      verified: false,
      source: 'Test Mode'
    }),
    isValidBarcode: jest.fn().mockReturnValue(true)
  }
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock theme constants
jest.mock('../constants/theme', () => ({
  COLORS: {
    background: { primary: '#000000' },
    text: { primary: '#FFFFFF', secondary: '#CCCCCC' },
    accent: { primary: '#00FFFF', error: '#FF0000' }
  },
  FONTS: {
    size: { md: 16, lg: 18, xl: 20 },
    weight: { bold: 'bold', medium: '500' }
  },
  SIZES: {
    spacing: { lg: 24, md: 16, sm: 8 },
    radius: { md: 12 }
  }
}));

describe('CameraScanner Component', () => {
  const mockOnCapture = jest.fn();
  const mockOnScan = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Food Mode', () => {
    it('should render camera interface for food mode', async () => {
      const { getByTestId, getByText } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByTestId('camera')).toBeTruthy();
      });

      expect(getByText('AI Food Recognition')).toBeTruthy();
      expect(getByText('Position food in frame')).toBeTruthy();
    });

    it('should handle capture button press', async () => {
      const { getByTestId } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByTestId('camera')).toBeTruthy();
      });

      // Find and press the capture button
      const captureButton = getByTestId('capture-button');
      fireEvent.press(captureButton);

      await waitFor(() => {
        expect(mockOnCapture).toHaveBeenCalled();
      });
    });

    it('should show processing state during AI analysis', async () => {
      const { getByText } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByText('AI Food Recognition')).toBeTruthy();
      });

      // Simulate processing state
      const captureButton = getByText('Position food in frame').parent;
      fireEvent.press(captureButton);

      await waitFor(() => {
        expect(getByText('AI is analyzing your food...')).toBeTruthy();
      });
    });
  });

  describe('Barcode Mode', () => {
    it('should render barcode scanner interface', async () => {
      const { getByTestId, getByText } = render(
        <CameraScanner
          mode="barcode"
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByTestId('camera')).toBeTruthy();
      });

      expect(getByText('Barcode Scanner')).toBeTruthy();
      expect(getByText('Position barcode in frame')).toBeTruthy();
    });

    it('should handle barcode scanning', async () => {
      const { getByTestId } = render(
        <CameraScanner
          mode="barcode"
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByTestId('camera')).toBeTruthy();
      });

      // Simulate barcode scan
      const mockBarcode = { value: '1234567890123' };
      
      // Trigger the code scanner callback
      const { useCodeScanner } = require('react-native-vision-camera');
      const mockCodeScanner = useCodeScanner();
      mockCodeScanner.onCodeScanned([mockBarcode]);

      await waitFor(() => {
        expect(mockOnScan).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error when camera permission is denied', () => {
      // Mock camera permission denied
      const { Camera } = require('react-native-vision-camera');
      jest.spyOn(Camera, 'requestCameraPermission').mockResolvedValue('denied');

      const { getByText } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Camera Access Required')).toBeTruthy();
      expect(getByText(/This feature requires camera access/)).toBeTruthy();
    });

    it('should show demo mode when VisionCamera is not available', () => {
      // Mock VisionCamera not available
      jest.doMock('react-native-vision-camera', () => {
        throw new Error('VisionCamera not available');
      });

      const { getByText } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      expect(getByText('VisionCamera Not Available')).toBeTruthy();
      expect(getByText('Try Demo Mode')).toBeTruthy();
    });

    it('should handle demo mode for food recognition', async () => {
      // Mock VisionCamera not available
      jest.doMock('react-native-vision-camera', () => {
        throw new Error('VisionCamera not available');
      });

      const { getByText } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      const demoButton = getByText('Try Demo Mode');
      fireEvent.press(demoButton);

      await waitFor(() => {
        expect(mockOnCapture).toHaveBeenCalled();
      });
    });

    it('should handle demo mode for barcode scanning', async () => {
      // Mock VisionCamera not available
      jest.doMock('react-native-vision-camera', () => {
        throw new Error('VisionCamera not available');
      });

      const { getByText } = render(
        <CameraScanner
          mode="barcode"
          onScan={mockOnScan}
          onClose={mockOnClose}
        />
      );

      const demoButton = getByText('Try Demo Mode');
      fireEvent.press(demoButton);

      await waitFor(() => {
        expect(mockOnScan).toHaveBeenCalled();
      });
    });
  });

  describe('UI Interactions', () => {
    it('should call onClose when close button is pressed', async () => {
      const { getByTestId } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByTestId('camera')).toBeTruthy();
      });

      const closeButton = getByTestId('close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable capture button during processing', async () => {
      const { getByTestId } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByTestId('camera')).toBeTruthy();
      });

      const captureButton = getByTestId('capture-button');
      
      // Initially enabled
      expect(captureButton.props.disabled).toBeFalsy();

      // Press to start processing
      fireEvent.press(captureButton);

      // Should be disabled during processing
      await waitFor(() => {
        expect(captureButton.props.disabled).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      const { getByTestId } = render(
        <CameraScanner
          mode="food"
          onCapture={mockOnCapture}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(getByTestId('camera')).toBeTruthy();
      });

      const closeButton = getByTestId('close-button');
      const captureButton = getByTestId('capture-button');

      expect(closeButton.props.accessibilityLabel).toBeTruthy();
      expect(captureButton.props.accessibilityLabel).toBeTruthy();
    });
  });
});
