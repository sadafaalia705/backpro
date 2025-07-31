import express from 'express';
import {
  createHoldRecord,
  fetchHoldRecords,
} from '../controllers/holdController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/addhold', authenticateJWT, createHoldRecord);
router.get('/gethold', authenticateJWT, fetchHoldRecords);

export default router;
