import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, ScrollView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';

function isImageUrl(url) {
  if (!url) return false;
  return /(\.jpeg|\.jpg|\.png|\.gif|\.webp)(\?.*)?$/i.test(url);
}

function isVideoUrl(url) {
  if (!url) return false;
  return /(\.mp4|\.mov|\.avi|\.mkv)(\?.*)?$/i.test(url);
}

export default function CreatorDraftsScreen({ route, navigation }) {
  const justUploadedUrl = route?.params?.justUploaded || null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Drafts</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {!justUploadedUrl ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color={COLORS.accent.primary} />
            <Text style={styles.emptyTitle}>No drafts yet</Text>
            <Text style={styles.emptyText}>
              Upload media from the Creator Studio to see it here as a draft.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('CreatorHub')}
            >
              <Text style={styles.primaryBtnText}>Go to Creator Studio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Latest upload</Text>
            {isImageUrl(justUploadedUrl) ? (
              <Image source={{ uri: justUploadedUrl }} style={styles.previewImage} resizeMode="cover" />
            ) : isVideoUrl(justUploadedUrl) ? (
              <View style={styles.videoFallback}>
                <Ionicons name="videocam" size={28} color={COLORS.text.secondary} />
                <Text style={styles.videoText}>Video uploaded</Text>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => Linking.openURL(justUploadedUrl)}
                >
                  <Text style={styles.linkBtnText}>Open video</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.videoFallback}>
                <Ionicons name="document" size={28} color={COLORS.text.secondary} />
                <Text style={styles.videoText}>File uploaded</Text>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => Linking.openURL(justUploadedUrl)}
                >
                  <Text style={styles.linkBtnText}>Open file</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.urlRow}>
              <Text style={styles.urlLabel}>URL</Text>
              <Text numberOfLines={2} style={styles.urlValue}>{justUploadedUrl}</Text>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('CreatorHub')}>
                <Text style={styles.secondaryBtnText}>Back to Studio</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('NewWorkout', { mediaUrl: justUploadedUrl })}
              >
                <Text style={styles.primaryBtnText}>Attach to Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    padding: SIZES.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.lg,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
  },
  closeBtn: {
    padding: SIZES.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: SIZES.spacing.xl,
  },
  emptyTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    marginTop: SIZES.spacing.md,
    marginBottom: SIZES.spacing.xs,
  },
  emptyText: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.md,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.spacing.lg,
  },
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.md,
    ...SHADOWS.medium,
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    marginBottom: SIZES.spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.background.secondary,
    marginBottom: SIZES.spacing.md,
  },
  videoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.background.secondary,
    marginBottom: SIZES.spacing.md,
  },
  videoText: {
    color: COLORS.text.secondary,
    marginTop: 6,
    marginBottom: 8,
  },
  linkBtn: {
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    backgroundColor: COLORS.accent.primary,
  },
  linkBtnText: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weight.bold,
  },
  urlRow: {
    marginTop: SIZES.spacing.sm,
    marginBottom: SIZES.spacing.md,
  },
  urlLabel: {
    color: COLORS.text.secondary,
    fontSize: FONTS.size.xs,
    marginBottom: 4,
  },
  urlValue: {
    color: COLORS.text.primary,
    fontSize: FONTS.size.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SIZES.spacing.md,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.accent.primary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.background.primary,
    fontWeight: FONTS.weight.bold,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border.primary,
  },
  secondaryBtnText: {
    color: COLORS.text.primary,
    fontWeight: FONTS.weight.semibold,
  },
});


