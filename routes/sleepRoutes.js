import express from 'express';
import authenticateJWT from '../middleware/authMiddleware.js';
import { addSleepLog, getUserSleepLogs, getWeeklySleepSummary } from '../controllers/authcontroller.js';
const router = express.Router();

router.post('/addsleep', authenticateJWT, addSleepLog);
router.get('/getsleep', authenticateJWT, getUserSleepLogs);

export default router;
