import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Button, Alert, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function ProgramDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    try {
      const res = await api.getPlan(id);
      setProgram(res.data || res);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const startFreeWeek = async () => {
    try { setAssigning(true); await api.assignPlan(id); Alert.alert('Added', 'Week 1 added to your calendar'); }
    catch (e) { Alert.alert('Error', e.message || 'Failed'); }
    finally { setAssigning(false); }
  };

  const handlePurchase = async () => {
    try {
      setAssigning(true);
      const res = await api.purchaseProgram(id);
      if (res?.success) {
        Alert.alert('Purchased', 'Program unlocked and added.');
      } else {
        throw new Error(res?.message || 'Purchase failed');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Purchase failed');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} />;
  if (!program) return <Text style={{ margin: 16 }}>Not found</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 20 }}>{program.name}</Text>
      <Text style={{ color: '#555' }}>{program.goal} • {program.difficulty}</Text>
      {program.price > 0 ? (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>${program.price} {program.currency || 'USD'}</Text>
          <TouchableOpacity onPress={handlePurchase} style={{ backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Buy</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {program.isFreePreview && (
        <View style={{ marginTop: 10 }}>
          <Button title={assigning ? 'Starting...' : 'Start Free Week'} onPress={startFreeWeek} disabled={assigning} />
        </View>
      )}
      <Text style={{ fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Sessions</Text>
      <FlatList
        data={(program.phases?.[0]?.sessions || []).slice(0, program.isFreePreview ? 7 : undefined)}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontWeight: '600' }}>Day {item.dayIndex}: {item.title}</Text>
            <Text>{item.type} • {item.estimatedDuration}m</Text>
            {item.videoUrl ? <Text style={{ color: '#10b981' }}>Video attached</Text> : null}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
      />
    </View>
  );
}


