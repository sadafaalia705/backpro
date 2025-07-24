import express from 'express';
import {
  addSugarReading,
  getUserReadings,
  updateReading,
  deleteReading
} from '../controllers/sugarController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, addSugarReading);
router.get('/history',authenticateJWT, getUserReadings);
router.put('/:id',authenticateJWT, updateReading);
router.delete('/:id',authenticateJWT, deleteReading);

export default router;
