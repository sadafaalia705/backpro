import { pool } from '../config/db.js';

export const addSugarReading = async (req, res) => {
  console.log('🚀 addSugarReading called with body:', req.body);
  console.log('User from token:', req.user);
  
  const userId = req.user.id; 
  const { glucose_level, notes, fasting_state } = req.body;

  if (!glucose_level) {
    console.log('Missing glucose_level in request');
    return res.status(400).json({ error: 'Glucose level is required' });
  }

  if (!userId) {
    console.log('Missing user ID from token');
    return res.status(401).json({ error: 'User authentication required' });
  }

  // Validate fasting_state
  if (fasting_state && !['Fasting', 'Post-Meal'].includes(fasting_state)) {
    console.log('Invalid fasting_state:', fasting_state);
    return res.status(400).json({ error: 'Fasting state must be either "Fasting" or "Post-Meal"' });
  }

  try {
    console.log('Executing INSERT query with values:', [userId, glucose_level, notes || null, fasting_state || null]);
    const [result] = await pool.query(
      `INSERT INTO sugar_logs (user_id, glucose_level, notes, fasting_state) VALUES (?, ?, ?, ?)`,
      [userId, glucose_level, notes || null, fasting_state || null]
    );

    console.log('INSERT successful, insertId:', result.insertId);

    // Get the inserted record to return the complete data
    const [insertedRecord] = await pool.query(
      'SELECT * FROM sugar_logs WHERE id = ?',
      [result.insertId]
    );

    console.log('Retrieved inserted record:', insertedRecord[0]);

    res.status(201).json({
      message: 'Sugar reading added successfully',
      id: result.insertId,
      user_id: userId,
      glucose_level,
      notes,
      fasting_state,
      recorded_at: insertedRecord[0].date_logged
    });
  } catch (error) {
    console.error('Error adding sugar reading:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      errno: error.errno
    });
    res.status(500).json({ 
      error: 'Failed to add sugar reading',
      details: error.message 
    });
  }
};

export const getUserReadings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, user_id, glucose_level, notes, fasting_state, date_logged as recorded_at FROM sugar_logs WHERE user_id = ? ORDER BY date_logged DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching sugar readings:', err);
    res.status(500).json({ error: 'Error fetching readings' });
  }
};

export const updateReading = async (req, res) => {
  const { glucose_level, notes, fasting_state } = req.body;
  
  // Validate fasting_state
  if (fasting_state && !['Fasting', 'Post-Meal'].includes(fasting_state)) {
    return res.status(400).json({ error: 'Fasting state must be either "Fasting" or "Post-Meal"' });
  }
  
  try {
    await pool.query(
      'UPDATE sugar_logs SET glucose_level = ?, notes = ?, fasting_state = ? WHERE id = ?',
      [glucose_level, notes, fasting_state || null, req.params.id]
    );
    res.json({ message: 'Reading updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
};

export const deleteReading = async (req, res) => {
  try {
    await pool.query('DELETE FROM sugar_logs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Reading deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
};
