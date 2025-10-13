/**
 * Health Settings Screen
 * Manage Apple Health / Google Fit connections and permissions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import Toast from 'react-native-toast-message';
import healthService from '../services/healthService';

export default function HealthSettingsScreen({ navigation }) {
  const [status, setStatus] = useState({
    isAvailable: false,
    isAuthorized: false,
    initialized: false,
    serviceName: 'Health Service',
    platform: Platform.OS,
  });
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  useEffect(() => {
    loadHealthStatus();
  }, []);

  const loadHealthStatus = async () => {
    try {
      await healthService.initialize();
      const currentStatus = healthService.getStatus();
      setStatus(currentStatus);

      if (currentStatus.isAuthorized) {
        const data = healthService.getCachedData();
        setHealthData(data);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Error loading health status:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load health settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await healthService.requestPermissions();
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Connected',
          text2: result.message,
        });

        // Reload status and fetch initial data
        await loadHealthStatus();
        await handleRefresh();

        // Start background observer
        healthService.startObserver();
      } else {
        Alert.alert(
          'Connection Failed',
          result.message,
          [
            {
              text: 'Learn More',
              onPress: () => showPermissionHelp(),
            },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to health service');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Health Service',
      `Are you sure you want to disconnect from ${status.serviceName}? You can reconnect anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await healthService.disconnect();
              healthService.stopObserver();
              
              Toast.show({
                type: 'success',
                text1: 'Disconnected',
                text2: `Disconnected from ${status.serviceName}`,
              });

              setHealthData(null);
              setLastSyncTime(null);
              await loadHealthStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await healthService.refresh();
      setHealthData(data);
      setLastSyncTime(new Date());
      
      Toast.show({
        type: 'success',
        text1: 'Synced',
        text2: 'Health data updated',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Could not refresh health data',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetPermissions = () => {
    Alert.alert(
      'Reset Permissions',
      'This will reset all health permissions. You will need to grant them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await healthService.resetAuthorization();
              healthService.stopObserver();
              
              Toast.show({
                type: 'success',
                text1: 'Reset Complete',
                text2: 'All permissions have been reset',
              });

              setHealthData(null);
              setLastSyncTime(null);
              await loadHealthStatus();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset permissions');
            }
          },
        },
      ]
    );
  };

  const showPermissionHelp = () => {
    const instructions = Platform.OS === 'ios'
      ? 'To enable Apple Health:\n\n1. Open Settings app\n2. Go to Privacy & Security\n3. Tap Health\n4. Select this app\n5. Enable the permissions you want to share'
      : 'To enable Google Fit:\n\n1. Ensure Google Fit app is installed\n2. Open Google Fit\n3. Complete the setup\n4. Return to this app and try connecting again';

    Alert.alert(
      'How to Enable Permissions',
      instructions,
      [
        {
          text: 'Open Settings',
          onPress: () => {
            // You could open app settings here
            Toast.show({
              type: 'info',
              text1: 'Open your device settings',
            });
          },
        },
        { text: 'OK' },
      ]
    );
  };

  const showPrivacyInfo = () => {
    Alert.alert(
      'Privacy & Data Usage',
      `We use ${status.serviceName} to:\n\n• Track your daily activity\n• Monitor your fitness progress\n• Provide personalized recommendations\n• Sync your workout history\n\nYour data:\n• Stays on your device unless you choose to sync\n• Is never shared with third parties\n• Can be disconnected anytime\n• Is encrypted and secure`,
      [{ text: 'Got It' }]
    );
  };

  const getDataIcon = (type) => {
    const icons = {
      steps: 'walk',
      calories: 'flame',
      heartRate: 'heart',
      weight: 'fitness',
    };
    return icons[type] || 'information-circle';
  };

  const formatValue = (type, value) => {
    if (value === null || value === undefined) return '--';
    
    switch (type) {
      case 'steps':
        return value.toLocaleString();
      case 'calories':
        return `${value} kcal`;
      case 'heartRate':
        return `${value} bpm`;
      case 'weight':
        return `${value} kg`;
      default:
        return value;
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    return lastSyncTime.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Loading health settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent.primary}
            colors={[COLORS.accent.primary]}
          />
        }
      >
        {/* Service Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.serviceInfo}>
              <Ionicons
                name={Platform.OS === 'ios' ? 'heart-circle' : 'logo-google'}
                size={32}
                color={status.isAuthorized ? COLORS.success : COLORS.text.secondary}
              />
              <View style={styles.serviceText}>
                <Text style={styles.serviceName}>{status.serviceName}</Text>
                <Text style={styles.serviceStatus}>
                  {!status.isAvailable
                    ? 'Not Available'
                    : status.isAuthorized
                    ? 'Connected'
                    : 'Not Connected'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: !status.isAvailable
                    ? COLORS.error + '20'
                    : status.isAuthorized
                    ? COLORS.success + '20'
                    : COLORS.warning + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: !status.isAvailable
                      ? COLORS.error
                      : status.isAuthorized
                      ? COLORS.success
                      : COLORS.warning,
                  },
                ]}
              >
                {!status.isAvailable ? '•' : status.isAuthorized ? '✓' : '○'}
              </Text>
            </View>
          </View>

          {!status.isAvailable && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={COLORS.warning} />
              <Text style={styles.warningText}>
                {status.serviceName} is not available on this device.
                {Platform.OS === 'android' && ' Please install Google Fit from the Play Store.'}
              </Text>
            </View>
          )}

          {status.isAvailable && !status.isAuthorized && (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <Ionicons name="link" size={20} color={COLORS.background.primary} />
              <Text style={styles.connectButtonText}>Connect {status.serviceName}</Text>
            </TouchableOpacity>
          )}

          {status.isAuthorized && (
            <>
              <View style={styles.syncInfo}>
                <Ionicons name="sync" size={16} color={COLORS.text.secondary} />
                <Text style={styles.syncText}>Last synced: {formatLastSync()}</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleRefresh}
                  disabled={refreshing}
                >
                  <Ionicons name="refresh" size={20} color={COLORS.accent.primary} />
                  <Text style={styles.actionButtonText}>Sync Now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleDisconnect}>
                  <Ionicons name="unlink" size={20} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Health Data Overview */}
        {status.isAuthorized && healthData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Data</Text>
            <View style={styles.dataGrid}>
              {Object.entries(healthData).map(([key, value]) => {
                if (key === 'timestamp') return null;
                return (
                  <View key={key} style={styles.dataItem}>
                    <Ionicons
                      name={getDataIcon(key)}
                      size={24}
                      color={COLORS.accent.primary}
                    />
                    <Text style={styles.dataLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Text>
                    <Text style={styles.dataValue}>{formatValue(key, value)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Available Data Types */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Data Types</Text>
          <Text style={styles.cardDescription}>
            {status.serviceName} can track the following health metrics:
          </Text>
          <View style={styles.dataTypeList}>
            {healthService.getAvailableDataTypes().map((type, index) => (
              <View key={index} style={styles.dataTypeItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={status.isAuthorized ? COLORS.success : COLORS.text.secondary}
                />
                <Text style={styles.dataTypeText}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Privacy & Permissions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy & Permissions</Text>
          <TouchableOpacity style={styles.menuItem} onPress={showPrivacyInfo}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark" size={22} color={COLORS.accent.primary} />
              <Text style={styles.menuItemText}>Privacy Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={showPermissionHelp}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle" size={22} color={COLORS.accent.primary} />
              <Text style={styles.menuItemText}>How to Enable Permissions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          {status.isAuthorized && (
            <TouchableOpacity style={styles.menuItem} onPress={handleResetPermissions}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="refresh-circle" size={22} color={COLORS.warning} />
                <Text style={[styles.menuItemText, { color: COLORS.warning }]}>
                  Reset All Permissions
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.accent.primary} />
          <Text style={styles.infoText}>
            {Platform.OS === 'ios'
              ? 'Apple Health data is stored locally on your device and synced via iCloud if enabled.'
              : 'Google Fit data is synced with your Google account and accessible across devices.'}
          </Text>
        </View>

        <View style={{ height: SIZES.padding * 2 }} />
      </ScrollView>
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
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.body3,
    color: COLORS.text.secondary,
    marginTop: SIZES.margin,
  },
  card: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.padding,
    marginTop: SIZES.margin,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.margin,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceText: {
    marginLeft: SIZES.margin,
  },
  serviceName: {
    ...FONTS.h4,
    color: COLORS.text.primary,
  },
  serviceStatus: {
    ...FONTS.body4,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...FONTS.h4,
    fontWeight: 'bold',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    padding: SIZES.padding / 2,
    borderRadius: SIZES.radius.md,
    marginTop: SIZES.margin / 2,
  },
  warningText: {
    ...FONTS.body4,
    color: COLORS.warning,
    marginLeft: SIZES.margin / 2,
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius.md,
    marginTop: SIZES.margin,
  },
  connectButtonText: {
    ...FONTS.body3,
    color: COLORS.background.primary,
    fontWeight: '600',
    marginLeft: SIZES.margin / 2,
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.margin / 2,
  },
  syncText: {
    ...FONTS.body4,
    color: COLORS.text.secondary,
    marginLeft: SIZES.margin / 2,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: SIZES.margin,
    gap: SIZES.margin / 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding / 2,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  actionButtonText: {
    ...FONTS.body4,
    color: COLORS.accent.primary,
    fontWeight: '600',
    marginLeft: SIZES.margin / 2,
  },
  cardTitle: {
    ...FONTS.h4,
    color: COLORS.text.primary,
    marginBottom: SIZES.margin / 2,
  },
  cardDescription: {
    ...FONTS.body4,
    color: COLORS.text.secondary,
    marginBottom: SIZES.margin,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.margin,
  },
  dataItem: {
    width: '48%',
    backgroundColor: COLORS.background.primary,
    padding: SIZES.padding / 2,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
  },
  dataLabel: {
    ...FONTS.body4,
    color: COLORS.text.secondary,
    marginTop: SIZES.margin / 4,
    textAlign: 'center',
  },
  dataValue: {
    ...FONTS.h4,
    color: COLORS.text.primary,
    marginTop: SIZES.margin / 4,
  },
  dataTypeList: {
    gap: SIZES.margin / 2,
  },
  dataTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding / 4,
  },
  dataTypeText: {
    ...FONTS.body3,
    color: COLORS.text.primary,
    marginLeft: SIZES.margin / 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary + '50',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    ...FONTS.body3,
    color: COLORS.text.primary,
    marginLeft: SIZES.margin,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent.primary + '10',
    padding: SIZES.padding / 2,
    borderRadius: SIZES.radius.md,
    marginTop: SIZES.margin,
  },
  infoText: {
    ...FONTS.body4,
    color: COLORS.text.secondary,
    marginLeft: SIZES.margin / 2,
    flex: 1,
  },
});


