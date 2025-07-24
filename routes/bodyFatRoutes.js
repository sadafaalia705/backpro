import express from 'express';
import { calculateBodyFat, getBodyFatHistory } from '../controllers/bodyFatController.js';
import authenticateJWT from '../middleware/authMiddleware.js'; // Middleware for JWT auth

const router = express.Router();

// ✅ Calculate Body Fat & Save
router.post('/calculate', authenticateJWT, calculateBodyFat);

// ✅ Fetch Body Fat History
router.get('/history', authenticateJWT, getBodyFatHistory);

export default router;
