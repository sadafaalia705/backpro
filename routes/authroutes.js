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
import jwt from 'jsonwebtoken';
import { addSleepLog, getWeeklySleepSummary, getUserSleepLogs } from '../controllers/authcontroller.js'; 
import { getRecords, addRecord } from '../controllers/bpController.js'; 
import { addHeartRate, getHeartRates } from '../controllers/heartRateController.js';


// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Authentication failed: No Bearer token provided');
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-key-2024-health-app';
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token verified successfully for user:', decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    } else {
      return res.status(401).json({ error: 'Authentication failed. Please log in again.' });
    }
  }
};

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


router.post('/addsleep', addSleepLog);
router.get('/:userId', getUserSleepLogs);
router.get('/weekly-summary/:userId', getWeeklySleepSummary);


// GET all blood pressure records
router.get('/getbp', authenticateJWT, getRecords);

// POST a new blood pressure record
router.post('/postbp', authenticateJWT, addRecord);


// POST - Add heart rate
router.post("/addheartrate", authenticateJWT, addHeartRate);

// GET - Fetch all heart rate records for a user
router.get("/getheartrate", authenticateJWT, getHeartRates);




export default router;
