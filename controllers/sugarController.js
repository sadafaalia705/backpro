import { pool } from '../config/db.js';

export const addSugarReading = async (req, res) => {
  const userId = req.user.id; 
  const { glucose_level, notes } = req.body;

  if (!glucose_level) {
    return res.status(400).json({ error: 'Glucose level is required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO sugar_logs (user_id, glucose_level, notes) VALUES (?, ?, ?)`,
      [userId, glucose_level, notes || null]
    );

    res.status(201).json({
      message: 'Sugar reading added successfully',
      data: { id: result.insertId, user_id: userId, glucose_level, notes }
    });
  } catch (error) {
    console.error('Error adding sugar reading:', error);
    res.status(500).json({ error: 'Failed to add sugar reading' });
  }
};

export const getUserReadings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sugar_logs WHERE user_id = ? ORDER BY date_logged DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching readings' });
  }
};

export const updateReading = async (req, res) => {
  const { glucose_level, notes } = req.body;
  try {
    await pool.query(
      'UPDATE sugar_logs SET glucose_level = ?, notes = ? WHERE id = ?',
      [glucose_level, notes, req.params.id]
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
