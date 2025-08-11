import express from 'express';
import authenticateJWT from '../middleware/authMiddleware.js';
import { 
  getBreakfastFoods, 
  getLunchFoods, 
  getDinnerFoods, 
  getSnackFoods, 
  getFoodById,
  getTodayFoods
} from '../controllers/fdController.js';

const router = express.Router();

// Category-based routes
router.get('/breakfast', getBreakfastFoods);
router.get('/lunch', getLunchFoods);
router.get('/dinner', getDinnerFoods);
router.get('/snack', getSnackFoods);

// Route for today's foods (protected)
router.get('/today', authenticateJWT, getTodayFoods);

// Route for food details
router.get('/:id', getFoodById);

export default router;
