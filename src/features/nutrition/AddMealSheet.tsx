/**
 * AddMealSheet - 5-second meal logging bottom sheet
 * Optimized for speed: Search, Recents, Barcode, Quick Add
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useFoodSearch, type FoodItem } from './hooks/useFoodSearch';
import { useRecents } from './hooks/useRecents';
import { useLogMeal } from './hooks/useLogMeal';
import eventService from '../../services/events';

interface AddMealSheetProps {
  visible: boolean;
  date: string;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AddMealSheet({ visible, date, onClose }: AddMealSheetProps) {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [serving, setServing] = useState(1);
  const startTimeRef = useRef<number>(0);

  const { foods, isSearching } = useFoodSearch(query);
  const { recents, addRecent } = useRecents();
  const { logMeal, isLogging } = useLogMeal();

  // Track time when sheet opens
  useEffect(() => {
    if (visible) {
      startTimeRef.current = Date.now();
      eventService.emit('meal_add_open', { date });
    }
  }, [visible, date]);

  const handleClose = () => {
    setQuery('');
    setSelectedFood(null);
    setServing(1);
    onClose();
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuery(''); // Clear search to show portion UI
  };

  const handleAdd = async () => {
    if (!selectedFood) return;

    const duration = Date.now() - startTimeRef.current;
    const now = new Date();
    const time = now.toTimeString().slice(0, 5); // HH:MM

    const meal = {
      date,
      time,
      name: selectedFood.name,
      foodId: selectedFood.id,
      serving,
      unit: selectedFood.unit || 'serving',
      kcal: Math.round(selectedFood.macros.kcal * serving),
      protein: Math.round(selectedFood.macros.protein * serving),
      carbs: Math.round(selectedFood.macros.carbs * serving),
      fat: Math.round(selectedFood.macros.fat * serving),
      source: 'search',
    };

    try {
      logMeal(meal);

      // Add to recents
      await addRecent(selectedFood);

      // Emit confirmation event with duration
      eventService.emit('meal_add_confirm', {
        duration_ms: duration,
        source: 'search',
        serving,
      });

      // Close sheet
      handleClose();
    } catch (error) {
      console.error('[AddMealSheet] Error adding meal:', error);
    }
  };

  const handleBarcodePress = () => {
    eventService.emit('barcode_button_press', { source: 'add_meal_sheet' });
    
    // Close sheet and navigate to Scan screen
    onClose();
    
    // Navigate to Scan screen with return context
    setTimeout(() => {
      try {
        navigation.navigate('Scan' as never, { 
          returnTo: 'Nutrition',
          date 
        } as never);
      } catch (error) {
        console.error('[AddMealSheet] Navigation to Scan failed:', error);
      }
    }, 100); // Small delay to let sheet close animation complete
  };

  const renderSearch = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={COLORS.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          placeholderTextColor={COLORS.text.tertiary}
          value={query}
          onChangeText={setQuery}
          autoFocus={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.barcodeButton} onPress={handleBarcodePress}>
        <Ionicons name="barcode-outline" size={24} color={COLORS.accent.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderRecents = () => {
    if (query.length > 0 || recents.length === 0) return null;

    return (
      <View style={styles.recentsContainer}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentsScroll}>
          {recents.slice(0, 10).map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.recentChip}
              onPress={() => handleSelectFood(food)}
            >
              <Text style={styles.recentName} numberOfLines={1}>
                {food.name}
              </Text>
              <Text style={styles.recentMacros}>
                {food.macros.kcal} cal • {food.macros.protein}g P
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSearchResults = () => {
    if (query.length < 2) return null;

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accent.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (foods.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={COLORS.text.tertiary} />
          <Text style={styles.emptyText}>No foods found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsContainer} keyboardShouldPersistTaps="handled">
        {foods.map((food) => (
          <TouchableOpacity
            key={food.id}
            style={styles.foodItem}
            onPress={() => handleSelectFood(food)}
          >
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodMacros}>
                {food.macros.kcal} cal • P: {food.macros.protein}g • C: {food.macros.carbs}g • F:{' '}
                {food.macros.fat}g
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderPortionSelection = () => {
    if (!selectedFood) return null;

    return (
      <View style={styles.portionContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedFood(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>

        <View style={styles.selectedFoodHeader}>
          <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
          <Text style={styles.selectedFoodUnit}>
            {selectedFood.unit || 'serving'} • {selectedFood.macros.kcal} cal
          </Text>
        </View>

        <View style={styles.servingControl}>
          <Text style={styles.servingLabel}>Servings</Text>
          <View style={styles.servingButtons}>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServing(Math.max(0.25, serving - 0.25))}
            >
              <Ionicons name="remove" size={20} color={COLORS.accent.primary} />
            </TouchableOpacity>

            <View style={styles.servingValue}>
              <Text style={styles.servingText}>{serving.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setServing(Math.min(20, serving + 0.25))}
            >
              <Ionicons name="add" size={20} color={COLORS.accent.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Macro preview */}
        <View style={styles.macroPreview}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(selectedFood.macros.kcal * serving)}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {Math.round(selectedFood.macros.protein * serving)}g
            </Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>
              {Math.round(selectedFood.macros.carbs * serving)}g
            </Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(selectedFood.macros.fat * serving)}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, isLogging && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={isLogging}
        >
          {isLogging ? (
            <ActivityIndicator size="small" color={COLORS.text.onAccent} />
          ) : (
            <Text style={styles.addButtonText}>Add to Log</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Add Meal</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          {selectedFood ? (
            renderPortionSelection()
          ) : (
            <>
              {renderSearch()}
              {renderRecents()}
              {renderSearchResults()}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background.primary,
    borderTopLeftRadius: SIZES.radius.xl,
    borderTopRightRadius: SIZES.radius.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.utility.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  title: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.md,
    gap: SIZES.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.md,
    paddingHorizontal: SIZES.spacing.md,
    height: 48,
    gap: SIZES.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.text.primary,
    paddingVertical: 0,
  },
  barcodeButton: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radius.md,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentsContainer: {
    paddingTop: SIZES.spacing.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
    paddingHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentsScroll: {
    paddingHorizontal: SIZES.spacing.lg,
  },
  recentChip: {
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: SIZES.spacing.md,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.md,
    marginRight: SIZES.spacing.sm,
    minWidth: 120,
  },
  recentName: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  recentMacros: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  loadingContainer: {
    padding: SIZES.spacing.xl,
    alignItems: 'center',
    gap: SIZES.spacing.sm,
  },
  loadingText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  emptyContainer: {
    padding: SIZES.spacing.xxl,
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
  },
  resultsContainer: {
    paddingHorizontal: SIZES.spacing.lg,
    paddingTop: SIZES.spacing.md,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SIZES.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.utility.divider,
  },
  foodInfo: {
    flex: 1,
    marginRight: SIZES.spacing.md,
  },
  foodName: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.medium,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  foodMacros: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  portionContainer: {
    padding: SIZES.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: SIZES.spacing.md,
  },
  selectedFoodHeader: {
    marginBottom: SIZES.spacing.xl,
  },
  selectedFoodName: {
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  selectedFoodUnit: {
    fontSize: FONTS.size.sm,
    color: COLORS.text.secondary,
  },
  servingControl: {
    marginBottom: SIZES.spacing.xl,
  },
  servingLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.secondary,
    marginBottom: SIZES.spacing.sm,
  },
  servingButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.spacing.lg,
  },
  servingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingValue: {
    minWidth: 80,
    alignItems: 'center',
  },
  servingText: {
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text.primary,
  },
  macroPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.spacing.lg,
    backgroundColor: COLORS.background.secondary,
    borderRadius: SIZES.radius.lg,
    marginBottom: SIZES.spacing.xl,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.accent.primary,
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text.tertiary,
  },
  addButton: {
    backgroundColor: COLORS.accent.primary,
    paddingVertical: SIZES.spacing.md,
    borderRadius: SIZES.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.semibold,
    color: COLORS.text.onAccent,
  },
});

