import { pool } from '../config/db.js';

// Add a food log
export const addFoodLog = async (req, res) => {
  try {
    const { date, meal, name, calories, carbs, fat, protein, sodium, sugar } = req.body;
    const user_id = req.user.id;
    if (!date || !meal || !name) {
      return res.status(400).json({ error: 'date, meal, and name are required' });
    }
    const query = `INSERT INTO food_logs (user_id, date, meal, name, calories, carbs, fat, protein, sodium, sugar)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.query(query, [
      user_id, date, meal, name, calories || 0, carbs || 0, fat || 0, protein || 0, sodium || 0, sugar || 0
    ]);
    res.status(201).json({ message: 'Food log added', id: result.insertId });
  } catch (err) {
    console.error('Error in addFoodLog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get food logs for a user and date
export const getFoodLogs = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }
    const query = `SELECT * FROM food_logs WHERE user_id = ? AND date = ? ORDER BY meal, id`;
    const [rows] = await pool.query(query, [user_id, date]);
    res.json({ records: rows });
  } catch (err) {
    console.error('Error in getFoodLogs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 