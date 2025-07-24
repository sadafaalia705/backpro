import express from 'express';
import { body, param, query } from 'express-validator';
import { 
    createReminder, 
    getUserReminders, 
    updateReminder, 
    deleteReminder, 
    logMedicineIntake,
    getUpcomingReminders 
} from '../controllers/medicineReminderController.js';

const router = express.Router();

// Validation middleware
const validateReminder = [
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('medicine_name').trim().notEmpty().withMessage('Medicine name is required'),
    body('dosage').trim().notEmpty().withMessage('Dosage is required'),
    body('frequency').isIn(['daily', 'weekly', 'custom']).withMessage('Invalid frequency'),
    body('times_per_day').optional().isInt({ min: 1 }).withMessage('Times per day must be at least 1'),
    body('specific_days')
        .if((value, { req }) => ['weekly', 'custom'].includes(req.body.frequency))
        .notEmpty().withMessage('Specific days are required for weekly/custom frequency')
        .custom((value, { req }) => {
            if (req.body.frequency === 'weekly') {
                const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const days = value.split(',').map(day => day.trim().toLowerCase());
                return days.every(day => validDays.includes(day));
            } else if (req.body.frequency === 'custom') {
                const days = value.split(',').map(day => parseInt(day.trim(), 10));
                return days.every(day => day >= 1 && day <= 7);
            }
            return true;
        })
        .withMessage('Invalid days format'),
    body('start_date').isDate().withMessage('Valid start date is required'),
    body('end_date').optional().isDate().withMessage('End date must be a valid date'),
    body('reminder_times')
        .isArray({ min: 1 }).withMessage('At least one reminder time is required')
        .custom(times => times.every(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)))
        .withMessage('Invalid time format. Use HH:MM (24-hour format)')
];

// Create a new medicine reminder
router.post('/', validateReminder, createReminder);

// Get all reminders for a user
router.get('/user/:user_id', [
    param('user_id').isInt().withMessage('User ID must be an integer'),
    query('active_only').optional().isIn(['true', 'false']).withMessage('active_only must be true or false')
], getUserReminders);

// Update a reminder
router.put('/:id', [
    param('id').isInt().withMessage('Reminder ID must be an integer'),
    ...validateReminder
], updateReminder);

// Delete a reminder
router.delete('/:id', [
    param('id').isInt().withMessage('Reminder ID must be an integer')
], deleteReminder);

// Log medicine intake
router.post('/log-intake', [
    body('reminder_id').isInt().withMessage('Reminder ID must be an integer'),
    body('reminder_time_id').isInt().withMessage('Reminder time ID must be an integer'),
    body('user_id').isInt().withMessage('User ID must be an integer'),
    body('status').isIn(['taken', 'missed', 'snoozed']).withMessage('Invalid status'),
    body('scheduled_time').isISO8601().withMessage('Valid scheduled time is required'),
    body('notes').optional().isString()
], logMedicineIntake);

// Get upcoming reminders for a user
router.get('/upcoming/:user_id', [
    param('user_id').isInt().withMessage('User ID must be an integer'),
    query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
], getUpcomingReminders);

export default router;
