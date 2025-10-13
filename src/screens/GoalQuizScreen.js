import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { useProfile, useSaveQuiz } from '../hooks/useUserData';
import crashReporting from '../services/crashReporting';

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', icon: 'bed-outline', multiplier: 1.2, desc: 'Little to no exercise' },
  { id: 'light', label: 'Light', icon: 'walk-outline', multiplier: 1.375, desc: '1-3 days/week' },
  { id: 'moderate', label: 'Moderate', icon: 'bicycle-outline', multiplier: 1.55, desc: '3-5 days/week' },
  { id: 'active', label: 'Active', icon: 'fitness-outline', multiplier: 1.725, desc: '6-7 days/week' },
  { id: 'very', label: 'Very Active', icon: 'barbell-outline', multiplier: 1.9, desc: 'Intense daily' },
];

const DIET_STYLES = [
  { id: 'balanced', label: 'Balanced', protein: 25, carbs: 45, fat: 30 },
  { id: 'high-protein', label: 'High Protein', protein: 30, carbs: 40, fat: 30 },
  { id: 'low-carb', label: 'Low Carb', protein: 30, carbs: 25, fat: 45 },
  { id: 'plant-forward', label: 'Plant Forward', protein: 25, carbs: 50, fat: 25 },
];

const GOALS = [
  { id: 'cut', label: 'Lose Weight', icon: 'trending-down', minPace: -0.75, maxPace: -0.25, defaultPace: -0.5 },
  { id: 'recomp', label: 'Body Recomp', icon: 'refresh', minPace: 0, maxPace: 0, defaultPace: 0 },
  { id: 'bulk', label: 'Gain Muscle', icon: 'trending-up', minPace: 0.1, maxPace: 0.35, defaultPace: 0.25 },
];

