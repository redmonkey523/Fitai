import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { getMediaLibrary, updateMedia } from '../services/mediaLibrary';
import api from '../services/api';
// Audio loaded dynamically for web compat
import CompatVideo from '../components/CompatVideo';

export default function CreatorClipEditorScreen({ navigation, route }) {
  const { url, returnTo } = route.params || {};
  const [item, setItem] = useState(null);
  const [startS, setStartS] = useState('');
  const [endS, setEndS] = useState('');
  const [coverAtS, setCoverAtS] = useState('');
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState('1.0');
  // Visual editing placeholders (local only for now)
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [colorHue, setColorHue] = useState(180);
  const [activeTool, setActiveTool] = useState('trim'); // upload | trim | music | text | filters
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [musicUrl, setMusicUrl] = useState('');
  const musicSoundRef = useRef(null);
  const previewFilterStyle = () => {
    if (Platform.OS === 'web') {
      const b = Math.max(0.1, Number(brightness) / 50);
      const c = Math.max(0.1, Number(contrast) / 50);
      const h = Number(colorHue) || 0;
      return { filter: `brightness(${b}) contrast(${c}) hue-rotate(${h}deg)` };
    }
    return {};
  };

  useEffect(() => {
    (async () => {
      try {
        const lib = await getMediaLibrary();
        const found = lib.find((m) => m.url === url);
        if (!found) return Alert.alert('Not found', 'Media was not found in your library');
        setItem(found);
        setStartS((found.trimStartS ?? '').toString());
        setEndS((found.trimEndS ?? '').toString());
        setCoverAtS((found.coverAtS ?? '').toString());
        setMuted(Boolean(found.muted));
        setSpeed((found.speed ?? '1.0').toString());
        setBrightness(Number(found.brightness ?? 50));
        setContrast(Number(found.contrast ?? 50));
        setColorHue(Number(found.colorHue ?? 180));
      } catch (e) {
        Alert.alert('Error', e?.message || 'Failed to load media');
      }
    })();
  }, [url]);

  const onSave = async () => {
    try {
      const trimStart = startS ? Number(startS) : undefined;
      const trimEnd = endS ? Number(endS) : undefined;
      const coverAt = coverAtS ? Number(coverAtS) : undefined;
      const spd = speed && !isNaN(Number(speed)) ? Number(speed) : 1.0;

      // If the media has a Cloudinary ID, request server-side processing
      if (item?.cloudinaryId) {
        const resp = await api.processClip({
          cloudinaryId: item.cloudinaryId,
          trimStartS: trimStart,
          trimEndS: trimEnd,
          muted,
          speed: spd,
          coverAtS: coverAt,
          brightness,
          contrast,
          hue: colorHue,
        });
        const processedUrl = resp?.processedUrl || resp?.data?.processedUrl;
        const thumbnailUrl = resp?.thumbnailUrl || resp?.data?.thumbnailUrl;
        const publicId = resp?.publicId || resp?.data?.publicId || item.cloudinaryId;
        if (!processedUrl) throw new Error('Processing did not return a URL');
        await updateMedia(url, {
          originalUrl: item.originalUrl || item.url,
          url: processedUrl,
          thumbnailUrl,
          cloudinaryId: publicId,
          trimStartS: trimStart,
          trimEndS: trimEnd,
          coverAtS: coverAt,
          muted,
          speed: spd,
          brightness,
          contrast,
          colorHue,
          status: 'ready',
        });
        Alert.alert('Processed', 'Clip processed successfully');
        if (returnTo?.name) {
          navigation.navigate(returnTo.name, returnTo.params || {});
        } else {
          navigation.goBack();
        }
        return;
      }

      // Fallback: save metadata only when processing not available
      await updateMedia(url, {
        trimStartS: trimStart,
        trimEndS: trimEnd,
        coverAtS: coverAt,
        muted,
        speed: spd,
        brightness,
        contrast,
        colorHue,
        status: 'ready',
      });
      Alert.alert('Saved', 'Edits saved (no server-side processing available)');
      if (returnTo?.name) {
        navigation.navigate(returnTo.name, returnTo.params || {});
      } else {
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save edits');
    }
  };

  const onStatus = (status) => {
    if (!status) return;
    if (typeof status.positionMillis === 'number') setPositionMs(status.positionMillis);
    if (typeof status.durationMillis === 'number') setDurationMs(status.durationMillis);
    if (status.didJustFinish) setIsPlaying(false);
    // Loop inside trim range when defined
    const startSecNum = Number(startS) || 0;
    const endSecNum = Number(endS) || Math.floor((durationMs || status.durationMillis || 0) / 1000);
    const endMs = endSecNum * 1000;
    const startMs = startSecNum * 1000;
    if (isPlaying && endMs > 0 && typeof status.positionMillis === 'number' && status.positionMillis >= endMs) {
      try { videoRef.current?.setPositionAsync(Math.max(0, startMs)); } catch {}
      try { musicSoundRef.current?.setPositionAsync(Math.max(0, startMs)); } catch {}
    }
  };

  const togglePlay = async () => {
    try {
      if (!videoRef.current) return;
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
        if (musicSoundRef.current) {
          try { await musicSoundRef.current.pauseAsync(); } catch {}
        }
      } else {
        // Sync audio track (if present) with video position
        const pos = positionMs;
        await videoRef.current.playAsync();
        setIsPlaying(true);
        if (musicSoundRef.current) {
          try { await musicSoundRef.current.playFromPositionAsync(pos); } catch {}
        }
      }
    } catch {}
  };

  const seekToSeconds = async (sec) => {
    try {
      if (!videoRef.current) return;
      await videoRef.current.setPositionAsync(Math.max(0, Math.min(sec * 1000, durationMs || 0)));
      if (musicSoundRef.current) {
        try { await musicSoundRef.current.setPositionAsync(Math.max(0, Math.min(sec * 1000, durationMs || 0))); } catch {}
      }
    } catch {}
  };

  const formatTime = (ms) => {
    const totalSec = Math.floor((ms || 0) / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Apply playback speed immediately
  useEffect(() => {
    (async () => {
      try { await videoRef.current?.setRateAsync(Math.max(0.25, Math.min(2, Number(speed) || 1)), true); } catch {}
      try { await musicSoundRef.current?.setRateAsync(Math.max(0.5, Math.min(2, Number(speed) || 1)), true); } catch {}
    })();
  }, [speed]);

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Clip</Text>
      <TouchableOpacity onPress={onSave} style={styles.iconBtn}>
        <Ionicons name="save" size={22} color={COLORS.accent.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {!item ? (
        <View style={{ padding: SIZES.spacing.lg }}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <View style={styles.editorLayout}>
          {/* Left tool rail */}
          <View style={styles.toolRail}>
            <ToolButton active={activeTool==='upload'} icon="arrow-up" label="Upload" onPress={() => setActiveTool('upload')} />
            <ToolButton active={activeTool==='trim'} icon="cut" label="Trim" onPress={() => setActiveTool('trim')} />
            <ToolButton active={activeTool==='music'} icon="musical-notes" label="Add Music" onPress={() => setActiveTool('music')} />
            <ToolButton active={activeTool==='text'} icon="text" label="Text" onPress={() => setActiveTool('text')} />
            <ToolButton active={activeTool==='filters'} icon="color-filter" label="Filters" onPress={() => setActiveTool('filters')} />
          </View>

          {/* Center preview + timeline */}
          <View style={styles.centerPane}>
            <View style={styles.previewLarge}>
              <CompatVideo
                ref={videoRef}
                source={{ uri: item.url }}
                style={[styles.video, previewFilterStyle()]}
                resizeMode="contain"
                shouldPlay={false}
                isMuted={muted}
                onPlaybackStatusUpdate={onStatus}
              />
              {/* Native tint/brightness overlays (visual only) */}
              {Platform.OS !== 'web' && (
                <>
                  {/* Hue tint */}
                  <View style={[styles.previewOverlayTint, { pointerEvents: 'none', backgroundColor: `hsla(${colorHue}, 80%, 50%, 0.16)` }]} />
                  {/* Brightness overlay */}
                  {Number(brightness) !== 50 && (
                    <View
                      style={[styles.previewOverlayTint, { pointerEvents: 'none',
                        backgroundColor: Number(brightness) > 50 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.25)'
                      }]}
                    />
                  )}
                </>
              )}
              <TouchableOpacity style={[styles.playOverlay, { ...(Platform.OS === 'web' ? { outlineStyle: 'auto', outlineColor: '#0ea5ff44' } : {}) }]} onPress={togglePlay}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color={COLORS.background.primary} />
              </TouchableOpacity>
              <Text style={styles.previewFilename} numberOfLines={1}>{item.name || item.url}</Text>
              {Platform.OS === 'web' && (
                <TouchableOpacity onPress={() => window.open(item.url, '_blank')}>
                  <Text style={styles.link}>Open video</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Simple timeline and waveform stub */}
            <View style={styles.timeline}>
              <SeekBar
                positionSec={Math.floor(positionMs / 1000)}
                durationSec={Math.max(1, Math.floor(durationMs / 1000))}
                onSeek={seekToSeconds}
                startSec={Number(startS) || 0}
                endSec={Number(endS) || Math.max(1, Math.floor(durationMs / 1000))}
                onTrimStart={(sec) => setStartS(String(Math.max(0, Math.min(sec, Number(endS) || sec))))}
                onTrimEnd={(sec) => setEndS(String(Math.max(Number(startS) || 0, sec)))}
                onScrubStart={async () => { try { await videoRef.current?.pauseAsync(); await musicSoundRef.current?.pauseAsync(); } catch {} }}
                onScrubEnd={async () => { if (isPlaying) { try { await videoRef.current?.playAsync(); await musicSoundRef.current?.playAsync(); } catch {} } }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ color: COLORS.text.tertiary }}>{formatTime(positionMs)}</Text>
                <Text style={{ color: COLORS.text.tertiary }}>{formatTime(durationMs)}</Text>
              </View>
            </View>

            {/* Helper steps */}
            <View style={styles.howToBox}>
              <Text style={styles.howToTitle}>How to Edit Your Workout Videos</Text>
              <Text style={styles.howToStep}>1. Upload your video</Text>
              <Text style={styles.howToStep}>2. Trim the clip</Text>
              <Text style={styles.howToStep}>3. Adjust colors, add text, and more</Text>
            </View>
          </View>

          {/* Right editing panel */}
          <View style={styles.editPanel}>
            <TouchableOpacity style={styles.cropBtn} onPress={() => setActiveTool('trim')}>
              <Ionicons name="crop" size={18} color={COLORS.text.primary} />
              <Text style={styles.cropText}>Crop</Text>
            </TouchableOpacity>

            {activeTool === 'filters' && (
              <>
                <PanelRow label="Brightness">
                  <NumberSlider value={brightness} setValue={setBrightness} min={0} max={100} step={1} />
                </PanelRow>
                <PanelRow label="Contrast">
                  <NumberSlider value={contrast} setValue={setContrast} min={0} max={100} step={1} />
                </PanelRow>
                <PanelRow label="Color">
                  <ColorRing hue={colorHue} setHue={setColorHue} />
                </PanelRow>
                <Text style={{ color: COLORS.text.tertiary, fontSize: FONTS.size.xs, marginBottom: 6 }}>Preview applies immediately. Save to bake into the video.</Text>
                <Text style={styles.sectionLabel}>Filters</Text>
                <View style={styles.filterRow}>
                  {['A','B','C','D'].map((f) => (
                    <TouchableOpacity key={f} onPress={() => setContrast((v)=>Math.min(100, v+5))} style={styles.filterChip}><Text style={styles.filterChipText}>{f}</Text></TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {activeTool === 'music' && (
              <>
                <PanelRow label="Audio">
                  <TouchableOpacity onPress={() => setMuted((m) => !m)} style={[styles.toggle, muted && styles.toggleOn]}>
                    <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color={muted ? COLORS.background.primary : COLORS.text.primary} />
                    <Text style={[styles.toggleText, muted && { color: COLORS.background.primary }]}>{muted ? 'Muted' : 'Sound On'}</Text>
                  </TouchableOpacity>
                  <View style={{ height: SIZES.spacing.sm }} />
                  <TouchableOpacity onPress={async () => await handleUploadMusic(setMusicUrl, musicSoundRef)} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>{musicUrl ? 'Replace Music' : 'Upload Music'}</Text>
                  </TouchableOpacity>
                  {!!musicUrl && (
                    <Text style={{ color: COLORS.text.secondary, marginTop: 6 }} numberOfLines={1}>Selected: {musicUrl}</Text>
                  )}
                </PanelRow>
                <PanelRow label="Speed">
                  <NumberSlider value={Number(speed) * 100} setValue={(v)=> setSpeed(String(Math.max(0.25, Math.min(2, v/100)).toFixed(2)))} min={25} max={200} step={5} suffix="%" />
                </PanelRow>
              </>
            )}

            {activeTool === 'trim' && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: SIZES.spacing.md }]}>Trim</Text>
                <View style={styles.row}> 
                  <View style={styles.col}>
                    <Text style={styles.label}>Start (s)</Text>
                    <TextInput value={startS} onChangeText={(v) => setStartS(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>End (s)</Text>
                    <TextInput value={endS} onChangeText={(v) => setEndS(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Cover at (s)</Text>
                    <TextInput value={coverAtS} onChangeText={(v) => setCoverAtS(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
                  </View>
                </View>
              </>
            )}

            {activeTool === 'text' && (
              <>
                <Text style={styles.sectionLabel}>Text Overlay</Text>
                <Text style={{ color: COLORS.text.secondary }}>Coming soon: add styled text overlays.</Text>
              </>
            )}

            {activeTool === 'upload' && (
              <>
                <Text style={styles.sectionLabel}>Replace Media</Text>
                <TouchableOpacity onPress={async () => await handleUploadReplace(item, setItem)} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Upload & Replace</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.spacing.md, paddingVertical: SIZES.spacing.sm },
  iconBtn: { padding: SIZES.spacing.xs },
  headerTitle: { color: COLORS.text.primary, fontSize: FONTS.size.lg, fontWeight: FONTS.weight.bold },
  loadingText: { color: COLORS.text.secondary },
  editorLayout: { flex: 1, flexDirection: 'row' },
  // Left rail
  toolRail: { width: 84, paddingTop: SIZES.spacing.md, borderRightWidth: 1, borderRightColor: COLORS.border.primary, alignItems: 'stretch' },
  toolBtn: { alignItems: 'center', paddingVertical: SIZES.spacing.md, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  toolBtnActive: { borderLeftColor: COLORS.accent.primary, backgroundColor: COLORS.background.secondary },
  toolLabel: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, marginTop: 6 },
  // Center pane
  centerPane: { flex: 1, padding: SIZES.spacing.md },
  previewLarge: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, borderWidth: 1, borderColor: COLORS.border.primary, overflow: 'hidden' },
  video: { width: '100%', height: 220, backgroundColor: 'black' },
  previewOverlayTint: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  playOverlay: { position: 'absolute', top: '40%', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.35)', padding: 10, borderRadius: 24 },
  previewFilename: { color: COLORS.text.secondary, fontSize: FONTS.size.sm, marginTop: 8 },
  link: { color: COLORS.accent.primary, marginTop: 6, textDecorationLine: 'underline' },
  timeline: { marginTop: SIZES.spacing.md, backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, padding: SIZES.spacing.md, borderWidth: 1, borderColor: COLORS.border.primary },
  timelineThumbs: { height: 56, backgroundColor: COLORS.background.secondary, borderRadius: 8, marginBottom: 8 },
  waveform: { height: 40, backgroundColor: COLORS.background.secondary, borderRadius: 8 },
  howToBox: { marginTop: SIZES.spacing.md, backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, padding: SIZES.spacing.md, borderWidth: 1, borderColor: COLORS.border.primary },
  howToTitle: { color: COLORS.text.primary, fontWeight: FONTS.weight.bold, marginBottom: 6 },
  howToStep: { color: COLORS.text.secondary, marginTop: 2 },
  // Right panel
  editPanel: { width: 300, padding: SIZES.spacing.md, borderLeftWidth: 1, borderLeftColor: COLORS.border.primary },
  cropBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background.card, borderRadius: SIZES.radius.md, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border.primary, marginBottom: SIZES.spacing.md },
  cropText: { color: COLORS.text.primary, fontWeight: FONTS.weight.semibold },
  sectionLabel: { color: COLORS.text.primary, fontWeight: FONTS.weight.semibold, marginBottom: 6 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  filterChip: { backgroundColor: COLORS.background.card, borderWidth: 1, borderColor: COLORS.border.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  filterChipText: { color: COLORS.text.primary, fontWeight: FONTS.weight.semibold },
  row: { flexDirection: 'row', alignItems: 'center', gap: SIZES.spacing.md, marginBottom: SIZES.spacing.md },
  col: { flex: 1 },
  label: { color: COLORS.text.secondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: SIZES.radius.sm, paddingHorizontal: 10, paddingVertical: 8, color: COLORS.text.primary },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.border.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  toggleOn: { backgroundColor: COLORS.accent.primary, borderColor: COLORS.accent.primary },
  toggleText: { color: COLORS.text.primary },
  saveBtn: { backgroundColor: COLORS.accent.primary, borderRadius: SIZES.radius.md, alignItems: 'center', paddingVertical: SIZES.spacing.md, marginTop: SIZES.spacing.md },
  saveBtnText: { color: COLORS.background.primary, fontWeight: FONTS.weight.bold },
});

// Small UI helpers
const ToolButton = ({ active, icon, label, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.toolBtn, active && styles.toolBtnActive]}>
    <Ionicons name={icon} size={20} color={active ? COLORS.accent.primary : COLORS.text.secondary} />
    <Text style={[styles.toolLabel, active && { color: COLORS.accent.primary }]}>{label}</Text>
  </TouchableOpacity>
);

const PanelRow = ({ label, children }) => (
  <View style={{ marginBottom: SIZES.spacing.md }}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {children}
  </View>
);

// Minimal number slider with +/- controls (no dependency on community slider)
const NumberSlider = ({ value, setValue, min = 0, max = 100, step = 1, suffix = '' }) => {
  const clamp = (n) => Math.max(min, Math.min(max, n));
  const minus = () => setValue(clamp((Number(value) || 0) - step));
  const plus = () => setValue(clamp((Number(value) || 0) + step));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity onPress={minus} style={{ borderWidth:1, borderColor: COLORS.border.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text style={{ color: COLORS.text.primary }}>-</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, height: 10, backgroundColor: COLORS.background.secondary, borderRadius: 6, overflow: 'hidden' }}>
        <View style={{ width: `${((Number(value)||0)-min)/(max-min)*100}%`, height: '100%', backgroundColor: COLORS.accent.primary }} />
      </View>
      <TouchableOpacity onPress={plus} style={{ borderWidth:1, borderColor: COLORS.border.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
        <Text style={{ color: COLORS.text.primary }}>+</Text>
      </TouchableOpacity>
      <Text style={{ color: COLORS.text.secondary, width: 56, textAlign: 'right' }}>{Math.round(Number(value))}{suffix}</Text>
    </View>
  );
};

// Replace handler: selects a new video from device/web and updates the current item URL
async function handleUploadReplace(currentItem, setItem) {
  try {
    let picked;
    if (Platform.OS === 'web') {
      picked = await new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*,image/*';
        input.onchange = () => {
          const f = input.files && input.files[0];
          if (!f) return reject(new Error('No file'));
          resolve({ _raw: f, name: f.name, type: f.type });
        };
        input.click();
      });
    } else {
      const moduleName='expo-document-picker'; const picker=await import(moduleName); const {getDocumentAsync}=picker;
      const res = await getDocumentAsync({ type: ['video/*', 'image/*'] });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      picked = { uri: asset.uri, name: asset.name || 'media', type: asset.mimeType || 'application/octet-stream' };
    }
    const filePart = Platform.OS === 'web' ? picked._raw : picked;
    const upload = await api.uploadFile(filePart);
    const url = upload?.file?.url || upload?.data?.file?.url || upload?.url;
    if (!url) throw new Error('Upload did not return a URL');
    setItem((prev) => ({ ...prev, url }));
  } catch (e) {
    Alert.alert('Upload', e?.message || 'Failed to upload');
  }
}

// Very light color ring stub – adjusts hue only
const ColorRing = ({ hue, setHue }) => (
  <View style={{ alignItems: 'center' }}>
    <HueWheel hue={hue} onChange={setHue} size={140} />
    <View style={{ height: 8 }} />
    <NumberSlider value={hue} setValue={setHue} min={0} max={360} step={1} />
  </View>
);

// Seek bar for timeline - click to set position
const SeekBar = ({ positionSec, durationSec, onSeek, startSec = 0, endSec, onTrimStart, onTrimEnd, onScrubStart, onScrubEnd }) => {
  const pct = durationSec ? Math.min(100, Math.max(0, (positionSec / durationSec) * 100)) : 0;
  const end = typeof endSec === 'number' ? endSec : durationSec;
  const startPct = (startSec / durationSec) * 100;
  const endPct = (end / durationSec) * 100;
  // track drag state across presses
  const dragging = useRef(null); // 'playhead' | 'start' | 'end'
  const containerRef = useRef(null);
  const getWidth = () => {
    try {
      if (containerRef.current?.measure) {
        // RN Native measure is async; fallback to layout width from event
        return null;
      }
      return containerRef.current?.clientWidth || null;
    } catch { return null; }
  };
  const posToSec = (x, width) => {
    const w = width || getWidth() || 1;
    const p = Math.max(0, Math.min(1, x / w));
    return Math.round(p * durationSec);
  };
  const handleDown = (e) => {
    const width = e.nativeEvent?.layout?.width || e.currentTarget?.clientWidth || 1;
    const x = e.nativeEvent?.locationX ?? 0;
    const sec = posToSec(x, width);
    // Detect proximity to handles
    const startX = (startSec / durationSec) * width;
    const endX = (end / durationSec) * width;
    if (Math.abs(x - startX) < 12) dragging.current = 'start';
    else if (Math.abs(x - endX) < 12) dragging.current = 'end';
    else dragging.current = 'playhead';
    onScrubStart && onScrubStart();
    if (dragging.current === 'playhead') onSeek(sec);
  };
  const handleMove = (e) => {
    if (!dragging.current) return;
    const width = e.nativeEvent?.layout?.width || e.currentTarget?.clientWidth || 1;
    const x = e.nativeEvent?.locationX ?? 0;
    const sec = posToSec(x, width);
    if (dragging.current === 'start') onTrimStart && onTrimStart(sec);
    else if (dragging.current === 'end') onTrimEnd && onTrimEnd(sec);
    else onSeek(sec);
  };
  const handleUp = () => { dragging.current = null; onScrubEnd && onScrubEnd(); };

  return (
    <Pressable
      ref={containerRef}
      onPress={(e) => { /* handled via down/move/end */ }}
      onResponderGrant={handleDown}
      onStartShouldSetResponder={() => true}
      onResponderMove={handleMove}
      onResponderRelease={handleUp}
      style={{ height: 44, justifyContent: 'center' }}
    >
      <View style={{ height: 10, backgroundColor: COLORS.background.secondary, borderRadius: 5, overflow: 'hidden' }}>
        {/* Active region */}
        <View style={{ position: 'absolute', left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%`, height: '100%', backgroundColor: COLORS.background.tertiary }} />
        {/* Progress */}
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: COLORS.accent.primary }} />
        {/* Handles */}
        <View style={{ position: 'absolute', left: `${startPct}%`, top: -6, width: 6, height: 22, backgroundColor: COLORS.accent.primary, borderRadius: 3 }} />
        <View style={{ position: 'absolute', left: `calc(${endPct}% - 6px)`, top: -6, width: 6, height: 22, backgroundColor: COLORS.accent.primary, borderRadius: 3 }} />
      </View>
    </Pressable>
  );
};

// Upload and preview music helper
async function handleUploadMusic(setMusicUrl, musicSoundRef) {
  try {
    let picked;
    if (Platform.OS === 'web') {
      picked = await new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = () => {
          const f = input.files && input.files[0];
          if (!f) return reject(new Error('No file'));
          resolve({ _raw: f, name: f.name, type: f.type });
        };
        input.click();
      });
    } else {
      const moduleName='expo-document-picker'; const picker=await import(moduleName); const {getDocumentAsync}=picker;
      const res = await getDocumentAsync({ type: 'audio/*' });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      picked = { uri: asset.uri, name: asset.name || 'track.mp3', type: asset.mimeType || 'audio/mpeg' };
    }
    const filePart = Platform.OS === 'web' ? picked._raw : picked;
    const upload = await api.uploadFile(filePart, 'file');
    const url = upload?.file?.url || upload?.data?.file?.url || upload?.url;
    if (!url) throw new Error('Upload did not return a URL');
    setMusicUrl(url);
    // Prepare Audio.Sound
    if (musicSoundRef.current) {
      try { await musicSoundRef.current.unloadAsync(); } catch {}
      musicSoundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false, volume: 1.0 });
    musicSoundRef.current = sound;
  } catch (e) {
    Alert.alert('Music', e?.message || 'Failed to upload music');
  }
}

// Simple Hue wheel with drag
const HueWheel = ({ hue, onChange, size = 140 }) => {
  const radius = size / 2;
  const ringWidth = 14;
  const onTouch = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    const dx = locationX - radius;
    const dy = locationY - radius;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
    const deg = (angle + 360) % 360;
    onChange(Math.round(deg));
  };
  const knobX = radius + (radius - ringWidth / 2) * Math.cos((hue * Math.PI) / 180);
  const knobY = radius + (radius - ringWidth / 2) * Math.sin((hue * Math.PI) / 180);
  return (
    <View
      style={{ width: size, height: size, borderRadius: radius, borderWidth: ringWidth, borderColor: `hsl(${hue}, 80%, 50%)`, position: 'relative' }}
      onStartShouldSetResponder={() => true}
      onResponderGrant={onTouch}
      onResponderMove={onTouch}
    >
      <View style={{ position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: '#000', left: knobX - 8, top: knobY - 8 }} />
    </View>
  );
};



