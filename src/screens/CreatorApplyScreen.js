import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView } from 'react-native';
import Button from '../components/Button';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function CreatorApplyScreen({ navigation }) {
  const { token } = useAuth();

  const [bio, setBio] = useState('');
  const [niches, setNiches] = useState('strength, mobility');
  const [links, setLinks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!token) {
      Alert.alert('Login Required', 'You need to be logged in to apply as a creator.', [
        { text: 'Go to Login', onPress: () => navigation.navigate('Auth') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        bio: bio.trim(),
        niches: niches.split(',').map(s => s.trim()).filter(Boolean),
        links: links.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await api.applyCreator(payload);

      if (res.success === false) {
        throw new Error(res.message || 'Application failed');
      }

      Alert.alert(
        'Application Approved!',
        'Congratulations! You now have access to the Creator Studio.',
        [
          {
            text: 'Go to Creator Studio',
            onPress: () => navigation.navigate('Creator')
          },
          { text: 'OK' }
        ]
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 12 }}>Apply to be a Creator</Text>
      <Text>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} placeholder="Tell us about your coaching" multiline style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 }} />
      <Text>Niches (comma-separated)</Text>
      <TextInput value={niches} onChangeText={setNiches} placeholder="e.g., strength, mobility" style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 }} />
      <Text>Links (comma-separated)</Text>
      <TextInput value={links} onChangeText={setLinks} placeholder="e.g., https://your.site" style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 }} />
      <Button
        label={submitting ? 'Submitting...' : 'Submit Application'}
        onPress={submit}
        disabled={submitting}
        fullWidth
        type="primary"
      />
    </ScrollView>
  );
}


