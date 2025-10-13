import React, { useRef } from 'react';
import { Platform, Pressable, Image, View, StyleProp, ViewStyle } from 'react-native';
import CompatVideo from './CompatVideo';
import { SHADOWS, COLORS, SIZES } from '../constants/theme';

export type MediaCardProps = {
  source: { uri: string } | number;
  type?: 'image' | 'video';
  posterUri?: string;
  autoplayOnHoverWeb?: boolean;
  muted?: boolean;
  loop?: boolean;
  onPress?: () => void;
  aspect?: number;
  skeleton?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function MediaCard({
  source,
  type = 'image',
  posterUri,
  autoplayOnHoverWeb = false,
  muted = true,
  loop = true,
  onPress,
  aspect = 16 / 9,
  skeleton = false,
  style,
}: MediaCardProps) {
  const videoRef = useRef<any>(null);
  const containerStyle: any = [{
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    backgroundColor: COLORS.background.secondary,
    aspectRatio: aspect,
    ...SHADOWS.medium,
  }, style];

  const onHoverIn = () => {
    if (Platform.OS === 'web' && autoplayOnHoverWeb && videoRef.current?.playAsync) {
      videoRef.current.playAsync().catch(() => {});
    }
  };
  const onHoverOut = () => {
    if (Platform.OS === 'web' && autoplayOnHoverWeb && videoRef.current?.pauseAsync) {
      videoRef.current.pauseAsync().catch(() => {});
    }
  };

  const onTap = async () => {
    try {
      if (onPress) return onPress();
      // Tap-to-play on native when no custom onPress provided
      if (Platform.OS !== 'web' && type === 'video' && videoRef.current) {
        // Try to infer current status by attempting a small operation
        if (videoRef.current.getStatusAsync) {
          const status = await videoRef.current.getStatusAsync();
          if (status?.isPlaying && videoRef.current.pauseAsync) {
            await videoRef.current.pauseAsync();
          } else if (videoRef.current.playAsync) {
            await videoRef.current.playAsync();
          }
        } else if (videoRef.current.playAsync) {
          await videoRef.current.playAsync();
        }
      } else if (onPress) {
        onPress();
      }
    } catch {}
  };

  if (skeleton) {
    return <View style={[{ height: 180, backgroundColor: COLORS.background.secondary, ...SHADOWS.small }, style]} />;
  }

  return (
    <Pressable onPress={onTap} onHoverIn={onHoverIn} onHoverOut={onHoverOut} style={containerStyle}>
      {type === 'video' ? (
        <CompatVideo
          ref={videoRef}
          source={source as any}
          resizeMode="cover"
          isMuted={muted}
          shouldPlay={false}
          isLooping={loop}
          posterSource={posterUri ? { uri: posterUri } : undefined}
          useNativeControls={Platform.OS !== 'web'}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Image source={source as any} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      )}
    </Pressable>
  );
}


