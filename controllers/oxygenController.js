import { pool } from '../config/db.js';

// POST controller
const createOxygenRecord = async (req, res) => {
  console.log('🚀 createOxygenRecord function called!');
  const { oxygen_level, heart_rate, notes, recorded_at } = req.body;
  console.log('Received data:', { oxygen_level, heart_rate, notes, recorded_at });  
  const user_id = req.user.id; // Get user_id from JWT token

  try {
    const [result] = await pool.execute(
      `INSERT INTO blood_oxygen_records (user_id, oxygen_level, heart_rate, notes, recorded_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, oxygen_level, heart_rate || null, notes || null, recorded_at || new Date()]
    );

    res.status(201).json({ message: "Record inserted successfully", id: result.insertId });
  } catch (error) {
    console.error("Error inserting record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET controller
const fetchOxygenRecords = async (req, res) => {
  console.log('🚀 fetchOxygenRecords function called!');
  const user_id = req.user.id;
  
  // TEMPORARY DEBUG - REMOVE LATER
  console.log('🔴 USER ID FROM TOKEN:', user_id);
  console.log('🔴 REQUEST USER OBJECT:', req.user);
  
  const { from_date, to_date } = req.query;

  // DEBUG: Log the complete request object
  console.log('🔴 FULL REQUEST OBJECT:', {
    method: req.method,
    path: req.path,
    query: req.query,
    user: req.user,
    headers: req.headers
  });

  let query = `SELECT * FROM blood_oxygen_records WHERE user_id = ?`;
  const params = [user_id];

  if (from_date) {
    query += " AND recorded_at >= ?";
    params.push(from_date);
  }

  if (to_date) {
    query += " AND recorded_at <= ?";
    params.push(to_date);
  }

  query += " ORDER BY recorded_at DESC";

  console.log('🔴 FINAL QUERY:', query);
  console.log('🔴 QUERY PARAMS:', params);

  try {
    // DEBUG: Test connection first
    const [test] = await pool.query('SELECT 1+1 AS test');
    console.log('🔴 DATABASE CONNECTION TEST:', test);

    const [rows] = await pool.execute(query, params);
    console.log('🔴 QUERY RESULTS:', rows);
    
    if (rows.length === 0) {
      console.log('🔴 NO RECORDS FOUND - checking database directly...');
      const [allRecords] = await pool.query('SELECT * FROM blood_oxygen_records');
      console.log('🔴 ALL RECORDS IN TABLE:', allRecords);
    }
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("🔴 ERROR DETAILS:", {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      code: error.code
    });
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export {
  createOxygenRecord,
  fetchOxygenRecords
};
