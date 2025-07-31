import express from 'express';
import { addHealthScore } from '../controllers/healthScoreController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'HealthScore routes are working!' });
});

// Route to save health score
router.post('/addscore', authenticateJWT, addHealthScore);

export default router;
