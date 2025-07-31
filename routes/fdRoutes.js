import express from 'express';
import { 
  getBreakfastFoods, 
  getLunchFoods, 
  getDinnerFoods, 
  getSnackFoods, 
  getFoodById 
} from '../controllers/fdController.js';

const router = express.Router();

// Category-based routes
router.get('/breakfast', getBreakfastFoods);
router.get('/lunch', getLunchFoods);
router.get('/dinner', getDinnerFoods);
router.get('/snack', getSnackFoods);

// Route for food details
router.get('/:id', getFoodById);

export default router;
