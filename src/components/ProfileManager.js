import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';

const { width, height } = Dimensions.get('window');

const ProfileManager = ({ 
  navigation,
  onProfileUpdate,
  onSettingsChange,
  onGoalUpdate
}) => {
  const dispatch = useDispatch();
  const userState = useSelector(state => state.user);
  const authState = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    fitnessGoals: [],
    nutritionGoals: [],
    dietaryRestrictions: [],
    profileImage: null
  });

  // Settings data
  const [settings, setSettings] = useState({
    notifications: {
      workout: true,
      nutrition: true,
      progress: true,
      social: true,
      challenges: true
    },
    privacy: {
      profilePublic: true,
      showProgress: true,
      showWorkouts: true,
      allowFriendRequests: true
    },
    units: {
      weight: 'kg', // kg or lbs
      height: 'cm', // cm or ft
      distance: 'km' // km or miles
    },
    theme: 'light', // light, dark, auto
    language: 'en'
  });

  // Goal data
  const [goals, setGoals] = useState({
    weight: {
      target: '',
      current: '',
      timeline: '3 months'
    },
    fitness: {
      workoutsPerWeek: 3,
      workoutDuration: 45,
      strengthGoal: '',
      cardioGoal: ''
    },
    nutrition: {
      dailyCalories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65
    }
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load mock data
      setProfileData({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        dateOfBirth: '1990-05-15',
        gender: 'male',
        height: '175',
        weight: '70',
        activityLevel: 'moderate',
        fitnessGoals: ['weight_loss', 'muscle_gain', 'endurance'],
        nutritionGoals: ['balanced_diet', 'protein_intake'],
        dietaryRestrictions: ['vegetarian'],
        profileImage: 'https://via.placeholder.com/150'
      });

      setGoals({
        weight: {
          target: '65',
          current: '70',
          timeline: '3 months'
        },
        fitness: {
          workoutsPerWeek: 4,
          workoutDuration: 45,
          strengthGoal: 'Bench press 100kg',
          cardioGoal: 'Run 10km in 45 minutes'
        },
        nutrition: {
          dailyCalories: 2000,
          protein: 150,
          carbs: 200,
          fat: 65
        }
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update profile
      if (onProfileUpdate) {
        onProfileUpdate(profileData);
      }
      
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsChange = async (newSettings) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(newSettings);
      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }
      
      setShowSettingsModal(false);
      Alert.alert('Success', 'Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGoalUpdate = async (newGoals) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGoals(newGoals);
      if (onGoalUpdate) {
        onGoalUpdate(newGoals);
      }
      
      setShowGoalModal(false);
      Alert.alert('Success', 'Goals updated successfully!');
    } catch (error) {
      console.error('Error updating goals:', error);
      Alert.alert('Error', 'Failed to update goals');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Handle logout
            if (navigation) {
              navigation.navigate('Auth');
            }
          }
        }
      ]
    );
  };

  const renderProfileSection = () => (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Ionicons 
            name={editMode ? "close" : "create-outline"} 
            size={20} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.profileImageContainer}>
        <Image 
          source={{ uri: profileData.profileImage }} 
          style={styles.profileImage}
        />
        {editMode && (
          <TouchableOpacity 
            style={styles.imageEditButton}
            onPress={() => setShowImagePicker(true)}
          >
            <Ionicons name="camera" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.profileFields}>
        <View style={styles.fieldRow}>
          <Input
            label="First Name"
            value={profileData.firstName}
            onChangeText={(text) => setProfileData({...profileData, firstName: text})}
            editable={editMode}
            style={styles.field}
          />
          <Input
            label="Last Name"
            value={profileData.lastName}
            onChangeText={(text) => setProfileData({...profileData, lastName: text})}
            editable={editMode}
            style={styles.field}
          />
        </View>

        <Input
          label="Email"
          value={profileData.email}
          onChangeText={(text) => setProfileData({...profileData, email: text})}
          editable={editMode}
          keyboardType="email-address"
        />

        <View style={styles.fieldRow}>
          <Input
            label="Height (cm)"
            value={profileData.height}
            onChangeText={(text) => setProfileData({...profileData, height: text})}
            editable={editMode}
            keyboardType="numeric"
            style={styles.field}
          />
          <Input
            label="Weight (kg)"
            value={profileData.weight}
            onChangeText={(text) => setProfileData({...profileData, weight: text})}
            editable={editMode}
            keyboardType="numeric"
            style={styles.field}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.radioGroup}>
              {['male', 'female', 'other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.radioButton,
                    profileData.gender === gender && styles.radioButtonActive
                  ]}
                  onPress={() => setProfileData({...profileData, gender})}
                  disabled={!editMode}
                >
                  <Text style={[
                    styles.radioText,
                    profileData.gender === gender && styles.radioTextActive
                  ]}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerText}>
                {profileData.activityLevel.charAt(0).toUpperCase() + profileData.activityLevel.slice(1)}
              </Text>
              {editMode && (
                <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
              )}
            </View>
          </View>
        </View>
      </View>

      {editMode && (
        <Button
          title={saving ? "Saving..." : "Save Changes"}
          onPress={handleProfileUpdate}
          disabled={saving}
          style={styles.saveButton}
        />
      )}
    </Card>
  );

  const renderGoalsSection = () => (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fitness Goals</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setShowGoalModal(true)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.goalsGrid}>
        <View style={styles.goalCard}>
          <Ionicons name="scale" size={24} color={COLORS.primary} />
          <Text style={styles.goalTitle}>Weight Goal</Text>
          <Text style={styles.goalValue}>
            {goals.weight.current}kg → {goals.weight.target}kg
          </Text>
          <Text style={styles.goalTimeline}>{goals.weight.timeline}</Text>
        </View>

        <View style={styles.goalCard}>
          <Ionicons name="fitness" size={24} color={COLORS.primary} />
          <Text style={styles.goalTitle}>Workouts</Text>
          <Text style={styles.goalValue}>
            {goals.fitness.workoutsPerWeek}x per week
          </Text>
          <Text style={styles.goalTimeline}>{goals.fitness.workoutDuration}min</Text>
        </View>

        <View style={styles.goalCard}>
          <Ionicons name="restaurant" size={24} color={COLORS.primary} />
          <Text style={styles.goalTitle}>Daily Calories</Text>
          <Text style={styles.goalValue}>{goals.nutrition.dailyCalories}</Text>
          <Text style={styles.goalTimeline}>calories</Text>
        </View>

        <View style={styles.goalCard}>
          <Ionicons name="trophy" size={24} color={COLORS.primary} />
          <Text style={styles.goalTitle}>Strength Goal</Text>
          <Text style={styles.goalValue}>{goals.fitness.strengthGoal}</Text>
          <Text style={styles.goalTimeline}>Target</Text>
        </View>
      </View>
    </Card>
  );

  const renderSettingsSection = () => (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setShowSettingsModal(true)}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsList}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Text style={styles.settingValue}>
            {Object.values(settings.notifications).filter(Boolean).length} enabled
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Privacy</Text>
          </View>
          <Text style={styles.settingValue}>
            {settings.privacy.profilePublic ? 'Public' : 'Private'}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="options" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Units</Text>
          </View>
          <Text style={styles.settingValue}>
            {settings.units.weight.toUpperCase()}, {settings.units.height.toUpperCase()}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="color-palette" size={20} color={COLORS.gray} />
            <Text style={styles.settingText}>Theme</Text>
          </View>
          <Text style={styles.settingValue}>
            {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderStatsSection = () => (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>45</Text>
          <Text style={styles.statLabel}>Workouts</Text>
          <Text style={styles.statPeriod}>This Month</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>12.5kg</Text>
          <Text style={styles.statLabel}>Weight Lost</Text>
          <Text style={styles.statPeriod}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>156</Text>
          <Text style={styles.statLabel}>Days Streak</Text>
          <Text style={styles.statPeriod}>Current</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>89%</Text>
          <Text style={styles.statLabel}>Goal Progress</Text>
          <Text style={styles.statPeriod}>Overall</Text>
        </View>
      </View>
    </Card>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <Button
        title="Export Data"
        onPress={() => Alert.alert('Export', 'Data export feature coming soon!')}
        variant="outline"
        style={styles.actionButton}
      />
      
      <Button
        title="Delete Account"
        onPress={() => Alert.alert('Delete Account', 'This action cannot be undone.')}
        variant="danger"
        style={styles.actionButton}
      />
      
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        style={styles.actionButton}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderProfileSection()}
      {renderGoalsSection()}
      {renderSettingsSection()}
      {renderStatsSection()}
      {renderActionButtons()}

      {/* Goal Modal */}
      <Modal
        visible={showGoalModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Goals</Text>
            <TouchableOpacity onPress={() => setShowGoalModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Weight Goals</Text>
            <View style={styles.modalFieldRow}>
              <Input
                label="Current Weight (kg)"
                value={goals.weight.current}
                onChangeText={(text) => setGoals({
                  ...goals,
                  weight: { ...goals.weight, current: text }
                })}
                keyboardType="numeric"
                style={styles.modalField}
              />
              <Input
                label="Target Weight (kg)"
                value={goals.weight.target}
                onChangeText={(text) => setGoals({
                  ...goals,
                  weight: { ...goals.weight, target: text }
                })}
                keyboardType="numeric"
                style={styles.modalField}
              />
            </View>

            <Text style={styles.modalSectionTitle}>Fitness Goals</Text>
            <View style={styles.modalFieldRow}>
              <Input
                label="Workouts per Week"
                value={goals.fitness.workoutsPerWeek.toString()}
                onChangeText={(text) => setGoals({
                  ...goals,
                  fitness: { ...goals.fitness, workoutsPerWeek: parseInt(text) || 0 }
                })}
                keyboardType="numeric"
                style={styles.modalField}
              />
              <Input
                label="Workout Duration (min)"
                value={goals.fitness.workoutDuration.toString()}
                onChangeText={(text) => setGoals({
                  ...goals,
                  fitness: { ...goals.fitness, workoutDuration: parseInt(text) || 0 }
                })}
                keyboardType="numeric"
                style={styles.modalField}
              />
            </View>

            <Input
              label="Strength Goal"
              value={goals.fitness.strengthGoal}
              onChangeText={(text) => setGoals({
                ...goals,
                fitness: { ...goals.fitness, strengthGoal: text }
              })}
            />

            <Text style={styles.modalSectionTitle}>Nutrition Goals</Text>
            <Input
              label="Daily Calories"
              value={goals.nutrition.dailyCalories.toString()}
              onChangeText={(text) => setGoals({
                ...goals,
                nutrition: { ...goals.nutrition, dailyCalories: parseInt(text) || 0 }
              })}
              keyboardType="numeric"
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={() => setShowGoalModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={saving ? "Saving..." : "Save Goals"}
              onPress={() => handleGoalUpdate(goals)}
              disabled={saving}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>Notifications</Text>
            {Object.entries(settings.notifications).map(([key, value]) => (
              <View key={key} style={styles.settingToggle}>
                <Text style={styles.settingToggleText}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} Notifications
                </Text>
                <Switch
                  value={value}
                  onValueChange={(newValue) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [key]: newValue }
                  })}
                  trackColor={{ false: COLORS.gray + '40', true: COLORS.primary + '40' }}
                  thumbColor={value ? COLORS.primary : COLORS.gray}
                />
              </View>
            ))}

            <Text style={styles.modalSectionTitle}>Privacy</Text>
            {Object.entries(settings.privacy).map(([key, value]) => (
              <View key={key} style={styles.settingToggle}>
                <Text style={styles.settingToggleText}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Switch
                  value={value}
                  onValueChange={(newValue) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, [key]: newValue }
                  })}
                  trackColor={{ false: COLORS.gray + '40', true: COLORS.primary + '40' }}
                  thumbColor={value ? COLORS.primary : COLORS.gray}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={() => setShowSettingsModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title={saving ? "Saving..." : "Save Settings"}
              onPress={() => handleSettingsChange(settings)}
              disabled={saving}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
    fontFamily: FONTS.medium,
  },
  section: {
    margin: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  editButton: {
    padding: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileFields: {
    gap: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  radioText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.gray,
  },
  radioTextActive: {
    color: COLORS.white,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  saveButton: {
    marginTop: 16,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: (width - 64) / 2 - 6,
    padding: 16,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  goalTimeline: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 64) / 2 - 6,
    padding: 16,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.success,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  statPeriod: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
  },
  actionButtons: {
    margin: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 12,
  },
  modalFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalField: {
    flex: 1,
  },
  settingToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingToggleText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
  },
});

export default ProfileManager;
