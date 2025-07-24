// controllers/cardioController.js
import { pool } from '../config/db.js';

// ✅ Utility to get IST datetime string
const getISTDateTime = (inputDate = null) => {
  const date = inputDate ? new Date(inputDate) : new Date();
  const istOffset = 330 * 60 * 1000; // IST = UTC + 5:30
  const istTime = new Date(date.getTime() + istOffset);
  return istTime.toISOString().slice(0, 19).replace('T', ' ');
};

// ✅ Save cardio history
export const saveHistory = async (req, res) => {
  try {
    console.log('📥 Received POST /cardio/history');
    const userId = req.user?.id; // ✅ Extract from JWT
    const { exercise, setNumber, completedAt } = req.body;

    if (!userId || !exercise || !setNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formattedDate = getISTDateTime(completedAt);
    console.log('📅 Formatted IST Date:', formattedDate);

    const sql = 'INSERT INTO cardio_history (user_id, exercise, set_number, completed_at) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(sql, [userId, exercise, setNumber, formattedDate]);

    res.json({ success: true, id: result.insertId });
  } catch (e) {
    console.error('❌ Error saving cardio history:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Get cardio history for logged-in user
export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ error: 'User ID missing from token' });

    const sql = 'SELECT * FROM cardio_history WHERE user_id = ? ORDER BY completed_at DESC';
    const [rows] = await pool.query(sql, [userId]);

    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get cardio plan
export const getPlan = (req, res) => {
  res.json({
    plan: [
      { exercise: 'Jumping Jacks', sets: 3, duration: 30 },
      { exercise: 'Push-Ups', sets: 3, duration: 30 },
      { exercise: 'Squats', sets: 3, duration: 30 },
      { exercise: 'Lunges', sets: 3, duration: 30 },
      { exercise: 'Burpees', sets: 3, duration: 30 },
      { exercise: 'Plank (Core Stability)', sets: 3, duration: 30 },
      { exercise: 'Seated Abs Circles', sets: 3, duration: 30 },
      { exercise: 'Reverse Crunches', sets: 3, duration: 30 },
      { exercise: 'Inchworm', sets: 3, duration: 30 },
    ]
  });
};

// ✅ Get progress summary
export const getProgress = (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const sql = 'SELECT COUNT(*) as totalSets, COUNT(DISTINCT DATE(completed_at)) as daysActive FROM cardio_history WHERE user_id = ?';
  pool.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ progress: rows[0] });
  });
};

export default {
  saveHistory,
  getHistory,
  getPlan,
  getProgress
};
