import express from 'express';
import {
  addSugarReading,
  getUserReadings,
  updateReading,
  deleteReading
} from '../controllers/sugarController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/addsugar', authenticateJWT, addSugarReading);
router.get('/getsugar', authenticateJWT, getUserReadings);
router.put('/updatesugar/:id', authenticateJWT, updateReading);
router.delete('/deletesugar/:id', authenticateJWT, deleteReading);

export default router;
