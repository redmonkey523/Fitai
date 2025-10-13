import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Button from './Button';

/**
 * Reusable empty state component
 */
export default function EmptyState({
  icon = 'file-tray-outline',
  iconColor = COLORS.text.tertiary,
  title = 'No Data',
  message = 'There\'s nothing here yet',
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  style,
  buttonType = 'primary',
}) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={64} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          type={buttonType}
          style={styles.button}
        />
      )}
      {secondaryLabel && onSecondary && (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          type="text"
          style={styles.secondaryButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xl,
  },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.spacing.lg,
  },
  button: {
    marginTop: SIZES.spacing.md,
    minHeight: 44, // Accessibility touch target
  },
  secondaryButton: {
    marginTop: SIZES.spacing.sm,
  },
});

