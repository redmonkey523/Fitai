import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress = ({ 
  size = 120, 
  strokeWidth = 12, // Enhanced default: 12pt stroke
  progress = 0, // 0 to 100
  color = COLORS.accent.primary,
  backgroundColor = COLORS.background.secondary,
  showPercentage = true,
  centerContent = null,
  animate = true,
  accessibilityLabel,
  accessibilityValue,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  useEffect(() => {
    if (animate) {
      Animated.spring(animatedValue, {
        toValue: progress,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animate]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View 
      style={[styles.container, { width: size, height: size }]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Progress: ${Math.round(progress)} percent`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
      accessibilityRole="progressbar"
    >
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.3}
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      
      <View style={styles.centerContent}>
        {centerContent || (showPercentage && (
          <Text 
            style={[styles.percentage, { fontSize: size / 4 }]}
            accessibilityLabel={accessibilityValue || `${Math.round(progress)} percent complete`}
          >
            {Math.round(progress)}%
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
  },
});

export default CircularProgress;

