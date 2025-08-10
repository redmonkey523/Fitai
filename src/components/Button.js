import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
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
}) => {
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

  // Determine button height based on size
  const getHeight = () => {
    switch (size) {
      case 'sm':
        return SIZES.button.height.sm;
      case 'md':
        return SIZES.button.height.md;
      case 'lg':
        return SIZES.button.height.lg;
      default:
        return SIZES.button.height.md;
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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, SHADOWS.medium]}
    >
      {renderButton()}
    </TouchableOpacity>
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
