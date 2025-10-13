import React, { useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES } from '../constants/theme';
import { persistBeforeUpload } from '../features/media/Upload';

export type UploadPickerProps = {
  accept?: 'image' | 'video' | 'any';
  maxSizeMB?: number;
  maxDurationSec?: number; // only for video
  multiple?: boolean;
  onFiles: (files: Array<{ uri?: string; name?: string; size?: number; type?: string; duration?: number } | File>) => void;
};

export default function UploadPicker({ accept = 'any', maxSizeMB = 200, maxDurationSec, multiple = false, onFiles }: UploadPickerProps) {
  const dropRef = useRef<View>(null);
  const [hover, setHover] = useState(false);

  const error = (msg: string) => Toast.show({ type: 'error', text1: 'Upload', text2: msg });

  const validate = (file: any) => {
    const isOkType =
      accept === 'any' ||
      (accept === 'image' && /^image\//.test(file.type || '')) ||
      (accept === 'video' && /^video\//.test(file.type || ''));
    const isOkSize = (file.size || 0) <= maxSizeMB * 1024 * 1024;
    const isOkDuration = typeof maxDurationSec === 'number'
      ? (typeof file.duration === 'number' ? file.duration <= maxDurationSec : true)
      : true;
    return isOkType && isOkSize && isOkDuration;
  };

  const handleFiles = (files: any[]) => {
    const valid: any[] = [];
    for (const f of files) {
      if (!validate(f)) {
        error('Invalid file type, size or duration');
        continue;
      }
      valid.push(f);
    }
    if (valid.length) onFiles(multiple ? valid : [valid[0]]);
  };

  const pickNative = async () => {
    const mediaTypes =
      accept === 'image' ? ImagePicker.MediaTypeOptions.Images :
      accept === 'video' ? ImagePicker.MediaTypeOptions.Videos :
      ImagePicker.MediaTypeOptions.All;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection: multiple });
    if (!result.canceled) {
      // Persist files to documentDirectory before passing to parent
      const persistedAssets = await Promise.all(
        (result.assets || []).map(async (a: ImagePicker.ImagePickerAsset) => {
          try {
            const durableUri = await persistBeforeUpload(a.uri, a.fileName ?? undefined);
            return {
              uri: durableUri,
              name: a.fileName,
              size: a.fileSize,
              type: a.type === 'video' ? 'video/*' : 'image/*',
              duration: a.duration,
            };
          } catch (error) {
            console.error('[UploadPicker] Failed to persist file:', error);
            // Fallback to original URI
            return {
              uri: a.uri,
              name: a.fileName,
              size: a.fileSize,
              type: a.type === 'video' ? 'video/*' : 'image/*',
              duration: a.duration,
            };
          }
        })
      );
      handleFiles(persistedAssets as any);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View
        // @ts-ignore - RNW drag events
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        // @ts-ignore
        onDragLeave={() => setHover(false)}
        // @ts-ignore
        onDrop={(e) => { e.preventDefault(); setHover(false); handleFiles(Array.from(e.dataTransfer.files)); }}
        style={{ borderWidth: 1, borderColor: hover ? COLORS.accent.primary : COLORS.border.primary, backgroundColor: hover ? '#0ea5ff11' : 'transparent', borderStyle: 'dashed', borderRadius: SIZES.radius.lg, padding: SIZES.spacing.lg, alignItems: 'center' }}
      >
        <Text style={{ color: COLORS.text.secondary }}>Drag & drop files here or click to browse</Text>
        {/* Hidden input to allow click-to-browse */}
        <div onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = multiple;
          input.accept = accept === 'image' ? 'image/*' : accept === 'video' ? 'video/*' : '*/*';
          input.onchange = async () => {
            const files = Array.from(input.files || []);
            // Best effort to read video duration on web
            const enriched = await Promise.all(files.map((f: any) => new Promise((resolve) => {
              try {
                if (f.type && f.type.startsWith('video/')) {
                  const url = URL.createObjectURL(f);
                  const v = document.createElement('video');
                  v.preload = 'metadata';
                  v.src = url;
                  v.onloadedmetadata = () => {
                    URL.revokeObjectURL(url);
                    resolve(Object.assign(f, { duration: Math.round(v.duration) }));
                  };
                  v.onerror = () => resolve(f);
                } else {
                  resolve(f);
                }
              } catch {
                resolve(f);
              }
            })));
            handleFiles(enriched as any[]);
          };
          input.click();
        }} style={{ width: 0, height: 0 }} />
      </View>
    );
  }

  return (
    <Pressable onPress={pickNative} style={{ borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.lg, padding: SIZES.spacing.lg, alignItems: 'center' }}>
      <Text style={{ color: COLORS.text.secondary }}>Pick from device</Text>
    </Pressable>
  );
}


