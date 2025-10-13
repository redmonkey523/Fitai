import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const BarChart = ({ 
  data = [], // Array of { label, value, color? }
  maxValue = null,
  height = 150,
  showValues = true,
  showLabels = true,
  barColor = COLORS.accent.primary,
}) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * 100;
          const color = item.color || barColor;
          
          return (
            <View 
              key={index} 
              style={[styles.barContainer, { width: `${barWidth}%` }]}
            >
              {showValues && item.value > 0 && (
                <Text style={styles.value}>{item.value}</Text>
              )}
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${barHeight}%`,
                      backgroundColor: color,
                    }
                  ]} 
                />
              </View>
              {showLabels && (
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: SIZES.spacing.lg,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: SIZES.spacing.sm,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
  },
  value: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginBottom: 4,
    fontWeight: FONTS.weight.medium,
  },
  label: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
  },
});

export default BarChart;

