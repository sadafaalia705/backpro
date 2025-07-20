import { pool } from './config/db.js';

async function checkUsers() {
  try {
    const [rows] = await pool.query('SELECT user_id, name, email FROM users');
    console.log('Users in database:');
    console.table(rows);
    
    if (rows.length === 0) {
      console.log('No users found in database');
    }
  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    process.exit();
  }
}

checkUsers(); 