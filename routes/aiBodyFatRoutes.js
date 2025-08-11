import express from 'express';
import { analyzeBodyFatWithAI, getAIAnalysisHistory } from '../controllers/aiBodyFatController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// POST /api/ai-bodyfat/analyze - Analyze body fat with AI
router.post('/analyze', analyzeBodyFatWithAI);

// GET /api/ai-bodyfat/history - Get user's AI analysis history
router.get('/history', getAIAnalysisHistory);

export default router; 