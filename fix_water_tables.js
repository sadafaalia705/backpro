import { query } from './config/db.js';

const fixWaterTables = async () => {
  try {
    console.log('🔧 Checking and fixing water tables...');
    
    // Check if water_intake_records table exists
    const waterTableCheck = await query('SHOW TABLES LIKE "water_intake_records"');
    if (waterTableCheck.length === 0) {
      console.log('Creating water_intake_records table...');
      await query(`
        CREATE TABLE water_intake_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          date DATE NOT NULL,
          total_intake INT DEFAULT 0,
          goal_achieved BOOLEAN DEFAULT FALSE,
          intake_logs JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_date (user_id, date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('✅ water_intake_records table created');
    } else {
      console.log('✅ water_intake_records table already exists');
    }
    
    // Check if user_water_preferences table exists
    const preferencesTableCheck = await query('SHOW TABLES LIKE "user_water_preferences"');
    if (preferencesTableCheck.length === 0) {
      console.log('Creating user_water_preferences table...');
      await query(`
        CREATE TABLE user_water_preferences (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          fcm_token VARCHAR(255),
          reminder_enabled BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('✅ user_water_preferences table created');
    } else {
      console.log('✅ user_water_preferences table already exists');
    }
    
    console.log('🎉 All water tables are ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing water tables:', error);
    process.exit(1);
  }
};

fixWaterTables(); 