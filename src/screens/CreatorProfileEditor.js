import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import UploadPicker from '../components/UploadPicker';
import api from '../services/api';

export default function CreatorProfileEditor({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [profile, setProfile] = useState({
    bio: '',
    specialties: [],
    pricing: 0,
    currency: 'USD',
    socialLinks: { instagram: '', youtube: '', tiktok: '', website: '' },
    profilePicture: null,
    bannerImage: null,
    certifications: [],
  });

  const [newSpecialty, setNewSpecialty] = useState('');
  const [certForm, setCertForm] = useState({ name: '', issuer: '', credentialId: '', url: '', issuedAt: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getMyCreatorProfile();
        const data = res?.data || res;
        setProfile({
          bio: data?.bio || '',
          specialties: data?.specialties || data?.niches || [],
          pricing: typeof data?.pricing === 'number' ? data.pricing : 0,
          currency: data?.currency || 'USD',
          socialLinks: data?.socialLinks || { instagram: '', youtube: '', tiktok: '', website: '' },
          profilePicture: data?.profilePicture || null,
          bannerImage: data?.bannerImage || null,
          certifications: Array.isArray(data?.certifications) ? data.certifications : [],
        });
      } catch (e) {
        // swallow; show empty form for first-time creators
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      const patch = {
        bio: profile.bio,
        specialties: profile.specialties,
        pricing: Number(profile.pricing) || 0,
        currency: profile.currency,
        socialLinks: profile.socialLinks,
      };
      const res = await api.updateMyCreatorProfile(patch);
      const data = res?.data || res;
      setProfile(prev => ({ ...prev, ...data }));
      Alert.alert('Saved', 'Your creator profile was updated.');
    } catch (e) {
      Alert.alert('Save failed', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onUploadAvatar = async (files) => {
    try {
      const file = files?.[0];
      if (!file) return;
      setUploadingAvatar(true);
      // Optimistic UI
      const optimistic = { url: file.uri || profile.profilePicture?.url, thumbnail: file.uri, width: undefined, height: undefined };
      setProfile(prev => ({ ...prev, profilePicture: optimistic }));
      const res = await api.uploadCreatorAvatar(Platform.OS === 'web' ? (file._raw || file) : { uri: file.uri, name: file.name || 'avatar', type: file.type || 'image/*' });
      const meta = res?.data?.profilePicture || res?.profilePicture || res?.data || res;
      setProfile(prev => ({ ...prev, profilePicture: meta }));
    } catch (e) {
      Alert.alert('Avatar upload failed', e?.message || 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onUploadBanner = async (files) => {
    try {
      const file = files?.[0];
      if (!file) return;
      setUploadingBanner(true);
      const optimistic = { url: file.uri || profile.bannerImage?.url, thumbnail: file.uri };
      setProfile(prev => ({ ...prev, bannerImage: optimistic }));
      const res = await api.uploadCreatorBanner(Platform.OS === 'web' ? (file._raw || file) : { uri: file.uri, name: file.name || 'banner', type: file.type || 'image/*' });
      const meta = res?.data?.bannerImage || res?.bannerImage || res?.data || res;
      setProfile(prev => ({ ...prev, bannerImage: meta }));
    } catch (e) {
      Alert.alert('Banner upload failed', e?.message || 'Please try again.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const onAddSpecialty = () => {
    const tag = (newSpecialty || '').trim().toLowerCase();
    if (!tag) return;
    if (profile.specialties.includes(tag)) return setNewSpecialty('');
    setProfile(prev => ({ ...prev, specialties: [...prev.specialties, tag] }));
    setNewSpecialty('');
  };

  const onRemoveSpecialty = (tag) => {
    setProfile(prev => ({ ...prev, specialties: prev.specialties.filter(t => t !== tag) }));
  };

  const onAddCertification = async () => {
    try {
      const payload = { ...certForm };
      if (!payload.name || payload.name.trim().length < 2) {
        Alert.alert('Validation', 'Certification name is required.');
        return;
      }
      const res = await api.addCertification(payload);
      const created = res?.data || res;
      setProfile(prev => ({ ...prev, certifications: [...prev.certifications, created] }));
      setCertForm({ name: '', issuer: '', credentialId: '', url: '', issuedAt: '' });
    } catch (e) {
      Alert.alert('Add certification failed', e?.message || 'Please try again.');
    }
  };

  const onRemoveCertification = async (id) => {
    try {
      await api.removeCertification(id);
      setProfile(prev => ({ ...prev, certifications: prev.certifications.filter(c => String(c._id) !== String(id)) }));
    } catch (e) {
      Alert.alert('Remove certification failed', e?.message || 'Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent.primary} />
        <Text style={{ color: COLORS.text.secondary, marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SIZES.spacing.md }}>
      <View style={styles.card}>
        <Text style={styles.title}>Avatar</Text>
        <UploadPicker accept="image" maxSizeMB={5} onFiles={onUploadAvatar} />
        {uploadingAvatar ? <Text style={styles.muted}>Uploading…</Text> : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Banner</Text>
        <UploadPicker accept="image" maxSizeMB={5} onFiles={onUploadBanner} />
        {uploadingBanner ? <Text style={styles.muted}>Uploading…</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>About</Text>
        <TextInput
          value={profile.bio}
          onChangeText={(t) => setProfile(p => ({ ...p, bio: t }))}
          placeholder="Your bio"
          placeholderTextColor={COLORS.text.tertiary}
          style={styles.textArea}
          multiline
          numberOfLines={5}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Specialties</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={newSpecialty}
            onChangeText={setNewSpecialty}
            placeholder="e.g. strength"
            placeholderTextColor={COLORS.text.tertiary}
            style={[styles.input, { flex: 1 }]}
          />
          <TouchableOpacity onPress={onAddSpecialty} style={styles.addBtn}><Text style={styles.addBtnText}>Add</Text></TouchableOpacity>
        </View>
        <View style={styles.tagsRow}>
          {profile.specialties.map(tag => (
            <TouchableOpacity key={tag} onPress={() => onRemoveSpecialty(tag)} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Pricing</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput value={String(profile.pricing)} onChangeText={(t) => setProfile(p => ({ ...p, pricing: t.replace(/[^0-9.]/g, '') }))} keyboardType="decimal-pad" style={[styles.input, { flex: 1 }]} />
          <TextInput value={profile.currency} onChangeText={(t) => setProfile(p => ({ ...p, currency: (t || 'USD').toUpperCase().slice(0, 5) }))} style={[styles.input, { width: 90, textTransform: 'uppercase' }]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Social Links</Text>
        {['instagram','youtube','tiktok','website'].map((k) => (
          <TextInput key={k} value={profile.socialLinks?.[k] || ''} onChangeText={(t) => setProfile(p => ({ ...p, socialLinks: { ...p.socialLinks, [k]: t } }))} placeholder={k} placeholderTextColor={COLORS.text.tertiary} style={styles.input} />
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Certifications</Text>
        <View style={{ gap: 8 }}>
          <TextInput value={certForm.name} onChangeText={(t) => setCertForm(f => ({ ...f, name: t }))} placeholder="Name (required)" placeholderTextColor={COLORS.text.tertiary} style={styles.input} />
          <TextInput value={certForm.issuer} onChangeText={(t) => setCertForm(f => ({ ...f, issuer: t }))} placeholder="Issuer" placeholderTextColor={COLORS.text.tertiary} style={styles.input} />
          <TextInput value={certForm.credentialId} onChangeText={(t) => setCertForm(f => ({ ...f, credentialId: t }))} placeholder="Credential ID" placeholderTextColor={COLORS.text.tertiary} style={styles.input} />
          <TextInput value={certForm.url} onChangeText={(t) => setCertForm(f => ({ ...f, url: t }))} placeholder="URL" placeholderTextColor={COLORS.text.tertiary} style={styles.input} />
          <TextInput value={certForm.issuedAt} onChangeText={(t) => setCertForm(f => ({ ...f, issuedAt: t }))} placeholder="Issued At (YYYY-MM-DD)" placeholderTextColor={COLORS.text.tertiary} style={styles.input} />
          <TouchableOpacity onPress={onAddCertification} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Add Certification</Text></TouchableOpacity>
        </View>
        <View style={{ marginTop: 12, gap: 8 }}>
          {profile.certifications.map((c) => (
            <View key={String(c._id || c.name)} style={styles.certRow}>
              <Text style={{ color: COLORS.text.primary, flex: 1 }}>{c.name}{c.issuer ? ` • ${c.issuer}` : ''}</Text>
              <TouchableOpacity onPress={() => onRemoveCertification(c._id)}><Ionicons name="trash" size={18} color={COLORS.accent.danger || '#ef4444'} /></TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={onSave} disabled={saving} style={[styles.primaryBtn, { marginBottom: 40, opacity: saving ? 0.7 : 1 }]}>
        <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Profile'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background.primary },
  card: { backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, padding: SIZES.spacing.md, marginBottom: SIZES.spacing.md, ...SHADOWS.small },
  title: { color: COLORS.text.primary, fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold, marginBottom: 8 },
  textArea: { minHeight: 120, borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.md, padding: 12, color: COLORS.text.primary },
  input: { borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.md, padding: 12, color: COLORS.text.primary, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { backgroundColor: COLORS.background.secondary, borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.round, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { color: COLORS.text.secondary, fontSize: FONTS.size.sm },
  addBtn: { backgroundColor: COLORS.background.secondary, paddingHorizontal: 16, justifyContent: 'center', borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.border.primary },
  addBtnText: { color: COLORS.text.primary },
  primaryBtn: { backgroundColor: COLORS.accent.primary, paddingVertical: 14, alignItems: 'center', borderRadius: SIZES.radius.md },
  primaryBtnText: { color: COLORS.background.primary, fontWeight: FONTS.weight.bold },
  muted: { color: COLORS.text.secondary, marginTop: 6 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.md, padding: 10 },
});





