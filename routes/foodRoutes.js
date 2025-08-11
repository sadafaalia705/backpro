import express from 'express';
import { addFoodLog, getFoodLogs, deleteFoodLog } from '../controllers/foodController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Add food log
router.post('/addfood', authenticateJWT, addFoodLog);
// Get food logs for a date
router.get('/getfood', authenticateJWT, getFoodLogs);
// Delete a food log
router.delete('/deletefood/:id', authenticateJWT, deleteFoodLog);

export default router; 