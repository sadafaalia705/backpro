import { pool } from '../config/db.js';

//  Add Heart Rate
export const addHeartRate = async (req, res) => {
    try {
        console.log("addHeartRate called", req.body);
        const { rate, notes } = req.body;
        const user_id = req.user.id; // Get user ID from JWT token

        if (!rate) {
            console.log("Missing rate");
            return res.status(400).json({ error: "rate is required" });
        }

        const query = `INSERT INTO heart_rate (user_id, rate, notes) VALUES (?, ?, ?)`;
        console.log("Running query:", query, [user_id, rate, notes || null]);
        
        const [result] = await pool.query(query, [user_id, rate, notes || null]);
        console.log("Query success:", result);
        console.log("About to send response");
        
        res.json({ 
            message: "Heart rate recorded successfully!", 
            data: { id: result.insertId, user_id, rate, notes } 
        });
    } catch (err) {
        console.log("Error in addHeartRate:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
};

//  Get All Heart Rate Records for a User
export const getHeartRates = async (req, res) => {
    try {
        const user_id = req.user.id; // Get user ID from JWT token

        const query = `SELECT * FROM heart_rate WHERE user_id = ? ORDER BY date_time DESC`;
        const [results] = await pool.query(query, [user_id]);

        res.json({ 
            message: "Heart rate records fetched successfully", 
            records: results 
        });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
};
