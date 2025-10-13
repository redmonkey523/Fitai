import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { subscribeToPushNotifications, testPushNotification } from '../store/slices/notificationSlice';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const PushNotificationTest = () => {
  const dispatch = useDispatch();
  const [pushToken, setPushToken] = useState(null);
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const { subscribingToPush = false, testingPush = false, error = null } = useSelector(state => state.notification || {});

  useEffect(() => {
    // Try to get push token on mount
    getPushToken();
  }, []);

  const getPushToken = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, generate a mock token for testing
        const mockToken = `web_token_${Date.now()}`;
        setPushToken(mockToken);
        return;
      }

      // For mobile, use Expo Notifications
      const { getPermissionsAsync, requestPermissionsAsync, getExpoPushTokenAsync } = await import('expo-notifications');
      
      const { status: existingStatus } = await getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Push notifications permission is required for this feature.');
        return;
      }

      const tokenData = await getExpoPushTokenAsync();
      setPushToken(tokenData.data);
    } catch (error) {
      console.warn('Failed to get push token:', error);
      Alert.alert('Error', 'Failed to get push notification token');
    }
  };

  const handleRegisterToken = async () => {
    if (!pushToken) {
      Alert.alert('Error', 'No push token available');
      return;
    }

    try {
      await dispatch(subscribeToPushNotifications({ 
        pushToken, 
        platform: Platform.OS === 'web' ? 'web' : 'expo',
        deviceId: Platform.OS === 'web' ? navigator.userAgent : undefined
      })).unwrap();
      
      setTokenRegistered(true);
      Alert.alert('Success', 'Push token registered successfully!');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to register push token');
    }
  };

  const handleTestNotification = async () => {
    if (!tokenRegistered) {
      Alert.alert('Error', 'Please register push token first');
      return;
    }

    try {
      await dispatch(testPushNotification()).unwrap();
      Alert.alert('Success', 'Test notification sent! Check your device.');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to send test notification');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={24} color={COLORS.accent.primary} />
        <Text style={styles.title}>Push Notification Test</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Token</Text>
        <Text style={styles.tokenText} numberOfLines={2}>
          {pushToken || 'No token available'}
        </Text>
        {!pushToken && (
          <TouchableOpacity style={styles.button} onPress={getPushToken}>
            <Text style={styles.buttonText}>Get Push Token</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.button, (!pushToken || subscribingToPush) && styles.buttonDisabled]} 
          onPress={handleRegisterToken}
          disabled={!pushToken || subscribingToPush}
        >
          <Text style={styles.buttonText}>
            {subscribingToPush ? 'Registering...' : 'Register Token'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.testButton, (!tokenRegistered || testingPush) && styles.buttonDisabled]} 
          onPress={handleTestNotification}
          disabled={!tokenRegistered || testingPush}
        >
          <Text style={styles.buttonText}>
            {testingPush ? 'Sending...' : 'Send Test Notification'}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          1. Get push token{'\n'}
          2. Register token with backend{'\n'}
          3. Send test notification{'\n'}
          4. Check your device for the notification
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    margin: SIZES.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  title: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginLeft: SIZES.spacing.sm,
  },
  section: {
    marginBottom: SIZES.spacing.md,
  },
  sectionTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  tokenText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
    marginBottom: SIZES.spacing.sm,
  },
  button: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.md,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  testButton: {
    backgroundColor: COLORS.accent.success,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  errorContainer: {
    backgroundColor: COLORS.accent.error + '20',
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent.error,
    marginBottom: SIZES.spacing.md,
  },
  errorText: {
    color: COLORS.accent.error,
    fontSize: FONTS.size.sm,
  },
  infoContainer: {
    backgroundColor: COLORS.background.secondary,
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
  },
  infoText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
  },
});

export default PushNotificationTest;
