import express from 'express';
import cardioController from '../controllers/cardioController.js';
import authenticateJWT from '../middleware/authMiddleware.js'; // Your middleware file

const router = express.Router();

router.post('/history', authenticateJWT, cardioController.saveHistory);
router.get('/history', authenticateJWT, cardioController.getHistory);
router.get('/plan', authenticateJWT, cardioController.getPlan);
router.get('/progress', authenticateJWT, cardioController.getProgress);

export default router;
