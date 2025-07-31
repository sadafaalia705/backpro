import { pool } from '../config/db.js';

// Add new medicine
export const addMedicine = async (req, res) => {
  try {
    console.log('🚀 addMedicine function called');
    console.log('🔍 Request user object:', req.user);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request body:', req.body);
    
    const user_id = req.user?.id;
    console.log('🔍 Extracted user_id:', user_id);
    
    if (!user_id) {
      console.error('❌ User ID is null or undefined');
      return res.status(401).json({ error: 'User not authenticated properly' });
    }
    
    const { name, dosage, times, startDate, endDate, notes } = req.body;
    
    console.log('Adding medicine with data:', {
      user_id,
      name,
      dosage,
      times,
      startDate,
      endDate,
      notes
    });

    const timesJson = JSON.stringify(times);
    console.log('Times JSON string:', timesJson);

    const [result] = await pool.query(
      `INSERT INTO medicines (user_id, name, dosage, times, start_date, end_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, name, dosage, timesJson, startDate, endDate || null, notes]
    );
    
    console.log('Medicine added successfully with ID:', result.insertId);
    res.status(201).json({ message: 'Medicine added', id: result.insertId });
  } catch (err) {
    console.error('Error adding medicine:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      errno: err.errno
    });
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

// Get all medicines for a user
export const getAllMedicines = async (req, res) => {
  try {
    const user_id = req.user.id;
    const [rows] = await pool.query(
      `SELECT * FROM medicines WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    // Process the rows to ensure times is properly parsed
    const processedRows = rows.map(medicine => {
      let times = [];
      
      // Safely parse the times JSON
      try {
        if (medicine.times && typeof medicine.times === 'string') {
          times = JSON.parse(medicine.times);
        } else if (Array.isArray(medicine.times)) {
          times = medicine.times;
        } else {
          console.error('Invalid times format for medicine:', medicine.id, medicine.times);
          times = []; // Default to empty array
        }
      } catch (parseError) {
        console.error('Error parsing times JSON for medicine:', medicine.id, medicine.times, parseError);
        times = []; // Default to empty array
      }

      return {
        ...medicine,
        times: Array.isArray(times) ? times : []
      };
    });

    res.json(processedRows);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get today's scheduled medicines
export const getTodayMedicines = async (req, res) => {
  try {
    const user_id = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [medicines] = await pool.query(
      `SELECT * FROM medicines
       WHERE user_id = ? AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)`,
      [user_id, today, today]
    );

    const schedule = [];

    for (const medicine of medicines) {
      let times = [];
      
      // Safely parse the times JSON
      try {
        if (medicine.times && typeof medicine.times === 'string') {
          times = JSON.parse(medicine.times);
        } else if (Array.isArray(medicine.times)) {
          times = medicine.times;
        } else {
          console.error('Invalid times format for medicine:', medicine.id, medicine.times);
          continue; // Skip this medicine if times is invalid
        }
      } catch (parseError) {
        console.error('Error parsing times JSON for medicine:', medicine.id, medicine.times, parseError);
        continue; // Skip this medicine if JSON parsing fails
      }

      // Ensure times is an array
      if (!Array.isArray(times)) {
        console.error('Times is not an array for medicine:', medicine.id, times);
        continue;
      }

      for (const time of times) {
        const [logRows] = await pool.query(
          `SELECT * FROM medicine_logs
           WHERE user_id = ? AND medicine_id = ? AND date = ? AND time = ?`,
          [user_id, medicine.id, today, time]
        );

        schedule.push({
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          time,
          taken: logRows.length > 0 ? logRows[0].taken : false,
          logId: logRows.length > 0 ? logRows[0].id : null
        });
      }
    }

    // Sort by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    res.json(schedule);
  } catch (err) {
    console.error('Error fetching today\'s medicines:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Mark medicine as taken/not taken
export const markMedicineTaken = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { medicineId, date, time, taken } = req.body;

    // Check if log already exists
    const [existingLogs] = await pool.query(
      `SELECT * FROM medicine_logs
       WHERE user_id = ? AND medicine_id = ? AND date = ? AND time = ?`,
      [user_id, medicineId, date, time]
    );

    if (existingLogs.length > 0) {
      // Update existing log
      await pool.query(
        `UPDATE medicine_logs SET taken = ?, timestamp = NOW()
         WHERE user_id = ? AND medicine_id = ? AND date = ? AND time = ?`,
        [taken, user_id, medicineId, date, time]
      );
    } else {
      // Create new log
      await pool.query(
        `INSERT INTO medicine_logs (user_id, medicine_id, date, time, taken, timestamp)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [user_id, medicineId, date, time, taken]
      );
    }

    res.json({ message: 'Medicine log updated successfully' });
  } catch (err) {
    console.error('Error marking medicine:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete medicine
export const deleteMedicine = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { medicineId } = req.params;

    // First delete all medicine logs for this medicine
    await pool.query(
      `DELETE FROM medicine_logs WHERE user_id = ? AND medicine_id = ?`,
      [user_id, medicineId]
    );

    // Then delete the medicine
    const [result] = await pool.query(
      `DELETE FROM medicines WHERE user_id = ? AND id = ?`,
      [user_id, medicineId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    console.error('Error deleting medicine:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
