import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook for managing push notifications
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [error, setError] = useState(null);

  // Register push token mutation
  const registerTokenMutation = useMutation({
    mutationFn: async (token) => {
      return await api.registerPushToken(token);
    },
  });

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          // Register token with backend
          registerTokenMutation.mutate(token);
        }
      })
      .catch(err => {
        console.error('Push notification error:', err);
        setError(err.message);
      });
  }, []);

  return {
    expoPushToken,
    error,
    isRegistered: !!expoPushToken && !error,
  };
}

/**
 * Register for push notifications
 */
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Permission to send notifications was denied');
  }

  // Get the token
  try {
    // Ensure projectId is configured in app.json/app.config.js
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } catch (error) {
    throw new Error('Failed to get push token. Ensure expo.projectId is set in app.json');
  }

  return token;
}

/**
 * Hook for fetching user notifications
 */
export function useNotifications(options = {}) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.getNotifications();
      return response?.data || [];
    },
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

