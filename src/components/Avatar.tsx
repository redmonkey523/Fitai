import React from 'react';
import { Image, View, Platform } from 'react-native';

type AvatarProps = {
  uri?: string | null;
  size?: number;
  verified?: boolean;
  ring?: boolean;
};

const DEFAULT_SIZE = 40;
const RING_COLOR = '#27E0C6';

export default function Avatar({ uri, size = DEFAULT_SIZE, verified = false, ring = true }: AvatarProps) {
  const borderRadius = size / 2;
  const ringWidth = ring ? Math.max(2, Math.floor(size * 0.06)) : 0;
  const outerSize = size + ringWidth * 2;
  const source = uri ? { uri } : { uri: 'https://via.placeholder.com/128x128/1a1a1a/666?text=+' };
  return (
    <View
      style={{
        width: outerSize,
        height: outerSize,
        borderRadius: outerSize / 2,
        alignItems: 'center',
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(0,0,0,0.3)' } : {}),
        borderWidth: ring ? ringWidth : 0,
        borderColor: ring ? RING_COLOR : 'transparent',
      }}
    >
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius }}
      />
      {verified && (
        <View
          style={{
            position: 'absolute',
            right: 2,
            bottom: 2,
            width: Math.max(10, Math.floor(size * 0.28)),
            height: Math.max(10, Math.floor(size * 0.28)),
            borderRadius: 999,
            backgroundColor: RING_COLOR,
            borderWidth: 2,
            borderColor: '#0B0B12',
          }}
        />
      )}
    </View>
  );
}


