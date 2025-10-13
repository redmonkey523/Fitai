import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, FlatList, Alert, Platform } from 'react-native';
import api from '../services/api';

export default function CreatorMediaAttachScreen({ route }) {
  const { planId } = route.params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try { const res = await api.getPlan(planId); setPlan(res.data || res); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [planId]);

  const attachVideo = async (sessionIndex) => {
    try {
      setUploading(true);
      let picked;
      if (Platform.OS === 'web') {
        picked = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/*';
          input.multiple = false;
          const cleanup = () => { if (input && input.parentNode) input.parentNode.removeChild(input); };
          input.addEventListener('change', () => {
            try {
              const f = input.files && input.files[0];
              cleanup();
              if (!f) return reject(new Error('No file selected'));
              resolve({ _raw: f, name: f.name, type: f.type });
            } catch (err) { cleanup(); reject(err); }
          });
          input.style.position = 'fixed';
          input.style.left = '-10000px';
          document.body.appendChild(input);
          input.click();
        });
      } else {
        const moduleName='expo-document-picker'; const picker=await import(moduleName); const {getDocumentAsync}=picker;
        const pick = await getDocumentAsync({ type: 'video/*', multiple: false });
        if (pick.canceled) { setUploading(false); return; }
        const asset = pick.assets?.[0];
        if (!asset) throw new Error('No file selected');
        picked = { uri: asset.uri, name: asset.name || 'lesson.mp4', type: asset.mimeType || 'video/mp4' };
      }

      const filePart = Platform.OS === 'web' ? picked._raw : picked;
      const upload = await api.uploadFile(filePart);
      const url = upload?.file?.url || upload?.data?.file?.url || upload?.url;
      if (!url) throw new Error('Upload did not return a URL');

      const updated = { phases: plan.phases };
      updated.phases[0].sessions[sessionIndex].videoUrl = url;
      await api.patchPlan(planId, { phases: updated.phases });
      Alert.alert('Attached', 'Video attached to session');
      await load();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Attach failed');
    } finally { setUploading(false); }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} />;
  if (!plan) return <Text style={{ margin: 16 }}>Plan not found</Text>;

  const sessions = plan.phases?.[0]?.sessions || [];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>Attach Session Media</Text>
      <FlatList
        data={sessions}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item, index }) => (
          <View style={{ paddingVertical: 10 }}>
            <Text style={{ fontWeight: '600' }}>Day {item.dayIndex}: {item.title}</Text>
            <Text>{item.type} • {item.estimatedDuration}m</Text>
            <Text style={{ color: item.videoUrl ? '#10b981' : '#ef4444' }}>{item.videoUrl ? 'Video Attached' : 'No Video'}</Text>
            <View style={{ height: 6 }} />
            <Button title={uploading ? 'Uploading...' : 'Attach/Replace Video'} onPress={() => attachVideo(index)} disabled={uploading} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
      />
    </View>
  );
}



