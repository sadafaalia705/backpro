import { pool } from '../config/db.js';

// GET all blood pressure records for a specific user
const getRecords = async (req, res) => {
  const user_id = req.user.id; // Changed from req.user.user_id to req.user.id

  try {
    const [rows] = await pool.query(
      'SELECT * FROM blood_pressure_records WHERE user_id = ? ORDER BY recorded_at DESC',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST a new blood pressure record
const addRecord = async (req, res) => {
  const { systolic, diastolic, notes } = req.body;
  const user_id = req.user.id; // Changed from req.user.user_id to req.user.id

  if (!systolic || !diastolic) {
    return res.status(400).json({ error: 'Systolic and diastolic are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO blood_pressure_records (user_id, systolic, diastolic, notes) 
       VALUES (?, ?, ?, ?)`,
      [user_id, systolic, diastolic, notes || null]
    );

    const [newRecord] = await pool.query(
      'SELECT * FROM blood_pressure_records WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newRecord[0]);
  } catch (err) {
    console.error('Error inserting record:', err);
    res.status(500).json({ error: 'Failed to add record' });
  }
};

export { getRecords, addRecord };
