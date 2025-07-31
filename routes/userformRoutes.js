import express from 'express';
import { saveUserForm, getUserForm } from '../controllers/userformController.js';
import authenticateJWT from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/user-form', authenticateJWT, saveUserForm);
router.get('/user-form', authenticateJWT, getUserForm);

export default router;
