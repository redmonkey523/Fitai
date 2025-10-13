import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';
import api from '../services/api';

export default function ProgramTemplateScreen({ navigation }) {
  const [name, setName] = useState('Beginner Strength');
  const [goal, setGoal] = useState('strength');
  const [weeks, setWeeks] = useState('4');
  const [level, setLevel] = useState('beginner');
  const [creating, setCreating] = useState(false);

  const createTemplate = async () => {
    try {
      setCreating(true);
      const numWeeks = Math.max(1, parseInt(weeks || '4'));
      // auto-generate simple split: 3 sessions per week
      const phases = [{ name: 'Phase 1', weeks: numWeeks, sessions: [] }];
      const sessionTypes = ['strength', 'cardio', 'mobility'];
      for (let w = 0; w < numWeeks; w++) {
        for (let d = 1; d <= 3; d++) {
          phases[0].sessions.push({ dayIndex: (w * 7) + d, title: `Session ${d}`, type: sessionTypes[(d - 1) % 3], estimatedDuration: 45, exercises: [] });
        }
      }
      const planBody = {
        name,
        goal: goal === 'strength' ? 'strength' : (goal || 'general_fitness'),
        difficulty: level,
        tags: [goal, level],
        phases,
        isPublished: false,
        isFreePreview: true
      };
      const res = await api.createProgram(planBody);
      const plan = res.data || res;
      Alert.alert('Created', 'Template created. You can now attach videos and publish.', [
        { text: 'Open Plan', onPress: () => navigation.navigate('PlanDetail', { id: plan.data?._id || plan._id }) }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 12 }}>Program Template</Text>
      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 }} />
      <Text>Goal (e.g., strength, weight_loss)</Text>
      <TextInput value={goal} onChangeText={setGoal} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 }} />
      <Text>Weeks</Text>
      <TextInput value={weeks} onChangeText={setWeeks} keyboardType="number-pad" style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 }} />
      <Text>Level (beginner/intermediate/advanced)</Text>
      <TextInput value={level} onChangeText={setLevel} style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 12 }} />
      <Button title={creating ? 'Creating...' : 'Create Template'} onPress={createTemplate} disabled={creating} />
    </ScrollView>
  );
}


