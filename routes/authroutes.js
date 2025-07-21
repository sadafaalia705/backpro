import express from 'express';
import {
  sendOTP,
  verifyOTP,
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile
} from '../controllers/authcontroller.js';
import { recordDailyWaterIntake, sendWaterReminder, updateReminderPreferences, getReminderPreferences } from '../controllers/waterController.js';
import { addSleepLog, getWeeklySleepSummary, getUserSleepLogs } from '../controllers/authcontroller.js'; 
import { getRecords, addRecord } from '../controllers/bpController.js'; 
import { addHeartRate, getHeartRates } from '../controllers/heartRateController.js';
import { createOxygenRecord, fetchOxygenRecords } from '../controllers/oxygenController.js';
import authenticateJWT from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', getProfile);



router.post('/record-water', recordDailyWaterIntake);
router.get('/send-reminders', sendWaterReminder);
router.post('/update-reminder-preferences', authenticateJWT, updateReminderPreferences);
router.get('/get-reminder-preferences', authenticateJWT, getReminderPreferences);

router.get("/getoxygen",authenticateJWT ,fetchOxygenRecords);
router.post('/addsleep', authenticateJWT, addSleepLog);
router.get('/:userId', getUserSleepLogs);
router.get('/weekly-summary', authenticateJWT, getWeeklySleepSummary);


// GET all blood pressure records
router.get('/getbp', authenticateJWT, getRecords);

// POST a new blood pressure record
router.post('/postbp', authenticateJWT, addRecord);


// POST - Add heart rate
router.post("/addheartrate", authenticateJWT, addHeartRate);

// GET - Fetch all heart rate records for a user
router.get("/getheartrate", authenticateJWT, getHeartRates);


router.post("/addoxygen", authenticateJWT, createOxygenRecord);


// Test endpoint to verify authentication
router.get("/test-auth", authenticateJWT, (req, res) => {
  res.json({ 
    message: "Authentication working!", 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});




export default router;
