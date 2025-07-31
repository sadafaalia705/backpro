import { pool } from '../config/db.js';

// Utility function to get foods by category
const getFoodsByCategory = async (category, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, icon FROM foods WHERE category = ?',
      [category]
    );
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ message: `Error fetching ${category} foods`, error });
  }
};

export const getBreakfastFoods = (req, res) => getFoodsByCategory('breakfast', res);
export const getLunchFoods = (req, res) => getFoodsByCategory('lunch', res);
export const getDinnerFoods = (req, res) => getFoodsByCategory('dinner', res);
export const getSnackFoods = (req, res) => getFoodsByCategory('snack', res);

// Get details of one food item by ID
export const getFoodById = async (req, res) => {
  const foodId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM foods WHERE id = ?',
      [foodId]
    );
    if (result[0].length === 0) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.json(result[0][0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food item', error });
  }
};
