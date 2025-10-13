/**
 * ProgressPhotos - Progress photos gallery (read-only)
 * Display-only; photo capture handled by Agent 3
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../../constants/theme';

export interface ProgressPhoto {
  id: string;
  date: string;
  uri: string;
  note?: string;
}

interface ProgressPhotosProps {
  photos: ProgressPhoto[];
  onPhotoPress?: (photo: ProgressPhoto) => void;
  onAddPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - SIZES.spacing.lg * 2 - SIZES.spacing.sm * 2) / 3;

export function ProgressPhotos({ photos, onPhotoPress, onAddPress }: ProgressPhotosProps) {
  if (photos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress Photos</Text>
        </View>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="camera-outline" size={48} color={COLORS.text.tertiary} />
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>
            Photo capture coming soon (Agent 3)
          </Text>
        </View>
      </View>
    );
  }

  const renderPhoto = ({ item }: { item: ProgressPhoto }) => {
    const date = new Date(item.date);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

    return (
      <TouchableOpacity
        style={styles.photoCard}
        onPress={() => onPhotoPress?.(item)}
      >
        <Image source={{ uri: item.uri }} style={styles.photoImage} />
        <Text style={styles.photoDate}>{dateStr}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Photos</Text>
        {onAddPress && (
          <TouchableOpacity onPress={onAddPress} style={styles.addButton}>
            <Ionicons name="add" size={20} color={COLORS.accent.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.md,
  },
  title: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.accent.primary,
  },
  emptyContainer: {
    paddingVertical: SIZES.spacing.xxl,
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  emptyText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.secondary,
  },
  emptySubtext: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  grid: {
    gap: SIZES.spacing.sm,
  },
  row: {
    gap: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.sm,
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    backgroundColor: COLORS.background.primary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoDate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    fontSize: FONTS.size.xs,
    padding: 4,
    textAlign: 'center',
  },
});

