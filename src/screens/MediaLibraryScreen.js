import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { getMediaLibrary } from '../services/mediaLibrary';
import api from '../services/api';

export default function MediaLibraryScreen({ navigation, route }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(Boolean(route?.params?.bulkAttach));
  const [selected, setSelected] = useState([]); // [{ url, type, name, uploadedAt, status, trimStartS, trimEndS }]
  const [coverUrl, setCoverUrl] = useState(null);
  const [focusedItem, setFocusedItem] = useState(null); // preview without auto-attaching
  const [DraggableFlatListComp, setDraggableFlatListComp] = useState(null);

  const blockIndex = route?.params?.blockIndex ?? null;

  useEffect(() => {
    (async () => {
      try {
        // Prefer server-backed data
        const res = await api.getMediaItems();
        const serverItems = res?.items || res?.data?.items || [];
        if (Array.isArray(serverItems)) {
          setItems(serverItems.map(it => ({
            url: it.url,
            type: it.type || ((it.url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'video'),
            name: it.name,
            uploadedAt: it.uploadedAt,
            status: it.status,
            cloudinaryId: it.cloudinaryId,
            processedUrl: it.processedUrl,
            thumbnailUrl: it.thumbnailUrl,
          })));
        } else {
          throw new Error('Invalid server response');
        }
        // Try to load draggable list; fallback gracefully if not installed
        try {
          const mod = await import('react-native-draggable-flatlist');
          setDraggableFlatListComp(() => mod.default || mod.DraggableFlatList || null);
        } catch {}
      } catch (e) {
        // Fallback to local-only library
        try {
          const data = await getMediaLibrary();
          setItems(data);
        } catch (err) {
          Alert.alert('Error', err?.message || 'Failed to load media library');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = (item) => {
    if (item.status && item.status !== 'ready') {
      Alert.alert('Not ready', 'This asset is not ready to attach yet.');
      return;
    }
    if (!selectMode) {
      // Browse mode: show preview and allow explicit attach, do not auto-navigate
      setFocusedItem(item);
    } else {
      // toggle in selection
      const exists = selected.find((s) => s.url === item.url);
      if (exists) {
        setSelected((prev) => prev.filter((s) => s.url !== item.url));
        if (coverUrl === item.url) setCoverUrl(null);
      } else {
        const entry = { ...item, trimStartS: '', trimEndS: '' };
        setSelected((prev) => [...prev, entry]);
      }
    }
  };

  const isSelected = (url) => selected.some((s) => s.url === url);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.item, isSelected(item.url) && styles.itemSelected]} 
      onPress={() => handleSelect(item)}
      onLongPress={() => {
        if (!selectMode) {
          setSelectMode(true);
          handleSelect(item);
        }
      }}
    >
      <View style={styles.thumb}>
        {item.type === 'image' ? (
          <View style={styles.imagePlaceholder} />
        ) : (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={18} color={COLORS.background.primary} />
          </View>
        )}
        {/* Selection checkbox overlay */}
        {selectMode && (
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected(item.url) && styles.checkboxSelected]}>
              {isSelected(item.url) && (
                <Ionicons name="checkmark" size={16} color={COLORS.background.primary} />
              )}
            </View>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>{item.name || item.url}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {new Date(item.uploadedAt || Date.now()).toLocaleString()}
          {item.status && item.status !== 'ready' ? ` • ${item.status}` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity onPress={() => navigation.navigate('CreatorClipEditor', { url: item.url, returnTo: { name: route?.name || 'MediaLibrary', params: route?.params || {} } })} style={{ padding: 6 }}>
          <Ionicons name="construct" size={18} color={COLORS.text.secondary} />
        </TouchableOpacity>
        {selectMode ? (
          isSelected(item.url) ? <Ionicons name="checkbox" size={20} color={COLORS.accent.primary} /> : <Ionicons name="square-outline" size={20} color={COLORS.text.secondary} />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={COLORS.text.secondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const moveSelected = (index, dir) => {
    setSelected((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const onChangeTrim = (idx, field, value) => {
    // numeric only
    const clean = value.replace(/[^0-9]/g, '');
    setSelected((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: clean } : s));
  };

  const confirmAttach = () => {
    if (selected.length === 0) {
      Alert.alert('Nothing selected', 'Please select at least one asset.');
      return;
    }
    // Default cover to first if none picked
    const cover = coverUrl || selected[0].url;
    const payload = selected.map((s, order) => ({
      url: s.url,
      type: s.type,
      name: s.name,
      trimStartS: s.trimStartS ? Number(s.trimStartS) : undefined,
      trimEndS: s.trimEndS ? Number(s.trimEndS) : undefined,
      cover: s.url === cover,
      order,
    }));
    navigation.navigate('NewWorkout', { assignBlockIndex: blockIndex, bulkBlockMedia: payload });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Media Library</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.accent.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(it, idx) => `${it.url}-${idx}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="images-outline" size={48} color={COLORS.text.tertiary} />
                <Text style={styles.emptyText}>No media yet. Upload from Creator or New Workout.</Text>
              </View>
            }
          />

          {selectMode && (
            <View style={styles.selectionPanel}>
              <Text style={styles.panelTitle}>Selected ({selected.length})</Text>
              {DraggableFlatListComp ? (
                <DraggableFlatListComp
                  data={selected}
                  keyExtractor={(it) => it.url}
                  onDragEnd={({ data }) => setSelected(data)}
                  renderItem={({ item: s, index: idx, drag, isActive }) => (
                    <View key={s.url} style={[styles.selRow, isActive && { opacity: 0.9 }]}> 
                      <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
                        <Ionicons name="reorder-three" size={20} color={COLORS.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setCoverUrl(s.url)} style={[styles.coverChip, (coverUrl ? coverUrl === s.url : idx === 0) && styles.coverChipActive]}>
                        <Text style={styles.coverChipText}>{(coverUrl ? coverUrl === s.url : idx === 0) ? 'Cover' : 'Set Cover'}</Text>
                      </TouchableOpacity>
                      <Text numberOfLines={1} style={styles.selName}>{s.name || s.url}</Text>
                      <View style={styles.trimBox}>
                        <Text style={styles.trimLabel}>Start</Text>
                        <TextInput value={String(s.trimStartS || '')} onChangeText={(v) => onChangeTrim(idx, 'trimStartS', v)} style={styles.trimInput} keyboardType="numeric" />
                      </View>
                      <View style={styles.trimBox}>
                        <Text style={styles.trimLabel}>End</Text>
                        <TextInput value={String(s.trimEndS || '')} onChangeText={(v) => onChangeTrim(idx, 'trimEndS', v)} style={styles.trimInput} keyboardType="numeric" />
                      </View>
                      <TouchableOpacity onPress={() => handleSelect(s)} style={styles.removeBtn}><Ionicons name="close" size={16} color={COLORS.text.primary} /></TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                selected.map((s, idx) => (
                  <View key={s.url} style={styles.selRow}>
                    <TouchableOpacity onPress={() => setCoverUrl(s.url)} style={[styles.coverChip, (coverUrl ? coverUrl === s.url : idx === 0) && styles.coverChipActive]}>
                      <Text style={styles.coverChipText}>{(coverUrl ? coverUrl === s.url : idx === 0) ? 'Cover' : 'Set Cover'}</Text>
                    </TouchableOpacity>
                    <Text numberOfLines={1} style={styles.selName}>{s.name || s.url}</Text>
                    <View style={styles.trimBox}>
                      <Text style={styles.trimLabel}>Start</Text>
                      <TextInput value={String(s.trimStartS || '')} onChangeText={(v) => onChangeTrim(idx, 'trimStartS', v)} style={styles.trimInput} keyboardType="numeric" />
                    </View>
                    <View style={styles.trimBox}>
                      <Text style={styles.trimLabel}>End</Text>
                      <TextInput value={String(s.trimEndS || '')} onChangeText={(v) => onChangeTrim(idx, 'trimEndS', v)} style={styles.trimInput} keyboardType="numeric" />
                    </View>
                    <View style={styles.moveCol}>
                      <TouchableOpacity onPress={() => moveSelected(idx, -1)} style={styles.moveBtn}><Ionicons name="arrow-up" size={16} color={COLORS.text.primary} /></TouchableOpacity>
                      <TouchableOpacity onPress={() => moveSelected(idx, 1)} style={styles.moveBtn}><Ionicons name="arrow-down" size={16} color={COLORS.text.primary} /></TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => handleSelect(s)} style={styles.removeBtn}><Ionicons name="close" size={16} color={COLORS.text.primary} /></TouchableOpacity>
                  </View>
                ))
              )}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity disabled={selected.length === 0} onPress={confirmAttach} style={[styles.attachCta, selected.length === 0 && { opacity: 0.5 }]}>
                  <Text style={styles.attachCtaText}>Attach to Block</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={selected.length === 0} onPress={() => navigation.navigate('CreatorTimelineEditor', { clips: selected })} style={[styles.attachCta, selected.length === 0 && { opacity: 0.5 }]}>
                  <Text style={styles.attachCtaText}>Open Timeline Editor</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {!selectMode && focusedItem && (
            <View style={styles.selectionPanel}>
              <Text style={styles.panelTitle}>Preview</Text>
              <View style={styles.selRow}>
                <Text numberOfLines={1} style={styles.selName}>{focusedItem.name || focusedItem.url}</Text>
                <TouchableOpacity onPress={() => setFocusedItem(null)} style={styles.removeBtn}><Ionicons name="close" size={16} color={COLORS.text.primary} /></TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                {blockIndex !== null ? (
                  <TouchableOpacity onPress={() => navigation.navigate('NewWorkout', { mediaUrl: focusedItem.url, assignBlockIndex: blockIndex })} style={styles.attachCta}>
                    <Text style={styles.attachCtaText}>Attach to Block</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => { try { navigator.clipboard?.writeText(focusedItem.url); } catch {} }} style={[styles.attachCta, { backgroundColor: COLORS.background.secondary }] }>
                  <Text style={[styles.attachCtaText, { color: COLORS.text.primary }]}>Copy URL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
  },
  backButton: {
    padding: SIZES.spacing.xs,
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: SIZES.spacing.md,
    paddingBottom: SIZES.spacing.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    padding: SIZES.spacing.md,
    borderRadius: SIZES.radius.md,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.small,
  },
  itemSelected: {
    borderWidth: 1,
    borderColor: COLORS.accent.primary,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkboxContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.text.primary,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.accent.primary,
    borderColor: COLORS.accent.primary,
    marginRight: SIZES.spacing.md,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: 4,
  },
  videoBadge: {
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  meta: {
    flex: 1,
  },
  name: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
  },
  sub: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.sm,
  },
  empty: {
    alignItems: 'center',
    marginTop: SIZES.spacing.xl,
  },
  emptyText: {
    marginTop: SIZES.spacing.sm,
    color: COLORS.text.secondary,
  },
  selectionPanel: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border.primary,
    padding: SIZES.spacing.md,
    backgroundColor: COLORS.background.primary,
  },
  panelTitle: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.sm,
  },
  selRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
  },
  selName: {
    flex: 1,
    color: COLORS.text.primary,
  },
  trimBox: {
    alignItems: 'center',
  },
  trimLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
  },
  trimInput: {
    width: 56,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: SIZES.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: COLORS.text.primary,
  },
  moveCol: {
    alignItems: 'center',
    gap: 4,
  },
  moveBtn: {
    padding: 4,
  },
  removeBtn: {
    padding: 4,
  },
  coverChip: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coverChipActive: {
    borderColor: COLORS.accent.primary,
  },
  coverChipText: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xs,
  },
  attachCta: {
    marginTop: SIZES.spacing.md,
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    alignItems: 'center',
    paddingVertical: SIZES.spacing.md,
  },
  attachCtaText: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weight.bold,
  },
});


