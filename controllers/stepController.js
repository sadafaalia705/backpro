import { pool } from '../config/db.js';

export const upsertSteps = async (req, res) => {
  const { day, steps, miles, minutes, calories, floors } = req.body;
  const user_id = req.user.id; // Get user ID from JWT token

  if (day === undefined) return res.status(400).json({ error: 'Missing fields' });

  try {
    const [existing] = await pool.query(
      'SELECT * FROM step_data WHERE user_id = ? AND day = ?',
      [user_id, day]
    );

    if (existing.length) {
      await pool.query(
        `UPDATE step_data SET steps = ?, miles = ?, minutes = ?, calories = ?, floors = ?
         WHERE user_id = ? AND day = ?`,
        [steps, miles, minutes, calories, floors, user_id, day]
      );
    } else {
      await pool.query(
        `INSERT INTO step_data (user_id, day, steps, miles, minutes, calories, floors)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, day, steps, miles, minutes, calories, floors]
      );
    }

    res.json({ message: 'Step data saved successfully' });
  } catch (err) {
    console.error('Upsert Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWeeklyData = async (req, res) => {
  const user_id = req.user.id; // Get user ID from JWT token

  try {
    const [rows] = await pool.query(
      'SELECT * FROM step_data WHERE user_id = ? ORDER BY day ASC',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get Weekly Error:', err);
    res.status(500).json({ error: 'Error fetching data' });
  }
};
