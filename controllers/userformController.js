import { pool } from '../config/db.js';

// Convert numeric sleep hours to ENUM-compatible string
function convertSleepHours(hours) {
  if (hours < 5) return '<5 hours';
  if (hours >= 5 && hours < 6) return '5-6 hours';
  if (hours >= 6 && hours <= 8) return '6-8 hours';
  return '>8 hours';
}

// Controller to get user form data
const getUserForm = async (req, res) => {
  try {
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM user_forms WHERE user_id = ?',
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No form data found for this user' });
    }

    res.status(200).json({ 
      message: 'User form data retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error getting user form:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

// Controller to save user form
const saveUserForm = async (req, res) => {
  try {
    // Get user_id from authenticated user
    const user_id = req.user?.id;
    
    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      name,
      age,
      gender,
      height,
      weight,
      bmi,
      activityLevel,
      sleepHours,
      dietPreference,
      healthGoal,
      stressLevel,
      healthScore
    } = req.body;

    // Validate required fields
    if (!name || !age || !gender || !height || !weight) {
      return res.status(400).json({ error: 'Missing required fields: name, age, gender, height, weight' });
    }

    // Validate that the user exists in the users table
    const [userCheck] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [user_id]);
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Check if user already has a form entry
    const [existingForm] = await pool.query('SELECT id FROM user_forms WHERE user_id = ?', [user_id]);
    
    if (existingForm.length > 0) {
      // Update existing form
      const [result] = await pool.query(
        `UPDATE user_forms SET 
          name = ?, age = ?, gender = ?, height = ?, weight = ?, bmi = ?, activity_level = ?, sleep_hours = ?,
          diet_preference = ?, goals = ?, stress_level = ?, health_score = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
        [
          name,
          age,
          gender?.toLowerCase() || null,
          height,
          weight,
          bmi || null,
          activityLevel?.toLowerCase() || null,
          sleepHours ? convertSleepHours(sleepHours) : null,
          dietPreference?.toLowerCase() || null,
          healthGoal || null,
          stressLevel?.toLowerCase() || null,
          healthScore || null,
          user_id
        ]
      );

      res.status(200).json({ 
        message: 'Health data updated successfully!', 
        formId: existingForm[0].id,
        updated: true 
      });
    } else {
      // Insert new form
      const [result] = await pool.query(
        `INSERT INTO user_forms (
          user_id, name, age, gender, height, weight, bmi, activity_level, sleep_hours,
          diet_preference, goals, stress_level, health_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          name,
          age,
          gender?.toLowerCase() || null,
          height,
          weight,
          bmi || null,
          activityLevel?.toLowerCase() || null,
          sleepHours ? convertSleepHours(sleepHours) : null,
          dietPreference?.toLowerCase() || null,
          healthGoal || null,
          stressLevel?.toLowerCase() || null,
          healthScore || null
        ]
      );

      res.status(201).json({ 
        message: 'Health data saved successfully!', 
        formId: result.insertId,
        updated: false 
      });
    }
  } catch (error) {
    console.error('Error saving user form:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Invalid user_id: User does not exist' });
    }
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ error: 'Data too long for one or more fields' });
    }
    
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};

export { saveUserForm, getUserForm };
export default saveUserForm;
