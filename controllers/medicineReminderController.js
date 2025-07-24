import db from '../config/db.js';
import { validationResult } from 'express-validator';
import moment from 'moment';

// Create a new medicine reminder
export const createReminder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { 
            user_id, 
            medicine_name, 
            dosage, 
            frequency, 
            times_per_day, 
            specific_days, 
            start_date, 
            end_date, 
            notes, 
            reminder_times 
        } = req.body;

        // Insert the main reminder
        const [result] = await connection.query(
            `INSERT INTO medicine_reminders 
             (user_id, medicine_name, dosage, frequency, times_per_day, specific_days, start_date, end_date, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, medicine_name, dosage, frequency, times_per_day, specific_days, start_date, end_date, notes]
        );

        const reminderId = result.insertId;

        // Insert reminder times
        for (const time of reminder_times) {
            await connection.query(
                `INSERT INTO medicine_reminder_times 
                 (reminder_id, time_of_day, is_active)
                 VALUES (?, ?, TRUE)`,
                [reminderId, time]
            );
        }

        await connection.commit();
        
        // Get the created reminder with times
        const [reminder] = await connection.query(
            `SELECT mr.*, 
                    (SELECT JSON_ARRAYAGG(time_of_day) 
                     FROM medicine_reminder_times 
                     WHERE reminder_id = mr.id) as times
             FROM medicine_reminders mr
             WHERE mr.id = ?`,
            [reminderId]
        );

        res.status(201).json({
            success: true,
            data: reminder[0]
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating medicine reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create medicine reminder',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Get all reminders for a user
export const getUserReminders = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { active_only = 'true' } = req.query;
        
        let query = `
            SELECT mr.*, 
                   (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', mrt.id,
                            'time_of_day', mrt.time_of_day,
                            'is_active', mrt.is_active
                        )
                    ) FROM medicine_reminder_times mrt 
                    WHERE mrt.reminder_id = mr.id) as reminder_times
            FROM medicine_reminders mr
            WHERE mr.user_id = ?
        `;
        
        const params = [user_id];
        
        if (active_only === 'true') {
            query += ' AND mr.is_active = TRUE';
            query += ' AND (mr.end_date IS NULL OR mr.end_date >= CURDATE())';
        }
        
        query += ' ORDER BY mr.medicine_name';
        
        const [reminders] = await db.query(query, params);
        
        // Parse the JSON strings
        const parsedReminders = reminders.map(reminder => ({
            ...reminder,
            reminder_times: JSON.parse(reminder.reminder_times || '[]')
        }));
        
        res.status(200).json({
            success: true,
            data: parsedReminders
        });
        
    } catch (error) {
        console.error('Error fetching medicine reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch medicine reminders',
            error: error.message
        });
    }
};

// Update a reminder
export const updateReminder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { 
            medicine_name, 
            dosage, 
            frequency, 
            times_per_day, 
            specific_days, 
            start_date, 
            end_date, 
            notes, 
            is_active,
            reminder_times 
        } = req.body;

        // Update the main reminder
        await connection.query(
            `UPDATE medicine_reminders 
             SET medicine_name = ?, dosage = ?, frequency = ?, 
                 times_per_day = ?, specific_days = ?, start_date = ?, 
                 end_date = ?, notes = ?, is_active = ?, updated_at = NOW()
             WHERE id = ?`,
            [medicine_name, dosage, frequency, times_per_day, specific_days, 
             start_date, end_date, notes, is_active, id]
        );

        // Delete existing times
        await connection.query(
            'DELETE FROM medicine_reminder_times WHERE reminder_id = ?',
            [id]
        );

        // Insert new times
        for (const time of reminder_times) {
            await connection.query(
                `INSERT INTO medicine_reminder_times 
                 (reminder_id, time_of_day, is_active)
                 VALUES (?, ?, TRUE)`,
                [id, time.time_of_day]
            );
        }

        await connection.commit();
        
        // Get the updated reminder with times
        const [reminder] = await connection.query(
            `SELECT mr.*, 
                    (SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', mrt.id,
                            'time_of_day', mrt.time_of_day,
                            'is_active', mrt.is_active
                        )
                    ) FROM medicine_reminder_times mrt 
                    WHERE mrt.reminder_id = mr.id) as reminder_times
             FROM medicine_reminders mr
             WHERE mr.id = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            data: {
                ...reminder[0],
                reminder_times: JSON.parse(reminder[0].reminder_times || '[]')
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating medicine reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update medicine reminder',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Delete a reminder
export const deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        
        // First, delete the reminder times (due to foreign key constraint)
        await db.query(
            'DELETE FROM medicine_reminder_times WHERE reminder_id = ?',
            [id]
        );
        
        // Then delete the main reminder
        await db.query(
            'DELETE FROM medicine_reminders WHERE id = ?',
            [id]
        );
        
        res.status(200).json({
            success: true,
            message: 'Medicine reminder deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting medicine reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete medicine reminder',
            error: error.message
        });
    }
};

