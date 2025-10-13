import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Program } from '../../../services/api';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../../constants/theme';
import { trackProgramClick } from '../../../services/events';

export interface ProgramCardProps {
  program: Program;
  source: 'trending' | 'programs' | 'home';
  onPress?: (program: Program) => void;
  onAdd?: (program: Program) => void;
  isAdding?: boolean;
  position?: number;
}

/**
 * Program card component for Discover lists
 * Displays program information with action buttons
 */
export function ProgramCard({
  program,
  source,
  onPress,
  onAdd,
  isAdding = false,
  position,
}: ProgramCardProps) {
  const handlePress = () => {
    trackProgramClick(program.id, source, position);
    onPress?.(program);
  };

  const handleAdd = (e: any) => {
    e?.stopPropagation?.();
    onAdd?.(program);
  };

  // Format price
  const price = program.priceCents === 0 
    ? 'Free' 
    : `$${(program.priceCents / 100).toFixed(2)}`;

  // Get thumbnail URL with fallback
  const thumbnailUrl = program.coverUrl || program.thumbnail || program.media?.hero || 
    'https://via.placeholder.com/88x56/1A1A24/00FFFF?text=Program';

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Image 
          source={{ uri: thumbnailUrl }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {program.title}
          </Text>
          
          {program.coach && (
            <Text style={styles.coach} numberOfLines={1}>
              {program.coach}
            </Text>
          )}
          
          <View style={styles.metaRow}>
            {program.duration && (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
                <Text style={styles.metaText}>{program.duration}</Text>
              </View>
            )}
            
            {program.duration && program.rating && (
              <Text style={styles.metaDivider}>•</Text>
            )}
            
            {program.rating && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color={COLORS.accent.warning} />
                <Text style={styles.metaText}>{program.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={[styles.price, program.priceCents === 0 && styles.priceFree]}>
            {price}
          </Text>
          {program.followers && (
            <Text style={styles.followers}>
              {program.followers >= 1000 
                ? `${(program.followers / 1000).toFixed(1)}k` 
                : program.followers} enrolled
            </Text>
          )}
        </View>
        
        {onAdd && (
          <TouchableOpacity 
            style={[styles.addButton, isAdding && styles.addButtonDisabled]} 
            onPress={handleAdd}
            disabled={isAdding}
          >
            <Ionicons 
              name={isAdding ? "checkmark" : "add"} 
              size={18} 
              color={isAdding ? COLORS.accent.success : COLORS.background.primary} 
            />
            <Text style={[styles.addButtonText, isAdding && styles.addButtonTextDisabled]}>
              {isAdding ? 'Added' : 'Add'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  thumbnail: {
    width: 88,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    marginRight: SIZES.spacing.md,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  coach: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  metaDivider: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.tertiary,
    marginHorizontal: SIZES.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  priceFree: {
    color: COLORS.accent.success,
  },
  followers: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent.primary,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.accent.success,
  },
  addButtonText: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.background.primary,
  },
  addButtonTextDisabled: {
    color: COLORS.accent.success,
  },
});

export default ProgramCard;

