import { query } from '../config/db.js';
import { sendFCMNotification } from '../utils/fcm.js';

// API 1: Get today's water intake
const getTodayWaterIntake = async (req, res) => {
  try {
    const userId = req.user?.id;
    const today = new Date().toISOString().split('T')[0];

    console.log('🔍 getTodayWaterIntake called with:', { userId, today });

    if (!userId) {
      console.log('❌ No user ID found in token');
      return res.status(401).json({ error: 'Unauthorized - No user ID found in token' });
    }

    const sql = `
      SELECT total_intake, goal_achieved, intake_logs, created_at, updated_at
      FROM water_intake_records 
      WHERE user_id = ? AND date = ?
    `;

    console.log('🔍 Executing SQL query:', sql);
    console.log('🔍 Query parameters:', [userId, today]);

    const results = await query(sql, [userId, today]);

    console.log('🔍 Query results:', results);

    if (results.length > 0) {
      const record = results[0];
      console.log('🔍 Found record:', record);
      
      // Safe JSON parsing
      let intakeLogs = [];
      try {
        intakeLogs = record.intake_logs ? JSON.parse(record.intake_logs) : [];
      } catch (parseError) {
        console.error('❌ Error parsing intake_logs JSON:', parseError);
        console.error('❌ Raw intake_logs value:', record.intake_logs);
        intakeLogs = [];
      }

      const response = {
        total_intake: record.total_intake || 0,
        goal_achieved: record.goal_achieved || false,
        intake_logs: intakeLogs,
        created_at: record.created_at,
        updated_at: record.updated_at
      };

      console.log('✅ Sending response:', response);
      res.json(response);
    } else {
      // No record for today, return empty data
      console.log('ℹ️ No record found for today, returning empty data');
      res.json({
        total_intake: 0,
        goal_achieved: false,
        intake_logs: [],
        created_at: null,
        updated_at: null
      });
    }
  } catch (error) {
    console.error("❌ Error getting water intake:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
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

// API 3: Update FCM token for user
const updateFCMToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!fcm_token) {
      return res.status(400).json({ error: "fcm_token is required" });
    }

    // Check if user preference exists
    const checkSql = 'SELECT id FROM user_water_preferences WHERE user_id = ?';
    const existingPreference = await query(checkSql, [userId]);

    if (existingPreference.length > 0) {
      // Update existing preference
      const updateSql = 'UPDATE user_water_preferences SET fcm_token = ? WHERE user_id = ?';
      await query(updateSql, [fcm_token, userId]);
    } else {
      // Create new preference with FCM token
      const insertSql = 'INSERT INTO user_water_preferences (user_id, fcm_token, reminder_enabled) VALUES (?, ?, ?)';
      await query(insertSql, [userId, fcm_token, true]);
    }

    console.log(`Updated FCM token for user ${userId}`);
    res.json({ 
      message: "FCM token updated successfully.",
      fcm_token: fcm_token 
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    res.status(500).json({ error: "Failed to update FCM token.", details: error.message });
  }
};

// API 4: Get reminder preferences
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

// API 4: Get water intake history
const getWaterIntakeHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - No user ID found in token' });
    }

    // Get user's weight for goal calculation
    const userWeightSql = 'SELECT weight FROM user_forms WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    const userWeightResult = await query(userWeightSql, [userId]);
    const userWeight = userWeightResult.length > 0 ? userWeightResult[0].weight : 60; // Default weight if not found

    // Get water intake history (last 30 days)
    const sql = `
      SELECT date, total_intake, goal_achieved, intake_logs, created_at, updated_at
      FROM water_intake_records 
      WHERE user_id = ? 
      ORDER BY date DESC 
      LIMIT 30
    `;

    console.log('🔍 Executing water history SQL query for user:', userId);
    const results = await query(sql, [userId]);

    // Process results to include goal calculation
    const history = results.map(record => {
      const dailyGoal = userWeight * 35; // 35ml per kg of body weight
      const percentage = dailyGoal > 0 ? Math.round((record.total_intake / dailyGoal) * 100) : 0;
      
      return {
        date: record.date,
        total_intake: record.total_intake || 0,
        goal: dailyGoal,
        percentage: percentage,
        goal_achieved: record.goal_achieved || false,
        created_at: record.created_at,
        updated_at: record.updated_at
      };
    });

    console.log(`✅ Found ${history.length} water intake records for user ${userId}`);
    res.json(history);
  } catch (error) {
    console.error("❌ Error getting water intake history:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState
    });
    res.status(500).json({ error: "Failed to get water intake history.", details: error.message });
  }
};

