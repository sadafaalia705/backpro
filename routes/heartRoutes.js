import express from 'express';
import { addHeartRate, getHeartRates } from '../controllers/heartRateController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Add food log
router.post('/addhr', authenticateJWT, addHeartRate);
// Get food logs for a date
router.get('/gethr', authenticateJWT, getHeartRates);

export default router; 