import express from 'express';
import { addMedicine, getAllMedicines, getTodayMedicines, markMedicineTaken, deleteMedicine } from '../controllers/medicineController.js';
import authenticateJWT from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/addmed',authenticateJWT, addMedicine);
router.get('/allmed',authenticateJWT, getAllMedicines);
router.get('/todaymed',authenticateJWT, getTodayMedicines);
router.post('/marktaken',authenticateJWT, markMedicineTaken);
router.delete('/deletemed/:medicineId',authenticateJWT, deleteMedicine);

export default router;
