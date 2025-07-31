import { pool } from './config/db.js';

async function checkBodyFatTable() {
  try {
    console.log('🔍 Checking body_fat_records table...');
    
    // Check if table exists
    const [tables] = await pool.query('SHOW TABLES LIKE "body_fat_records"');
    console.log('body_fat_records table exists:', tables.length > 0);
    
    if (tables.length === 0) {
      console.log('❌ body_fat_records table does not exist!');
      console.log('Creating table...');
      
      // Create the table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS body_fat_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          weight_kg FLOAT NOT NULL,
          height_cm FLOAT NOT NULL,
          neck_cm FLOAT NOT NULL,
          waist_cm FLOAT NOT NULL,
          age INT NOT NULL,
          gender ENUM('male', 'female') NOT NULL,
          bmi FLOAT NOT NULL,
          body_fat FLOAT NOT NULL,
          notes TEXT,
          recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          INDEX idx_user_recorded (user_id, recorded_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      
      console.log('✅ body_fat_records table created successfully!');
    } else {
      console.log('✅ body_fat_records table exists');
    }
    
    // Check table structure
    const [structure] = await pool.query('DESCRIBE body_fat_records');
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
    console.error('❌ Error checking/creating body_fat_records table:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

checkBodyFatTable(); 