// routes/analyticsRoutes.js
import express from 'express';
import {
  getAnalytics,
  getExercises,
  getBreathHoldTrends,
  getCardioSummary
} from '../controllers/analyticsController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();


router.get('/getanalytics', authenticateJWT, getAnalytics);


router.get('/exercises', authenticateJWT, getExercises);


router.get('/breath-hold-trends', authenticateJWT, getBreathHoldTrends);


router.get('/cardio-summary', authenticateJWT, getCardioSummary);

export default router;