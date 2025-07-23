import express from 'express';
import { getRecords, addRecord } from '../controllers/bpController.js'; 
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Add blood pressure record
router.post('/addbp', authenticateJWT, addRecord);
// Get blood pressure records
router.get('/getbp', authenticateJWT, getRecords);

export default router; 