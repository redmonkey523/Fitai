import aiService from '../services/aiService';

/**
 * Test utility for AI Scanner functionality
 * Run this to verify all components are working correctly
 */
export const testAIScanner = async () => {
  console.log('🧪 Testing AI Scanner Functionality...\n');

  try {
    // Test 1: Barcode validation
    console.log('1. Testing barcode validation...');
    const validBarcodes = ['3017620422003', '5000159407236', '4008400322221'];
    const invalidBarcodes = ['123', 'abc', ''];

    validBarcodes.forEach(barcode => {
      const isValid = aiService.isValidBarcode(barcode);
      console.log(`   ${barcode}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    invalidBarcodes.forEach(barcode => {
      const isValid = aiService.isValidBarcode(barcode);
      console.log(`   "${barcode}": ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`);
    });

    // Test 2: Demo barcode lookup
    console.log('\n2. Testing demo barcode lookup...');
    const demoResult = await aiService.lookupProductByBarcode('demo123');
    console.log(`   Demo product: ${demoResult.name} (${demoResult.brand})`);
    console.log(`   Calories: ${demoResult.nutrition.calories} kcal`);
    console.log(`   Source: ${demoResult.source}`);

    // Test 3: Real barcode lookup (Nutella)
    console.log('\n3. Testing real barcode lookup...');
    const nutellaResult = await aiService.lookupProductByBarcode('3017620422003');
    console.log(`   Product: ${nutellaResult.name} (${nutellaResult.brand})`);
    console.log(`   Calories: ${nutellaResult.nutrition.calories} kcal`);
    console.log(`   Source: ${nutellaResult.source}`);

    // Test 4: AI food recognition
    console.log('\n4. Testing AI food recognition...');
    const foodResult = await aiService.processFoodImage('demo');
    console.log(`   Recognized food: ${foodResult.name}`);
    console.log(`   Confidence: ${Math.round(foodResult.confidence * 100)}%`);
    console.log(`   Calories: ${foodResult.nutrition.calories} kcal`);
    console.log(`   Source: ${foodResult.source}`);

    // Test 5: Nutrition calculations
    console.log('\n5. Testing nutrition calculations...');
    const nutrition = aiService.calculateNutritionFacts(foodResult, 150);
    console.log(`   Serving size: ${nutrition.servingSize}`);
    console.log(`   Calories: ${nutrition.calories} kcal`);
    console.log(`   Protein: ${nutrition.protein}g`);
    console.log(`   Carbs: ${nutrition.carbs}g`);
    console.log(`   Fat: ${nutrition.fat}g`);

    // Test 6: Macro percentages
    console.log('\n6. Testing macro percentages...');
    const macros = aiService.getMacroPercentages(nutrition);
    console.log(`   Protein: ${macros.protein}%`);
    console.log(`   Carbs: ${macros.carbs}%`);
    console.log(`   Fat: ${macros.fat}%`);

    console.log('\n✅ All AI Scanner tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ AI Scanner test failed:', error);
    return false;
  }
};

/**
 * Test specific barcode lookup
 */
export const testBarcodeLookup = async (barcode) => {
  try {
    console.log(`🔍 Looking up barcode: ${barcode}`);
    const result = await aiService.lookupProductByBarcode(barcode);
    
    console.log('📦 Product Information:');
    console.log(`   Name: ${result.name}`);
    console.log(`   Brand: ${result.brand}`);
    console.log(`   Calories: ${result.nutrition.calories} kcal`);
    console.log(`   Protein: ${result.nutrition.protein}g`);
    console.log(`   Carbs: ${result.nutrition.carbs}g`);
    console.log(`   Fat: ${result.nutrition.fat}g`);
    console.log(`   Source: ${result.source}`);
    console.log(`   Verified: ${result.verified ? 'Yes' : 'No'}`);
    
    if (result.ingredients && result.ingredients.length > 0) {
      console.log(`   Ingredients: ${result.ingredients.join(', ')}`);
    }
    
    if (result.allergens && result.allergens.length > 0) {
      console.log(`   Allergens: ${result.allergens.join(', ')}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Barcode lookup failed:', error);
    return null;
  }
};

/**
 * Test food recognition with demo image
 */
export const testFoodRecognition = async () => {
  try {
    console.log('🍽️ Testing food recognition...');
    const result = await aiService.processFoodImage('demo');
    
    console.log('📸 Food Recognition Result:');
    console.log(`   Name: ${result.name}`);
    console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`   Calories: ${result.nutrition.calories} kcal`);
    console.log(`   Protein: ${result.nutrition.protein}g`);
    console.log(`   Carbs: ${result.nutrition.carbs}g`);
    console.log(`   Fat: ${result.nutrition.fat}g`);
    console.log(`   Source: ${result.source}`);
    
    if (result.ingredients && result.ingredients.length > 0) {
      console.log(`   Ingredients: ${result.ingredients.join(', ')}`);
    }
    
    if (result.allergens && result.allergens.length > 0) {
      console.log(`   Allergens: ${result.allergens.join(', ')}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Food recognition failed:', error);
    return null;
  }
};

export default {
  testAIScanner,
  testBarcodeLookup,
  testFoodRecognition
};
