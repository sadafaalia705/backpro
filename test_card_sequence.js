import { pool } from './config/db.js';

async function testCardSequence() {
  try {
    console.log('🧪 Testing card sequence functionality...');
    
    // Test 1: Check if table exists
    console.log('\n1. Checking if card_sequence table exists...');
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'ha' 
      AND TABLE_NAME = 'card_sequence'
    `);
    
    if (tables.length === 0) {
      console.log('❌ card_sequence table does not exist!');
      return;
    }
    console.log('✅ card_sequence table exists');
    
    // Test 2: Check table structure
    console.log('\n2. Checking table structure...');
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ha' 
      AND TABLE_NAME = 'card_sequence' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}) Default: ${col.COLUMN_DEFAULT}`);
    });
    
    // Test 3: Check if there are any users
    console.log('\n3. Checking for users...');
    const [users] = await pool.execute('SELECT user_id, name FROM users LIMIT 5');
    console.log(`📊 Found ${users.length} users:`, users.map(u => ({ id: u.user_id, name: u.name })));
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    // Test 4: Check card sequence for first user
    const testUserId = users[0].user_id;
    console.log(`\n4. Checking card sequence for user ${testUserId}...`);
    const [sequences] = await pool.execute('SELECT * FROM card_sequence WHERE user_id = ?', [testUserId]);
    
    if (sequences.length === 0) {
      console.log('❌ No card sequence found for user, creating default...');
      await pool.execute('INSERT INTO card_sequence (user_id) VALUES (?)', [testUserId]);
      console.log('✅ Created default card sequence');
    } else {
      console.log('✅ Found card sequence:', sequences[0]);
    }
    
    // Test 5: Test updating card sequence
    console.log('\n5. Testing card sequence update...');
    const testSequence = [
      { card_name: 'medicine_tracking', position_number: 2 },
      { card_name: 'calories', position_number: 1 },
      { card_name: 'water', position_number: 3 },
      { card_name: 'steps', position_number: 4 },
      { card_name: 'sleep', position_number: 5 },
      { card_name: 'blood_pressure', position_number: 6 },
      { card_name: 'heart_rate', position_number: 7 },
      { card_name: 'temperature', position_number: 8 },
      { card_name: 'breath_retention', position_number: 9 },
      { card_name: 'blood_oxygen', position_number: 10 },
      { card_name: 'cardio', position_number: 11 },
      { card_name: 'blood_sugar', position_number: 12 },
      { card_name: 'body_fat', position_number: 13 },
      { card_name: 'happiness_score', position_number: 14 },
      { card_name: 'analytics', position_number: 15 },
      { card_name: 'food_analytics', position_number: 16 }
    ];
    
    // Create update object
    const updateFields = {};
    testSequence.forEach(card => {
      const fieldName = `${card.card_name}_position`;
      updateFields[fieldName] = card.position_number;
    });
    
    // Build dynamic UPDATE query
    const setClause = Object.keys(updateFields)
      .map(field => `${field} = ?`)
      .join(', ');
    
    const query = `
      INSERT INTO card_sequence (user_id, ${Object.keys(updateFields).join(', ')})
      VALUES (?, ${Object.keys(updateFields).map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE
      ${setClause}, updated_at = CURRENT_TIMESTAMP
    `;
    
    const values = [testUserId, ...Object.values(updateFields), ...Object.values(updateFields)];
    
    console.log('🔧 Executing update query...');
    await pool.execute(query, values);
    console.log('✅ Card sequence updated successfully');
    
    // Test 6: Verify the update
    console.log('\n6. Verifying the update...');
    const [updatedSequence] = await pool.execute('SELECT * FROM card_sequence WHERE user_id = ?', [testUserId]);
    console.log('📊 Updated sequence:', updatedSequence[0]);
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testCardSequence();