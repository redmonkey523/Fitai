import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import Card from '../components/Card';
import Button from '../components/Button';
import useHealthKit from '../hooks/useHealthKit';
import crashReporting from '../services/crashReporting';

/**
 * Data Sources Screen
 * Allows users to manage connected data sources like Apple Health
 */
export default function DataSourcesScreen({ navigation }) {
  const {
    isAvailable: healthKitAvailable,
    isAuthorized: healthKitAuthorized,
    steps: healthKitSteps,
    requestPermissions: requestHealthKitPermissions,
    loading: healthKitLoading,
  } = useHealthKit();

  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handle connecting to Apple Health
   */
  const handleConnectAppleHealth = async () => {
    try {
      const granted = await requestHealthKitPermissions();
      if (granted) {
        Alert.alert(
          'Connected!',
          'Apple Health is now connected. Your step count will be synced automatically.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable Health permissions in your device Settings > Privacy > Health > Fitness App to track your steps.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      crashReporting.logError(error, { context: 'apple_health_connect' });
      Alert.alert('Error', 'Failed to connect to Apple Health. Please try again.');
    }
  };

  /**
   * Handle opening Health app
   */
  const handleOpenHealthApp = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('x-apple-health://');
    }
  };

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Data Sources</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );

  /**
   * Render Apple Health section
   */
  const renderAppleHealthSection = () => {
    if (!healthKitAvailable) {
      return (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={32} color={COLORS.text.tertiary} />
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Apple Health</Text>
              <Text style={styles.cardSubtitle}>Not Available</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Apple Health is only available on iOS devices. Run this app on an iPhone or iPad to connect.
          </Text>
        </Card>
      );
    }

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="heart"
            size={32}
            color={healthKitAuthorized ? COLORS.accent.success : COLORS.accent.primary}
          />
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>Apple Health</Text>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: healthKitAuthorized ? COLORS.accent.success : COLORS.text.tertiary },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: healthKitAuthorized ? COLORS.accent.success : COLORS.text.tertiary },
                ]}
              >
                {healthKitAuthorized ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          {healthKitAuthorized
            ? 'Your step count is synced from Apple Health. We only read step data and never write to your Health app.'
            : 'Connect Apple Health to automatically track your daily steps from your iPhone or Apple Watch.'}
        </Text>

        {healthKitAuthorized && (
          <View style={styles.stepsDisplay}>
            <View style={styles.stepsInfo}>
              <Ionicons name="footsteps" size={24} color={COLORS.accent.secondary} />
              <View style={styles.stepsContent}>
                <Text style={styles.stepsValue}>{healthKitSteps.toLocaleString()}</Text>
                <Text style={styles.stepsLabel}>steps today</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.cardActions}>
          {healthKitAuthorized ? (
            <>
              <Button
                label="Manage Permissions"
                type="outline"
                onPress={handleConnectAppleHealth}
                style={styles.actionButton}
                accessibilityLabel="Manage Apple Health permissions"
                accessibilityHint="Re-request or update Health permissions"
              />
              <Button
                label="Open Health App"
                type="text"
                onPress={handleOpenHealthApp}
                style={styles.secondaryButton}
                accessibilityLabel="Open Apple Health app"
              />
            </>
          ) : (
            <Button
              label="Connect Apple Health"
              type="primary"
              onPress={handleConnectAppleHealth}
              fullWidth
              style={styles.actionButton}
              accessibilityLabel="Connect to Apple Health"
              accessibilityHint="Grant permissions to read step count from Apple Health"
            />
          )}
        </View>

        {healthKitAuthorized && (
          <View style={styles.permissionsNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.text.tertiary} />
            <Text style={styles.permissionsNoteText}>
              We only read step counts. We never write to Health.
            </Text>
          </View>
        )}
      </Card>
    );
  };

  /**
   * Render future data sources section
   */
  const renderFutureDataSources = () => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="apps" size={32} color={COLORS.text.tertiary} />
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>More Data Sources</Text>
          <Text style={styles.cardSubtitle}>Coming Soon</Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>
        We're working on integrations with more fitness apps and devices.
      </Text>

      <View style={styles.futureSourcesList}>
        <View style={styles.futureSourceItem}>
          <Ionicons name="logo-google" size={20} color={COLORS.text.secondary} />
          <Text style={styles.futureSourceText}>Google Fit</Text>
        </View>
        <View style={styles.futureSourceItem}>
          <Ionicons name="watch" size={20} color={COLORS.text.secondary} />
          <Text style={styles.futureSourceText}>Fitbit</Text>
        </View>
        <View style={styles.futureSourceItem}>
          <Ionicons name="stats-chart" size={20} color={COLORS.text.secondary} />
          <Text style={styles.futureSourceText}>Strava</Text>
        </View>
        <View style={styles.futureSourceItem}>
          <Ionicons name="barbell" size={20} color={COLORS.text.secondary} />
          <Text style={styles.futureSourceText}>MyFitnessPal</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Connected Sources</Text>
          {renderAppleHealthSection()}

          <Text style={styles.sectionTitle}>Available Soon</Text>
          {renderFutureDataSources()}

          <View style={styles.bottomPadding} />
        </View>
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
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: SIZES.spacing.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.md,
    marginTop: SIZES.spacing.lg,
  },
  card: {
    marginBottom: SIZES.spacing.lg,
    padding: SIZES.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: SIZES.spacing.md,
  },
  cardTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
  },
  cardDescription: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: SIZES.spacing.lg,
  },
  stepsDisplay: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    marginBottom: SIZES.spacing.lg,
  },
  stepsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepsContent: {
    marginLeft: SIZES.spacing.md,
  },
  stepsValue: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  stepsLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  cardActions: {
    gap: SIZES.spacing.sm,
  },
  actionButton: {
    marginBottom: SIZES.spacing.xs,
    minHeight: 44, // Accessibility touch target
  },
  secondaryButton: {
    minHeight: 44,
  },
  permissionsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.md,
    paddingTop: SIZES.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
  },
  permissionsNoteText: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginLeft: 6,
    flex: 1,
  },
  futureSourcesList: {
    gap: SIZES.spacing.sm,
  },
  futureSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.sm,
    opacity: 0.6,
  },
  futureSourceText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    marginLeft: SIZES.spacing.md,
  },
  bottomPadding: {
    height: SIZES.spacing.xxl,
  },
});

