import express from 'express';
import { addRespiratoryRate, getRespiratoryRates } from '../controllers/respiratoryController.js';
import authenticateJWT from '../middleware/authMiddleware.js';
const router = express.Router();

// Route to add a record
router.post('/addrespiratory', authenticateJWT, addRespiratoryRate);

// Route to get all records
router.get('/getrespiratory', authenticateJWT, getRespiratoryRates);

export default router;
