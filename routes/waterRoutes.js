import express from 'express';
import { recordDailyWaterIntake, sendWaterReminder, updateReminderPreferences, getReminderPreferences, getTodayWaterIntake } from '../controllers/waterController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/today', authenticateJWT, getTodayWaterIntake);
router.post('/record-water', authenticateJWT, recordDailyWaterIntake);
router.get('/send-reminders', authenticateJWT, sendWaterReminder);
router.post('/update-reminder-preferences', authenticateJWT, updateReminderPreferences);
router.get('/get-reminder-preferences', authenticateJWT, getReminderPreferences);

export default router; 