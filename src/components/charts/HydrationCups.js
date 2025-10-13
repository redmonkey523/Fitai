import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const HydrationCups = ({ 
  consumed = 0, 
  total = 8, 
  onCupPress,
  onLongPress,
}) => {
  const cups = Array.from({ length: total }, (_, i) => i < consumed);

  return (
    <View style={styles.container}>
      <View style={styles.cupsGrid}>
        {cups.map((filled, index) => (
          <TouchableOpacity
            key={index}
            style={styles.cupWrapper}
            onPress={() => onCupPress?.(index)}
            onLongPress={() => onLongPress?.(index)}
            activeOpacity={0.7}
            delayLongPress={300}
          >
            <View style={[styles.cup, filled && styles.cupFilled]}>
              <Ionicons 
                name={filled ? 'water' : 'water-outline'} 
                size={24} 
                color={filled ? COLORS.accent.primary : COLORS.text.tertiary} 
              />
            </View>
            <Text style={styles.cupNumber}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          Tap to fill • Long press to add 2 cups
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  cupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SIZES.spacing.sm,
  },
  cupWrapper: {
    alignItems: 'center',
    width: '22%',
    marginBottom: SIZES.spacing.md,
  },
  cup: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 2,
    borderColor: COLORS.border.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  cupFilled: {
    backgroundColor: `${COLORS.accent.primary}15`,
    borderColor: COLORS.accent.primary,
  },
  cupNumber: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
  },
  legend: {
    marginTop: SIZES.spacing.md,
    paddingTop: SIZES.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  legendText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
  },
});

export default HydrationCups;

