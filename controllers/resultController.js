const pool = require('../db/pool');
const moment = require('moment');

exports.getTodayFoods = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const [rows] = await pool.execute(
      'SELECT * FROM foods WHERE DATE(created_at) = ? ORDER BY created_at ASC',
      [today]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching today\'s foods:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
