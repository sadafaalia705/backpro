import { pool } from './config/db.js';

async function checkTable() {
  try {
    console.log('🔍 Checking card_sequence table...');
    
    // Check if table exists
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'ha' 
      AND TABLE_NAME = 'card_sequence'
    `);
    
    if (tables.length === 0) {
      console.log('❌ card_sequence table does not exist!');
      console.log('💡 Run the migration: node run_migration.js');
      return;
    }
    
    console.log('✅ card_sequence table exists');
    
    // Check table structure
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
    
    // Check if there are any users
    const [users] = await pool.execute('SELECT user_id, name FROM users LIMIT 3');
    console.log(`📊 Found ${users.length} users:`, users.map(u => ({ id: u.user_id, name: u.name })));
    
    if (users.length > 0) {
      // Check if first user has card sequence
      const [sequences] = await pool.execute('SELECT * FROM card_sequence WHERE user_id = ?', [users[0].user_id]);
      if (sequences.length === 0) {
        console.log('⚠️  First user has no card sequence, creating default...');
        await pool.execute('INSERT INTO card_sequence (user_id) VALUES (?)', [users[0].user_id]);
        console.log('✅ Created default card sequence');
      } else {
        console.log('✅ User has card sequence:', sequences[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking table:', error);
  } finally {
    process.exit(0);
  }
}

checkTable(); 