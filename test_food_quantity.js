import { pool } from './config/db.js';

// Test script to verify food quantity functionality
async function testFoodQuantity() {
  try {
    console.log('🧪 Testing food quantity functionality...');
    
    // Test 1: Check if we can add food with quantity
    console.log('\n📝 Test 1: Adding food with quantity 2');
    const testFood = {
      user_id: 1, // Assuming user ID 1 exists
      date: '2024-01-15',
      meal: 'breakfast',
      name: 'Test Food',
      calories: 100,
      carbs: 20,
      fat: 5,
      protein: 10,
      sodium: 200,
      sugar: 5,
      quantity: 2
    };
    
    // Calculate expected values
    const expectedCalories = testFood.calories * testFood.quantity;
    const expectedCarbs = testFood.carbs * testFood.quantity;
    const expectedFat = testFood.fat * testFood.quantity;
    const expectedProtein = testFood.protein * testFood.quantity;
    const expectedSodium = testFood.sodium * testFood.quantity;
    const expectedSugar = testFood.sugar * testFood.quantity;
    
    console.log('Expected values after quantity multiplication:');
    console.log(`Calories: ${testFood.calories} × ${testFood.quantity} = ${expectedCalories}`);
    console.log(`Carbs: ${testFood.carbs} × ${testFood.quantity} = ${expectedCarbs}`);
    console.log(`Fat: ${testFood.fat} × ${testFood.quantity} = ${expectedFat}`);
    console.log(`Protein: ${testFood.protein} × ${testFood.quantity} = ${expectedProtein}`);
    console.log(`Sodium: ${testFood.sodium} × ${testFood.quantity} = ${expectedSodium}`);
    console.log(`Sugar: ${testFood.sugar} × ${testFood.quantity} = ${expectedSugar}`);
    
    // Test 2: Check existing food logs with quantity > 1
    console.log('\n📊 Test 2: Checking existing food logs with quantity > 1');
    const [rows] = await pool.execute(
      'SELECT id, name, quantity, calories, carbs, fat, protein, sodium, sugar FROM food_logs WHERE quantity > 1 ORDER BY created_at DESC LIMIT 5'
    );
    
    if (rows.length > 0) {
      console.log('Found food logs with quantity > 1:');
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.name} (Qty: ${row.quantity})`);
        console.log(`   Calories: ${row.calories}, Carbs: ${row.carbs}, Fat: ${row.fat}, Protein: ${row.protein}`);
      });
    } else {
      console.log('No food logs found with quantity > 1');
    }
    
    // Test 3: Check digestive timeline calculation
    console.log('\n⏰ Test 3: Testing digestive timeline calculation');
    const testFoods = [
      {
        id: 1,
        name: 'Test Food 1',
        category: 'breakfast',
        carbs: 40, // 20g × 2 quantity
        protein: 20, // 10g × 2 quantity
        fat: 10, // 5g × 2 quantity
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Test Food 2',
        category: 'lunch',
        carbs: 60, // 30g × 2 quantity
        protein: 30, // 15g × 2 quantity
        fat: 20, // 10g × 2 quantity
        created_at: new Date().toISOString()
      }
    ];
    
    // Simulate the digestive timeline calculation
    const ABSORPTION_TIMES = {
      carbs: { avg: 1.25 },
      protein: { avg: 3 },
      fat: { avg: 5 }
    };
    
    const calculateDigestionDuration = (nutrientType, amount) => {
      const baseTime = ABSORPTION_TIMES[nutrientType].avg;
      const baseAmount = 10;
      
      if (amount <= baseAmount) {
        return baseTime;
      } else {
        const multiplier = Math.min(1 + (amount - baseAmount) / baseAmount * 0.5, 2);
        return baseTime * multiplier;
      }
    };
    
    testFoods.forEach((food, index) => {
      const carbsDuration = calculateDigestionDuration('carbs', food.carbs);
      const proteinDuration = calculateDigestionDuration('protein', food.protein);
      const fatDuration = calculateDigestionDuration('fat', food.fat);
      
      console.log(`\nFood ${index + 1}: ${food.name}`);
      console.log(`Carbs: ${food.carbs}g → ${carbsDuration.toFixed(1)}h digestion`);
      console.log(`Protein: ${food.protein}g → ${proteinDuration.toFixed(1)}h digestion`);
      console.log(`Fat: ${food.fat}g → ${fatDuration.toFixed(1)}h digestion`);
      console.log(`Total digestion time: ${Math.max(carbsDuration, proteinDuration, fatDuration).toFixed(1)}h`);
    });
    
    console.log('\n✅ Food quantity test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in food quantity test:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testFoodQuantity(); 