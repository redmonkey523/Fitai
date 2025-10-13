import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Slider loaded dynamically for web compat
import api from '../services/api';
import { addMediaItem } from '../services/mediaLibrary';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

export default function CreatorTimelineEditorScreen({ navigation, route }) {
  const initialClips = useMemo(() => (route?.params?.clips || []).map((c, idx) => ({
    url: c.url,
    name: c.name || `clip_${idx + 1}.mp4`,
    trimStartS: c.trimStartS || 0,
    trimEndS: c.trimEndS || null,
    speed: c.speed || 1.0,
    volume: c.volume ?? 1.0,
    fadeInS: 0,
    fadeOutS: 0,
  })), [route?.params?.clips]);

  const [clips, setClips] = useState(initialClips);
  const [aspect, setAspect] = useState('9:16');
  const [exporting, setExporting] = useState(false);
  const [title, setTitle] = useState('export');
  const [textOverlays, setTextOverlays] = useState([]); // [{ text, x, y, size, color, startS, endS }]
  const [exportBlob, setExportBlob] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nativeOutPath, setNativeOutPath] = useState(null);
  const [crossfadeS, setCrossfadeS] = useState(0); // global crossfade between clips
  const [bgAudioUrl, setBgAudioUrl] = useState('');
  const [bgAudioVolume, setBgAudioVolume] = useState(0.5);

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Timeline Editor</Text>
      <TouchableOpacity onPress={handleExport} disabled={exporting} style={styles.iconBtn}>
        {exporting ? <ActivityIndicator color={COLORS.accent.primary} /> : <Ionicons name="download" size={22} color={COLORS.accent.primary} />}
      </TouchableOpacity>
    </View>
  );

  const setClip = (i, patch) => setClips(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  // Simple web preview of first clip
  const Preview = () => {
    if (Platform.OS !== 'web') return null;
    const first = clips[0];
    if (!first) return null;
    return (
      <View style={styles.previewBox}>
        <Text style={styles.label}>Preview (first clip)</Text>
        <video src={first.url} style={{ width: '100%', borderRadius: 8 }} controls playsInline />
      </View>
    );
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      if (Platform.OS !== 'web') {
        // Native path: full filtergraph parity
        try {
          const { FFmpegKit } = await import('ffmpeg-kit-react-native');
          const FileSystem = await import('expo-file-system');
          // 1) Download inputs
          const inputPaths = [];
          for (let i = 0; i < clips.length; i++) {
            const sourceUrl = clips[i].url;
            const target = `${FileSystem.cacheDirectory}in_${i}.mp4`;
            await FileSystem.downloadAsync(sourceUrl, target);
            inputPaths.push(target);
          }
          // Optional background audio
          let bgPath = null;
          if (bgAudioUrl) {
            try {
              const t = `${FileSystem.cacheDirectory}bg.mp3`;
              await FileSystem.downloadAsync(bgAudioUrl, t);
              bgPath = t;
            } catch {}
          }
          // 2) Build filtergraph
          const preparedVideoLabels = [];
          const preparedAudioLabels = [];
          const preparedDurations = [];
          const filterParts = [];
          for (let i = 0; i < clips.length; i++) {
            const c = clips[i];
            const vLabel = `v${i}`;
            const aLabel = `a${i}`;
            const trimStart = Number.isFinite(c.trimStartS) ? Math.max(0, c.trimStartS) : 0;
            const trimEnd = Number.isFinite(c.trimEndS) && c.trimEndS > trimStart ? c.trimEndS : null;
            const speed = c.speed && c.speed > 0 ? c.speed : 1.0;
            const fadeIn = c.fadeInS && c.fadeInS > 0 ? c.fadeInS : 0;
            const fadeOut = c.fadeOutS && c.fadeOutS > 0 ? c.fadeOutS : 0;
            // video
            let vChain = `[${i}:v]`;
            if (trimStart || trimEnd) {
              if (trimEnd) {
                vChain += `trim=start=${trimStart}:end=${trimEnd},setpts=PTS-STARTPTS`;
              } else {
                vChain += `trim=start=${trimStart},setpts=PTS-STARTPTS`;
              }
            } else {
              vChain += 'setpts=PTS-STARTPTS';
            }
            if (speed !== 1.0) {
              vChain += `,setpts=${(1/speed).toFixed(5)}*PTS`;
            }
            if (fadeIn) vChain += `,fade=t=in:st=0:d=${fadeIn}`;
            const baseDur = trimEnd ? (trimEnd - trimStart) : null;
            const durAfterSpeed = (baseDur && baseDur > 0) ? (baseDur / speed) : null;
            if (fadeOut && durAfterSpeed && fadeOut < durAfterSpeed) {
              const st = Math.max(0, (durAfterSpeed - fadeOut).toFixed(3));
              vChain += `,fade=t=out:st=${st}:d=${fadeOut}`;
            }
            vChain += `[${vLabel}]`;
            filterParts.push(vChain);
            preparedVideoLabels.push(vLabel);
            preparedDurations.push(durAfterSpeed);
            // audio
            let aChain = `[${i}:a]anull`;
            if (speed !== 1.0) {
              const atempos = [];
              let remaining = speed;
              while (remaining > 2.0) { atempos.push('atempo=2.0'); remaining = remaining / 2.0; }
              while (remaining < 0.5 && remaining > 0) { atempos.push('atempo=0.5'); remaining = remaining * 2.0; }
              atempos.push(`atempo=${remaining.toFixed(3)}`);
              aChain += `,${atempos.join(',')}`;
            }
            if (c.volume !== undefined && c.volume !== 1.0) {
              aChain += `,volume=${Math.max(0, c.volume)}`;
            }
            aChain += `[${aLabel}]`;
            filterParts.push(aChain);
            preparedAudioLabels.push(aLabel);
          }
          // Concat or crossfade
          let videoOutLabel = 'vout';
          let audioOutLabel = 'aout';
          const allDurKnown = preparedDurations.every(d => typeof d === 'number' && isFinite(d) && d > 0);
          if (clips.length >= 2 && crossfadeS > 0 && allDurKnown) {
            let curV = preparedVideoLabels[0];
            let curA = preparedAudioLabels[0];
            let curDur = preparedDurations[0];
            for (let i = 1; i < clips.length; i++) {
              const nextV = preparedVideoLabels[i];
              const nextA = preparedAudioLabels[i];
              const nextDur = preparedDurations[i];
              const outV = `vx${i}`;
              const outA = `ax${i}`;
              const offset = Math.max(0, curDur - crossfadeS).toFixed(3);
              filterParts.push(`[${curV}][${nextV}]xfade=transition=fade:duration=${crossfadeS}:offset=${offset}[${outV}]`);
              filterParts.push(`[${curA}][${nextA}]acrossfade=d=${crossfadeS}[${outA}]`);
              curDur = curDur + nextDur - crossfadeS;
              curV = outV; curA = outA;
            }
            videoOutLabel = curV; audioOutLabel = curA;
          } else {
            const n = clips.length;
            const vInputs = preparedVideoLabels.map(l => `[${l}]`).join('');
            const aInputs = preparedAudioLabels.map(l => `[${l}]`).join('');
            filterParts.push(`${vInputs}${aInputs}concat=n=${n}:v=1:a=1[vout][aout]`);
          }
          // Text overlays
          if (textOverlays.length > 0) {
            const overlayChain = [];
            overlayChain.push(`[${videoOutLabel}]`);
            textOverlays.forEach((t, idx) => {
              const safeText = (t.text || '').replace(/:/g, '\\:');
              const enable = Number.isFinite(t.startS) && Number.isFinite(t.endS) && t.endS > t.startS
                ? `:enable='between(t,${t.startS},${t.endS})'` : '';
              overlayChain.push(`drawtext=text='${safeText}':x=${t.x||'(w-text_w)/2'}:y=${t.y||'h-80'}:fontsize=${t.size||36}:fontcolor=${t.color||'white'}${enable}`);
              if (idx < textOverlays.length - 1) overlayChain.push(',');
            });
            overlayChain.push('[vtx]');
            filterParts.push(overlayChain.join(''));
            videoOutLabel = 'vtx';
          }
          // Background audio mix
          if (bgPath) {
            const safeVol = Math.max(0, Math.min(2, bgAudioVolume));
            // Append bg input to inputs for ffmpeg
          }
          // 3) Build command
          const outPath = `${FileSystem.cacheDirectory}${title || 'export'}.mp4`;
          const inputArgs = inputPaths.map(p => `-i "${p}"`).join(' ')
            + (bgPath ? ` -i "${bgPath}"` : '');
          if (bgPath) {
            // mix bg audio into outAudioLabel
            filterParts.push(`[${clips.length}:a]volume=${Math.max(0, Math.min(2, bgAudioVolume))}[abg]`);
            filterParts.push(`[${audioOutLabel}][abg]amix=inputs=2:duration=longest:dropout_transition=0[amix]`);
            audioOutLabel = 'amix';
          }
          const filterComplex = filterParts.join(';');
          const cmd = `${inputArgs} -filter_complex "${filterComplex}" -map [${videoOutLabel}] -map [${audioOutLabel}] -movflags faststart -preset veryfast -pix_fmt yuv420p "${outPath}"`;
          const session = await FFmpegKit.run(cmd);
          const rc = await session.getReturnCode();
          if (!rc || !rc.isValueSuccess()) throw new Error('FFmpeg native export failed');
          setNativeOutPath(outPath);
          Alert.alert('Exported', `Saved to: ${outPath}`);
        } catch (err) {
          Alert.alert('Export failed', err?.message || 'Native export failed.');
        }
        return;
      }
      // Lazy-load ffmpeg for web via CDN to avoid Metro bundling issues
      const ffmpegMod = await import(/* webpackIgnore: true */ 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js');
      const { createFFmpeg, fetchFile } = ffmpegMod;
      const ffmpeg = createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
      });
      await ffmpeg.load();

      // Write clips to FS
      for (let i = 0; i < clips.length; i++) {
        const fileName = `in_${i}.mp4`;
        const data = await fetchFile(clips[i].url);
        ffmpeg.FS('writeFile', fileName, data);
      }

      // Build filtergraph chain to apply trim/speed/fades between clips (simplified).
      // Approach: for each clip i, apply trim and setpts/atempo; then concat all.
      // NOTE: Crossfades and text overlays are approximated and may be refined in later passes.

      const vfInputs = [];
      const filterParts = [];
      const preparedVideoLabels = [];
      const preparedAudioLabels = [];
      const preparedDurations = []; // duration after speed and trim, seconds

      for (let i = 0; i < clips.length; i++) {
        const c = clips[i];
        const inName = `in_${i}.mp4`;
        const vLabel = `v${i}`;
        const aLabel = `a${i}`;
        const trimStart = Number.isFinite(c.trimStartS) ? Math.max(0, c.trimStartS) : 0;
        const trimEnd = Number.isFinite(c.trimEndS) && c.trimEndS > trimStart ? c.trimEndS : null;
        const speed = c.speed && c.speed > 0 ? c.speed : 1.0;
        const fadeIn = c.fadeInS && c.fadeInS > 0 ? c.fadeInS : 0;
        const fadeOut = c.fadeOutS && c.fadeOutS > 0 ? c.fadeOutS : 0;

        vfInputs.push('-i', inName);
        // video filters
        let vChain = `[${i}:v]`;
        if (trimStart || trimEnd) {
          if (trimEnd) {
            vChain += `trim=start=${trimStart}:end=${trimEnd},setpts=PTS-STARTPTS`;
          } else {
            vChain += `trim=start=${trimStart},setpts=PTS-STARTPTS`;
          }
        } else {
          vChain += 'setpts=PTS-STARTPTS';
        }
        if (speed !== 1.0) {
          vChain += `,setpts=${(1/speed).toFixed(5)}*PTS`;
        }
        if (fadeIn) {
          vChain += `,fade=t=in:st=0:d=${fadeIn}`;
        }
        // compute duration after trim and speed for precise fadeOut
        const baseDur = trimEnd ? (trimEnd - trimStart) : null;
        const durAfterSpeed = (baseDur && baseDur > 0) ? (baseDur / speed) : null;
        if (fadeOut && durAfterSpeed && fadeOut < durAfterSpeed) {
          const st = Math.max(0, (durAfterSpeed - fadeOut).toFixed(3));
          vChain += `,fade=t=out:st=${st}:d=${fadeOut}`;
        }
        vChain += `[${vLabel}]`;
        filterParts.push(vChain);
        preparedVideoLabels.push(vLabel);
        preparedDurations.push(durAfterSpeed);

        // audio filters
        let aChain = `[${i}:a]anull`;
        if (speed !== 1.0) {
          // atempo supports 0.5..2 per filter; chain if outside
          const atempos = [];
          let remaining = speed;
          while (remaining > 2.0) { atempos.push('atempo=2.0'); remaining = remaining / 2.0; }
          while (remaining < 0.5 && remaining > 0) { atempos.push('atempo=0.5'); remaining = remaining * 2.0; }
          atempos.push(`atempo=${remaining.toFixed(3)}`);
          aChain += `,${atempos.join(',')}`;
        }
        if (c.volume !== undefined && c.volume !== 1.0) {
          aChain += `,volume=${Math.max(0, c.volume)}`;
        }
        aChain += `[${aLabel}]`;
        filterParts.push(aChain);
        preparedAudioLabels.push(aLabel);
      }

      // Optional background audio
      let bgAudioInputIndex = null;
      if (bgAudioUrl) {
        try {
          const data = await fetchFile(bgAudioUrl);
          ffmpeg.FS('writeFile', 'bg.mp3', data);
          vfInputs.push('-i', 'bg.mp3');
          bgAudioInputIndex = clips.length; // appended after video inputs
        } catch {}
      }

      // Crossfade if durations known and crossfadeS > 0; else concat
      let videoOutLabel = 'vout';
      let audioOutLabel = 'aout';
      const allDurKnown = preparedDurations.every(d => typeof d === 'number' && isFinite(d) && d > 0);
      if (clips.length >= 2 && crossfadeS > 0 && allDurKnown) {
        let curV = preparedVideoLabels[0];
        let curA = preparedAudioLabels[0];
        let curDur = preparedDurations[0];
        for (let i = 1; i < clips.length; i++) {
          const nextV = preparedVideoLabels[i];
          const nextA = preparedAudioLabels[i];
          const nextDur = preparedDurations[i];
          const outV = `vx${i}`;
          const outA = `ax${i}`;
          const offset = Math.max(0, curDur - crossfadeS).toFixed(3);
          filterParts.push(`[${curV}][${nextV}]xfade=transition=fade:duration=${crossfadeS}:offset=${offset}[${outV}]`);
          filterParts.push(`[${curA}][${nextA}]acrossfade=d=${crossfadeS}[${outA}]`);
          curDur = curDur + nextDur - crossfadeS;
          curV = outV;
          curA = outA;
        }
        videoOutLabel = curV;
        audioOutLabel = curA;
      } else {
        const n = clips.length;
        const vInputs = preparedVideoLabels.map(l => `[${l}]`).join('');
        const aInputs = preparedAudioLabels.map(l => `[${l}]`).join('');
        filterParts.push(`${vInputs}${aInputs}concat=n=${n}:v=1:a=1[vout][aout]`);
      }

      // Text overlays (optional) using drawtext if present
      // For simplicity, apply overlays over the concatenated output
      // Note: drawtext needs fontconfig in WASM build; may no-op if not available.
      if (textOverlays.length > 0) {
        const overlayChain = [];
        overlayChain.push(`[${videoOutLabel}]`);
        textOverlays.forEach((t, idx) => {
          const safeText = (t.text || '').replace(/:/g, '\\:');  
          const enable = Number.isFinite(t.startS) && Number.isFinite(t.endS) && t.endS > t.startS
            ? `:enable='between(t,${t.startS},${t.endS})'`
            : '';
          overlayChain.push(`drawtext=text='${safeText}':x=${t.x||'(w-text_w)/2'}:y=${t.y||'h-80'}:fontsize=${t.size||36}:fontcolor=${t.color||'white'}${enable}`);
          if (idx < textOverlays.length - 1) overlayChain.push(',');
        });
        overlayChain.push('[vtx]');
        filterParts.push(overlayChain.join(''));
      }

      const filterComplex = filterParts.join(';');
      let outVideoLabel = textOverlays.length > 0 ? 'vtx' : videoOutLabel;
      let outAudioLabel = audioOutLabel;

      // Mix background audio if present
      if (bgAudioInputIndex !== null) {
        filterParts.push(`[${bgAudioInputIndex}:a]volume=${Math.max(0, Math.min(2, bgAudioVolume))}[abg]`);
        filterParts.push(`[${outAudioLabel}][abg]amix=inputs=2:duration=longest:dropout_transition=0[amix]`);
        outAudioLabel = 'amix';
      }

      const finalFilter = filterParts.join(';');
      const outName = `${title || 'export'}.mp4`;
      const args = [...vfInputs, '-filter_complex', finalFilter, '-map', `[${outVideoLabel}]`, '-map', `[${outAudioLabel}]`, '-movflags', 'faststart', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', 'out.mp4'];
      await ffmpeg.run(...args);
      const out = ffmpeg.FS('readFile', 'out.mp4');
      const blob = new Blob([out.buffer], { type: 'video/mp4' });
      setExportBlob(blob);
      const url = URL.createObjectURL(blob);
      // Offer download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'export'}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      Alert.alert('Exported', `Video exported as ${title || 'export'}.mp4`);
    } catch (e) {
      Alert.alert('Export failed', e?.message || 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      const fileName = `${title || 'export'}.mp4`;
      if (Platform.OS === 'web') {
        if (!exportBlob) {
          Alert.alert('No export', 'Export your timeline first.');
          return;
        }
        setSaving(true);
        const file = new File([exportBlob], fileName, { type: 'video/mp4' });
        const res = await api.uploadFile(file);
        if (res?.success && res?.file?.url) {
          await addMediaItem({ url: res.file.url, type: 'video', name: fileName, status: 'ready' });
          Alert.alert('Saved', 'Export uploaded to your Media Library.');
          navigation.navigate('MediaLibrary');
        } else {
          throw new Error(res?.message || 'Upload failed');
        }
      } else {
        if (!nativeOutPath) {
          Alert.alert('No export', 'Export your timeline first.');
          return;
        }
        setSaving(true);
        const filePart = { uri: nativeOutPath, name: fileName, type: 'video/mp4' };
        const res = await api.uploadFile(filePart);
        if (res?.success && res?.file?.url) {
          await addMediaItem({ url: res.file.url, type: 'video', name: fileName, status: 'ready' });
          Alert.alert('Saved', 'Export uploaded to your Media Library.');
          navigation.navigate('MediaLibrary');
        } else {
          throw new Error(res?.message || 'Upload failed');
        }
      }
    } catch (e) {
      Alert.alert('Save failed', e?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: SIZES.spacing.md }}>
        {/* Aspect ratio */}
        <View style={styles.row}>
          {['9:16','16:9','1:1'].map(opt => (
            <TouchableOpacity key={opt} style={[styles.chip, aspect === opt && styles.chipActive]} onPress={() => setAspect(opt)}>
              <Text style={[styles.chipText, aspect === opt && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title and Global Settings */}
        <View style={styles.controlsRow}>
          <View style={styles.controlCol}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} placeholder="export" value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.controlCol}>
            <Text style={styles.label}>Crossfade (s)</Text>
            <TextInput style={styles.input} value={String(crossfadeS)} onChangeText={(v) => setCrossfadeS(Number(v.replace(/[^0-9]/g, '')) || 0)} keyboardType="numeric" />
            <Slider
              minimumValue={0}
              maximumValue={6}
              step={0.5}
              value={Number(crossfadeS) || 0}
              onValueChange={(val) => setCrossfadeS(Number(val.toFixed(1)))}
              minimumTrackTintColor={COLORS.accent.primary}
              maximumTrackTintColor={COLORS.border.primary}
              thumbTintColor={COLORS.accent.primary}
              style={styles.slider}
            />
          </View>
        </View>
        <View style={styles.controlsRow}>
          <View style={styles.controlCol}>
            <Text style={styles.label}>BG Audio URL</Text>
            <TextInput style={styles.input} placeholder="https://.../music.mp3" value={bgAudioUrl} onChangeText={setBgAudioUrl} />
          </View>
          <View style={styles.controlCol}>
            <Text style={styles.label}>BG Audio Vol (0-2)</Text>
            <TextInput style={styles.input} value={String(bgAudioVolume)} onChangeText={(v) => setBgAudioVolume(Number(v.replace(/[^0-9.]/g, '')) || 0.5)} keyboardType="decimal-pad" />
          </View>
        </View>

        {/* Clips list with per-clip controls */}
        {clips.map((c, i) => (
          <View key={c.url + i} style={styles.clipCard}>
            <Text style={styles.clipTitle} numberOfLines={1}>{c.name || c.url}</Text>
            <View style={styles.controlsRow}>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Start (s)</Text>
                <TextInput style={styles.input} value={String(c.trimStartS ?? '')} onChangeText={(v) => setClip(i, { trimStartS: Number(v.replace(/[^0-9]/g, '')) })} keyboardType="numeric" />
                <Slider
                  minimumValue={0}
                  maximumValue={60}
                  step={1}
                  value={Number(c.trimStartS) || 0}
                  onValueChange={(val) => setClip(i, { trimStartS: Math.max(0, Math.floor(val)) })}
                  minimumTrackTintColor={COLORS.accent.primary}
                  maximumTrackTintColor={COLORS.border.primary}
                  thumbTintColor={COLORS.accent.primary}
                  style={styles.slider}
                />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>End (s)</Text>
                <TextInput style={styles.input} value={c.trimEndS === null ? '' : String(c.trimEndS)} onChangeText={(v) => setClip(i, { trimEndS: v ? Number(v.replace(/[^0-9]/g, '')) : null })} keyboardType="numeric" />
                <Slider
                  minimumValue={0}
                  maximumValue={180}
                  step={1}
                  value={typeof c.trimEndS === 'number' ? Math.max(0, c.trimEndS) : 0}
                  onValueChange={(val) => setClip(i, { trimEndS: Math.max(0, Math.floor(val)) })}
                  minimumTrackTintColor={COLORS.accent.primary}
                  maximumTrackTintColor={COLORS.border.primary}
                  thumbTintColor={COLORS.accent.primary}
                  style={styles.slider}
                />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Speed</Text>
                <TextInput style={styles.input} value={String(c.speed)} onChangeText={(v) => setClip(i, { speed: Number(v.replace(/[^0-9.]/g, '')) || 1.0 })} keyboardType="decimal-pad" />
                <Slider
                  minimumValue={0.25}
                  maximumValue={2}
                  step={0.05}
                  value={Number(c.speed) || 1}
                  onValueChange={(val) => setClip(i, { speed: Number(val.toFixed(2)) })}
                  minimumTrackTintColor={COLORS.accent.primary}
                  maximumTrackTintColor={COLORS.border.primary}
                  thumbTintColor={COLORS.accent.primary}
                  style={styles.slider}
                />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Vol</Text>
                <TextInput style={styles.input} value={String(c.volume)} onChangeText={(v) => setClip(i, { volume: Number(v.replace(/[^0-9.]/g, '')) || 1.0 })} keyboardType="decimal-pad" />
                <Slider
                  minimumValue={0}
                  maximumValue={2}
                  step={0.05}
                  value={Number(c.volume) || 1}
                  onValueChange={(val) => setClip(i, { volume: Number(val.toFixed(2)) })}
                  minimumTrackTintColor={COLORS.accent.primary}
                  maximumTrackTintColor={COLORS.border.primary}
                  thumbTintColor={COLORS.accent.primary}
                  style={styles.slider}
                />
              </View>
            </View>
            <View style={styles.controlsRow}>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Fade In (s)</Text>
                <TextInput style={styles.input} value={String(c.fadeInS)} onChangeText={(v) => setClip(i, { fadeInS: Number(v.replace(/[^0-9]/g, '')) || 0 })} keyboardType="numeric" />
                <Slider
                  minimumValue={0}
                  maximumValue={5}
                  step={0.5}
                  value={Number(c.fadeInS) || 0}
                  onValueChange={(val) => setClip(i, { fadeInS: Number(val.toFixed(1)) })}
                  minimumTrackTintColor={COLORS.accent.primary}
                  maximumTrackTintColor={COLORS.border.primary}
                  thumbTintColor={COLORS.accent.primary}
                  style={styles.slider}
                />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Fade Out (s)</Text>
                <TextInput style={styles.input} value={String(c.fadeOutS)} onChangeText={(v) => setClip(i, { fadeOutS: Number(v.replace(/[^0-9]/g, '')) || 0 })} keyboardType="numeric" />
                <Slider
                  minimumValue={0}
                  maximumValue={5}
                  step={0.5}
                  value={Number(c.fadeOutS) || 0}
                  onValueChange={(val) => setClip(i, { fadeOutS: Number(val.toFixed(1)) })}
                  minimumTrackTintColor={COLORS.accent.primary}
                  maximumTrackTintColor={COLORS.border.primary}
                  thumbTintColor={COLORS.accent.primary}
                  style={styles.slider}
                />
              </View>
            </View>
          </View>
        ))}

        {/* Text overlays (basic with controls) */}
        <View style={styles.clipCard}>
          <Text style={styles.clipTitle}>Text Overlays</Text>
          {textOverlays.map((t, i) => (
            <View key={`tx_${i}`} style={styles.controlsRow}>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Text</Text>
                <TextInput style={styles.input} value={t.text} onChangeText={(v) => setTextOverlays(prev => prev.map((x, idx) => idx === i ? { ...x, text: v } : x))} />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Start</Text>
                <TextInput style={styles.input} value={String(t.startS || '')} onChangeText={(v) => setTextOverlays(prev => prev.map((x, idx) => idx === i ? { ...x, startS: Number(v.replace(/[^0-9]/g, '')) || 0 } : x))} keyboardType="numeric" />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>End</Text>
                <TextInput style={styles.input} value={String(t.endS || '')} onChangeText={(v) => setTextOverlays(prev => prev.map((x, idx) => idx === i ? { ...x, endS: Number(v.replace(/[^0-9]/g, '')) || 0 } : x))} keyboardType="numeric" />
              </View>
            </View>
          ))}
          {textOverlays.map((t, i) => (
            <View key={`txpos_${i}`} style={styles.controlsRow}>
              <View style={styles.controlCol}>
                <Text style={styles.label}>X</Text>
                <TextInput style={styles.input} placeholder="(w-text_w)/2" value={String(t.x ?? '')} onChangeText={(v) => setTextOverlays(prev => prev.map((x, idx) => idx === i ? { ...x, x: v } : x))} />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Y</Text>
                <TextInput style={styles.input} placeholder="h-80" value={String(t.y ?? '')} onChangeText={(v) => setTextOverlays(prev => prev.map((x, idx) => idx === i ? { ...x, y: v } : x))} />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Size</Text>
                <TextInput style={styles.input} value={String(t.size || 36)} onChangeText={(v) => setTextOverlays(prev => prev.map((x, idx) => idx === i ? { ...x, size: Number(v.replace(/[^0-9]/g, '')) || 36 } : x))} keyboardType="numeric" />
              </View>
              <View style={styles.controlCol}>
                <Text style={styles.label}>Color</Text>
                <TextInput style={styles.input} value={t.color || 'white'} onChangeText={(v) => setTextOverlays(prev => prev.map((x, idx) => idx === i ? { ...x, color: v || 'white' } : x))} />
              </View>
              <TouchableOpacity onPress={() => setTextOverlays(prev => prev.filter((_, idx) => idx !== i))} style={[styles.addBtn, { alignSelf: 'flex-end' }]}>
                <Text style={styles.addBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setTextOverlays(prev => [...prev, { text: 'Title', x: '(w-text_w)/2', y: 'h-80', size: 36, color: 'white', startS: 0, endS: 2 }])}>
              <Text style={styles.addBtnText}>+ Add Text</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.helper}>Export applies trims, speed, volume, crossfade, and basic text. Web supports Save to Library; native export saves to cache.</Text>
        {/* Web Preview */}
        <Preview />
        <View style={[styles.controlsRow, { marginTop: SIZES.spacing.md }] }>
          <TouchableOpacity onPress={handleExport} disabled={exporting} style={[styles.addBtn, exporting && { opacity: 0.6 }]}>
            <Text style={styles.addBtnText}>{exporting ? 'Exporting…' : (Platform.OS === 'web' ? 'Export (Download)' : 'Export')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveToLibrary}
            disabled={(Platform.OS === 'web' ? !exportBlob : !nativeOutPath) || saving}
            style={[styles.addBtn, (((Platform.OS === 'web' ? !exportBlob : !nativeOutPath) || saving) && { opacity: 0.6 })]}
          >
            <Text style={styles.addBtnText}>{saving ? 'Saving…' : 'Save to Library'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing.md, paddingVertical: SIZES.spacing.sm },
  iconBtn: { padding: SIZES.spacing.xs },
  headerTitle: { color: COLORS.text.primary, fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold },
  row: { flexDirection: 'row', gap: SIZES.spacing.sm, marginBottom: SIZES.spacing.md },
  chip: { borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { borderColor: COLORS.accent.primary, backgroundColor: COLORS.background.secondary },
  chipText: { color: COLORS.text.secondary },
  chipTextActive: { color: COLORS.text.primary, fontWeight: FONTS.weight.semibold },
  clipCard: { backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, padding: SIZES.spacing.md, marginBottom: SIZES.spacing.md, ...SHADOWS.small },
  clipTitle: { color: COLORS.text.primary, fontWeight: FONTS.weight.semibold, marginBottom: SIZES.spacing.sm },
  controlsRow: { flexDirection: 'row', gap: SIZES.spacing.sm, marginBottom: SIZES.spacing.sm },
  controlCol: { flex: 1 },
  label: { color: COLORS.text.secondary, marginBottom: 4, fontSize: FONTS.size.xs },
  input: { borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.sm, paddingHorizontal: 8, paddingVertical: 6, color: COLORS.text.primary },
  helper: { color: COLORS.text.tertiary, fontSize: FONTS.size.xs, marginTop: SIZES.spacing.sm },
  addBtn: { borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: COLORS.text.primary, fontWeight: FONTS.weight.semibold },
});


