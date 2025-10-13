import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Platform, Alert } from 'react-native';
// ImagePicker loaded dynamically for web compat
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AvatarCropperSheet, { AvatarCropperRef } from '../components/avatar/AvatarCropperSheet';

export default function ProfilePhotoScreen() {
  const { user, refreshUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const cropperRef = useRef<AvatarCropperRef>(null);

  useEffect(() => {
    const u = (user?.profilePicture || user?.avatar || null) as (string | null);
    setAvatarUrl(u);
  }, [user]);

  const pick = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 1 });
      if (!res.canceled) cropperRef.current?.open(res.assets[0].uri);
    } catch (e) {
      Alert.alert('Picker', (e as Error)?.message || 'Failed to open library');
    }
  };

  const camera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Camera', 'Camera permission is required');
      const res = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!res.canceled) cropperRef.current?.open(res.assets[0].uri);
    } catch (e) {
      Alert.alert('Camera', (e as Error)?.message || 'Failed to open camera');
    }
  };

  const remove = async () => {
    Alert.alert('Remove photo?', 'You can add a new one anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
          try { await api.deleteAvatar(); setAvatarUrl(null); } catch (e) { Alert.alert('Remove', (e as Error)?.message || 'Failed'); }
        } }
    ]);
  };

  const saveCropped = async (croppedUri: string) => {
    try {
      const file = { uri: croppedUri, name: 'avatar.jpg', type: 'image/jpeg' } as any;
      const resp = await api.uploadAvatar(file, (pct) => setUploadPct(Math.round(pct * 100)));
      const url = resp?.avatarUrl || resp?.data?.avatarUrl || resp?.url;
      if (url) setAvatarUrl(url);
      try { await refreshUser(); } catch {}
    } catch (e) {
      Alert.alert('Upload', (e as Error)?.message || 'Failed to upload');
    } finally {
      setUploadPct(0);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Profile Photo</Text>
      <Text style={s.sub}>Your photo appears on posts, comments, and messages.</Text>

      <View style={s.card}>
        <View style={s.avatarRing}>
          <Image
            source={avatarUrl ? { uri: avatarUrl } : { uri: 'https://via.placeholder.com/152x152/1a1a1a/666?text=+' }}
            style={s.avatar}
            resizeMode="cover"
          />
        </View>
      </View>

      <View style={s.row}>
        <PrimaryButton label="Change Photo" onPress={pick} />
        {Platform.OS !== 'web' && <SecondaryButton label="Take Photo" onPress={camera} />}
        {avatarUrl && <TextButton label="Remove" onPress={remove} />}
      </View>

      {!!uploadPct && uploadPct > 0 && (
        <View style={s.progress}><View style={[s.progressFill, { width: `${uploadPct}%` }]} /></View>
      )}

      <Guidelines />

      <AvatarCropperSheet ref={cropperRef} onSave={saveCropped} />
    </View>
  );
}

const PrimaryButton = ({ label, onPress }: any) => (
  <Pressable onPress={onPress} style={s.btnPrimary}><Text style={s.btnTextDark}>{label}</Text></Pressable>
);
const SecondaryButton = ({ label, onPress }: any) => (
  <Pressable onPress={onPress} style={s.btnSecondary}><Text style={s.btnText}>{label}</Text></Pressable>
);
const TextButton = ({ label, onPress }: any) => (
  <Pressable onPress={onPress}><Text style={s.link}>{label}</Text></Pressable>
);

const Guidelines = () => (
  <View style={s.card}>
    <Text style={s.cardTitle}>Guidelines</Text>
    <Text style={s.tip}>• Use a clear, front-facing photo</Text>
    <Text style={s.tip}>• Minimum 400×400 · JPG/PNG/WebP · ≤ 5MB</Text>
    <Text style={s.tip}>This photo appears on your posts and comments.</Text>
  </View>
);

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#0B0B0F', gap: 12 },
  title: { color: '#E8EAF0', fontSize: 20, fontWeight: '700' },
  sub: { color: '#AEB3C2' },
  card: { backgroundColor: '#14141A', padding: 16, borderRadius: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(0,0,0,0.28)' } : {}) },
  avatarRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: 'rgba(39,224,198,0.35)', alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 152, height: 152, borderRadius: 76 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  btnPrimary: { backgroundColor: '#27E0C6', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnSecondary: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#E8EAF0', fontWeight: '600' },
  btnTextDark: { color: '#0B0B0F', fontWeight: '700' },
  link: { color: '#7BEADD', paddingVertical: 12 },
  progress: { height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: '#27E0C6' },
  cardTitle: { color: '#E8EAF0', fontWeight: '700', marginBottom: 8 },
  tip: { color: '#AEB3C2' },
});


