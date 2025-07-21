import { pool } from '../config/db.js';

const toCelsius = (f) => ((f - 32) * 5) / 9;
const toFahrenheit = (c) => (c * 9) / 5 + 32;

// ✅ Add Temperature
export const addTemperature = async (req, res) => {
  try {
    const { temperature, unit, notes } = req.body;
    const user_id = req.user.id;

    if (!user_id) return res.status(401).json({ error: "Authentication required" });
    if (temperature === undefined || isNaN(temperature)) {
      return res.status(400).json({ error: "Valid temperature is required" });
    }
    if (unit && !['F', 'C'].includes(unit)) {
      return res.status(400).json({ error: "Unit must be 'F' or 'C'" });
    }

    const tempUnit = unit === "C" ? "C" : "F";
    const convertedTemp =
      tempUnit === "F"
        ? toCelsius(Number(temperature))  // F → C
        : toFahrenheit(Number(temperature)); // C → F

    const query = `
      INSERT INTO temperature (user_id, temperature, unit, converted_temp, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
      user_id,
      temperature,
      tempUnit,
      convertedTemp,
      notes || null
    ]);

    res.json({
      message: "✅ Temperature recorded successfully",
      data: {
        id: result.insertId,
        user_id,
        temperature,
        unit: tempUnit,
        converted_temp: convertedTemp,
        notes
      }
    });
  } catch (err) {
    console.error("Error in addTemperature:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ✅ Fetch All Temperatures for Logged-in User
export const getTemperatures = async (req, res) => {
  try {
    const user_id = req.user.id;
    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized. Token missing or invalid." });
    }

    const query = `SELECT * FROM temperature WHERE user_id = ? ORDER BY date_time DESC`;
    const [results] = await pool.query(query, [user_id]);

    res.json({
      message: "✅ Temperature records fetched successfully",
      records: results
    });
  } catch (err) {
    console.error("Error in getTemperatures:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
