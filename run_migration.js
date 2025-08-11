import { pool } from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running card sequence migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'restructure_card_sequence_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.execute(migrationSQL);
    
    console.log('✅ Card sequence migration completed successfully!');
    
    // Test the migration by checking the table structure
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ha' 
      AND TABLE_NAME = 'card_sequence' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Updated card_sequence table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration(); 