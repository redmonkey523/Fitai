/**
 * GoalSetup - TDEE wizard for setting fitness goals
 * Collects user stats, calculates TDEE, shows suggested macros and timeline
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import {
  tdee,
  calculateMacros,
  calculateTimeline,
  getActivityDescription,
  getGoalDescription,
  type Sex,
  type ActivityLevel,
  type GoalTarget,
  type GoalInput,
} from '../../services/goals';
import { db } from '../../storage/db';

interface GoalSetupProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Step = 'basics' | 'activity' | 'target' | 'review';

export function GoalSetup({ visible, onClose, onComplete }: GoalSetupProps) {
  const [step, setStep] = useState<Step>('basics');
  const [isSaving, setIsSaving] = useState(false);

  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [target, setTarget] = useState<GoalTarget>('recomp');
  const [targetWeight, setTargetWeight] = useState('');

  const handleClose = () => {
    setStep('basics');
    setSex('male');
    setAge('');
    setHeightCm('');
    setWeightKg('');
    setActivity('moderate');
    setTarget('recomp');
    setTargetWeight('');
    onClose();
  };

  const handleNext = () => {
    if (step === 'basics') setStep('activity');
    else if (step === 'activity') setStep('target');
    else if (step === 'target') setStep('review');
  };

  const handleBack = () => {
    if (step === 'review') setStep('target');
    else if (step === 'target') setStep('activity');
    else if (step === 'activity') setStep('basics');
  };

  const canProceed = () => {
    if (step === 'basics') {
      return (
        age.length > 0 &&
        heightCm.length > 0 &&
        weightKg.length > 0 &&
        parseInt(age) > 0 &&
        parseInt(heightCm) > 0 &&
        parseFloat(weightKg) > 0
      );
    }
    if (step === 'target' && target !== 'recomp') {
      return targetWeight.length > 0 && parseFloat(targetWeight) > 0;
    }
    return true;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const goalData: GoalInput = {
        sex,
        age: parseInt(age),
        height_cm: parseInt(heightCm),
        weight_kg: parseFloat(weightKg),
        activity,
        target,
      };

      const id = `goal_${Date.now()}`;
      const createdAt = new Date().toISOString();

      await db.execute(
        `INSERT INTO goals (id, sex, age, height_cm, weight_kg, activity, target, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, goalData.sex, goalData.age, goalData.height_cm, goalData.weight_kg, goalData.activity, goalData.target, createdAt]
      );

      onComplete?.();
      handleClose();
    } catch (error) {
      console.error('[GoalSetup] Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBasics = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtext}>We'll use this to calculate your TDEE</Text>

      <View style={styles.radioGroup}>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[styles.radioOption, sex === 'male' && styles.radioOptionActive]}
            onPress={() => setSex('male')}
          >
            <Ionicons
              name={sex === 'male' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={sex === 'male' ? COLORS.accent.primary : COLORS.text.tertiary}
            />
            <Text
              style={[styles.radioText, sex === 'male' && styles.radioTextActive]}
            >
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.radioOption, sex === 'female' && styles.radioOptionActive]}
            onPress={() => setSex('female')}
          >
            <Ionicons
              name={sex === 'female' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={sex === 'female' ? COLORS.accent.primary : COLORS.text.tertiary}
            />
            <Text
              style={[styles.radioText, sex === 'female' && styles.radioTextActive]}
            >
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age (years)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 25"
          placeholderTextColor={COLORS.text.tertiary}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 175"
          placeholderTextColor={COLORS.text.tertiary}
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 70"
          placeholderTextColor={COLORS.text.tertiary}
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );

  const renderActivity = () => {
    const activities: Array<{ level: ActivityLevel; icon: string }> = [
      { level: 'sedentary', icon: 'bed-outline' },
      { level: 'light', icon: 'walk-outline' },
      { level: 'moderate', icon: 'fitness-outline' },
      { level: 'active', icon: 'barbell-outline' },
      { level: 'very', icon: 'flash-outline' },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Activity Level</Text>
        <Text style={styles.stepSubtext}>Choose your typical activity level</Text>

        <View style={styles.optionsGrid}>
          {activities.map(({ level, icon }) => (
            <TouchableOpacity
              key={level}
              style={[styles.activityCard, activity === level && styles.activityCardActive]}
              onPress={() => setActivity(level)}
            >
              <Ionicons
                name={icon as any}
                size={32}
                color={activity === level ? COLORS.accent.primary : COLORS.text.secondary}
              />
              <Text
                style={[styles.activityName, activity === level && styles.activityNameActive]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
              <Text style={styles.activityDesc}>{getActivityDescription(level)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTarget = () => {
    const targets: Array<{ target: GoalTarget; icon: string; color: string }> = [
      { target: 'cut', icon: 'trending-down-outline', color: COLORS.accent.secondary },
      { target: 'recomp', icon: 'swap-horizontal-outline', color: COLORS.accent.primary },
      { target: 'bulk', icon: 'trending-up-outline', color: COLORS.accent.quaternary },
    ];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Goal</Text>
        <Text style={styles.stepSubtext}>What's your primary goal?</Text>

        <View style={styles.targetGrid}>
          {targets.map(({ target: t, icon, color }) => (
            <TouchableOpacity
              key={t}
              style={[styles.targetCard, target === t && styles.targetCardActive]}
              onPress={() => setTarget(t)}
            >
              <Ionicons
                name={icon as any}
                size={32}
                color={target === t ? color : COLORS.text.tertiary}
              />
              <Text style={[styles.targetName, target === t && styles.targetNameActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
              <Text style={styles.targetDesc}>{getGoalDescription(t)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {target !== 'recomp' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 75"
              placeholderTextColor={COLORS.text.tertiary}
              value={targetWeight}
              onChangeText={setTargetWeight}
              keyboardType="decimal-pad"
            />
          </View>
        )}
      </View>
    );
  };

  const renderReview = () => {
    const goalData: GoalInput = {
      sex,
      age: parseInt(age),
      height_cm: parseInt(heightCm),
      weight_kg: parseFloat(weightKg),
      activity,
      target,
    };

    const tdeeValue = tdee(goalData);
    const macros = calculateMacros(goalData);

    let timeline = null;
    if (target !== 'recomp' && targetWeight) {
      timeline = calculateTimeline(parseFloat(weightKg), parseFloat(targetWeight), target);
    }

    return (
      <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Your Plan</Text>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Maintenance TDEE</Text>
          <Text style={styles.reviewValue}>{tdeeValue} cal/day</Text>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Target Calories</Text>
          <Text style={styles.reviewValue}>{macros.kcal} cal/day</Text>
        </View>

        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>Macro Targets</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroReviewItem}>
              <Text style={styles.macroReviewValue}>{macros.protein}g</Text>
              <Text style={styles.macroReviewLabel}>Protein</Text>
            </View>
            <View style={styles.macroReviewItem}>
              <Text style={styles.macroReviewValue}>{macros.carbs}g</Text>
              <Text style={styles.macroReviewLabel}>Carbs</Text>
            </View>
            <View style={styles.macroReviewItem}>
              <Text style={styles.macroReviewValue}>{macros.fat}g</Text>
              <Text style={styles.macroReviewLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {timeline && (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewLabel}>Timeline</Text>
            <Text style={styles.reviewValue}>
              {timeline.estimatedWeeks} weeks
            </Text>
            <Text style={styles.timelineDetail}>
              {timeline.weeklyDelta > 0 ? '+' : ''}
              {timeline.weeklyDelta.toFixed(2)} kg/week
            </Text>
            <Text style={styles.timelineDetail}>
              Target: {new Date(timeline.estimatedDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.accent.secondary} />
          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>Disclaimer:</Text> These are estimates based on
            general formulas. They are not medical advice. Consult a healthcare professional for
            personalized guidance.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'basics':
        return renderBasics();
      case 'activity':
        return renderActivity();
      case 'target':
        return renderTarget();
      case 'review':
        return renderReview();
    }
  };

  const stepProgress = () => {
    const steps: Step[] = ['basics', 'activity', 'target', 'review'];
    const currentIndex = steps.indexOf(step);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 'basics' ? handleClose : handleBack}>
            <Ionicons
              name={step === 'basics' ? 'close' : 'arrow-back'}
              size={28}
              color={COLORS.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goal Setup</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${stepProgress()}%` }]} />
        </View>

        <View style={styles.content}>{renderStep()}</View>

        <View style={styles.footer}>
          {step === 'review' ? (
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.text.onAccent} />
              ) : (
                <Text style={styles.saveButtonText}>Save Goals</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.xl,
    paddingBottom: SIZES.spacing.md,
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.background.secondary,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.spacing.lg,
  },
  stepContainer: {
    paddingTop: SIZES.spacing.xl,
  },
  stepTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  stepSubtext: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.xl,
  },
  radioGroup: {
    marginBottom: SIZES.spacing.lg,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.sm,
  },
  radioRow: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  radioOptionActive: {
    borderColor: COLORS.accent.primary,
  },
  radioText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
  },
  radioTextActive: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.semibold,
  },
  inputGroup: {
    marginBottom: SIZES.spacing.lg,
  },
  input: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.md,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
  },
  optionsGrid: {
    gap: SIZES.spacing.md,
  },
  activityCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityCardActive: {
    borderColor: COLORS.accent.primary,
    backgroundColor: COLORS.background.primary,
  },
  activityName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.sm,
  },
  activityNameActive: {
    color: COLORS.text.primary,
  },
  activityDesc: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  targetGrid: {
    gap: SIZES.spacing.md,
    marginBottom: SIZES.spacing.lg,
  },
  targetCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  targetCardActive: {
    borderColor: COLORS.accent.primary,
    backgroundColor: COLORS.background.primary,
  },
  targetName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.sm,
  },
  targetNameActive: {
    color: COLORS.text.primary,
  },
  targetDesc: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  reviewContainer: {
    flex: 1,
    paddingTop: SIZES.spacing.lg,
  },
  reviewCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  reviewLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.xs,
  },
  reviewValue: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SIZES.spacing.md,
  },
  macroReviewItem: {
    alignItems: 'center',
  },
  macroReviewValue: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  macroReviewLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginTop: 4,
  },
  timelineDetail: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.md,
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.xl,
  },
  disclaimerText: {
    flex: 1,
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    lineHeight: 18,
  },
  disclaimerBold: {
    fontWeight: FONTS.weight.bold,
  },
  footer: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.utility.divider,
  },
  nextButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.onAccent,
  },
  saveButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.onAccent,
  },
});

