import { pool } from '../config/db.js';
import moment from 'moment';

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

export const getTodayFoods = async (req, res) => {
  try {
    const user_id = req.user.id; // Get user ID from authenticated request
    const today = moment().format('YYYY-MM-DD');
    
    const [rows] = await pool.execute(
      'SELECT * FROM food_logs WHERE user_id = ? AND date = ? ORDER BY created_at ASC',
      [user_id, today]
    );
    
    // Map the data to match frontend expectations
    const mappedFoods = rows.map(food => ({
      ...food,
      category: food.meal === 'snacks' ? 'snack' : food.meal, // Map 'snacks' to 'snack'
      // Nutritional values are already adjusted for quantity in addFoodLog
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      protein: food.protein || 0,
      calories: food.calories || 0,
      sodium: food.sodium || 0,
      sugar: food.sugar || 0,
      serving_size: food.serving_size || '1 serving',
      icon: food.icon || '🍽️',
      created_at: food.created_at || new Date().toISOString()
    }));
    
    res.json(mappedFoods);
  } catch (err) {
    console.error('Error fetching today\'s foods:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
