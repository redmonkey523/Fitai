import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

export default function TrialBanner({ trialEndsAt, onUpgrade }) {
  if (!trialEndsAt) return null;
  const diffMs = new Date(trialEndsAt).getTime() - Date.now();
  const remainingDays = Math.max(0, Math.ceil(diffMs / (24*60*60*1000)));
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Free trial: {remainingDays} day{remainingDays !== 1 ? 's' : ''} left</Text>
      <TouchableOpacity onPress={onUpgrade} style={styles.btn}>
        <Text style={styles.btnText}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.card,
    borderColor: COLORS.accent.primary,
    borderWidth: 1,
    borderRadius: SIZES.radius.md,
    marginHorizontal: SIZES.spacing.md,
    marginTop: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: { color: COLORS.text.primary, fontSize: FONTS.size.sm },
  btn: { backgroundColor: COLORS.accent.primary, borderRadius: SIZES.radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  btnText: { color: COLORS.background.primary, fontWeight: FONTS.weight.bold },
});


