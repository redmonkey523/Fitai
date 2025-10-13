import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

export default function PlanDetailScreen({ route }) {
  const { id } = route.params;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getPlan(id);
        if (mounted) setPlan(res.data || res);
      } catch (e) {
        console.error('Load plan error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const assign = async () => {
    try {
      setAssigning(true);
      await api.assignPlan(id);
      alert('Assigned!');
    } catch (e) {
      alert('Assign failed');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 32 }} />;
  if (!plan) return <Text style={{ margin: 16 }}>Not found</Text>;

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 20, marginBottom: 8 }}>{plan.name}</Text>
      <Text style={{ marginBottom: 12 }}>{plan.goal} • {plan.difficulty}</Text>
      <Button title={assigning ? 'Assigning...' : 'Assign Plan'} onPress={assign} disabled={assigning} />
      <View style={{ height: 16 }} />
      {plan.phases?.map((ph, idx) => (
        <View key={idx} style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '600' }}>{ph.name} • {ph.weeks} weeks</Text>
          {ph.sessions?.slice(0, 3).map((s, i) => (
            <Text key={i}>Day {s.dayIndex}: {s.title} ({s.type})</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}


