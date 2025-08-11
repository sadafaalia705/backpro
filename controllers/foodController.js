import { pool } from '../config/db.js';

// Add a food log
export const addFoodLog = async (req, res) => {
  try {
    const { date, meal, name, calories, carbs, fat, protein, sodium, sugar, quantity } = req.body;
    const user_id = req.user.id;
    if (!date || !meal || !name) {
      return res.status(400).json({ error: 'date, meal, and name are required' });
    }
    
    // Multiply nutritional values by quantity
    const quantityMultiplier = quantity || 1;
    const adjustedCalories = (calories || 0) * quantityMultiplier;
    const adjustedCarbs = (carbs || 0) * quantityMultiplier;
    const adjustedFat = (fat || 0) * quantityMultiplier;
    const adjustedProtein = (protein || 0) * quantityMultiplier;
    const adjustedSodium = (sodium || 0) * quantityMultiplier;
    const adjustedSugar = (sugar || 0) * quantityMultiplier;
    
    const query = `INSERT INTO food_logs (user_id, date, meal, name, calories, carbs, fat, protein, sodium, sugar, quantity)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.query(query, [
      user_id, date, meal, name, adjustedCalories, adjustedCarbs, adjustedFat, adjustedProtein, adjustedSodium, adjustedSugar, quantity || 1
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

// Delete a food log
export const deleteFoodLog = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    if (!id) {
      return res.status(400).json({ error: 'food log id is required' });
    }
    
    // First check if the food log exists and belongs to the user
    const checkQuery = `SELECT id FROM food_logs WHERE id = ? AND user_id = ?`;
    const [checkRows] = await pool.query(checkQuery, [id, user_id]);
    
    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'Food log not found or access denied' });
    }
    
    // Delete the food log
    const deleteQuery = `DELETE FROM food_logs WHERE id = ? AND user_id = ?`;
    const [result] = await pool.query(deleteQuery, [id, user_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Food log not found' });
    }
    
    res.json({ message: 'Food log deleted successfully' });
  } catch (err) {
    console.error('Error in deleteFoodLog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 