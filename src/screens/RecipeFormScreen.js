import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { COLORS, SIZES } from '../constants/theme';
import mealPlanningService from '../services/mealPlanningService';

const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];
const CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DIETARY_TAGS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'High-Protein',
];

export default function RecipeFormScreen({ navigation, route }) {
  const { recipeId, recipe: existingRecipe } = route.params || {};
  const isEditing = !!recipeId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [category, setCategory] = useState('dinner');
  const [dietaryTags, setDietaryTags] = useState([]);
  
  // Ingredients
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);
  
  // Instructions
  const [instructions, setInstructions] = useState(['']);
  
  // Nutrition
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingRecipe) {
      loadRecipeData(existingRecipe);
    }
  }, [existingRecipe]);

  const loadRecipeData = (recipe) => {
    setName(recipe.name || '');
    setDescription(recipe.description || '');
    setImage(recipe.image || null);
    setPrepTime(recipe.prepTime?.toString() || '');
    setCookTime(recipe.cookTime?.toString() || '');
    setServings(recipe.servings?.toString() || '');
    setDifficulty(recipe.difficulty || 'Easy');
    setCategory(recipe.category || 'dinner');
    setDietaryTags(recipe.dietaryTags || []);
    setIngredients(recipe.ingredients?.length > 0 ? recipe.ingredients : [{ name: '', quantity: '', unit: '' }]);
    setInstructions(recipe.instructions?.length > 0 ? recipe.instructions : ['']);
    setCalories(recipe.nutrition?.calories?.toString() || '');
    setProtein(recipe.nutrition?.protein?.toString() || '');
    setCarbs(recipe.nutrition?.carbs?.toString() || '');
    setFat(recipe.nutrition?.fat?.toString() || '');
    setNotes(recipe.notes || '');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const updateInstruction = (index, value) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const toggleDietaryTag = (tag) => {
    setDietaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Recipe name is required' });
      return false;
    }
    if (!prepTime || !cookTime || !servings) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all basic fields' });
      return false;
    }
    if (ingredients.every(ing => !ing.name.trim())) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Add at least one ingredient' });
      return false;
    }
    if (instructions.every(inst => !inst.trim())) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Add at least one instruction' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const recipeData = {
        name: name.trim(),
        description: description.trim(),
        image,
        prepTime: parseInt(prepTime),
        cookTime: parseInt(cookTime),
        servings: parseInt(servings),
        difficulty,
        category,
        dietaryTags,
        ingredients: ingredients.filter(ing => ing.name.trim()),
        instructions: instructions.filter(inst => inst.trim()),
        nutrition: {
          calories: parseInt(calories) || 0,
          protein: parseInt(protein) || 0,
          carbs: parseInt(carbs) || 0,
          fat: parseInt(fat) || 0,
        },
        notes: notes.trim(),
      };

      if (isEditing) {
        await mealPlanningService.updateRecipe(recipeId, recipeData);
        Toast.show({
          type: 'success',
          text1: 'Recipe Updated',
        });
      } else {
        await mealPlanningService.createRecipe(recipeData);
        Toast.show({
          type: 'success',
          text1: 'Recipe Created',
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving recipe:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save recipe',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Recipe' : 'New Recipe'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <TouchableOpacity style={styles.imageContainer} onPress={handlePickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={48} color={COLORS.textSecondary} />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Recipe Name *"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Prep Time (min) *</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={prepTime}
                onChangeText={setPrepTime}
              />
            </View>
            
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Cook Time (min) *</Text>
              <TextInput
                style={styles.input}
                placeholder="45"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={cookTime}
                onChangeText={setCookTime}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Servings *</Text>
              <TextInput
                style={styles.input}
                placeholder="4"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={servings}
                onChangeText={setServings}
              />
            </View>
            
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Difficulty</Text>
              <View style={styles.difficultyPicker}>
                {DIFFICULTY_LEVELS.map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyOption,
                      difficulty === level && styles.difficultyOptionActive,
                    ]}
                    onPress={() => setDifficulty(level)}
                  >
                    <Text
                      style={[
                        styles.difficultyOptionText,
                        difficulty === level && styles.difficultyOptionTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.categoryPicker}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryOption,
                  category === cat && styles.categoryOptionActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    category === cat && styles.categoryOptionTextActive,
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Dietary Tags</Text>
          <View style={styles.tagsPicker}>
            {DIETARY_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagOption,
                  dietaryTags.includes(tag) && styles.tagOptionActive,
                ]}
                onPress={() => toggleDietaryTag(tag)}
              >
                <Text
                  style={[
                    styles.tagOptionText,
                    dietaryTags.includes(tag) && styles.tagOptionTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients *</Text>
            <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
              <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <TextInput
                style={[styles.input, styles.ingredientName]}
                placeholder="Ingredient name"
                placeholderTextColor={COLORS.textSecondary}
                value={ingredient.name}
                onChangeText={(value) => updateIngredient(index, 'name', value)}
              />
              <TextInput
                style={[styles.input, styles.ingredientQuantity]}
                placeholder="Qty"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={ingredient.quantity}
                onChangeText={(value) => updateIngredient(index, 'quantity', value)}
              />
              <TextInput
                style={[styles.input, styles.ingredientUnit]}
                placeholder="Unit"
                placeholderTextColor={COLORS.textSecondary}
                value={ingredient.unit}
                onChangeText={(value) => updateIngredient(index, 'unit', value)}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions *</Text>
            <TouchableOpacity onPress={addInstruction} style={styles.addButton}>
              <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.instructionInput]}
                placeholder={`Step ${index + 1}`}
                placeholderTextColor={COLORS.textSecondary}
                value={instruction}
                onChangeText={(value) => updateInstruction(index, value)}
                multiline
              />
              {instructions.length > 1 && (
                <TouchableOpacity onPress={() => removeInstruction(index)}>
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Nutrition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Calories</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
            </View>
            
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
              />
            </View>
            
            <View style={styles.inputColumn}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
              />
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any additional notes or tips..."
            placeholderTextColor={COLORS.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputColumn: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  difficultyPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  difficultyOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  difficultyOptionTextActive: {
    color: COLORS.white,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryOptionTextActive: {
    color: COLORS.white,
  },
  tagsPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  tagOptionTextActive: {
    color: COLORS.white,
  },
  ingredientRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientName: {
    flex: 2,
    marginBottom: 0,
  },
  ingredientQuantity: {
    flex: 1,
    marginBottom: 0,
  },
  ingredientUnit: {
    flex: 1,
    marginBottom: 0,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  instructionInput: {
    flex: 1,
    marginBottom: 0,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});


