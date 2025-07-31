import { pool } from '../config/db.js';

// POST /api/healthscore
const addHealthScore = async (req, res) => {
  console.log('🚀 addHealthScore called with body:', req.body);
  console.log('User from token:', req.user);
  
  const { score, level, tip, timestamp } = req.body;
  const user_id = req.user.id; // Get user ID from JWT token

  if (score == null || !level || !tip) {
    console.log('Missing required fields:', { score, level, tip });
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!user_id) {
    console.log('Missing user ID from token');
    return res.status(401).json({ message: 'User authentication required' });
  }

  try {
    // Convert ISO string to MySQL datetime format
    const dateTime = timestamp ? new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ') : 
                     new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log('Executing query with values:', [user_id, score, level, tip, dateTime]);

    const query = `
      INSERT INTO health_scores (user_id, score, level, tip, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `;
    await pool.execute(query, [user_id, score, level, tip, dateTime]);

    console.log('Health score saved successfully');
    res.status(201).json({ message: 'Health score saved successfully' });
  } catch (error) {
    console.error('Error saving health score:', error.message);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      errno: error.errno
    });
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

export { addHealthScore };
