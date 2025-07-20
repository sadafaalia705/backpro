// routes/forms.js
import express from 'express';
import {pool} from '../config/db.js'

const router = express.Router();

// POST endpoint to create a new form entry
router.post('/forms', async (req, res) => {
  try {
    const {
      name,
      height,
      weight,
      activity_level,
      sleep_hours,
      diet_preference,
      goals,
      stress_level
    } = req.body;

    // Validation
    if (!name || !height || !weight || !activity_level || !sleep_hours || !diet_preference || !goals || !stress_level) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate enum values
    const validActivityLevels = ['sedentary', 'lightly active', 'moderately active', 'very active'];
    const validSleepHours = ['<5 hours', '5-6 hours', '6-8 hours', '>8 hours'];
    const validDietPreferences = ['vegetarian', 'vegan', 'omnivore', 'keto', 'other'];
    const validStressLevels = ['low', 'moderate', 'high'];

    if (!validActivityLevels.includes(activity_level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity level'
      });
    }

    if (!validSleepHours.includes(sleep_hours)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sleep hours'
      });
    }

    if (!validDietPreferences.includes(diet_preference)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diet preference'
      });
    }

    if (!validStressLevels.includes(stress_level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stress level'
      });
    }

    // Validate numeric values
    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Height and weight must be valid positive numbers'
      });
    }

    // Insert into database
    const query = `
      INSERT INTO user_forms (
        name, height, weight, activity_level, sleep_hours, 
        diet_preference, goals, stress_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      name,
      parseFloat(height),
      parseFloat(weight),
      activity_level,
      sleep_hours,
      diet_preference,
      goals,
      stress_level
    ]);

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        id: result.insertId,
        name,
        height: parseFloat(height),
        weight: parseFloat(weight),
        activity_level,
        sleep_hours,
        diet_preference,
        goals,
        stress_level
      }
    });

  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET endpoint to retrieve all forms
router.get('/forms', async (req, res) => {
  try {
    const query = `
      SELECT id, name, height, weight, activity_level, sleep_hours, 
             diet_preference, goals, stress_level, created_at
      FROM user_forms
      ORDER BY created_at DESC
    `;

    const [rows] = await pool.execute(query);

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET endpoint to retrieve a specific form by ID
router.get('/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT id, name, height, weight, activity_level, sleep_hours, 
             diet_preference, goals, stress_level, created_at
      FROM user_forms
      WHERE id = ?
    `;

    const [rows] = await pool.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });

  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT endpoint to update a form
router.put('/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      height,
      weight,
      activity_level,
      sleep_hours,
      diet_preference,
      goals,
      stress_level
    } = req.body;

    // Check if form exists
    const checkQuery = 'SELECT id FROM user_forms WHERE id = ?';
    const [existingForm] = await pool.execute(checkQuery, [id]);

    if (existingForm.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Update query
    const updateQuery = `
      UPDATE user_forms 
      SET name = ?, height = ?, weight = ?, activity_level = ?, 
          sleep_hours = ?, diet_preference = ?, goals = ?, stress_level = ?
      WHERE id = ?
    `;

    await pool.execute(updateQuery, [
      name,
      parseFloat(height),
      parseFloat(weight),
      activity_level,
      sleep_hours,
      diet_preference,
      goals,
      stress_level,
      id
    ]);

    res.status(200).json({
      success: true,
      message: 'Form updated successfully'
    });

  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE endpoint to delete a form
router.delete('/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM user_forms WHERE id = ?';
    const [result] = await pool.execute(deleteQuery, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Form deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;