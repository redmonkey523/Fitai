import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

/**
 * InlineAlert component for non-blocking notifications
 * Used for errors, warnings, success messages, and info
 * 
 * @param {string} type - 'error', 'warning', 'success', 'info'
 * @param {string} title - Alert title (optional)
 * @param {string} message - Alert message
 * @param {string} actionLabel - Action button label (optional, e.g., 'Retry')
 * @param {function} onAction - Action button handler
 * @param {boolean} dismissible - Whether alert can be dismissed
 * @param {function} onDismiss - Dismiss handler
 * @param {boolean} autoHide - Auto-hide after duration (default: false)
 * @param {number} autoHideDuration - Duration before auto-hide in ms (default: 5000)
 * @param {object} style - Additional styles
 */
const InlineAlert = ({
  type = 'info',
  title,
  message,
  actionLabel,
  onAction,
  dismissible = true,
  onDismiss,
  autoHide = false,
  autoHideDuration = 5000,
  style,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide timer
    if (autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  // Get icon, color, and background based on type
  const getTypeConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: 'alert-circle',
          color: COLORS.accent.error,
          backgroundColor: 'rgba(255, 0, 85, 0.1)',
          borderColor: COLORS.accent.error,
        };
      case 'warning':
        return {
          icon: 'warning',
          color: COLORS.accent.warning,
          backgroundColor: 'rgba(255, 170, 0, 0.1)',
          borderColor: COLORS.accent.warning,
        };
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: COLORS.accent.success,
          backgroundColor: 'rgba(0, 255, 102, 0.1)',
          borderColor: COLORS.accent.success,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          color: COLORS.accent.primary,
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          borderColor: COLORS.accent.primary,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        SHADOWS.small,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon} size={24} color={config.color} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.message}>{message}</Text>

        {/* Action button */}
        {actionLabel && onAction && (
          <TouchableOpacity
            onPress={onAction}
            style={[styles.actionButton, { borderColor: config.color }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={[styles.actionLabel, { color: config.color }]}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dismiss button */}
      {dismissible && (
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.dismissButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
        >
          <Ionicons name="close" size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    marginHorizontal: SIZES.spacing.md,
    marginVertical: SIZES.spacing.sm,
    borderWidth: 1,
    minHeight: 44, // Accessibility touch target
  },
  iconContainer: {
    marginRight: SIZES.spacing.md,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  message: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    minHeight: 36, // Accessibility touch target
  },
  actionLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
  },
  dismissButton: {
    marginLeft: SIZES.spacing.sm,
    padding: SIZES.spacing.xs,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
});

export default InlineAlert;




