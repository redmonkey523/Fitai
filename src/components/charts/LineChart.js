import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line as SvgLine } from 'react-native-svg';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const LineChart = ({ 
  data = [], // Array of numbers
  labels = [], // Array of labels
  width = 300,
  height = 150,
  lineColor = COLORS.accent.primary,
  showDots = true,
  showGrid = true,
  goalValue = null,
  goalColor = COLORS.accent.success,
}) => {
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const minValue = Math.min(...data, 0);
  const maxValue = Math.max(...data, goalValue || 0);
  const range = maxValue - minValue || 1;
  
  // Generate path
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
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

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {showGrid && (
          <>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + chartHeight * (1 - ratio);
              return (
                <SvgLine
                  key={i}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke={COLORS.border.primary}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              );
            })}
          </>
        )}
        
        {/* Goal line */}
        {goalValue && (
          <SvgLine
            x1={padding}
            y1={padding + chartHeight - ((goalValue - minValue) / range) * chartHeight}
            x2={width - padding}
            y2={padding + chartHeight - ((goalValue - minValue) / range) * chartHeight}
            stroke={goalColor}
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity={0.5}
          />
        )}
        
        {/* Line path */}
        <Path
          d={pathData}
          stroke={lineColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Dots */}
        {showDots && points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={lineColor}
          />
        ))}
      </Svg>
      
      {/* Labels */}
      {labels.length > 0 && (
        <View style={styles.labelsContainer}>
          {labels.map((label, index) => (
            <Text key={index} style={styles.label}>
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: SIZES.spacing.xs,
  },
  label: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
  },
});

export default LineChart;

