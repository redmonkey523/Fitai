import { StyleSheet } from 'react-native';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

export const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.lg,
    ...SHADOWS.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.md,
  },
  thumb: {
    width: 88,
    height: 56,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.background.secondary,
  },
  lineLong: {
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.background.secondary,
    width: '70%',
  },
  lineShort: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background.secondary,
    width: '50%',
  },
  footer: {
    marginTop: SIZES.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pill: {
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background.secondary,
  },
});


