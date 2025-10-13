import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../../constants/theme';

const SparklineChart = ({ 
  data = [], // Array of numbers
  width = 100,
  height = 30,
  lineColor = COLORS.accent.primary,
  showLastDot = true,
  strokeWidth = 2,
}) => {
  if (data.length < 2) {
    return <View style={[styles.container, { width, height }]} />;
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  
  // Generate path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return { x, y, value };
  });
  
  const pathData = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  const lastPoint = points[points.length - 1];
  const trend = data[data.length - 1] > data[0] ? 'up' : 'down';
  const trendColor = trend === 'up' ? COLORS.accent.success : COLORS.accent.error;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Line path */}
        <Path
          d={pathData}
          stroke={lineColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Last point dot */}
        {showLastDot && (
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="3"
            fill={trendColor}
          />
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SparklineChart;

