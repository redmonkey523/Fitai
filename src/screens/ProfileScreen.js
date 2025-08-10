import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';

// Import auth context
import { useAuth } from '../contexts/AuthContext';

const ProfileScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    fitnessGoal: '',
    experienceLevel: '',
  });

  // Get user and auth methods from context
  const { user, handleLogout, isAuthenticating } = useAuth();

  // Initialize edit form when user data is available
  React.useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        height: user.height || '',
        weight: user.weight || '',
        fitnessGoal: user.fitnessGoal || '',
        experienceLevel: user.experienceLevel || '',
      });
    }
  }, [user]);

  // Handle logout confirmation
  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await handleLogout();
              // The auth context will handle the success and show toast
            } catch (error) {
              // Error handling is done in the auth context
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    setIsEditing(false);
    setShowEditModal(false);
    
    // In a real app, you'd save this to your backend
    // For now, we'll just show a success message
    Alert.alert(
      'Profile Updated',
      'Your profile has been saved successfully!',
      [{ text: 'OK' }]
    );
  };

  // Format member since date
  const formatMemberSince = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Get provider display name
  const getProviderDisplayName = (provider) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'email':
        return 'Email';
      default:
        return 'Email';
    }
  };

  // Get provider icon
  const getProviderIcon = (provider) => {
    switch (provider) {
      case 'google':
        return 'logo-google';
      case 'email':
        return 'mail';
      default:
        return 'mail';
    }
  };

  // Get user's full name
  const getUserFullName = () => {
    if (!user) return 'User';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return 'User';
    }
  };

  // Render profile header
  const renderProfileHeader = () => {
    return (
      <Card style={styles.profileHeaderCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color={COLORS.text.tertiary} />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{getUserFullName()}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userProvider}>
              Signed in with {getProviderDisplayName(user?.provider)}
            </Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>
                Member since {formatMemberSince(user?.memberSince)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  // Render profile stats
  const renderProfileStats = () => {
    return (
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Profile Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Goals Met</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Calories Burned</Text>
          </View>
        </View>
      </Card>
    );
  };

  // Render action items
  const renderActionItems = () => {
    const actionItems = [
      {
        id: 'edit',
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
        icon: 'create-outline',
        onPress: () => setShowEditModal(true),
      },
      {
        id: 'security',
        title: 'Security & Privacy',
        subtitle: 'Manage your account security',
        icon: 'shield-checkmark-outline',
        onPress: () => setShowSecurityModal(true),
      },
      {
        id: 'accounts',
        title: 'Connected Accounts',
        subtitle: `${getProviderDisplayName(user?.provider)} ✓`,
        icon: getProviderIcon(user?.provider),
        onPress: () => Alert.alert('Connected Accounts', 'Manage your connected accounts.'),
      },
      {
        id: 'subscription',
        title: 'Manage Subscription',
        subtitle: user?.isPremium ? 'Premium Plan' : 'Free Plan',
        icon: user?.isPremium ? 'star' : 'star-outline',
        onPress: () => Alert.alert('Subscription', 'Manage your subscription plan.'),
      },
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Manage your notification preferences',
        icon: 'notifications-outline',
        onPress: () => Alert.alert('Notifications', 'Manage your notification settings.'),
      },
      {
        id: 'data',
        title: 'Data & Storage',
        subtitle: 'Manage your app data',
        icon: 'cloud-outline',
        onPress: () => Alert.alert('Data & Storage', 'Manage your app data and storage.'),
      },
    ];

    return (
      <Card style={styles.actionsCard}>
        {actionItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.actionItem,
              index === actionItems.length - 1 && styles.lastActionItem
            ]}
            onPress={item.onPress}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={item.icon} size={24} color={COLORS.accent.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        ))}
      </Card>
    );
  };

  // Render subscription info
  const renderSubscriptionInfo = () => {
    return (
      <Card style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <Ionicons 
            name={user?.isPremium ? "star" : "star-outline"} 
            size={24} 
            color={user?.isPremium ? COLORS.accent.quaternary : COLORS.text.tertiary} 
          />
          <Text style={styles.subscriptionTitle}>
            {user?.isPremium ? 'Premium Plan' : 'Free Plan'}
          </Text>
        </View>
        
        <Text style={styles.subscriptionDescription}>
          {user?.isPremium 
            ? 'You have access to all premium features including AI personal trainer, custom meal plans, and advanced analytics.'
            : 'Upgrade to Premium for AI personal trainer, custom meal plans, advanced analytics, and more.'
          }
        </Text>
        
        {!user?.isPremium && (
          <Button
            type="primary"
            label="UPGRADE TO PREMIUM"
            onPress={() => Alert.alert('Upgrade', 'This would open the subscription upgrade flow.')}
            style={styles.upgradeButton}
          />
        )}
      </Card>
    );
  };

  // Render logout section
  const renderLogoutSection = () => {
    return (
      <Card style={styles.logoutCard}>
                 <Button
           type="outline"
           label={isLoading || isAuthenticating ? "Signing out..." : "Sign Out"}
           onPress={handleLogoutPress}
           disabled={isLoading || isAuthenticating}
           style={styles.logoutButton}
           textColor={COLORS.accent.error}
         />
      </Card>
    );
  };

  // Render edit profile modal
  const renderEditModal = () => {
    return (
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.firstName}
                  onChangeText={(text) => setEditForm({...editForm, firstName: text})}
                  placeholder="Enter your first name"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.lastName}
                  onChangeText={(text) => setEditForm({...editForm, lastName: text})}
                  placeholder="Enter your last name"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={editForm.email}
                  editable={false}
                  placeholder="Email cannot be changed"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm({...editForm, phone: text})}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.text.tertiary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Fitness Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.dateOfBirth}
                  onChangeText={(text) => setEditForm({...editForm, dateOfBirth: text})}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Height</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.height}
                    onChangeText={(text) => setEditForm({...editForm, height: text})}
                    placeholder="5 feet 10 inches"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                </View>
                
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Weight</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.weight}
                    onChangeText={(text) => setEditForm({...editForm, weight: text})}
                    placeholder="150 lbs"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fitness Goal</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.fitnessGoal}
                  onChangeText={(text) => setEditForm({...editForm, fitnessGoal: text})}
                  placeholder="e.g., Build muscle, Lose weight, Stay fit"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience Level</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.experienceLevel}
                  onChangeText={(text) => setEditForm({...editForm, experienceLevel: text})}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                  placeholderTextColor={COLORS.text.tertiary}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Render security modal
  const renderSecurityModal = () => {
    return (
      <Modal
        visible={showSecurityModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSecurityModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Security & Privacy</Text>
            <View style={{ width: 50 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Card style={styles.securityCard}>
              <TouchableOpacity style={styles.securityItem}>
                <Ionicons name="lock-closed-outline" size={24} color={COLORS.accent.primary} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Change Password</Text>
                  <Text style={styles.securitySubtitle}>Update your account password</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.securityItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.accent.primary} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.securitySubtitle}>Add an extra layer of security</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.securityItem}>
                <Ionicons name="eye-outline" size={24} color={COLORS.accent.primary} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Privacy Settings</Text>
                  <Text style={styles.securitySubtitle}>Control your data visibility</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.securityItem}>
                <Ionicons name="download-outline" size={24} color={COLORS.accent.primary} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Export Data</Text>
                  <Text style={styles.securitySubtitle}>Download your personal data</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.securityItem, styles.dangerItem]}>
                <Ionicons name="trash-outline" size={24} color={COLORS.accent.error} />
                <View style={styles.securityContent}>
                  <Text style={[styles.securityTitle, styles.dangerText]}>Delete Account</Text>
                  <Text style={styles.securitySubtitle}>Permanently delete your account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.accent.error} />
              </TouchableOpacity>
            </Card>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={[COLORS.background.secondary, COLORS.background.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Profile</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderProfileHeader()}
          {renderProfileStats()}
          {renderActionItems()}
          {renderSubscriptionInfo()}
          {renderLogoutSection()}
          
          {/* Bottom padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Modals */}
      {renderEditModal()}
      {renderSecurityModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: SIZES.spacing.lg,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SIZES.spacing.lg,
  },
  profileHeaderCard: {
    marginBottom: SIZES.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
  },
  avatarContainer: {
    marginRight: SIZES.spacing.lg,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius.round,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  userEmail: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.xs,
  },
  userProvider: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.sm,
    marginBottom: SIZES.spacing.sm,
  },
  memberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
  },
  memberBadgeText: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
  },
  statsCard: {
    marginBottom: SIZES.spacing.md,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  statLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  actionsCard: {
    marginBottom: SIZES.spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  lastActionItem: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.xs,
  },
  actionSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  subscriptionCard: {
    marginBottom: SIZES.spacing.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  subscriptionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginLeft: SIZES.spacing.sm,
  },
  subscriptionDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    lineHeight: 24,
    marginBottom: SIZES.spacing.md,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
  },
  logoutCard: {
    marginTop: SIZES.spacing.md,
  },
  logoutButton: {
    borderColor: COLORS.accent.error,
  },
  bottomPadding: {
    height: 80,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: 60,
    paddingBottom: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  modalCancel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
  },
  modalTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  modalSave: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  formSection: {
    marginBottom: SIZES.spacing.xl,
  },
  formSectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  inputGroup: {
    marginBottom: SIZES.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  inputLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.sm,
  },
  textInput: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.md,
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    borderWidth: 1,
    borderColor: COLORS.utility.divider,
  },
  disabledInput: {
    backgroundColor: COLORS.background.primary,
    color: COLORS.text.tertiary,
  },
  // Security modal styles
  securityCard: {
    marginBottom: SIZES.spacing.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  securityContent: {
    flex: 1,
    marginLeft: SIZES.spacing.md,
  },
  securityTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.xs,
  },
  securitySubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  dangerItem: {
    borderBottomColor: COLORS.accent.error,
  },
  dangerText: {
    color: COLORS.accent.error,
  },
});

export default ProfileScreen;
