import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Image, Platform } from 'react-native';

export type AvatarCropperRef = { open: (uri: string) => void; close: () => void; };

export default forwardRef<AvatarCropperRef, { onSave: (uri: string) => Promise<void> }>(
  ({ onSave }, ref) => {
    const [visible, setVisible] = useState(false);
    const [uri, setUri] = useState<string | null>(null);
    useImperativeHandle(ref, () => ({
      open: (u) => { setUri(u); setVisible(true); },
      close: () => setVisible(false),
    }));

    const save = async () => {
      if (!uri) return;
      
      // Platform-specific image manipulation
      if (Platform.OS === 'web') {
        // On web, just save the URI as-is
        await onSave(uri);
        setVisible(false);
        return;
      }

      // On native, use image manipulator
      try {
        const ImageManipulator = await import('expo-image-manipulator');
        const manip = await ImageManipulator.manipulateAsync(
          uri,
          [ { resize: { width: 1024 } } ],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
        );
        await onSave(manip.uri);
      } catch (error) {
        console.error('Image manipulation failed:', error);
        // Fallback: save original
        await onSave(uri);
      }
      setVisible(false);
    };

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.sheet}>
          <Text style={styles.title}>Crop</Text>
          {uri && (
            <Image source={{ uri }} style={styles.canvas} resizeMode="contain" />
          )}
          <View style={styles.actions}>
            <Pressable onPress={() => setVisible(false)}><Text style={styles.cancel}>Cancel</Text></Pressable>
            <Pressable onPress={save} style={styles.save}><Text style={{ color: '#0B0B0F', fontWeight: '700' }}>Save</Text></Pressable>
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#0B0B0F', padding: 16, gap: 12 },
  title: { color: '#E8EAF0', fontSize: 18, fontWeight: '700' },
  canvas: { flex: 1, backgroundColor: '#111218', borderRadius: 16,
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px rgba(0,0,0,0.28)' } : {}) },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  cancel: { color: '#E8EAF0', padding: 12 },
  save: { backgroundColor: '#27E0C6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
});


