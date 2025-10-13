import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const StackedBarChart = ({ 
  data = [], // Array of { label, value, color }
  total = 100,
  height = 20,
  showLabels = false,
  backgroundColor = COLORS.background.secondary,
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.barContainer, { height, backgroundColor }]}>
        {data.map((item, index) => {
          const width = (item.value / total) * 100;
          
          return (
            <View
              key={index}
              style={[
                styles.segment,
                { 
                  width: `${width}%`,
                  backgroundColor: item.color,
                }
              ]}
            />
          );
        })}
      </View>
      
      {showLabels && (
        <View style={styles.labelsContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.labelItem}>
              <View style={[styles.labelDot, { backgroundColor: item.color }]} />
              <Text style={styles.labelText}>
                {item.label}: {item.value}g
              </Text>
            </View>
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
  barContainer: {
    flexDirection: 'row',
    borderRadius: SIZES.radius.sm,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.spacing.sm,
    gap: SIZES.spacing.md,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SIZES.spacing.xs,
  },
  labelText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
  },
});

export default StackedBarChart;

