import express from "express";
import { addTemperature, getTemperatures } from "../controllers/temperatureController.js";
import authenticateJWT from "../middleware/authMiddleware.js";

const router = express.Router();

// Add temperature (POST)
router.post("/addtemp", authenticateJWT, addTemperature);

// Get temperatures (GET)
router.get("/gettemp", authenticateJWT, getTemperatures);

export default router;
