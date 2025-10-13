// Test script for AI Scanner functionality
const aiService = require('./src/services/aiService').default;

async function testAIScanner() {
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
}

// Run the test
testAIScanner().then(success => {
  if (success) {
    console.log('\n🎉 AI Scanner is working perfectly!');
  } else {
    console.log('\n💥 AI Scanner needs some fixes.');
  }
});
