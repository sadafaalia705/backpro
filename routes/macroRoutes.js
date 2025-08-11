// routes/macroRoutes.js
import express from 'express';
import { getUserMacros } from '../controllers/macroController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get user macros - user ID will be extracted from JWT token
router.get('/user-macros', async (req, res) => {
  try {
    // Extract user ID from authenticated request
    const userId = req.user.id;
    
    // Call the controller with the authenticated user ID
    await getUserMacros({ params: { userId } }, res);
  } catch (error) {
    console.error('Error in macro route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
