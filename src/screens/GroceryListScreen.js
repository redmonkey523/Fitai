import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES } from '../constants/theme';
import mealPlanningService from '../services/mealPlanningService';

const CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Pantry',
  'Frozen',
  'Beverages',
  'Snacks',
  'Other',
];

export default function GroceryListScreen({ navigation }) {
  const [groceryList, setGroceryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadGroceryList();
  }, []);

  const loadGroceryList = async () => {
    try {
      setLoading(true);
      const list = await mealPlanningService.getGroceryList();
      setGroceryList(list);
    } catch (error) {
      console.error('Error loading grocery list:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load grocery list',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateFromMealPlan = () => {
    Alert.alert(
      'Generate Grocery List',
      'Generate a grocery list from your meal plans for this week?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setGenerating(true);
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + 6); // End of week

              await mealPlanningService.generateGroceryList({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
              });

              await loadGroceryList();

              Toast.show({
                type: 'success',
                text1: 'Grocery List Generated',
                text2: 'Items added from your meal plans',
              });
            } catch (error) {
              console.error('Error generating grocery list:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to generate grocery list',
              });
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an item name',
      });
      return;
    }

    try {
      const item = {
        name: newItemName.trim(),
        quantity: parseFloat(newItemQuantity) || 1,
        unit: newItemUnit.trim() || '',
        category: newItemCategory,
      };

      await mealPlanningService.addGroceryItem(item);
      await loadGroceryList();

      // Reset form
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('');
      setNewItemCategory('Other');
      setAddingItem(false);

      Toast.show({
        type: 'success',
        text1: 'Item Added',
      });
    } catch (error) {
      console.error('Error adding item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item',
      });
    }
  };

  const handleToggleItem = async (itemId, checked) => {
    try {
      await mealPlanningService.updateGroceryItem(itemId, { checked: !checked });
      
      // Update local state
      setGroceryList(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item._id === itemId ? { ...item, checked: !checked } : item
        ),
      }));
    } catch (error) {
      console.error('Error toggling item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update item',
      });
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await mealPlanningService.deleteGroceryItem(itemId);
      await loadGroceryList();
      
      Toast.show({
        type: 'success',
        text1: 'Item Removed',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete item',
      });
    }
  };

  const handleClearChecked = () => {
    Alert.alert(
      'Clear Checked Items',
      'Remove all checked items from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await mealPlanningService.clearCheckedGroceryItems();
              await loadGroceryList();
              
              Toast.show({
                type: 'success',
                text1: 'Checked Items Cleared',
              });
            } catch (error) {
              console.error('Error clearing checked items:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to clear items',
              });
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Items',
      'Remove all items from your grocery list? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await mealPlanningService.clearGroceryList();
              await loadGroceryList();
              
              Toast.show({
                type: 'success',
                text1: 'Grocery List Cleared',
              });
            } catch (error) {
              console.error('Error clearing grocery list:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to clear list',
              });
            }
          },
        },
      ]
    );
  };

  const renderItemsByCategory = () => {
    if (!groceryList?.items || groceryList.items.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateText}>Your grocery list is empty</Text>
          <Text style={styles.emptyStateSubtext}>
            Add items manually or generate from your meal plans
          </Text>
        </View>
      );
    }

    // Group items by category
    const itemsByCategory = {};
    groceryList.items.forEach(item => {
      const category = item.category || 'Other';
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    });

    // Sort categories
    const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
      const aIndex = CATEGORIES.indexOf(a);
      const bIndex = CATEGORIES.indexOf(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sortedCategories.map(category => (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {itemsByCategory[category].map(item => (
          <View
            key={item._id}
            style={[styles.itemCard, item.checked && styles.itemCardChecked]}
          >
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleToggleItem(item._id, item.checked)}
            >
              <Ionicons
                name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={item.checked ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>

            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                {item.name}
              </Text>
              <Text style={styles.itemQuantity}>
                {item.quantity} {item.unit}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item._id)}
            >
              <Ionicons name="close-circle-outline" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    ));
  };

  const getTotalCount = () => {
    return groceryList?.items?.length || 0;
  };

  const getCheckedCount = () => {
    return groceryList?.items?.filter(item => item.checked).length || 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading grocery list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Grocery List</Text>
          {getTotalCount() > 0 && (
            <Text style={styles.headerSubtitle}>
              {getCheckedCount()} of {getTotalCount()} items
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {getCheckedCount() > 0 && (
            <TouchableOpacity onPress={handleClearChecked} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => setAddingItem(!addingItem)}
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonTextPrimary}>Add Item</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGenerateFromMealPlan}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Generate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Item Form */}
      {addingItem && (
        <View style={styles.addItemForm}>
          <TextInput
            style={styles.input}
            placeholder="Item name"
            placeholderTextColor={COLORS.textSecondary}
            value={newItemName}
            onChangeText={setNewItemName}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="Qty"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="numeric"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
            />
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="Unit"
              placeholderTextColor={COLORS.textSecondary}
              value={newItemUnit}
              onChangeText={setNewItemUnit}
            />
            <TouchableOpacity style={styles.categoryPicker}>
              <Text style={styles.categoryPickerText}>{newItemCategory}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, styles.formButtonCancel]}
              onPress={() => {
                setAddingItem(false);
                setNewItemName('');
                setNewItemQuantity('');
                setNewItemUnit('');
                setNewItemCategory('Other');
              }}
            >
              <Text style={styles.formButtonTextCancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.formButtonSubmit]}
              onPress={handleAddItem}
            >
              <Text style={styles.formButtonTextSubmit}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Grocery List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadGroceryList();
            }}
          />
        }
      >
        {renderItemsByCategory()}
        
        {getTotalCount() > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            <Text style={styles.clearAllText}>Clear All Items</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  addItemForm: {
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputSmall: {
    flex: 1,
  },
  categoryPicker: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  categoryPickerText: {
    fontSize: 16,
    color: COLORS.text,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  formButtonCancel: {
    backgroundColor: COLORS.background,
  },
  formButtonSubmit: {
    backgroundColor: COLORS.primary,
  },
  formButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  formButtonTextSubmit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemCardChecked: {
    opacity: 0.6,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginVertical: 20,
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});


