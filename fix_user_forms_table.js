import { pool } from './config/db.js';

async function fixUserFormsTable() {
  try {
    console.log('Checking user_forms table structure...');
    
    // Check if user_id column exists
    const [columns] = await pool.query('DESCRIBE user_forms');
    const columnNames = columns.map(col => col.Field);
    console.log('Current columns:', columnNames);
    
    if (!columnNames.includes('user_id')) {
      console.log('user_id column missing. Adding it...');
      
      // Add user_id column
      await pool.query(`
        ALTER TABLE user_forms 
        ADD COLUMN user_id INT NOT NULL AFTER id,
        ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      `);
      
      console.log('user_id column added successfully!');
    } else {
      console.log('user_id column already exists.');
    }
    
    // Verify the table structure
    const [updatedColumns] = await pool.query('DESCRIBE user_forms');
    console.log('Updated table structure:', updatedColumns.map(col => col.Field));
    
  } catch (error) {
    console.error('Error fixing user_forms table:', error);
  } finally {
    await pool.end();
  }
}

fixUserFormsTable(); 