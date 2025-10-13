import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

/**
 * Custom Button component with cyberpunk styling
 * 
 * @param {string} type - 'primary', 'secondary', 'outline', or 'text'
 * @param {string} size - 'sm', 'md', or 'lg'
 * @param {function} onPress - Function to call when button is pressed
 * @param {string} label - Button text
 * @param {boolean} disabled - Whether button is disabled
 * @param {boolean} fullWidth - Whether button should take full width
 * @param {object} style - Additional styles
 */
const Button = ({
  type = 'primary',
  size = 'md',
  onPress,
  label,
  disabled = false,
  fullWidth = false,
  style,
  icon,
  textColor,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  // Determine gradient colors based on button type
  const getGradient = () => {
    switch (type) {
      case 'primary':
        return COLORS.gradient.primary;
      case 'secondary':
        return COLORS.gradient.secondary;
      case 'workout':
        return COLORS.gradient.workout;
      case 'progress':
        return COLORS.gradient.progress;
      default:
        return COLORS.gradient.primary;
    }
  };

  // Determine button height based on size (min 44pt for accessibility)
  const getHeight = () => {
    switch (size) {
      case 'sm':
        return Math.max(SIZES.button.height.sm || 36, 32); // Allow smaller for secondary actions
      case 'md':
        return Math.max(SIZES.button.height.md || 48, 44); // Min 44pt touch target
      case 'lg':
        return Math.max(SIZES.button.height.lg || 56, 44); // Min 44pt touch target
      default:
        return 44; // Default min 44pt
    }
  };

  // Determine text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return FONTS.size.sm;
      case 'md':
        return FONTS.size.md;
      case 'lg':
        return FONTS.size.lg;
      default:
        return FONTS.size.md;
    }
  };

  // Render different button types
  const renderButton = () => {
    // Outline button
    if (type === 'outline') {
      return (
        <View
          style={[
            styles.button,
            styles.outlineButton,
            { height: getHeight() },
            fullWidth && styles.fullWidth,
            disabled && styles.disabledOutline,
            style,
          ]}
        >
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              styles.outlineText,
              { fontSize: getTextSize() },
              textColor && { color: textColor },
              disabled && styles.disabledText,
            ]}
          >
            {label}
          </Text>
        </View>
      );
    }

    // Text button
    if (type === 'text') {
      return (
        <View
          style={[
            styles.button,
            styles.textButton,
            { height: getHeight() },
            fullWidth && styles.fullWidth,
            style,
          ]}
        >
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.text,
              styles.textButtonText,
              { fontSize: getTextSize() },
              disabled && styles.disabledText,
            ]}
          >
            {label}
          </Text>
        </View>
      );
    }

    // Gradient buttons (primary, secondary, etc.)
    return (
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.button,
          { height: getHeight() },
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.text, { fontSize: getTextSize() }]}>{label}</Text>
      </LinearGradient>
    );
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.container, SHADOWS.medium]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        {renderButton()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.md,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.semibold,
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
  },
  outlineText: {
    color: COLORS.accent.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: SIZES.spacing.sm,
  },
  textButtonText: {
    color: COLORS.accent.primary,
  },
  disabledOutline: {
    borderColor: COLORS.text.disabled,
  },
  disabledText: {
    color: COLORS.text.disabled,
  },
  iconContainer: {
    marginRight: SIZES.spacing.sm,
  },
});

export default Button;
