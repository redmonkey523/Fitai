import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * WorkoutRestTimer - Rest timer between sets with audio/haptic feedback
 * 
 * Features:
 * - Customizable rest duration
 * - Visual countdown
 * - Haptic/vibration feedback at intervals
 * - Pause/resume functionality
 * - Skip rest option
 * - Background timer support
 * 
 * @param {Object} props
 * @param {number} props.duration - Rest duration in seconds (default: 90)
 * @param {function} props.onComplete - Callback when timer completes
 * @param {function} props.onSkip - Callback when user skips rest
 * @param {boolean} props.visible - Whether timer modal is visible
 * @param {function} props.onClose - Callback to close timer
 */
const WorkoutRestTimer = ({
  duration = 90,
  onComplete,
  onSkip,
  visible = false,
  onClose,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  // Start timer when modal opens
  useEffect(() => {
    if (visible && !isActive) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible]);

  // Trigger haptics at key intervals
  useEffect(() => {
    if (isActive && !isPaused) {
      // Haptic feedback at 10, 5, 3, 2, 1 seconds
      if ([10, 5, 3, 2, 1].includes(timeRemaining)) {
        triggerFeedback();
      }
      
      // Timer complete
      if (timeRemaining === 0) {
        handleComplete();
      }
    }
  }, [timeRemaining, isActive, isPaused]);

  const startTimer = () => {
    setIsActive(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    setTimeRemaining(duration);
    
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
        const remaining = duration - elapsed;
        
        if (remaining <= 0) {
          setTimeRemaining(0);
        } else {
          setTimeRemaining(remaining);
        }
      }
    }, 100); // Update every 100ms for smooth countdown
  };

  const pauseTimer = () => {
    setIsPaused(true);
    pausedTimeRef.current = Date.now() - startTimeRef.current;
  };

  const resumeTimer = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now() - pausedTimeRef.current;
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeRemaining(duration);
    setIsPaused(false);
    setIsActive(false);
    pausedTimeRef.current = 0;
    startTimer();
  };

  const handleComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsActive(false);
    triggerCompleteFeedback();
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsActive(false);
    if (onSkip) {
      onSkip();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClose = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsActive(false);
    if (onClose) {
      onClose();
    }
  };

  const triggerFeedback = async () => {
    if (Platform.OS === 'web') {
      // Web: try to use Vibration API
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } else {
      // Native: use Haptics
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback to Vibration
        Vibration.vibrate(200);
      }
    }
  };

  const triggerCompleteFeedback = async () => {
    if (Platform.OS === 'web') {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } else {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Vibration.vibrate([200, 100, 200]);
      }
    }
  };

  const addTime = (seconds) => {
    const newTime = Math.min(timeRemaining + seconds, 600); // Max 10 minutes
    setTimeRemaining(newTime);
    // Adjust start time to account for added time
    startTimeRef.current = startTimeRef.current - (seconds * 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((duration - timeRemaining) / duration) * 100;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 5) return COLORS.error;
    if (timeRemaining <= 15) return COLORS.warning;
    return COLORS.accent.primary;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.background.secondary, COLORS.background.primary]}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Rest Timer</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Circular Progress */}
            <View style={styles.timerSection}>
              <View style={styles.circularProgress}>
                {/* Background circle */}
                <View style={[styles.progressCircle, { borderColor: COLORS.background.tertiary }]} />
                
                {/* Progress circle (simplified - in production use react-native-svg for smooth animation) */}
                <View 
                  style={[
                    styles.progressCircle, 
                    { 
                      borderColor: getTimerColor(),
                      borderTopWidth: 8,
                      borderRightWidth: 8,
                      transform: [{ rotate: `${getProgressPercentage() * 3.6}deg` }]
                    }
                  ]} 
                />
                
                {/* Time display */}
                <View style={styles.timeContainer}>
                  <Text style={[styles.timeText, { color: getTimerColor() }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                  <Text style={styles.timeLabel}>
                    {isPaused ? 'PAUSED' : 'remaining'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick adjust buttons */}
            <View style={styles.adjustButtons}>
              <TouchableOpacity 
                style={styles.adjustButton}
                onPress={() => addTime(-15)}
                disabled={timeRemaining <= 15}
              >
                <Text style={styles.adjustButtonText}>-15s</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adjustButton}
                onPress={() => addTime(15)}
              >
                <Text style={styles.adjustButtonText}>+15s</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.adjustButton}
                onPress={() => addTime(30)}
              >
                <Text style={styles.adjustButtonText}>+30s</Text>
              </TouchableOpacity>
            </View>

            {/* Control buttons */}
            <View style={styles.controls}>
              <TouchableOpacity 
                style={[styles.controlButton, styles.secondaryButton]}
                onPress={resetTimer}
              >
                <Ionicons name="refresh" size={24} color={COLORS.text.primary} />
                <Text style={styles.controlButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.controlButton, styles.primaryButton]}
                onPress={isPaused ? resumeTimer : pauseTimer}
              >
                <Ionicons 
                  name={isPaused ? 'play' : 'pause'} 
                  size={24} 
                  color={COLORS.background.primary} 
                />
                <Text style={[styles.controlButtonText, styles.primaryButtonText]}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.controlButton, styles.secondaryButton]}
                onPress={handleSkip}
              >
                <Ionicons name="play-forward" size={24} color={COLORS.text.primary} />
                <Text style={styles.controlButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Info text */}
            <Text style={styles.infoText}>
              {timeRemaining <= 5 
                ? '🔥 Time\'s up! Ready for the next set?' 
                : timeRemaining <= 15
                ? '⏱️ Get ready...'
                : '💪 Take your time to recover'}
            </Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  gradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  circularProgress: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 64,
    fontWeight: FONTS.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  adjustButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  adjustButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  adjustButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.accent.primary,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryButton: {
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  primaryButton: {
    backgroundColor: COLORS.accent.primary,
  },
  controlButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
  },
  primaryButtonText: {
    color: COLORS.background.primary,
  },
  infoText: {
    textAlign: 'center',
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
});

export default WorkoutRestTimer;


