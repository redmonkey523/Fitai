import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, FlatList, Alert } from 'react-native';
import api from '../services/api';

export default function CoachChannelScreen({ route }) {
  const { id } = route.params;
  const [coach, setCoach] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.getCoach(id);
      const payload = res.data || res;
      setCoach(payload.coach);
      setPrograms(payload.programs || []);
      setFollowing(!!payload.isFollowing);
    } catch (e) {
      console.error('Coach load error', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const toggleFollow = async () => {
    try {
      if (following) { await api.unfollowCoach(id); setFollowing(false); }
      else { await api.followCoach(id); setFollowing(true); }
    } catch (e) { Alert.alert('Error', e.message || 'Failed'); }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} />;
  if (!coach) return <Text style={{ margin: 16 }}>Coach not found</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 18 }}>Coach Channel</Text>
      <Text style={{ marginTop: 6 }}>{coach.bio || 'No bio yet'}</Text>
      <Text style={{ marginTop: 6, color: '#555' }}>Niches: {(coach.niches||[]).join(', ')}</Text>
      <View style={{ height: 8 }} />
      <Button title={following ? 'Unfollow' : 'Follow'} onPress={toggleFollow} />
      <View style={{ height: 16 }} />
      <Text style={{ fontWeight: '600', marginBottom: 8 }}>Programs</Text>
      <FlatList
        data={programs}
        keyExtractor={(it) => String(it._id)}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 10 }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text>{item.goal} • {item.difficulty}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
      />
    </View>
  );
}


