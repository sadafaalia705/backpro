import express from 'express';
import { getProfile } from '../controllers/authcontroller.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', authenticateJWT, getProfile);

export default router; 