// controllers/macroController.js
import { pool } from '../config/db.js';

const activityMultipliers = {
  sedentary: 1.2,
  'lightly active': 1.375,
  'moderately active': 1.55,
  'very active': 1.725,
};

export const getUserMacros = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT age, gender, height, weight, activity_level, goals FROM user_forms WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User form not found. Please complete your health profile first.' });
    }

    const user = rows[0];
    const { age, gender, height, weight, activity_level, goals } = user;

    // Validate required fields
    if (!age || !gender || !height || !weight || !activity_level) {
      return res.status(400).json({ 
        message: 'Incomplete user profile. Please ensure age, gender, height, weight, and activity level are provided.' 
      });
    }

    // 1. Calculate BMR
    const heightCm = parseFloat(height);
    const weightKg = parseFloat(weight);
    const userAge = parseInt(age);

    let bmr;
    if (gender.toLowerCase() === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * userAge + 5;
    } else if (gender.toLowerCase() === 'female') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * userAge - 161;
    } else {
      // Default neutral calculation
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * userAge;
    }

    // 2. TDEE
    const multiplier = activityMultipliers[activity_level.toLowerCase()] || 1.2;
    let tdee = bmr * multiplier;

    // 3. Adjust for goal
    const goal = goals?.toLowerCase() || '';

    if (goal.includes('lose')) {
      tdee *= 0.85;
    } else if (goal.includes('gain') || goal.includes('muscle')) {
      tdee *= 1.1;
    }

    // 4. Macronutrient split
    const carbs = Math.round((tdee * 0.5) / 4);     // 50% carbs, 4 kcal/g
    const protein = Math.round((tdee * 0.25) / 4);  // 25% protein
    const fat = Math.round((tdee * 0.25) / 9);      // 25% fat, 9 kcal/g

    res.json({
      success: true,
      data: {
        calories: Math.round(tdee),
        carbs_g: carbs,
        protein_g: protein,
        fat_g: fat,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        activity_level: activity_level,
        goal: goals || 'maintain'
      }
    });

  } catch (err) {
    console.error('Error fetching user macros:', err);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error while calculating macros' 
    });
  }
};
