import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import healthKitService from '../services/healthKit';

/**
 * Hook to use HealthKit step tracking
 * @returns {Object} HealthKit state and methods
 */
export function useHealthKit() {
  const [isAvailable, setIsAvailable] = useState(healthKitService.getIsAvailable());
  const [isAuthorized, setIsAuthorized] = useState(healthKitService.getIsAuthorized());
  const [steps, setSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setLoading(true);
        const available = healthKitService.getIsAvailable();
        setIsAvailable(available);

        if (available) {
          const authorized = await healthKitService.checkPermissions();
          setIsAuthorized(authorized);

          if (authorized) {
            const currentSteps = await healthKitService.fetchTodaySteps();
            setSteps(currentSteps);
          }
        }
      } catch (err) {
        console.error('[useHealthKit] Error checking permissions:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, []);

  // Subscribe to step updates
  useEffect(() => {
    if (!isAuthorized) return;

    const unsubscribe = healthKitService.subscribe((newSteps) => {
      setSteps(newSteps);
    });

    return unsubscribe;
  }, [isAuthorized]);

  // Refresh on app foreground
  useEffect(() => {
    if (!isAuthorized) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[useHealthKit] App foregrounded, refreshing steps...');
        healthKitService.refresh();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [isAuthorized]);

  // Start/stop observer
  useEffect(() => {
    if (isAuthorized) {
      healthKitService.startObserver();
    }

    return () => {
      healthKitService.stopObserver();
    };
  }, [isAuthorized]);

  /**
   * Request HealthKit permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const granted = await healthKitService.requestPermissions();
      setIsAuthorized(granted);
      
      if (granted) {
        const currentSteps = await healthKitService.fetchTodaySteps();
        setSteps(currentSteps);
      }
      
      return granted;
    } catch (err) {
      console.error('[useHealthKit] Error requesting permissions:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manually refresh steps
   */
  const refresh = useCallback(async () => {
    if (!isAuthorized) return;
    
    try {
      setError(null);
      const currentSteps = await healthKitService.refresh();
      setSteps(currentSteps);
    } catch (err) {
      console.error('[useHealthKit] Error refreshing:', err);
      setError(err.message);
    }
  }, [isAuthorized]);

  /**
   * Get steps for a date range
   */
  const getStepsForRange = useCallback(async (startDate, endDate) => {
    if (!isAuthorized) return [];
    
    try {
      return await healthKitService.getStepsForRange(startDate, endDate);
    } catch (err) {
      console.error('[useHealthKit] Error getting step range:', err);
      setError(err.message);
      return [];
    }
  }, [isAuthorized]);

  return {
    isAvailable,
    isAuthorized,
    steps,
    loading,
    error,
    requestPermissions,
    refresh,
    getStepsForRange,
  };
}

export default useHealthKit;

