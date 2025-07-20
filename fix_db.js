import { pool } from './config/db.js';

async function fixDatabase() {
  try {
    console.log('🔍 Checking database users...');
    
    // Check all users
    const [users] = await pool.query('SELECT user_id, name, email FROM users ORDER BY user_id');
    
    console.log('\n📋 Current users in database:');
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach(user => {
        console.log(`✅ ID: ${user.user_id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    // Check if user_id 5 exists
    const [user5] = await pool.query('SELECT user_id, name, email FROM users WHERE user_id = ?', [5]);
    if (user5.length === 0) {
      console.log('\n❌ User ID 5 does not exist - this is causing the foreign key error');
      
      // Create a test user with ID 5 if no users exist
      if (users.length === 0) {
        console.log('\n🔧 Creating test user with ID 5...');
        await pool.query(
          'INSERT INTO users (user_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
          [5, 'Test User', 'test@example.com', '$2a$10$dummy.hash.for.testing', 'user']
        );
        console.log('✅ Test user created with ID 5');
      } else {
        console.log('\n💡 Solution: You need to either:');
        console.log('   1. Register a new user and use that token');
        console.log('   2. Or manually create user ID 5 in database');
        console.log('   3. Or clear your app\'s stored token and login again');
      }
    } else {
      console.log('\n✅ User ID 5 exists:', user5[0]);
    }
    
    // Check heart_rate table structure
    const [heartRateStructure] = await pool.query('DESCRIBE heart_rate');
    console.log('\n📊 Heart rate table structure:');
    heartRateStructure.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Key || ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixDatabase(); 