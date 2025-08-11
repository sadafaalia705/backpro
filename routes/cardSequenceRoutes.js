import express from 'express';
import cardSequenceController from '../controllers/cardSequenceController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get user's card sequence
router.get('/sequence', cardSequenceController.getUserCardSequence);

// Update card positions when cards are swapped
router.put('/sequence', cardSequenceController.updateCardPositions);

// Reset user's card sequence to default
router.post('/reset', cardSequenceController.resetToDefault);

export default router; 