import { pool } from '../config/db.js';

// GET all blood pressure records for a specific user
const getRecords = async (req, res) => {
  console.log('🚀 getRecords function called');
  const user_id = req.user.id; // Changed from req.user.user_id to req.user.id
  console.log('User ID:', user_id);

  try {
    console.log('Executing SELECT query for user_id:', user_id);
    const [rows] = await pool.query(
      'SELECT * FROM blood_pressure_records WHERE user_id = ? ORDER BY recorded_at DESC',
      [user_id]
    );
    console.log('Retrieved records count:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching records:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      errno: err.errno
    });
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// POST a new blood pressure record
const addRecord = async (req, res) => {
  console.log('🚀 addRecord function called with body:', req.body);
  const { systolic, diastolic, notes } = req.body;
  const user_id = req.user.id; // Changed from req.user.user_id to req.user.id
  console.log('User ID:', user_id);

  if (!systolic || !diastolic) {
    console.log('Missing required fields:', { systolic, diastolic });
    return res.status(400).json({ error: 'Systolic and diastolic are required' });
  }

  try {
    console.log('Executing INSERT query with values:', [user_id, systolic, diastolic, notes || null]);
    const [result] = await pool.query(
      `INSERT INTO blood_pressure_records (user_id, systolic, diastolic, notes) 
       VALUES (?, ?, ?, ?)`,
      [user_id, systolic, diastolic, notes || null]
    );

    console.log('INSERT successful, insertId:', result.insertId);

    const [newRecord] = await pool.query(
      'SELECT * FROM blood_pressure_records WHERE id = ?',
      [result.insertId]
    );

    console.log('Retrieved new record:', newRecord[0]);
    res.status(201).json(newRecord[0]);
  } catch (err) {
    console.error('Error inserting record:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      errno: err.errno
    });
    res.status(500).json({ error: 'Failed to add record', details: err.message });
  }
};

export { getRecords, addRecord };
