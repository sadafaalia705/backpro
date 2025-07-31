import { pool } from './config/db.js';

async function checkUserFormsTable() {
  try {
    console.log('Checking user_forms table structure...');
    
    // Check if table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'user_forms'");
    if (tables.length === 0) {
      console.log('user_forms table does not exist. Creating it...');
      
      const createTableSQL = `
        CREATE TABLE user_forms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255),
          height DECIMAL(5,2),
          weight DECIMAL(5,2),
          bmi DECIMAL(4,2),
          activity_level ENUM('sedentary', 'lightly active', 'moderately active', 'very active'),
          sleep_hours ENUM('<5 hours', '5-6 hours', '6-8 hours', '>8 hours'),
          diet_preference ENUM('vegetarian', 'vegan', 'omnivore', 'keto', 'other'),
          goals TEXT,
          stress_level ENUM('low', 'moderate', 'high'),
          health_score INT CHECK (health_score >= 0 AND health_score <= 100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `;
      
      await pool.query(createTableSQL);
      console.log('user_forms table created successfully!');
    } else {
      console.log('user_forms table exists.');
    }

    // Check table structure
    const [columns] = await pool.query("DESCRIBE user_forms");
    console.log('\nTable structure:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });

    // Check foreign key constraints
    const [constraints] = await pool.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'user_forms' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('\nForeign key constraints:');
    constraints.forEach(constraint => {
      console.log(`- ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });

    // Check if users table exists and has data
    const [usersTable] = await pool.query("SHOW TABLES LIKE 'users'");
    if (usersTable.length === 0) {
      console.log('\n❌ users table does not exist! This will cause foreign key constraint issues.');
      return;
    }

    const [userCount] = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log(`\nUsers table has ${userCount[0].count} records`);

    // Check existing user_forms data
    const [formCount] = await pool.query("SELECT COUNT(*) as count FROM user_forms");
    console.log(`user_forms table has ${formCount[0].count} records`);

    // Test inserting a sample record (if users exist)
    if (userCount[0].count > 0) {
      const [firstUser] = await pool.query("SELECT user_id FROM users LIMIT 1");
      const testUserId = firstUser[0].user_id;
      
      console.log(`\nTesting insert with user_id: ${testUserId}`);
      
      try {
        const [result] = await pool.query(`
          INSERT INTO user_forms (
            user_id, name, height, weight, bmi, activity_level, sleep_hours,
            diet_preference, goals, stress_level, health_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          testUserId,
          'Test User',
          175.5,
          70.2,
          22.86,
          'moderately active',
          '6-8 hours',
          'vegetarian',
          'Lose weight',
          'moderate',
          75
        ]);
        
        console.log('✅ Test insert successful! Insert ID:', result.insertId);
        
        // Clean up test data
        await pool.query("DELETE FROM user_forms WHERE id = ?", [result.insertId]);
        console.log('✅ Test data cleaned up');
        
      } catch (error) {
        console.log('❌ Test insert failed:', error.message);
        console.log('Error code:', error.code);
      }
    } else {
      console.log('\n⚠️  No users in database. Cannot test foreign key constraint.');
    }

    console.log('\n✅ user_forms table check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking user_forms table:', error);
  } finally {
    await pool.end();
  }
}

checkUserFormsTable(); 