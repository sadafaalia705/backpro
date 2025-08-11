import express from 'express';
import { getDigestiveTimeline } from '../controllers/insightController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all insight routes
router.use(authenticateJWT);

// POST route for digestive timeline
router.post('/digestive-timeline', getDigestiveTimeline);

export default router;