// Log medicine intake
export const logMedicineIntake = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { 
            reminder_id, 
            reminder_time_id, 
            user_id, 
            status, 
            notes,
            scheduled_time
        } = req.body;

        // Log the intake
        const [result] = await connection.query(
            `INSERT INTO medicine_intake_logs 
             (reminder_id, reminder_time_id, user_id, scheduled_time, taken_time, status, notes)
             VALUES (?, ?, ?, ?, ${status === 'taken' ? 'NOW()' : 'NULL'}, ?, ?)`,
            [reminder_id, reminder_time_id, user_id, scheduled_time, status, notes]
        );

        await connection.commit();
        
        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                reminder_id,
                reminder_time_id,
                user_id,
                scheduled_time,
                status,
                notes,
                taken_time: status === 'taken' ? new Date() : null
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error logging medicine intake:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log medicine intake',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

// Get upcoming reminders for a user
export const getUpcomingReminders = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { days = 7 } = req.query;
        
        const query = `
            SELECT 
                mr.id as reminder_id,
                mr.medicine_name,
                mr.dosage,
                mrt.id as time_id,
                mrt.time_of_day,
                DATE_ADD(CURDATE(), INTERVAL n.number DAY) as reminder_date,
                CONCAT(
                    DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL n.number DAY), '%Y-%m-%d '),
                    TIME_FORMAT(mrt.time_of_day, '%H:%i:%s')
                ) as scheduled_time,
                mil.status as intake_status,
                mil.notes as intake_notes
            FROM 
                medicine_reminders mr
            CROSS JOIN 
                (SELECT 0 as number UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) n
            JOIN 
                medicine_reminder_times mrt ON mr.id = mrt.reminder_id
            LEFT JOIN 
                medicine_intake_logs mil ON 
                    mr.id = mil.reminder_id AND 
                    mrt.id = mil.reminder_time_id AND
                    DATE(mil.scheduled_time) = DATE_ADD(CURDATE(), INTERVAL n.number DAY)
            WHERE 
                mr.user_id = ? AND
                mr.is_active = TRUE AND
                (mr.end_date IS NULL OR mr.end_date >= CURDATE()) AND
                n.number < ? AND
                (
                    mr.frequency = 'daily' OR
                    (mr.frequency = 'weekly' AND 
                     FIND_IN_SET(
                         DAYNAME(DATE_ADD(CURDATE(), INTERVAL n.number DAY)), 
                         mr.specific_days
                     ) > 0) OR
                    (mr.frequency = 'custom' AND 
                     FIND_IN_SET(
                         DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL n.number DAY)), 
                         mr.specific_days
                     ) > 0)
                )
            ORDER BY 
                reminder_date, mrt.time_of_day
        `;
        
        const [reminders] = await db.query(query, [user_id, days]);
        
        // Format the response
        const formattedReminders = reminders.map(reminder => ({
            reminder_id: reminder.reminder_id,
            medicine_name: reminder.medicine_name,
            dosage: reminder.dosage,
            time_id: reminder.time_id,
            time_of_day: reminder.time_of_day,
            reminder_date: reminder.reminder_date,
            scheduled_time: reminder.scheduled_time,
            status: reminder.intake_status || 'pending',
            notes: reminder.intake_notes || null
        }));
        
        res.status(200).json({
            success: true,
            data: formattedReminders
        });
        
    } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming reminders',
            error: error.message
        });
    }
};