export default function GoalQuizScreen({ navigation, route }) {
  const { user, updateProfile, refreshUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { mutate: saveQuiz, isLoading: isSaving } = useSaveQuiz();
  
  const [step, setStep] = useState(1);
  const [useMetric, setUseMetric] = useState(false); // Default to imperial (feet/inches, pounds)

  // Step 1: Personal data
  const [sex, setSex] = useState(user?.sex || 'male');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  // Step 2: Lifestyle
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [dailySteps, setDailySteps] = useState('');
  const [sleepQuality, setSleepQuality] = useState('ok');

  // Step 3: Goal
  const [goalType, setGoalType] = useState('cut');
  const [pace, setPace] = useState(-0.5);
  const [targetWeight, setTargetWeight] = useState('');
  const [dietStyle, setDietStyle] = useState('balanced');
  const [exclusions, setExclusions] = useState([]);

  // Calculated results
  const [results, setResults] = useState(null);

  // Pre-populate from existing profile data
  useEffect(() => {
    if (profile && !age && !height && !weight) {
      crashReporting.log('Pre-populating quiz from profile', 'info');
      
      if (profile.sex) setSex(profile.sex);
      if (profile.age) setAge(profile.age.toString());
      
      // Height
      if (profile.height?.value) {
        const heightCm = profile.height.value;
        if (useMetric) {
          setHeight(heightCm.toString());
        } else {
          // Convert cm to inches
          const heightIn = (heightCm / 2.54).toFixed(1);
          setHeight(heightIn);
        }
      }
      
      // Weight
      if (profile.weight?.value) {
        const weightKg = profile.weight.value;
        if (useMetric) {
          setWeight(weightKg.toString());
        } else {
          // Convert kg to lbs
          const weightLbs = (weightKg / 0.453592).toFixed(1);
          setWeight(weightLbs);
        }
      }
      
      // Goals
      if (profile.goals) {
        if (profile.goals.activityLevel) setActivityLevel(profile.goals.activityLevel);
        if (profile.goals.goalType) setGoalType(profile.goals.goalType);
        if (profile.goals.dietStyle) setDietStyle(profile.goals.dietStyle);
        if (profile.goals.dailySteps) setDailySteps(profile.goals.dailySteps.toString());
        if (profile.goals.weeklyDelta) setPace(profile.goals.weeklyDelta);
        
        // Target weight
        if (profile.goals.targetWeight) {
          const targetKg = profile.goals.targetWeight;
          if (useMetric) {
            setTargetWeight(targetKg.toString());
          } else {
            const targetLbs = (targetKg / 0.453592).toFixed(1);
            setTargetWeight(targetLbs);
          }
        }
      }
    }
  }, [profile, useMetric]);

  // Convert height between cm and inches
  const convertHeight = (value, toMetric) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return toMetric ? (num * 2.54).toFixed(0) : (num / 2.54).toFixed(1);
  };

  // Convert weight between kg and lbs
  const convertWeight = (value, toMetric) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return toMetric ? (num * 0.453592).toFixed(1) : (num / 0.453592).toFixed(1);
  };

  // Toggle units
  const toggleUnits = () => {
    setUseMetric(!useMetric);
    if (height) setHeight(convertHeight(height, !useMetric));
    if (weight) setWeight(convertWeight(weight, !useMetric));
    if (targetWeight) setTargetWeight(convertWeight(targetWeight, !useMetric));
  };

  // Calculate BMR
  const calculateBMR = () => {
    const weightKg = useMetric ? parseFloat(weight) : parseFloat(weight) * 0.453592;
    const heightCm = useMetric ? parseFloat(height) : parseFloat(height) * 2.54;
    const ageNum = parseInt(age);

    if (bodyFat && parseFloat(bodyFat) > 0) {
      // Katch-McArdle
      const bf = parseFloat(bodyFat) / 100;
      const lbm = weightKg * (1 - bf);
      return 370 + 21.6 * lbm;
    } else {
      // Mifflin-St Jeor
      if (sex === 'male') {
        return 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
      } else {
        return 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
      }
    }
  };

  // Calculate results
  const calculateResults = () => {
    try {
      const bmr = calculateBMR();
      const activityMultiplier = ACTIVITY_LEVELS.find(a => a.id === activityLevel)?.multiplier || 1.55;
      const tdee = bmr * activityMultiplier;

      // Calorie target based on pace
      const deltaPerDay = (pace * 7700) / 7; // 7700 kcal per kg
      const minCalories = sex === 'male' ? 1600 : 1300;
      const calorieTarget = Math.max(minCalories, Math.min(tdee + 500, tdee - deltaPerDay));

      // Get diet style
      const style = DIET_STYLES.find(d => d.id === dietStyle) || DIET_STYLES[0];
      const weightKg = useMetric ? parseFloat(weight) : parseFloat(weight) * 0.453592;

      // Calculate macros
      let proteinG = Math.max((style.protein / 100 * calorieTarget) / 4, 1.8 * weightKg);
      let fatG = Math.max((style.fat / 100 * calorieTarget) / 9, 0.6 * weightKg);
      let carbsG = (calorieTarget - proteinG * 4 - fatG * 9) / 4;

      // Round to sensible steps
      proteinG = Math.round(proteinG / 5) * 5;
      carbsG = Math.round(carbsG / 5) * 5;
      fatG = Math.round(fatG / 2) * 2;

      // Water and fiber
      const waterMl = Math.min(4000, 35 * weightKg);
      const fiberG = Math.round(14 * calorieTarget / 1000);

      // ETA
      let eta = null;
      if (targetWeight && pace !== 0) {
        const targetKg = useMetric ? parseFloat(targetWeight) : parseFloat(targetWeight) * 0.453592;
        const weeks = Math.abs(targetKg - weightKg) / Math.abs(pace);
        eta = Math.ceil(weeks);
      }

      setResults({
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        calorieTarget: Math.round(calorieTarget),
        proteinG,
        carbsG,
        fatG,
        waterMl: Math.round(waterMl),
        fiberG,
        eta,
        formula: bodyFat ? 'Katch-McArdle' : 'Mifflin-St Jeor',
      });

      setStep(4);
    } catch (error) {
      Alert.alert('Error', 'Please check your inputs and try again.');
    }
  };

  // Validate and save with new API endpoints
  const handleSave = async () => {
    try {
      const weightKg = useMetric ? parseFloat(weight) : parseFloat(weight) * 0.453592;
      const heightCm = useMetric ? parseFloat(height) : parseFloat(height) * 2.54;
      const targetKg = targetWeight ? (useMetric ? parseFloat(targetWeight) : parseFloat(targetWeight) * 0.453592) : null;

      const profileData = {
        sex,
        age: parseInt(age),
        height: heightCm,
        weight: weightKg,
        units: 'metric', // Always store in metric on backend
      };

      const goalsData = {
        goals: {
          goalType,
          activityLevel,
          dietStyle,
          pace,
        },
        targets: {
          dailyCalories: results.calorieTarget,
          proteinTarget: results.proteinG,
          carbsTarget: results.carbsG,
          fatTarget: results.fatG,
          hydrationCups: Math.round(results.waterMl / 240), // Convert ml to cups
          dailySteps: dailySteps ? parseInt(dailySteps) : 10000,
          fiberTarget: results.fiberG,
          targetWeight: targetKg,
          weeklyDelta: pace,
          weeklyWorkouts: user?.goals?.weeklyWorkouts || 3, // Preserve existing or default to 3
        },
      };

      crashReporting.log('Saving quiz results', 'info', {
        profile: profileData,
        goals: goalsData,
      });
      
      // Use the mutation hook
      saveQuiz(
        { profile: profileData, goals: goalsData },
        {
          onSuccess: () => {
            crashReporting.log('Quiz results saved successfully', 'info');
            
            // Navigate to Progress tab to see updated goals
            // Use navigate to Main stack first, then to Progress tab
            if (navigation.canGoBack()) {
              navigation.goBack(); // Go back to Main
              // Then navigate to Progress tab
              setTimeout(() => {
                navigation.getParent()?.navigate('Main', { 
                  screen: 'Progress' 
                });
              }, 100);
            } else {
              // If no history, navigate directly to Main/Progress
              navigation.navigate('Main', { screen: 'Progress' });
            }
          },
          onError: (error) => {
            crashReporting.logError(error, { context: 'quiz_save' });
            // Error toast is shown automatically by the hook
          },
        }
      );
    } catch (error) {
      crashReporting.logError(error, { context: 'quiz_prepare' });
      Alert.alert('Error', 'Failed to prepare your data. Please try again.');
    }
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(step - 1)} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Goal Quiz</Text>
      <View style={styles.headerRight} />
    </View>
  );

  // Render stepper
  const renderStepper = () => (
    <View style={styles.stepper}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.stepDot, step >= i && styles.stepDotActive]} />
      ))}
    </View>
  );

  // Render Step 1: Personal data
  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>About You</Text>
      <Text style={styles.stepSubtitle}>Let's start with some basic information</Text>

      {/* Sex */}
      <Text style={styles.label}>Sex</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, sex === 'male' && styles.buttonActive]}
          onPress={() => setSex('male')}
        >
          <Text style={[styles.buttonText, sex === 'male' && styles.buttonTextActive]}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, sex === 'female' && styles.buttonActive]}
          onPress={() => setSex('female')}
        >
          <Text style={[styles.buttonText, sex === 'female' && styles.buttonTextActive]}>Female</Text>
        </TouchableOpacity>
      </View>

      {/* Age */}
      <Text style={styles.label}>Age (years)</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        placeholder="25"
        placeholderTextColor={COLORS.text.tertiary}
      />

      {/* Height */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Height</Text>
        <TouchableOpacity onPress={toggleUnits}>
          <Text style={styles.unitToggle}>{useMetric ? 'cm' : 'in'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        placeholder={useMetric ? '175' : "5'9\""}
        placeholderTextColor={COLORS.text.tertiary}
      />

      {/* Weight */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Current Weight</Text>
        <TouchableOpacity onPress={toggleUnits}>
          <Text style={styles.unitToggle}>{useMetric ? 'kg' : 'lb'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder={useMetric ? '75' : '165'}
        placeholderTextColor={COLORS.text.tertiary}
      />

      {/* Body Fat % (optional) */}
      <Text style={styles.label}>Body Fat % (optional)</Text>
      <TextInput
        style={styles.input}
        value={bodyFat}
        onChangeText={setBodyFat}
        keyboardType="numeric"
        placeholder="15"
        placeholderTextColor={COLORS.text.tertiary}
      />

      <Button
        title="Next"
        onPress={() => {
          // Validation
          if (!age || !height || !weight) {
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
          }
          const ageNum = parseInt(age);
          const heightNum = parseFloat(height);
          const weightNum = parseFloat(weight);
          
          if (ageNum < 13 || ageNum > 90) {
            Alert.alert('Invalid Age', 'Age must be between 13 and 90.');
            return;
          }
          if (useMetric && (heightNum < 120 || heightNum > 230)) {
            Alert.alert('Invalid Height', 'Height must be between 120-230 cm.');
            return;
          }
          if (!useMetric && (heightNum < 47 || heightNum > 91)) {
            Alert.alert('Invalid Height', 'Height must be between 47-91 inches.');
            return;
          }
          if (useMetric && (weightNum < 35 || weightNum > 250)) {
            Alert.alert('Invalid Weight', 'Weight must be between 35-250 kg.');
            return;
          }
          if (!useMetric && (weightNum < 77 || weightNum > 550)) {
            Alert.alert('Invalid Weight', 'Weight must be between 77-550 lbs.');
            return;
          }
          
          setStep(2);
        }}
        style={{ marginTop: SIZES.spacing.xl }}
      />
    </ScrollView>
  );

  // Render Step 2: Lifestyle
  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Your Lifestyle</Text>
      <Text style={styles.stepSubtitle}>Help us understand your activity level</Text>

      <Text style={styles.label}>Activity Level</Text>
      <View style={styles.activityGrid}>
        {ACTIVITY_LEVELS.map(level => (
          <TouchableOpacity
            key={level.id}
            style={[styles.activityCard, activityLevel === level.id && styles.activityCardActive]}
            onPress={() => setActivityLevel(level.id)}
          >
            <Ionicons name={level.icon} size={32} color={activityLevel === level.id ? COLORS.accent.primary : COLORS.text.secondary} />
            <Text style={[styles.activityLabel, activityLevel === level.id && styles.activityLabelActive]}>{level.label}</Text>
            <Text style={styles.activityDesc}>{level.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Daily Steps (optional)</Text>
      <TextInput
        style={styles.input}
        value={dailySteps}
        onChangeText={setDailySteps}
        keyboardType="numeric"
        placeholder="10000"
        placeholderTextColor={COLORS.text.tertiary}
      />

      <Text style={styles.label}>Sleep Quality</Text>
      <View style={styles.buttonGroup}>
        {['poor', 'ok', 'good'].map(quality => (
          <TouchableOpacity
            key={quality}
            style={[styles.button, sleepQuality === quality && styles.buttonActive]}
            onPress={() => setSleepQuality(quality)}
          >
            <Text style={[styles.buttonText, sleepQuality === quality && styles.buttonTextActive]}>
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Next"
        onPress={() => setStep(3)}
        style={{ marginTop: SIZES.spacing.xl }}
      />
    </ScrollView>
  );

  // Render Step 3: Goal
  const renderStep3 = () => {
    const currentGoal = GOALS.find(g => g.id === goalType) || GOALS[0];
    
    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Your Goal</Text>
        <Text style={styles.stepSubtitle}>What would you like to achieve?</Text>

        <Text style={styles.label}>Primary Goal</Text>
        <View style={styles.goalGrid}>
          {GOALS.map(goal => (
            <TouchableOpacity
              key={goal.id}
              style={[styles.goalCard, goalType === goal.id && styles.goalCardActive]}
              onPress={() => {
                setGoalType(goal.id);
                setPace(goal.defaultPace);
              }}
            >
              <Ionicons name={goal.icon} size={32} color={goalType === goal.id ? COLORS.accent.primary : COLORS.text.secondary} />
              <Text style={[styles.goalLabel, goalType === goal.id && styles.goalLabelActive]}>{goal.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pace Slider */}
        {goalType !== 'recomp' && (
          <>
            <Text style={styles.label}>
              Pace: {Math.abs(pace).toFixed(2)} kg/week ({Math.abs(pace * 7700 / 7).toFixed(0)} kcal/day)
            </Text>
            <View style={styles.paceSlider}>
              {/* Simple buttons for pace adjustment */}
              <TouchableOpacity onPress={() => setPace(Math.max(currentGoal.minPace, pace - 0.05))} style={styles.paceButton}>
                <Ionicons name="remove" size={20} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.paceValue}>{Math.abs(pace).toFixed(2)} kg/wk</Text>
              <TouchableOpacity onPress={() => setPace(Math.min(currentGoal.maxPace, pace + 0.05))} style={styles.paceButton}>
                <Ionicons name="add" size={20} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Target Weight */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Target Weight (optional)</Text>
          <Text style={styles.unitToggle}>{useMetric ? 'kg' : 'lb'}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={targetWeight}
          onChangeText={setTargetWeight}
          keyboardType="numeric"
          placeholder={useMetric ? '70' : '154'}
          placeholderTextColor={COLORS.text.tertiary}
        />

        {/* Diet Style */}
        <Text style={styles.label}>Diet Style</Text>
        <View style={styles.dietGrid}>
          {DIET_STYLES.map(style => (
            <TouchableOpacity
              key={style.id}
              style={[styles.dietCard, dietStyle === style.id && styles.dietCardActive]}
              onPress={() => setDietStyle(style.id)}
            >
              <Text style={[styles.dietLabel, dietStyle === style.id && styles.dietLabelActive]}>{style.label}</Text>
              <Text style={styles.dietMacros}>P{style.protein}% C{style.carbs}% F{style.fat}%</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Calculate"
          onPress={calculateResults}
          style={{ marginTop: SIZES.spacing.xl }}
        />
      </ScrollView>
    );
  };

  // Render Step 4: Results
  const renderStep4 = () => {
    if (!results) return null;

    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Your Plan</Text>
        <Text style={styles.stepSubtitle}>Personalized nutrition targets</Text>

        <Card style={styles.resultsCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Daily Calories</Text>
            <Text style={styles.resultValue}>{results.calorieTarget} kcal</Text>
          </View>
          <View style={styles.resultDivider} />
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Protein</Text>
            <Text style={styles.resultValue}>{results.proteinG}g ({Math.round(results.proteinG * 4 / results.calorieTarget * 100)}%)</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Carbs</Text>
            <Text style={styles.resultValue}>{results.carbsG}g ({Math.round(results.carbsG * 4 / results.calorieTarget * 100)}%)</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Fat</Text>
            <Text style={styles.resultValue}>{results.fatG}g ({Math.round(results.fatG * 9 / results.calorieTarget * 100)}%)</Text>
          </View>
          <View style={styles.resultDivider} />
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Water</Text>
            <Text style={styles.resultValue}>{Math.round(results.waterMl / 240)} cups ({results.waterMl}ml)</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Fiber</Text>
            <Text style={styles.resultValue}>{results.fiberG}g</Text>
          </View>
          
          {results.eta && (
            <>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>ETA to Target</Text>
                <Text style={styles.resultValue}>{results.eta} weeks</Text>
              </View>
            </>
          )}
        </Card>

        {/* Explain Numbers */}
        <Card style={styles.explainCard}>
          <Text style={styles.explainTitle}>How we calculated this</Text>
          <Text style={styles.explainText}>
            BMR: {results.bmr} kcal (using {results.formula}){'\n'}
            TDEE: {results.tdee} kcal (BMR × activity){'\n'}
            Target: {results.calorieTarget} kcal (adjusted for {Math.abs(pace).toFixed(2)} kg/week)
          </Text>
        </Card>

        <View style={styles.buttonRow}>
          <Button
            title={isSaving ? "Saving..." : "Save & Continue"}
            onPress={handleSave}
            disabled={isSaving}
            style={{ flex: 1, marginRight: SIZES.spacing.sm }}
          />
          <Button
            title="Back"
            variant="secondary"
            onPress={() => setStep(3)}
            disabled={isSaving}
            style={{ flex: 1, marginLeft: SIZES.spacing.sm }}
          />
        </View>
      </ScrollView>
    );
  };

  // Show loading state while fetching profile
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderStepper()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </SafeAreaView>
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
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    padding: SIZES.spacing.xs,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  headerRight: {
    width: 40,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.lg,
    gap: SIZES.spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.background.secondary,
  },
  stepDotActive: {
    backgroundColor: COLORS.accent.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SIZES.spacing.lg,
  },
  stepTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  stepSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.xl,
  },
  label: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.sm,
    marginTop: SIZES.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.sm,
  },
  unitToggle: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  input: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: SIZES.spacing.md,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
  },
  buttonText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  buttonTextActive: {
    color: COLORS.background.primary,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.md,
  },
  activityCard: {
    width: '48%',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  },
  activityCardActive: {
    borderColor: COLORS.accent.primary,
    borderWidth: 2,
  },
  activityLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginTop: SIZES.spacing.xs,
  },
  activityLabelActive: {
    color: COLORS.accent.primary,
  },
  activityDesc: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    marginTop: 4,
  },
  goalGrid: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.md,
  },
  goalCard: {
    flex: 1,
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  },
  goalCardActive: {
    borderColor: COLORS.accent.primary,
    borderWidth: 2,
  },
  goalLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    marginTop: SIZES.spacing.xs,
    textAlign: 'center',
  },
  goalLabelActive: {
    color: COLORS.accent.primary,
  },
  paceSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    marginBottom: SIZES.spacing.md,
  },
  paceButton: {
    padding: SIZES.spacing.sm,
    backgroundColor: COLORS.background.primary,
    borderRadius: SIZES.radius.sm,
  },
  paceValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.md,
  },
  dietCard: {
    width: '48%',
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
  },
  dietCardActive: {
    borderColor: COLORS.accent.primary,
    borderWidth: 2,
  },
  dietLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  dietLabelActive: {
    color: COLORS.accent.primary,
  },
  dietMacros: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: 4,
  },
  resultsCard: {
    marginBottom: SIZES.spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.sm,
  },
  resultLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  resultValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  resultDivider: {
    height: 1,
    backgroundColor: COLORS.border.primary,
    marginVertical: SIZES.spacing.xs,
  },
  explainCard: {
    marginBottom: SIZES.spacing.md,
  },
  explainTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  explainText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginTop: SIZES.spacing.md,
  },
});

