import { pool } from './config/db.js';

async function testUserFormsTable() {
  try {
    console.log('🔍 Testing user_forms table...');
    
    // Check if table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'user_forms'");
    console.log('📋 Tables found:', tables);
    
    if (tables.length === 0) {
      console.log('❌ user_forms table does not exist!');
      return;
    }
    
    // Check table structure
    const [columns] = await pool.query("DESCRIBE user_forms");
    console.log('📋 user_forms table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if there are any records
    const [records] = await pool.query("SELECT COUNT(*) as count FROM user_forms");
    console.log('📊 Total records in user_forms:', records[0].count);
    
    // Check recent records
    const [recentRecords] = await pool.query("SELECT * FROM user_forms ORDER BY created_at DESC LIMIT 5");
    console.log('📋 Recent records:', recentRecords);
    
  } catch (error) {
    console.error('❌ Error testing user_forms table:', error);
  } finally {
    await pool.end();
  }
}

testUserFormsTable(); 