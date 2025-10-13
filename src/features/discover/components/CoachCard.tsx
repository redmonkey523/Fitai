import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Coach } from '../../../services/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../../constants/theme';
import { trackCoachClick, trackCoachFollow } from '../../../services/events';

export interface CoachCardProps {
  coach: Coach;
  source: 'coaches' | 'home';
  onPress?: (coach: Coach) => void;
  onFollow?: (coach: Coach) => void;
  isFollowing?: boolean;
  position?: number;
}

/**
 * Coach card component for Discover lists
 * Displays coach information with follow button
 */
export function CoachCard({
  coach,
  source,
  onPress,
  onFollow,
  isFollowing = false,
  position,
}: CoachCardProps) {
  const handlePress = () => {
    trackCoachClick(coach.id, source, position);
    onPress?.(coach);
  };

  const handleFollow = (e: any) => {
    e?.stopPropagation?.();
    trackCoachFollow(coach.id, source);
    onFollow?.(coach);
  };

  // Get avatar URL with fallback
  const avatarUrl = coach.avatarUrl || 
    'https://via.placeholder.com/56/1A1A24/00FFFF?text=' + (coach.name?.[0] || 'C');

  // Format followers count
  const followersText = coach.followers 
    ? coach.followers >= 1000 
      ? `${(coach.followers / 1000).toFixed(1)}k followers`
      : `${coach.followers} followers`
    : '';

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={styles.avatar}
          resizeMode="cover"
        />
        
        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {coach.name}
            </Text>
            {coach.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.accent.success} />
              </View>
            )}
          </View>
          
          {coach.specialty && (
            <Text style={styles.specialty} numberOfLines={2}>
              {coach.specialty}
            </Text>
          )}
          
          <View style={styles.metaRow}>
            {coach.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={COLORS.accent.warning} />
                <Text style={styles.rating}>{coach.rating.toFixed(1)}</Text>
              </View>
            )}
            
            {followersText && (
              <>
                {coach.rating && <Text style={styles.metaDivider}>•</Text>}
                <Text style={styles.followers}>{followersText}</Text>
              </>
            )}
          </View>
        </View>
      </View>
      
      {onFollow && (
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followButtonActive]} 
          onPress={handleFollow}
        >
          <Ionicons 
            name={isFollowing ? "checkmark" : "person-add"} 
            size={18} 
            color={isFollowing ? COLORS.accent.success : COLORS.background.primary} 
          />
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: SIZES.spacing.md,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    ...SHADOWS.small,
  },
  content: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background.secondary,
    marginRight: SIZES.spacing.md,
    borderWidth: 2,
    borderColor: COLORS.border.primary,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: SIZES.spacing.xs,
  },
  specialty: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    fontWeight: FONTS.weight.medium,
  },
  metaDivider: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginHorizontal: SIZES.spacing.sm,
  },
  followers: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: 8,
    gap: 6,
  },
  followButtonActive: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.accent.success,
  },
  followButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.background.primary,
  },
  followButtonTextActive: {
    color: COLORS.accent.success,
  },
});

export default CoachCard;

