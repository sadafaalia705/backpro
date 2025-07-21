import { pool } from '../config/db.js';

// POST /api/resp/addrespiratory
export const addRespiratoryRate = async (req, res) => {
  const user_id = req.user.id; // Get user_id from JWT token
  const { respiratoryRate, notes } = req.body;

  if (!respiratoryRate || isNaN(respiratoryRate)) {
    return res.status(400).json({ error: 'Valid respiratory rate required' });
  }

  try {
    const query = `
      INSERT INTO respiratory_rate_records (user_id, respiratory_rate, notes)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [user_id, respiratoryRate, notes || null]);
    res.status(201).json({ message: 'Respiratory rate recorded', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record respiratory rate' });
  }
};

// GET /api/resp/getrespiratory
export const getRespiratoryRates = async (req, res) => {
  const user_id = req.user.id; // Get user_id from JWT token

  try {
    const query = `
      SELECT id, respiratory_rate AS respiratoryRate, notes, timestamp
      FROM respiratory_rate_records
      WHERE user_id = ?
      ORDER BY timestamp DESC
    `;
    const [rows] = await pool.execute(query, [user_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch respiratory records' });
  }
};
