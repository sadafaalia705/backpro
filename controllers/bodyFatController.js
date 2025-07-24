import { pool } from '../config/db.js';

// ✅ Calculate and Save Body Fat
export const calculateBodyFat = async (req, res) => {
    try {
        const user_id = req.user.id; // Extracted from JWT
        const {
            weightKg,
            heightCm,
            neckCm,
            waistCm,
            age,
            gender,
            notes // ✅ Added notes
        } = req.body;

        if (
            !weightKg || !heightCm || !neckCm || !waistCm || !age ||
            !["male", "female"].includes(gender)
        ) {
            return res.status(400).json({ error: "All fields are required and must be valid." });
        }

        // ✅ Calculate BMI
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);

        // ✅ Calculate Body Fat %
        let bodyFat;
        if (gender === "male") {
            bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
        } else {
            bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waistCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
        }

        // ✅ Avoid negative values
        bodyFat = Math.abs(bodyFat);

        // ✅ Save to DB
        const query = `
            INSERT INTO body_fat_records 
            (user_id, weight_kg, height_cm, neck_cm, waist_cm, age, gender, bmi, body_fat, notes, recorded_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            user_id, weightKg, heightCm, neckCm, waistCm, age, gender, bmi.toFixed(2), bodyFat.toFixed(2), notes || null
        ]);

        res.json({
            message: "Body fat calculated and saved successfully",
            data: {
                id: result.insertId,
                bmi: bmi.toFixed(2),
                bodyFat: bodyFat.toFixed(2),
                notes: notes || null
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
                bmi,
                notes
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
