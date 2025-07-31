import { pool } from '../config/db.js';

// POST /api/hold/addhold
export const createHoldRecord = async (req, res) => {
  try {
    const userId = req.user.id; // Get user_id from middleware
    const { duration } = req.body;

    if (!duration) {
      return res.status(400).json({ message: 'Missing duration' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const insertQuery = `
      INSERT INTO breath_hold_records (user_id, duration)
      VALUES (?, ?)
    `;
    const [result] = await pool.query(insertQuery, [userId, duration]);

    // Get the inserted record to return the complete data
    const [insertedRecord] = await pool.query(
      'SELECT * FROM breath_hold_records WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Hold record created successfully',
      id: result.insertId,
      user_id: userId,
      duration,
      date: insertedRecord[0].date
    });
  } catch (err) {
    console.error('Error creating record:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/hold/gethold
export const fetchHoldRecords = async (req, res) => {
  try {
    const userId = req.user.id; // Get user_id from middleware

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const selectQuery = `
      SELECT * FROM breath_hold_records
      WHERE user_id = ?
      ORDER BY date DESC
      LIMIT 10
    `;
    const [rows] = await pool.query(selectQuery, [userId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
