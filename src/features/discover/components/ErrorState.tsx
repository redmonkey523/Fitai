import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';

export interface ErrorStateProps {
  message?: string;
  error?: Error;
  onRetry?: () => void;
}

/**
 * Error state component with retry functionality
 * Shows when data fetching fails
 */
export function ErrorState({
  message = 'Something went wrong',
  error,
  onRetry,
}: ErrorStateProps) {
  // Extract user-friendly error message
  const errorMessage = error?.message || message;
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.accent.error} />
      </View>
      
      <Text style={styles.title}>Oops!</Text>
      
      <Text style={styles.message}>{errorMessage}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color={COLORS.background.primary} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.xxl,
  },
  iconContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  title: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.sm,
  },
  message: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SIZES.spacing.xl,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderRadius: 8,
    gap: SIZES.spacing.sm,
  },
  retryText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.background.primary,
  },
});

export default ErrorState;

