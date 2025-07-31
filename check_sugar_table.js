import { pool } from './config/db.js';

async function checkSugarTable() {
  try {
    console.log('🔍 Checking sugar_logs table...');
    
    // Check if table exists
    const [tables] = await pool.query('SHOW TABLES LIKE "sugar_logs"');
    console.log('sugar_logs table exists:', tables.length > 0);
    
    if (tables.length === 0) {
      console.log('❌ sugar_logs table does not exist!');
      console.log('Creating table...');
      
      // Create the table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sugar_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          date_logged DATETIME DEFAULT CURRENT_TIMESTAMP,
          glucose_level INT NOT NULL,
          notes TEXT,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          INDEX idx_user_date (user_id, date_logged DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      
      console.log('✅ sugar_logs table created successfully!');
    } else {
      console.log('✅ sugar_logs table exists');
    }
    
    // Check table structure
    const [structure] = await pool.query('DESCRIBE sugar_logs');
    console.log('\n📋 Table structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    // Check if users table exists (for foreign key)
    const [userTables] = await pool.query('SHOW TABLES LIKE "users"');
    console.log('\n👥 users table exists:', userTables.length > 0);
    
    if (userTables.length > 0) {
      const [userStructure] = await pool.query('DESCRIBE users');
      console.log('📋 users table structure:');
      userStructure.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking sugar table:', error);
  } finally {
    process.exit(0);
  }
}

checkSugarTable(); 