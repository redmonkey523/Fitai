import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const SectionHeader = ({ title, onSeeAll, rightText = 'See all' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={onSeeAll}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>{rightText}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.accent.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
});

export default SectionHeader;

