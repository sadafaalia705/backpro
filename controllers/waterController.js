import { query } from '../config/db.js';
import { sendFCMNotification } from '../utils/fcm.js';

// API 1: Get today's water intake
const getTodayWaterIntake = async (req, res) => {
  try {
    const userId = req.user?.id;
    const today = new Date().toISOString().split('T')[0];

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - No user ID found in token' });
    }

    const sql = `
      SELECT total_intake, goal_achieved, intake_logs, created_at, updated_at
      FROM water_intake_records 
      WHERE user_id = ? AND date = ?
    `;

    const results = await query(sql, [userId, today]);

    if (results.length > 0) {
      const record = results[0];
      res.json({
        total_intake: record.total_intake || 0,
        goal_achieved: record.goal_achieved || false,
        intake_logs: record.intake_logs ? JSON.parse(record.intake_logs) : [],
        created_at: record.created_at,
        updated_at: record.updated_at
      });
    } else {
      // No record for today, return empty data
      res.json({
        total_intake: 0,
        goal_achieved: false,
        intake_logs: [],
        created_at: null,
        updated_at: null
      });
    }
  } catch (error) {
    console.error("Error getting water intake:", error);
    res.status(500).json({ error: "Failed to get water intake.", details: error.message });
  }
};

// API 2: Save water intake progress at 12 AM
const recordDailyWaterIntake = async (req, res) => {
  try {
    const { total_intake, intake_logs } = req.body;
    const userId = req.user?.id; // Get user ID from JWT token
    const today = new Date().toISOString().split('T')[0];

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - No user ID found in token' });
    }

    const goal = 2450;
    const goalAchieved = total_intake >= goal;

    const sql = `
      INSERT INTO water_intake_records (user_id, date, total_intake, goal_achieved, intake_logs)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        total_intake = VALUES(total_intake), 
        goal_achieved = VALUES(goal_achieved), 
        intake_logs = VALUES(intake_logs)
    `;

    console.log('Executing SQL:', sql);
    console.log('Parameters:', [userId, today, total_intake, goalAchieved, JSON.stringify(intake_logs)]);

    await query(sql, [userId, today, total_intake, goalAchieved, JSON.stringify(intake_logs)]);

    res.json({ message: "Water intake recorded successfully." });
  } catch (error) {
    console.error("Error recording water intake:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    res.status(500).json({ error: "Failed to record intake.", details: error.message });
  }
};

// API 2: Update reminder preferences
const updateReminderPreferences = async (req, res) => {
  try {
    const { reminder_enabled } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (typeof reminder_enabled !== 'boolean') {
      return res.status(400).json({ error: "reminder_enabled must be a boolean value" });
    }

    // Check if user preference exists
    const checkSql = 'SELECT id FROM user_water_preferences WHERE user_id = ?';
    const existingPreference = await query(checkSql, [userId]);

    if (existingPreference.length > 0) {
      // Update existing preference
      const updateSql = 'UPDATE user_water_preferences SET reminder_enabled = ? WHERE user_id = ?';
      await query(updateSql, [reminder_enabled, userId]);
    } else {
      // Create new preference
      const insertSql = 'INSERT INTO user_water_preferences (user_id, reminder_enabled) VALUES (?, ?)';
      await query(insertSql, [userId, reminder_enabled]);
    }

    console.log(`Updated reminder preferences for user ${userId}: ${reminder_enabled}`);
    res.json({ 
      message: "Reminder preferences updated successfully.",
      reminder_enabled: reminder_enabled 
    });
  } catch (error) {
    console.error("Error updating reminder preferences:", error);
    res.status(500).json({ error: "Failed to update reminder preferences.", details: error.message });
  }
};

// API 3: Get reminder preferences
const getReminderPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = 'SELECT reminder_enabled FROM user_water_preferences WHERE user_id = ?';
    const preferences = await query(sql, [userId]);

    if (preferences.length > 0) {
      res.json({ 
        reminder_enabled: preferences[0].reminder_enabled 
      });
    } else {
      // Return default value if no preference exists
      res.json({ 
        reminder_enabled: true 
      });
    }
  } catch (error) {
    console.error("Error getting reminder preferences:", error);
    res.status(500).json({ error: "Failed to get reminder preferences.", details: error.message });
  }
};

// API 3: Send reminder every 2 minutes (modified from 2 hours)
const sendWaterReminder = async (req, res) => {
  console.log('sendWaterReminder API called');
  try {
    // Check if user_water_preferences table exists
    try {
      const tableCheck = await query('SHOW TABLES LIKE "user_water_preferences"');
      if (tableCheck.length === 0) {
        console.log('user_water_preferences table does not exist, creating dummy response');
        return res.json({ 
          message: "Reminders processed (no preferences table found).",
          note: "user_water_preferences table not found - reminders would be sent to all users in production"
        });
      }

      // Query for users with reminders enabled
      const users = await query(`
        SELECT user_id, fcm_token FROM user_water_preferences
        WHERE reminder_enabled = TRUE
      `);

      let notifiedCount = 0;

      for (const user of users) {
        if (user.fcm_token) {
          try {
            await sendFCMNotification(user.fcm_token, "Time to drink water!");
            console.log(`Reminder sent to user ${user.user_id}`);
            notifiedCount++;
          } catch (notifyErr) {
            console.error(`Failed to send reminder to user ${user.user_id}:`, notifyErr.message);
          }
        } else {
          console.log(`User ${user.user_id} has no FCM token.`);
        }
      }

      res.json({ message: "Reminders processed.", users_count: users.length, notified: notifiedCount });

    } catch (tableError) {
      console.log('Error checking user_water_preferences table:', tableError.message);
      return res.json({ 
        message: "Reminders processed (table error handled).",
        note: "user_water_preferences table error - reminders would be sent to all users in production"
      });
    }
  } catch (error) {
    console.error("Error sending reminders:", error);
    res.status(500).json({ error: "Reminder dispatch failed.", details: error.message });
  }
};
export { recordDailyWaterIntake, sendWaterReminder, updateReminderPreferences, getReminderPreferences, getTodayWaterIntake };
