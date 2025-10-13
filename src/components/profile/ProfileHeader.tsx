import React from 'react';
import { View, Text, ImageBackground, Platform } from 'react-native';
import Avatar from '../Avatar';

type Props = {
  bannerUrl?: string | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  specialties?: string[];
  stats?: { posts?: number; subscribers?: number; programs?: number };
};

export default function ProfileHeader({ bannerUrl, avatarUrl, displayName, username, bio, specialties = [], stats = {} }: Props) {
  return (
    <View>
      <ImageBackground
        source={{ uri: bannerUrl || 'https://via.placeholder.com/1200x675/111/222?text=%20' }}
        style={{ width: '100%', aspectRatio: 16/9, backgroundColor: '#0B0B12' }}
        imageStyle={Platform.OS === 'web' ? { objectFit: 'cover' } : {}}
      />
      <View style={{ paddingHorizontal: 16, marginTop: -48, flexDirection: 'row', alignItems: 'flex-end' }}>
        <Avatar uri={avatarUrl || undefined} size={96} ring verified={false} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: '#E5E7EB', fontWeight: '700', fontSize: 20 }} numberOfLines={1}>{displayName || 'User'}</Text>
          <Text style={{ color: '#9CA3AF' }}>{username ? `@${username}` : ''}</Text>
        </View>
      </View>
      {bio ? (
        <Text style={{ color: '#D1D5DB', paddingHorizontal: 16, marginTop: 8 }}>{bio}</Text>
      ) : null}
      {Array.isArray(specialties) && specialties.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 8 }}>
          {specialties.slice(0, 8).map((t) => (
            <View key={t} style={{ backgroundColor: 'rgba(39,224,198,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#27E0C6', fontSize: 12 }}>{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginTop: 12 }}>
        <Stat label="Posts" value={stats.posts || 0} />
        <Stat label="Subscribers" value={stats.subscribers || 0} />
        <Stat label="Programs" value={stats.programs || 0} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: '#E5E7EB', fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{label}</Text>
    </View>
  );
}


