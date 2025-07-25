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
import { addSleepLog, getWeeklySleepSummary, getUserSleepLogs } from '../controllers/authcontroller.js'; 
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





router.get("/getoxygen",authenticateJWT ,fetchOxygenRecords);
router.post('/addsleep', authenticateJWT, addSleepLog);
router.get('/getsleep', authenticateJWT, getUserSleepLogs);
router.get('/weekly-summary', authenticateJWT, getWeeklySleepSummary);



// POST - Add heart rate
router.post("/addheartrate", authenticateJWT, addHeartRate);

// GET - Fetch all heart rate records for a user
router.get("/getheartrate", authenticateJWT, getHeartRates);


router.post("/addoxygen", authenticateJWT, createOxygenRecord);

// GET - Get user profile
router.get("/profile", authenticateJWT, getProfile);

// Test endpoint to verify authentication
router.get("/test-auth", authenticateJWT, (req, res) => {
  res.json({ 
    message: "Authentication working!", 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});




export default router;
