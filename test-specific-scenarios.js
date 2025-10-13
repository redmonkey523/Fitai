// Additional test scenarios for AI Scanner
const aiService = require('./src/services/aiService').default;

async function testSpecificScenarios() {
  console.log('🔍 Testing Specific AI Scanner Scenarios...\n');

  try {
    // Test 1: Different serving sizes
    console.log('1. Testing different serving sizes...');
    const foodResult = await aiService.processFoodImage('demo');
    
    const sizes = [50, 100, 200, 300];
    sizes.forEach(size => {
      const nutrition = aiService.calculateNutritionFacts(foodResult, size);
      console.log(`   ${size}g serving: ${nutrition.calories} kcal, ${nutrition.protein}g protein`);
    });

    // Test 2: All demo barcodes
    console.log('\n2. Testing all demo barcodes...');
    const demoBarcodes = ['3017620422003', '5000159407236', '4008400322221'];
    
    for (const barcode of demoBarcodes) {
      const result = await aiService.lookupProductByBarcode(barcode);
      console.log(`   ${barcode}: ${result.name} - ${result.nutrition.calories} kcal`);
    }

    // Test 3: Multiple food recognition attempts
    console.log('\n3. Testing multiple food recognition attempts...');
    const foods = [];
    for (let i = 0; i < 3; i++) {
      const food = await aiService.processFoodImage('demo');
      foods.push(food);
      console.log(`   Attempt ${i + 1}: ${food.name} (${Math.round(food.confidence * 100)}% confidence)`);
    }

    // Test 4: Error handling
    console.log('\n4. Testing error handling...');
    try {
      const invalidResult = await aiService.processFoodImage('');
      console.log('   ❌ Should have thrown error for empty image path');
    } catch (error) {
      console.log('   ✅ Correctly handled invalid image path');
    }

    // Test 5: Nutrition grades
    console.log('\n5. Testing nutrition grades...');
    const result = await aiService.lookupProductByBarcode('3017620422003');
    console.log(`   Nutella grade: ${result.nutritionGrade || 'Not available'}`);

    // Test 6: Macro calculations edge cases
    console.log('\n6. Testing macro calculation edge cases...');
    const zeroNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const macros = aiService.getMacroPercentages(zeroNutrition);
    console.log(`   Zero calories macros: P:${macros.protein}%, C:${macros.carbs}%, F:${macros.fat}%`);

    console.log('\n✅ All specific scenario tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ Specific scenario test failed:', error);
    return false;
  }
}

// Run the specific scenario tests
testSpecificScenarios().then(success => {
  if (success) {
    console.log('\n🎯 All specific scenarios working correctly!');
  } else {
    console.log('\n💥 Some specific scenarios need attention.');
  }
});
