import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';

/**
 * Input component with cyberpunk styling
 * 
 * @param {string} label - Input label
 * @param {string} placeholder - Input placeholder
 * @param {string} value - Input value
 * @param {function} onChangeText - Function to call when text changes
 * @param {boolean} secureTextEntry - Whether to hide text entry
 * @param {string} error - Error message
 * @param {object} style - Additional styles
 */
const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          selectionColor={COLORS.accent.primary}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.spacing.md,
  },
  label: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.xs,
    fontWeight: FONTS.weight.medium,
  },
  inputContainer: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.utility.divider,
    paddingHorizontal: SIZES.spacing.md,
    height: 50,
    justifyContent: 'center',
  },
  input: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.regular,
  },
  inputError: {
    borderColor: COLORS.accent.error,
  },
  errorText: {
    color: COLORS.accent.error,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
});

export default Input;
