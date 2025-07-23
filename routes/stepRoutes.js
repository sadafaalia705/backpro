import express from 'express';
import authenticateJWT from '../middleware/authMiddleware.js';
import { upsertSteps, getWeeklyData } from '../controllers/stepController.js';
const router = express.Router();

router.post('/send',authenticateJWT, upsertSteps);
router.get('/get',authenticateJWT, getWeeklyData);

export default router;
