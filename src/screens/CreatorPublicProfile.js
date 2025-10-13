import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import api from '../services/api';

/**
 * Public-facing creator profile for followers
 * Shows content, bio, stats, and follow button
 */
export default function CreatorPublicProfile({ route, navigation }) {
  const { creatorId } = route.params || {};
  const [creator, setCreator] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (creatorId) {
      fetchCreatorData();
    }
  }, [creatorId]);

  const fetchCreatorData = async () => {
    try {
      const [creatorRes, contentRes] = await Promise.all([
        api.getCreatorProfile(creatorId),
        api.getCreatorContent(creatorId),
      ]);

      setCreator(creatorRes.data);
      setContent(contentRes.data || []);
      setIsFollowing(creatorRes.data?.isFollowing || false);
    } catch (error) {
      console.error('Error fetching creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.unfollowCreator(creatorId);
        setIsFollowing(false);
      } else {
        await api.followCreator(creatorId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!creator) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Creator not found</Text>
          <Button label="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with cover image */}
        <View style={styles.coverContainer}>
          {creator.coverImage ? (
            <Image source={{ uri: creator.coverImage }} style={styles.coverImage} />
          ) : (
            <LinearGradient
              colors={[COLORS.accent.primary, COLORS.accent.secondary]}
              style={styles.coverGradient}
            />
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: creator.avatar || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{creator.name}</Text>
          {creator.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.accent.success} />
              <Text style={styles.verifiedText}>Verified Creator</Text>
            </View>
          )}

          {creator.bio && <Text style={styles.bio}>{creator.bio}</Text>}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{creator.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{creator.programsCount || 0}</Text>
              <Text style={styles.statLabel}>Programs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{creator.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Follow Button */}
          <Button
            label={isFollowing ? 'Following' : 'Follow'}
            onPress={handleFollow}
            icon={isFollowing ? 'checkmark' : 'add'}
            type={isFollowing ? 'outline' : 'primary'}
            style={styles.followButton}
          />
        </View>

        {/* Content Tabs */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Content</Text>
          
          {content.length === 0 ? (
            <View style={styles.emptyContent}>
              <Ionicons name="cube-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyText}>No content yet</Text>
            </View>
          ) : (
            <View style={styles.contentGrid}>
              {content.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.contentCard}
                  onPress={() => navigation.navigate('ContentDetail', { id: item._id })}
                >
                  <Image source={{ uri: item.thumbnail }} style={styles.contentThumbnail} />
                  <View style={styles.contentInfo}>
                    <Text style={styles.contentTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.contentMeta}>
                      <Ionicons name="eye-outline" size={14} color={COLORS.text.tertiary} />
                      <Text style={styles.contentMetaText}>{item.views || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  coverContainer: {
    height: 200,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: SIZES.spacing.lg,
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.background.primary,
    backgroundColor: COLORS.background.secondary,
  },
  name: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginTop: SIZES.spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.xs,
  },
  verifiedText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginLeft: SIZES.spacing.xs,
  },
  bio: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SIZES.spacing.md,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  statLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginTop: SIZES.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border.primary,
  },
  followButton: {
    marginTop: SIZES.spacing.lg,
    minWidth: 150,
  },
  contentSection: {
    padding: SIZES.spacing.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.md,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.spacing.md,
  },
  contentCard: {
    width: '48%',
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  contentThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.background.secondary,
  },
  contentInfo: {
    padding: SIZES.spacing.md,
  },
  contentTitle: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
    marginBottom: SIZES.spacing.xs,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentMetaText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginLeft: SIZES.spacing.xs,
  },
  emptyContent: {
    alignItems: 'center',
    padding: SIZES.spacing.xxl,
  },
  emptyText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.tertiary,
    marginTop: SIZES.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTS.size.md,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.lg,
  },
  errorText: {
    fontSize: FONTS.size.lg,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.lg,
  },
});

