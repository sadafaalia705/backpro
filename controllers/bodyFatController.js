import { pool } from '../config/db.js';

// ✅ Calculate and Save Body Fat
export const calculateBodyFat = async (req, res) => {
    try {
        const user_id = req.user.id; // Extracted from JWT
        console.log('Body fat calculation request:', {
            user_id,
            body: req.body
        });
        
        const {
            neckCm,
            waistCm,
            hipCm // Added hip measurement for female calculation
        } = req.body;

        console.log('Extracted measurements:', { neckCm, waistCm, hipCm });

        if (!neckCm || !waistCm) {
            console.log('Missing required measurements:', { neckCm, waistCm });
            return res.status(400).json({ error: "Neck and waist measurements are required." });
        }

        // ✅ Fetch user's height and gender from user_forms table
        const [userForm] = await pool.query(
            'SELECT height, gender FROM user_forms WHERE user_id = ?',
            [user_id]
        );

        if (userForm.length === 0) {
            return res.status(400).json({ 
                error: "User profile not found. Please complete your health profile first." 
            });
        }

        const { height, gender } = userForm[0];

        if (!height || !gender) {
            return res.status(400).json({ 
                error: "Height and gender are required. Please update your health profile." 
            });
        }

        if (!['male', 'female'].includes(gender.toLowerCase())) {
            return res.status(400).json({ 
                error: "Invalid gender. Please update your health profile." 
            });
        }

        // ✅ Calculate Body Fat % using the correct formulas
        let bodyFat;
        if (gender.toLowerCase() === "male") {
            // Male formula: % Body Fat = 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
            bodyFat = 86.010 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(height) + 36.76;
        } else {
            // Female formula: % Body Fat = 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
            if (!hipCm) {
                return res.status(400).json({ 
                    error: "Hip measurement is required for female body fat calculation." 
                });
            }
            bodyFat = 163.205 * Math.log10(waistCm + hipCm - neckCm) - 97.684 * Math.log10(height) - 78.387;
        }

        // ✅ Ensure body fat is within reasonable bounds (0-50%)
        bodyFat = Math.max(0, Math.min(50, bodyFat));

        // ✅ Calculate BMI (we'll use a default weight of 70kg for display purposes)
        const heightM = height / 100;
        const defaultWeight = 70; // Default weight for BMI calculation
        const bmi = defaultWeight / (heightM * heightM);

        // ✅ Save to DB
        const query = `
            INSERT INTO body_fat_records 
            (user_id, weight_kg, height_cm, neck_cm, waist_cm, age, gender, bmi, body_fat, recorded_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            user_id, defaultWeight, height, neckCm, waistCm, 25, gender.toLowerCase(), bmi.toFixed(2), bodyFat.toFixed(2)
        ]);

        res.json({
            message: "Body fat calculated and saved successfully",
            data: {
                id: result.insertId,
                bmi: bmi.toFixed(2),
                bodyFat: bodyFat.toFixed(2),
                height: height,
                gender: gender.toLowerCase()
            }
        });
    } catch (err) {
        console.error("Error in calculateBodyFat:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
};

// ✅ Get Body Fat History
export const getBodyFatHistory = async (req, res) => {
    try {
        const user_id = req.user.id; // From JWT

        const query = `
            SELECT 
                id,
                weight_kg AS weightKg,
                body_fat AS bodyFat,
                recorded_at AS date_time,
                bmi
            FROM body_fat_records
            WHERE user_id = ?
            ORDER BY recorded_at DESC
        `;
        const [results] = await pool.query(query, [user_id]);

        res.json({
            message: "Body fat records fetched successfully",
            records: results
        });
    } catch (err) {
        console.error("Error in getBodyFatHistory:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
};
