import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Simple test component
const TestComponent = ({ onPress, children }) => (
  <View testID="test-container">
    <Text testID="test-text" onPress={onPress}>
      {children}
    </Text>
  </View>
);

describe('Basic Test Suite', () => {
  it('should render a simple component', () => {
    const { getByTestId } = render(
      <TestComponent>Hello World</TestComponent>
    );

    expect(getByTestId('test-container')).toBeTruthy();
    expect(getByTestId('test-text')).toBeTruthy();
  });

  it('should handle user interactions', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <TestComponent onPress={mockOnPress}>Click me</TestComponent>
    );

    fireEvent.press(getByTestId('test-text'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should display the correct text', () => {
    const { getByText } = render(
      <TestComponent>Custom Text</TestComponent>
    );

    expect(getByText('Custom Text')).toBeTruthy();
  });
});

describe('Jest Setup Verification', () => {
  it('should have working mocks', () => {
    // Test that mocks are working
    expect(jest.fn()).toBeDefined();
    expect(jest.clearAllMocks).toBeDefined();
  });

  it('should have working async/await', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should have working timers', () => {
    jest.useFakeTimers();
    const callback = jest.fn();
    
    setTimeout(callback, 1000);
    jest.runAllTimers();
    
    expect(callback).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
