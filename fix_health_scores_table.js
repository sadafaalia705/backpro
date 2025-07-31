import { pool } from './config/db.js';

async function fixHealthScoresTable() {
  try {
    console.log('🔍 Checking health_scores table...');
    
    // Check if table exists
    const [tables] = await pool.query('SHOW TABLES LIKE "health_scores"');
    console.log('health_scores table exists:', tables.length > 0);
    
    if (tables.length === 0) {
      console.log('❌ health_scores table does not exist!');
      console.log('Creating table...');
      
      // Create the table with user_id column
      await pool.query(`
        CREATE TABLE IF NOT EXISTS health_scores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          score INT NOT NULL,
          level VARCHAR(50) NOT NULL,
          tip TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      
      console.log('✅ health_scores table created successfully!');
    } else {
      console.log('✅ health_scores table exists');
      
      // Check if user_id column exists
      const [columns] = await pool.query('DESCRIBE health_scores');
      const hasUserId = columns.some(col => col.Field === 'user_id');
      
      if (!hasUserId) {
        console.log('❌ user_id column missing! Adding it...');
        
        // Add user_id column
        await pool.query(`
          ALTER TABLE health_scores 
          ADD COLUMN user_id INT NOT NULL AFTER id,
          ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          ADD INDEX idx_user_id (user_id)
        `);
        
        console.log('✅ user_id column added successfully!');
      } else {
        console.log('✅ user_id column already exists');
      }
    }
    
    // Check table structure
    const [structure] = await pool.query('DESCRIBE health_scores');
    console.log('\n📋 Table structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    console.log('\n✅ health_scores table is ready!');
    
  } catch (error) {
    console.error('❌ Error fixing health_scores table:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

fixHealthScoresTable(); 