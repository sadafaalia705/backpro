import { pool } from './config/db.js';
import fs from 'fs';
import path from 'path';

async function createSugarLogsTable() {
  try {
    console.log('Creating sugar_logs table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS sugar_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date_logged DATETIME DEFAULT CURRENT_TIMESTAMP,
        glucose_level INT NOT NULL,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, date_logged DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;

    await pool.query(createTableSQL);
    console.log('✅ sugar_logs table created successfully!');
    
    // Test the table by checking if it exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'sugar_logs'");
    if (tables.length > 0) {
      console.log('✅ Table verification successful');
    } else {
      console.log('❌ Table verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error creating sugar_logs table:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

createSugarLogsTable(); 