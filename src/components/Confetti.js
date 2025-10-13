import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COUNT = 30;
const COLORS_ARRAY = [
  COLORS.accent.primary,
  COLORS.accent.secondary,
  COLORS.accent.success,
  COLORS.accent.quaternary,
];

const Confetti = ({ visible = false, onComplete }) => {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(SCREEN_WIDTH / 2),
      y: new Animated.Value(SCREEN_HEIGHT / 2),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)],
      size: Math.random() * 8 + 4,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      const animations = particles.map((particle) => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 150 + 100;
        const targetX = Math.cos(angle) * velocity;
        const targetY = Math.sin(angle) * velocity - 200; // Extra upward force

        return Animated.parallel([
          Animated.timing(particle.x, {
            toValue: SCREEN_WIDTH / 2 + targetX,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.y, {
              toValue: SCREEN_HEIGHT / 2 + targetY,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: SCREEN_HEIGHT,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.rotation, {
            toValue: Math.random() * 720 + 360,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(animations).start(() => {
        // Reset particles
        particles.forEach((particle) => {
          particle.x.setValue(SCREEN_WIDTH / 2);
          particle.y.setValue(SCREEN_HEIGHT / 2);
          particle.rotation.setValue(0);
          particle.opacity.setValue(1);
        });
        onComplete?.();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default Confetti;

