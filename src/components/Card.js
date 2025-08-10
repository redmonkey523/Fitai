import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

/**
 * Card component with cyberpunk styling
 * 
 * @param {string} type - 'default', 'workout', 'progress', 'nutrition'
 * @param {string} title - Card title
 * @param {string} subtitle - Card subtitle
 * @param {node} children - Card content
 * @param {function} onPress - Function to call when card is pressed
 * @param {object} style - Additional styles
 */
const Card = ({
  type = 'default',
  title,
  subtitle,
  children,
  onPress,
  style,
}) => {
  // Determine gradient colors based on card type
  const getGradient = () => {
    switch (type) {
      case 'workout':
        return COLORS.gradient.workout;
      case 'progress':
        return COLORS.gradient.progress;
      case 'nutrition':
        return COLORS.gradient.secondary;
      default:
        return [COLORS.background.card, COLORS.background.card];
    }
  };

  // Determine border color based on card type
  const getBorderColor = () => {
    switch (type) {
      case 'workout':
        return COLORS.accent.quaternary;
      case 'progress':
        return COLORS.accent.success;
      case 'nutrition':
        return COLORS.accent.secondary;
      default:
        return COLORS.accent.primary;
    }
  };

  const cardContent = (
    <View style={[styles.card, style]}>
      {/* Card header with gradient background for special types */}
      {(title || subtitle) && (
        <LinearGradient
          colors={getGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.header,
            { borderColor: getBorderColor() }
          ]}
        >
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </LinearGradient>
      )}

      {/* Card content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );

  // If onPress is provided, wrap with TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.container, SHADOWS.medium]}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  // Otherwise, just return the card
  return <View style={[styles.container, SHADOWS.medium]}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.md,
  },
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
  },
  header: {
    padding: SIZES.spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  subtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  content: {
    padding: SIZES.spacing.md,
  },
});

export default Card;