// API 5: Send reminder every 2 minutes (modified from 2 hours)
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

      // Get current user's reminder status and last water intake
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - No user ID found in token' });
      }

      // Check if current user has reminders enabled
      const userPreferenceSql = 'SELECT reminder_enabled, fcm_token FROM user_water_preferences WHERE user_id = ?';
      const userPreferences = await query(userPreferenceSql, [userId]);
      
      if (userPreferences.length === 0) {
        console.log(`No preferences found for user ${userId}, creating default preference`);
        // Create default preference for user
        await query('INSERT INTO user_water_preferences (user_id, reminder_enabled) VALUES (?, ?)', [userId, true]);
      }

      // Get today's water intake for the current user
      const today = new Date().toISOString().split('T')[0];
      const todayIntakeSql = 'SELECT total_intake FROM water_intake_records WHERE user_id = ? AND date = ?';
      const todayIntake = await query(todayIntakeSql, [userId, today]);
      
      const currentIntake = todayIntake.length > 0 ? todayIntake[0].total_intake : 0;
      
      // Get user's actual weight from user_forms table
      const userWeightSql = 'SELECT weight FROM user_forms WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
      const userWeightResult = await query(userWeightSql, [userId]);
      const userWeight = userWeightResult.length > 0 ? userWeightResult[0].weight : 60; // Default weight if not found
      const dailyGoal = userWeight * 35; // 35ml per kg
      
      console.log(`User ${userId} - Current intake: ${currentIntake}ml, Goal: ${dailyGoal}ml`);

      // Only send reminder if user has reminders enabled and hasn't met their goal
      if (userPreferences.length > 0 && userPreferences[0].reminder_enabled && currentIntake < dailyGoal) {
        const fcmToken = userPreferences[0].fcm_token;
        
        if (fcmToken) {
          try {
            await sendFCMNotification(fcmToken, "Time to drink water! Stay hydrated!");
            console.log(`Reminder sent to user ${userId}`);
            res.json({ 
              message: "Reminder sent successfully.",
              user_id: userId,
              current_intake: currentIntake,
              daily_goal: dailyGoal,
              reminder_sent: true
            });
          } catch (notifyErr) {
            console.error(`Failed to send reminder to user ${userId}:`, notifyErr.message);
            res.json({ 
              message: "Reminder processing completed with errors.",
              user_id: userId,
              error: notifyErr.message,
              reminder_sent: false
            });
          }
        } else {
          console.log(`User ${userId} has no FCM token.`);
          res.json({ 
            message: "No FCM token available for user.",
            user_id: userId,
            reminder_sent: false,
            note: "FCM token not configured"
          });
        }
      } else {
        console.log(`User ${userId} - Reminders disabled or goal already met`);
        res.json({ 
          message: "No reminder needed.",
          user_id: userId,
          current_intake: currentIntake,
          daily_goal: dailyGoal,
          reminder_sent: false,
          reason: userPreferences.length === 0 ? "No preferences" : 
                  !userPreferences[0].reminder_enabled ? "Reminders disabled" : "Goal already met"
        });
      }

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
export { recordDailyWaterIntake, sendWaterReminder, updateReminderPreferences, getReminderPreferences, getTodayWaterIntake, getWaterIntakeHistory, updateFCMToken };
