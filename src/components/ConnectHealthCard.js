import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import Button from './Button';

/**
 * ConnectHealthCard component
 * Displays a card prompting users to connect Apple Health
 * 
 * @param {function} onConnect - Handler for connect button
 * @param {boolean} loading - Whether connection is in progress
 * @param {string} title - Custom title (optional)
 * @param {string} message - Custom message (optional)
 * @param {string} variant - 'full' or 'compact' (default: 'full')
 * @param {object} style - Additional styles
 */
const ConnectHealthCard = ({
  onConnect,
  loading = false,
  title = 'Connect Apple Health',
  message = 'Track your daily steps and active minutes from iPhone or Apple Watch.',
  variant = 'full',
  style,
}) => {
  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactContent}>
          <Ionicons name="fitness-outline" size={24} color={COLORS.accent.primary} />
          <Text style={styles.compactText}>{title}</Text>
        </View>
        <Button
          label="Connect"
          type="primary"
          size="sm"
          onPress={onConnect}
          disabled={loading}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, SHADOWS.medium, style]}>
      {/* Health icon with glow effect */}
      <View style={styles.iconContainer}>
        <View style={styles.iconGlow}>
          <Ionicons name="fitness-outline" size={48} color={COLORS.accent.primary} />
        </View>
      </View>

      {/* Content */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {/* Connect button */}
      <Button
        label={loading ? 'Connecting...' : 'Enable & Connect'}
        type="primary"
        onPress={onConnect}
        disabled={loading}
        fullWidth
        style={styles.connectButton}
        accessibilityLabel="Connect to Apple Health"
        accessibilityHint="Opens Health app permissions"
      />

      {/* Why we need this link */}
      <Text style={styles.whyLink}>Why we need this →</Text>

      {/* Connected features preview */}
      <View style={styles.featuresPreview}>
        <View style={styles.featureItem}>
          <Ionicons name="walk" size={16} color={COLORS.accent.tertiary} />
          <Text style={styles.featureText}>Daily steps</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="time" size={16} color={COLORS.accent.success} />
          <Text style={styles.featureText}>Active minutes</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="flash" size={16} color={COLORS.accent.quaternary} />
          <Text style={styles.featureText}>Activity rings</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.xl,
    marginHorizontal: SIZES.spacing.md,
    marginVertical: SIZES.spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  iconGlow: {
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.accent.primary + '15',
    borderWidth: 2,
    borderColor: COLORS.accent.primary + '30',
  },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  message: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.spacing.lg,
  },
  connectButton: {
    marginBottom: SIZES.spacing.md,
  },
  whyLink: {
    fontSize: FONTS.size.sm,
    color: COLORS.accent.primary,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  featuresPreview: {
    flexDirection: 'row',
    gap: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    width: '100%',
    justifyContent: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.xs,
  },
  featureText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderStyle: 'dashed',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
    flex: 1,
  },
  compactText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    flex: 1,
  },
});

export default ConnectHealthCard;


