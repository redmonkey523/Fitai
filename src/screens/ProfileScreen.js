import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, TextInput, Modal, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Card from '../components/Card';
import Button from '../components/Button';
import api from '../services/api';
import { API_BASE_URL } from '../config/api';
import crashReporting from '../services/crashReporting';

// Import auth context
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
// ImagePicker loaded dynamically for web compat
import { FEATURE_FEED } from '../config/flags';
// Import React Query hooks for profile and goals
import { useProfile, useGoals, useUpdateProfile } from '../hooks/useUserData';

const ProfileScreen = ({ route }) => {
  const navigation = useNavigation();
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
    // Fitness Goals
    dailyCalorieGoal: '',
    weeklyWorkoutGoal: '',
    targetWeight: '',
    hydrationGoal: '',
    stepsGoal: '',
    proteinGoal: '',
    carbsGoal: '',
    fatGoal: '',
    fiberGoal: '',
  });

  // Get user and auth methods from context
  const { user, token, handleLogout, updateProfile, refreshUser, isAuthenticating } = useAuth();
  
  // Fetch profile and goals from API
  const { data: apiProfile, isLoading: profileLoading } = useProfile();
  const { data: apiGoals, isLoading: goalsLoading } = useGoals();
  const { mutate: updateProfileMutation } = useUpdateProfile();

  // Initialize edit form when API data is available
  useEffect(() => {
    // Prioritize API data over user context for accurate goal data
    const profile = apiProfile || user;
    const goals = apiGoals?.targets || user?.goals;
    
    if (profile) {
      crashReporting.log('Profile screen updating form with API data', 'debug', {
        profile: apiProfile,
        goals: apiGoals,
        fallback: user
      });
      
      setEditForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        height: profile.height?.value?.toString() || profile.height?.toString() || '',
        weight: profile.weight?.value?.toString() || profile.weight?.toString() || '',
        fitnessGoal: profile.fitnessLevel || '',
        experienceLevel: profile.experienceLevel || '',
        // Fitness Goals from API (auto-populated from quiz)
        dailyCalorieGoal: goals?.dailyCalories?.toString() || '2000',
        weeklyWorkoutGoal: goals?.weeklyWorkouts?.toString() || '3',
        targetWeight: goals?.targetWeight?.toString() || '',
        hydrationGoal: goals?.hydrationCups?.toString() || '8',
        stepsGoal: goals?.dailySteps?.toString() || '10000',
        proteinGoal: goals?.proteinTarget?.toString() || '',
        carbsGoal: goals?.carbsTarget?.toString() || '',
        fatGoal: goals?.fatTarget?.toString() || '',
        fiberGoal: goals?.fiberTarget?.toString() || '',
      });
    }
  }, [user, apiProfile, apiGoals]);

  // Auto-open edit modal if route param is set
  useEffect(() => {
    if (route?.params?.openEditModal) {
      setShowEditModal(true);
      // Clear the param so it doesn't re-open on subsequent navigations
      navigation.setParams({ openEditModal: false });
    }
  }, [route?.params?.openEditModal]);

  // Refresh user data every time the Profile screen comes into focus
  useFocusEffect(
    useCallback(() => {
      crashReporting.log('Profile screen focused, refreshing user data', 'debug');
      const refreshUserData = async () => {
        if (token && refreshUser) {
          await refreshUser();
          crashReporting.log('User data refreshed in Profile screen', 'debug');
        }
      };
      
      refreshUserData();
    }, [token, refreshUser])
  );

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
    setIsLoading(true);
    try {
      const profileData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        dateOfBirth: editForm.dateOfBirth,
        height: { value: parseFloat(editForm.height) || 0, unit: 'cm' },
        weight: { value: parseFloat(editForm.weight) || 0, unit: 'kg' },
        fitnessLevel: editForm.fitnessGoal,
        experienceLevel: editForm.experienceLevel,
        goals: {
          dailyCalories: parseFloat(editForm.dailyCalorieGoal) || 2000,
          weeklyWorkouts: parseFloat(editForm.weeklyWorkoutGoal) || 3,
          targetWeight: parseFloat(editForm.targetWeight) || null,
          hydrationCups: parseFloat(editForm.hydrationGoal) || 8,
          dailySteps: parseFloat(editForm.stepsGoal) || 10000,
        },
      };

      await updateProfile(profileData);
      setIsEditing(false);
      setShowEditModal(false);
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  // Format member since date
  const formatMemberSince = (date) => {
    if (!date) return 'N/A';
    
    const joinDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays < 7) {
      return `${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
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
        return 'Unknown';
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
        return 'person';
    }
  };

  // Get user full name
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
      return user.email?.split('@')[0] || 'User';
    }
  };

  // Render profile header
  const renderProfileHeader = () => {
    return (
          <View style={styles.headerContainer}>
        <LinearGradient
          colors={COLORS.gradient.primary}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('ProfilePhoto')}
            activeOpacity={0.7}
          >
            {user?.avatar || user?.profilePicture ? (
              <Image source={{ uri: user.avatar || user.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={COLORS.text.primary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={16} color={COLORS.background.primary} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{getUserFullName()}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          
          <View style={styles.memberInfo}>
            <Ionicons name="time" size={16} color={COLORS.text.primary} />
            <Text style={styles.memberText}>
              Member for {formatMemberSince(user?.createdAt)}
            </Text>
          </View>
          
          <View style={styles.providerInfo}>
            <Ionicons name={getProviderIcon(user?.provider)} size={16} color={COLORS.text.primary} />
            <Text style={styles.providerText}>
              Signed up with {getProviderDisplayName(user?.provider)}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Render profile stats
  const renderProfileStats = () => {
    return (
      <View style={styles.statsContainer}>
        <Card style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.fitnessLevel || 'Beginner'}</Text>
            <Text style={styles.statLabel}>Fitness Level</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user?.height?.value ? `${user.height.value}cm` : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Height</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user?.weight?.value ? `${user.weight.value}kg` : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Weight</Text>
          </View>
        </Card>
      </View>
    );
  };

  // Render action items
  const renderActionItems = () => {
    const actionItems = [
      {
        icon: 'person-outline',
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
        onPress: () => setShowEditModal(true),
      },
      {
        icon: 'image-outline',
        title: 'Profile Photo',
        subtitle: 'Set, crop, and update your avatar',
        onPress: () => navigation.navigate('ProfilePhoto'),
      },
      {
        icon: 'shield-outline',
        title: 'Security',
        subtitle: 'Password and privacy settings',
        onPress: () => setShowSecurityModal(true),
      },
      {
        icon: 'fitness-outline',
        title: 'Data Sources',
        subtitle: 'Manage Apple Health and connected apps',
        onPress: () => navigation.navigate('DataSources'),
      },
      {
        icon: 'heart-circle-outline',
        title: 'Health Connection',
        subtitle: 'Connect and sync with Apple Health or Google Fit',
        onPress: () => navigation.navigate('HealthSettings'),
      },
      {
        icon: 'notifications-outline',
        title: 'Notifications',
        subtitle: 'Manage your notification preferences',
        onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon!'),
      },
      {
        icon: 'help-circle-outline',
        title: 'Help & Support',
        subtitle: 'Get help and contact support',
        onPress: () => Alert.alert('Coming Soon', 'Help and support will be available soon!'),
      },
      {
        icon: 'information-circle-outline',
        title: 'About',
        subtitle: 'App version and information',
        onPress: () => Alert.alert('FitAI', 'Version 1.0.0\nYour AI-powered fitness companion'),
      },
    ];

    return (
      <View style={styles.actionsContainer}>
        {actionItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={item.icon} size={24} color={COLORS.accent.primary} />
            </View>
            
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render subscription info
  const renderSubscriptionInfo = () => {
    return (
      <View style={styles.subscriptionContainer}>
        <Card style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Ionicons name="diamond" size={24} color={COLORS.accent.primary} />
            <Text style={styles.subscriptionTitle}>Free Plan</Text>
          </View>
          
          <Text style={styles.subscriptionDescription}>
            You're currently on the free plan. Upgrade to unlock premium features!
          </Text>
          
          <Button
            title="Upgrade to Premium"
            onPress={() => Alert.alert('Coming Soon', 'Premium features will be available soon!')}
            style={styles.upgradeButton}
          />
        </Card>
      </View>
    );
  };

  // --- Upload Section (Post / Story) ---
  const [postPreview, setPostPreview] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);
  const [composer, setComposer] = useState({ caption: '', tags: '' });
  const [posting, setPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState({ post: false, story: false });
  const [options, setOptions] = useState({ allowComments: true, shareToDiscover: true, ratio: 'auto' });

  const handleFileFromEvent = (e, kind) => {
    try {
      const file = e?.target?.files?.[0] || e?.nativeEvent?.dataTransfer?.files?.[0];
      if (!file) return;
      if (!(file.type || '').startsWith('image/')) {
        Alert.alert('Images only', 'Please choose a photo. Video editing is in the Creator page.');
        return;
      }
      const url = URL.createObjectURL(file);
      if (kind === 'post') setPostPreview({ url, file, type: file.type });
      else setStoryPreview({ url, file, type: file.type });
    } catch {}
  };

  const pickMediaNative = async (kind) => {
    try {
      // Dynamic import for native platforms
      const ImagePicker = await import('expo-image-picker');
      
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow media library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      const file = {
        uri: asset.uri,
        name: asset.fileName || `media.${(asset.type === 'video') ? 'mp4' : 'jpg'}`,
        type: 'image/jpeg',
      };
      const preview = { url: asset.uri, file, type: file.type, width: asset.width, height: asset.height };
      if (kind === 'post') setPostPreview(preview); else setStoryPreview(preview);
    } catch (e) {
      Alert.alert('Picker error', e?.message || 'Failed to open media picker');
    }
  };

  const renderDropZone = (kind, preview) => {
    const label = kind === 'post' ? 'Post' : 'Story';
    const description = kind === 'post' ? 'Share your workout (photo)' : 'Post a quick update (photo)';
    const icon = 'camera';
    const onUploadPress = () => {
      if (Platform.OS === 'web') {
        const input = document.getElementById(`upload-input-${kind}`);
        if (input) input.click();
      } else {
        pickMediaNative(kind);
      }
    };

    return (
      <View style={[styles.uploadCard, dragging[kind] && { borderColor: COLORS.accent.primary }]}>
        <View style={styles.uploadHeader}>
          <View style={styles.uploadIconWrap}><Ionicons name={icon} size={22} color={COLORS.accent.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadTitle}>{label}</Text>
            <Text style={styles.uploadSubtitle}>{description}</Text>
          </View>
        </View>

        <View
          style={[styles.dropZone, preview ? styles.dropZoneHasMedia : null, dragging[kind] && styles.dropZoneDragging]}
          onDragOver={Platform.OS === 'web' ? (ev) => ev.preventDefault() : undefined}
          onDragEnter={Platform.OS === 'web' ? (ev) => { ev.preventDefault(); setDragging((d)=>({ ...d, [kind]: true })); } : undefined}
          onDragLeave={Platform.OS === 'web' ? () => setDragging((d)=>({ ...d, [kind]: false })) : undefined}
          onDrop={Platform.OS === 'web' ? (ev) => { ev.preventDefault(); setDragging((d)=>({ ...d, [kind]: false })); handleFileFromEvent(ev, kind); } : undefined}
        >
          {preview ? (
            <Image source={{ uri: preview.url }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.dropZoneInner}> 
              <Ionicons name={icon} size={36} color={COLORS.text.tertiary} />
              <Text style={styles.dropZoneText}>Drag & drop here</Text>
              <Text style={styles.dropZoneHint}>or use Upload</Text>
            </View>
          )}
          {Platform.OS === 'web' && (
            <input id={`upload-input-${kind}`} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileFromEvent(e, kind)} />
          )}
        </View>

        <View style={{ alignItems: 'flex-start' }}>
          <TouchableOpacity onPress={onUploadPress} activeOpacity={0.9} style={styles.uploadBtn}> 
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderUploadSection = () => {
    // Gate social posting functionality when FEATURE_FEED is disabled
    if (!FEATURE_FEED) {
      return null;
    }
    
    return (
    <View style={styles.uploadSection}>
      <Text style={styles.sectionHeading}>Create & Share</Text>
      <View style={styles.uploadRow}>
        {renderDropZone('post', postPreview)}
        {renderDropZone('story', storyPreview)}
      </View>

      {(postPreview || storyPreview) && (
        <View style={styles.composerCard}>
          <Text style={styles.composerHeading}>Post Details</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: SIZES.spacing.sm }}>
            {['auto','1:1','4:5','16:9','9:16'].map(r => (
              <TouchableOpacity key={r} onPress={() => setOptions((o)=>({ ...o, ratio: r }))} style={[styles.chip, options.ratio===r && styles.chipActive]}>
                <Text style={[styles.chipText, options.ratio===r && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.formInput}
            placeholder="Write a caption…"
            placeholderTextColor={COLORS.text.secondary}
            value={composer.caption}
            onChangeText={(t) => setComposer((c) => ({ ...c, caption: t }))}
            multiline
          />
          <TextInput
            style={[styles.formInput, { marginTop: SIZES.spacing.sm }]}
            placeholder="Tags (comma separated)"
            placeholderTextColor={COLORS.text.secondary}
            value={composer.tags}
            onChangeText={(t) => setComposer((c) => ({ ...c, tags: t }))}
          />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: SIZES.spacing.sm }}>
            <TouchableOpacity onPress={() => setOptions((o)=>({ ...o, allowComments: !o.allowComments }))} style={[styles.toggle, options.allowComments && styles.toggleOn]}>
              <Ionicons name={options.allowComments ? 'chatbubbles' : 'chatbubbles-outline'} size={16} color={options.allowComments ? '#0ea5ff' : COLORS.text.secondary} />
              <Text style={[styles.toggleText, options.allowComments && styles.toggleTextOn]}>Allow comments</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOptions((o)=>({ ...o, shareToDiscover: !o.shareToDiscover }))} style={[styles.toggle, options.shareToDiscover && styles.toggleOn]}>
              <Ionicons name={options.shareToDiscover ? 'pulse' : 'pulse-outline'} size={16} color={options.shareToDiscover ? '#0ea5ff' : COLORS.text.secondary} />
              <Text style={[styles.toggleText, options.shareToDiscover && styles.toggleTextOn]}>Share to Discover</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>
          {posting && (
            <View style={styles.progressBarOuter}>
              <View style={[styles.progressBarInner, { width: `${uploadProgress}%` }]} />
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: SIZES.spacing.md }}>
            <Button
              type="outline"
              label="Discard"
              onPress={() => { setPostPreview(null); setStoryPreview(null); setComposer({ caption: '', tags: '' }); }}
            />
            <Button
              label={posting ? 'Posting…' : 'Post'}
              disabled={posting}
              onPress={async () => {
                try {
                  const selected = postPreview || storyPreview;
                  if (!selected) {
                    Alert.alert('Select a photo', 'Please add a photo before posting.');
                    return;
                  }
                  setPosting(true);
                  // If preview points to a blob URL (web), upload via /upload/single
                  let media = [];
                  if (Platform.OS === 'web' && selected?.file) {
                    // use XHR to show progress
                    const token = await api.getAuthToken();
                    const xhr = new XMLHttpRequest();
                    const endpoint = `${API_BASE_URL}/upload/single`;
                    const form = new FormData();
                    form.append('file', selected.file, selected.file.name);
                    const uploadPromise = new Promise((resolve, reject) => {
                      xhr.open('POST', endpoint);
                      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
                      xhr.onreadystatechange = () => {
                        if (xhr.readyState === 4) {
                          try {
                            const json = JSON.parse(xhr.responseText || '{}');
                            if (xhr.status >= 200 && xhr.status < 300) resolve(json); else reject(new Error(json?.message || `HTTP ${xhr.status}`));
                          } catch (err) { reject(err); }
                        }
                      };
                      xhr.onerror = () => reject(new Error('Network error'));
                      xhr.send(form);
                    });
                    const upload = await uploadPromise;
                    media = [{ url: upload?.file?.url, type: 'image', thumbnail: upload?.file?.thumbnail, width: upload?.file?.width, height: upload?.file?.height }];
                  } else if (selected?.file) {
                    // Native: upload the asset file first to get a server URL
                    try {
                      const upload = await api.uploadFile(selected.file, 'file');
                      media = [{ url: upload?.file?.url, type: 'image', thumbnail: upload?.file?.thumbnail, width: upload?.file?.width, height: upload?.file?.height }];
                    } catch (err) {
                      throw new Error(err?.message || 'Upload failed');
                    }
                  } else if (selected?.url) {
                    // Fallback (should not generally happen): try to post local URI
                    media = [{ url: selected.url, type: 'image', width: selected.width, height: selected.height }];
                  }
                  // Guard: ensure we have either caption or uploaded media before posting
                  const caption = (composer.caption || '').trim();
                  if ((!caption || caption.length === 0) && (!Array.isArray(media) || media.length === 0)) {
                    throw new Error('No content to post. Please add a caption or upload a photo.');
                  }

                  // Some backends may require non-empty content even for media-only posts
                  // Provide a friendly fallback when caption is empty but media exists
                  const safeContent = caption.length > 0 ? caption : 'Shared a photo';

                  const payload = {
                    type: postPreview ? 'post' : 'story',
                    content: safeContent,
                    tags: composer.tags?.split(',').map(s => s.trim()).filter(Boolean),
                    visibility: 'public',
                    media,
                    options,
                  };
                  try { crashReporting.log('Post payload preview', 'debug', { type: payload.type, content: payload.content, mediaCount: Array.isArray(media) ? media.length : 0 }); } catch {}
                  const created = await api.createSocialActivity(payload);
                  Alert.alert('Posted', 'Your content has been shared.');
                  setPostPreview(null); setStoryPreview(null); setComposer({ caption: '', tags: '' });
                  setUploadProgress(0);
                  // Navigate to Discover > Follow to show the fresh post
                  try {
                    const refreshAt = Date.now();
                    navigation.navigate('Discover', { tab: 'follow', refreshAt });
                  } catch {}
                } catch (e) {
                  Alert.alert('Post failed', e?.message || 'Please try again.');
                } finally {
                  setPosting(false);
                }
              }}
            />
          </View>
        </View>
      )}
    </View>
    );
  };

  // Render logout section
  const renderLogoutSection = () => {
    return (
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          disabled={isLoading || isAuthenticating}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.accent.error} />
          <Text style={styles.logoutText}>
            {isLoading || isAuthenticating ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render edit modal
  const renderEditModal = () => {
    return (
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={() => setShowEditModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>First Name</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.firstName}
                onChangeText={(text) => setEditForm({...editForm, firstName: text})}
                placeholder="Enter first name"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.lastName}
                onChangeText={(text) => setEditForm({...editForm, lastName: text})}
                placeholder="Enter last name"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={editForm.email}
                editable={false}
                placeholder="Email cannot be changed"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({...editForm, phone: text})}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.text.secondary}
                keyboardType="phone-pad"
              />
            </View>
            
            {/* Removed Date of Birth field - was buggy and not saving properly */}
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.height}
                  onChangeText={(text) => setEditForm({...editForm, height: text})}
                  placeholder="170"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.weight}
                  onChangeText={(text) => setEditForm({...editForm, weight: text})}
                  placeholder="70"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fitness Level</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.fitnessGoal}
                onChangeText={(text) => setEditForm({...editForm, fitnessGoal: text})}
                placeholder="Beginner, Intermediate, Advanced"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Experience Level</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.experienceLevel}
                onChangeText={(text) => setEditForm({...editForm, experienceLevel: text})}
                placeholder="Years of experience"
                placeholderTextColor={COLORS.text.secondary}
              />
            </View>
            
            {/* Fitness Goals Section */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>Fitness Goals</Text>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Daily Calorie Goal</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.dailyCalorieGoal}
                onChangeText={(text) => setEditForm({...editForm, dailyCalorieGoal: text})}
                placeholder="2000"
                placeholderTextColor={COLORS.text.secondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Weekly Workout Goal</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.weeklyWorkoutGoal}
                onChangeText={(text) => setEditForm({...editForm, weeklyWorkoutGoal: text})}
                placeholder="3 workouts per week"
                placeholderTextColor={COLORS.text.secondary}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Hydration (cups/day)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.hydrationGoal}
                  onChangeText={(text) => setEditForm({...editForm, hydrationGoal: text})}
                  placeholder="8"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Steps Goal</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.stepsGoal}
                  onChangeText={(text) => setEditForm({...editForm, stepsGoal: text})}
                  placeholder="10000"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Weight (kg)</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.targetWeight}
                onChangeText={(text) => setEditForm({...editForm, targetWeight: text})}
                placeholder="Optional - Your goal weight"
                placeholderTextColor={COLORS.text.secondary}
                keyboardType="numeric"
              />
            </View>

            {/* Macro Targets Section */}
            <View style={styles.sectionDivider}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Macro Targets</Text>
                {apiGoals && (
                  <View style={styles.autoSetBadge}>
                    <Ionicons name="sparkles" size={12} color={COLORS.accent.primary} />
                    <Text style={styles.autoSetText}>Auto-set</Text>
                  </View>
                )}
              </View>
              {apiGoals && apiGoals.createdAt && (
                <Text style={styles.autoSetDate}>
                  From Goal Quiz • {new Date(apiGoals.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.proteinGoal}
                  onChangeText={(text) => setEditForm({...editForm, proteinGoal: text})}
                  placeholder="150"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.carbsGoal}
                  onChangeText={(text) => setEditForm({...editForm, carbsGoal: text})}
                  placeholder="200"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.fatGoal}
                  onChangeText={(text) => setEditForm({...editForm, fatGoal: text})}
                  placeholder="60"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.formLabel}>Fiber (g)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.fiberGoal}
                  onChangeText={(text) => setEditForm({...editForm, fiberGoal: text})}
                  placeholder="25"
                  placeholderTextColor={COLORS.text.secondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              type="outline"
              label="Cancel"
              onPress={() => setShowEditModal(false)}
              style={styles.cancelButton}
              textColor={COLORS.accent.error}
            />
            <Button
              label={isLoading ? "Saving..." : "Save Changes"}
              onPress={handleSaveProfile}
              disabled={isLoading}
              style={styles.saveButton}
            />
          </View>
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
            <Text style={styles.modalTitle}>Security Settings</Text>
            <TouchableOpacity
              onPress={() => setShowSecurityModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.securityDescription}>
              Security settings will be available in a future update.
            </Text>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <Button
              label="Close"
              onPress={() => setShowSecurityModal(false)}
              style={styles.saveButton}
            />
          </View>
        </View>
      </Modal>
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderProfileHeader()}
      {renderProfileStats()}
      {renderActionItems()}
      {renderUploadSection()}
      {renderSubscriptionInfo()}
      {renderLogoutSection()}
      {renderEditModal()}
      {renderSecurityModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  headerContainer: {
    marginBottom: SIZES.spacing.md,
  },
  headerGradient: {
    padding: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  avatarContainer: {
    marginBottom: SIZES.spacing.md,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius.round,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: SIZES.radius.round,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.xs,
  },
  userEmail: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    marginBottom: SIZES.spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.sm,
  },
  memberText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    marginLeft: SIZES.spacing.xs,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.sm,
  },
  providerText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
    marginLeft: SIZES.spacing.xs,
  },
  statsContainer: {
    marginBottom: SIZES.spacing.md,
  },
  statsCard: {
    marginBottom: SIZES.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  statValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  statLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    marginTop: SIZES.spacing.xs,
  },
  statDivider: {
    height: 1,
    backgroundColor: COLORS.utility.divider,
    opacity: 0.2,
    marginVertical: SIZES.spacing.md,
  },
  actionsContainer: {
    marginBottom: SIZES.spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
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
  subscriptionContainer: {
    marginBottom: SIZES.spacing.md,
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
  // Upload section styles
  uploadSection: {
    marginBottom: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.lg,
  },
  sectionHeading: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  uploadCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border?.primary || COLORS.utility.divider,
    ...SHADOWS.medium,
  },
  uploadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  uploadIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0ea5ff22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.sm,
  },
  uploadTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
  },
  uploadSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  dropZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.utility.divider,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.background.primary,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: SIZES.spacing.md,
  },
  dropZoneHasMedia: {
    borderStyle: 'solid',
  },
  dropZoneDragging: {
    borderColor: COLORS.accent.primary,
    backgroundColor: '#0ea5ff11',
  },
  dropZoneInner: {
    alignItems: 'center',
    gap: 6,
  },
  dropZoneText: {
    color: COLORS.text.secondary,
    marginTop: 6,
  },
  dropZoneHint: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    // resizeMode moved to Image prop for RN Web compatibility
  },
  composerCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.md,
    marginTop: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.utility.divider,
  },
  composerHeading: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.utility.divider,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background.primary,
  },
  chipActive: {
    borderColor: COLORS.accent.primary,
    backgroundColor: '#0ea5ff22',
  },
  chipText: { color: COLORS.text.secondary, fontSize: FONTS.size.xs },
  chipTextActive: { color: COLORS.accent.primary, fontWeight: FONTS.weight.bold },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.utility.divider,
  },
  toggleOn: {
    borderColor: COLORS.accent.primary,
    backgroundColor: '#0ea5ff22',
  },
  toggleText: { color: COLORS.text.secondary, fontSize: FONTS.size.xs },
  toggleTextOn: { color: COLORS.accent.primary, fontWeight: FONTS.weight.bold },
  progressBarOuter: {
    height: 6,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: SIZES.spacing.sm,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.accent.primary,
  },
  uploadBtn: {
    backgroundColor: COLORS.accent.primary,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  uploadBtnText: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weight.bold,
  },
  logoutContainer: {
    marginTop: SIZES.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.accent.error,
  },
  logoutText: {
    color: COLORS.accent.error,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginLeft: SIZES.spacing.sm,
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
  modalTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  closeButton: {
    padding: SIZES.spacing.sm,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  formGroup: {
    marginBottom: SIZES.spacing.md,
  },
  formLabel: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    marginBottom: SIZES.spacing.sm,
  },
  formInput: {
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
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.md,
  },
  formGroupHalf: {
    width: '48%',
  },
  sectionDivider: {
    marginTop: SIZES.spacing.xl,
    marginBottom: SIZES.spacing.md,
    paddingTop: SIZES.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  autoSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radius.full,
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
    gap: 4,
  },
  autoSetText: {
    color: COLORS.accent.primary,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.medium,
  },
  autoSetDate: {
    color: COLORS.text.tertiary,
    fontSize: FONTS.size.xs,
    marginTop: SIZES.spacing.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.utility.divider,
  },
  cancelButton: {
    backgroundColor: COLORS.background.secondary,
    borderColor: COLORS.accent.error,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: COLORS.accent.error,
  },
  saveButton: {
    backgroundColor: COLORS.accent.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  securityDescription: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    marginTop: SIZES.spacing.md,
  },
});

export default ProfileScreen;
