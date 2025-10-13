/**
 * AddWeightSheet - Quick weight entry bottom sheet
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';
import { useAddWeight, useProfile } from '../hooks/useWeight';

interface AddWeightSheetProps {
  visible: boolean;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AddWeightSheet({ visible, onClose }: AddWeightSheetProps) {
  const { data: profile } = useProfile();
  const { mutate: addWeight, isPending } = useAddWeight();

  const defaultUnit = profile?.weight_unit || 'kg';

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>(defaultUnit);
  const [note, setNote] = useState('');

  const handleClose = () => {
    setWeight('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setUnit(defaultUnit);
    onClose();
  };

  const handleSave = () => {
    const weightNum = parseFloat(weight);

    if (!weightNum || isNaN(weightNum)) {
      return;
    }

    addWeight(
      { date, weight: weightNum, unit, note },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (error) => {
          alert(`Error: ${error instanceof Error ? error.message : 'Failed to save weight'}`);
        },
      }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Weight</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>

            {/* Weight */}
            <View style={styles.field}>
              <Text style={styles.label}>Weight</Text>
              <View style={styles.weightRow}>
                <TextInput
                  style={[styles.input, styles.weightInput]}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder={unit === 'kg' ? '70' : '154'}
                  placeholderTextColor={COLORS.text.tertiary}
                  keyboardType="decimal-pad"
                  autoFocus
                />

                <View style={styles.unitToggle}>
                  <TouchableOpacity
                    style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
                    onPress={() => setUnit('kg')}
                  >
                    <Text
                      style={[styles.unitButtonText, unit === 'kg' && styles.unitButtonTextActive]}
                    >
                      kg
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.unitButton, unit === 'lb' && styles.unitButtonActive]}
                    onPress={() => setUnit('lb')}
                  >
                    <Text
                      style={[styles.unitButtonText, unit === 'lb' && styles.unitButtonTextActive]}
                    >
                      lb
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Note (optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="Feeling great!"
                placeholderTextColor={COLORS.text.tertiary}
              />
            </View>

            {/* Range hint */}
            <Text style={styles.hint}>
              Valid range: 25-400 kg (55-880 lb)
            </Text>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, isPending && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isPending || !weight}
            >
              {isPending ? (
                <ActivityIndicator color={COLORS.text.onAccent} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  content: {
    padding: SIZES.spacing.lg,
  },
  field: {
    marginBottom: SIZES.spacing.lg,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.sm,
  },
  input: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 8,
    padding: SIZES.spacing.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  weightRow: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  weightInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 8,
    padding: 4,
  },
  unitButton: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: COLORS.accent.primary,
  },
  unitButtonText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
  },
  unitButtonTextActive: {
    color: COLORS.text.onAccent,
  },
  hint: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginBottom: SIZES.spacing.md,
  },
  saveButton: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: 8,
    padding: SIZES.spacing.md,
    alignItems: 'center',
    marginTop: SIZES.spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.onAccent,
  },
});

