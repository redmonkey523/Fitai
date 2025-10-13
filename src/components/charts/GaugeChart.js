import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS } from '../../constants/theme';

const GaugeChart = ({ 
  value = 0, // 0 to 100+
  size = 160,
  strokeWidth = 12,
  maxValue = 120,
  centerContent = null,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const startAngle = -135;
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;
  
  const percentage = Math.min(value, maxValue);
  const isOverGoal = value > 100;
  const color = isOverGoal ? COLORS.accent.success : COLORS.accent.primary;
  
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 40,
      friction: 7,
    }).start();
  }, [percentage]);

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y, 
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const center = size / 2;
  const backgroundPath = describeArc(center, center, radius, startAngle, endAngle);
  
  const progressAngle = startAngle + (percentage / maxValue) * totalAngle;
  const progressPath = describeArc(center, center, radius, startAngle, progressAngle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background arc */}
        <Path
          d={backgroundPath}
          stroke={COLORS.background.secondary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <Path
          d={progressPath}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      
      <View style={styles.centerContent}>
        {centerContent || (
          <>
            <Text style={[styles.value, { fontSize: size / 4 }]}>
              {Math.round(value)}%
            </Text>
            <Text style={styles.label}>of goal</Text>
          </>
        )}
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
  value: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
  },
  label: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginTop: 4,
  },
});

export default GaugeChart;

