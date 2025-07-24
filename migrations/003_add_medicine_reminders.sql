-- Create medicine_reminders table
CREATE TABLE IF NOT EXISTS medicine_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL COMMENT 'e.g., "daily", "weekly", "custom"',
    times_per_day INT DEFAULT 1,
    specific_days VARCHAR(50) DEFAULT NULL COMMENT 'Comma-separated days (e.g., "monday,wednesday,friday")',
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_reminder (user_id, is_active, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create medicine_reminder_times table for storing individual reminder times
CREATE TABLE IF NOT EXISTS medicine_reminder_times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reminder_id INT NOT NULL,
    time_of_day TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reminder_id) REFERENCES medicine_reminders(id) ON DELETE CASCADE,
    INDEX idx_reminder_time (reminder_id, time_of_day, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create medicine_intake_logs table for tracking when medicines are taken
CREATE TABLE IF NOT EXISTS medicine_intake_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reminder_id INT NOT NULL,
    reminder_time_id INT NOT NULL,
    user_id INT NOT NULL,
    scheduled_time DATETIME NOT NULL,
    taken_time DATETIME DEFAULT NULL,
    status ENUM('pending', 'taken', 'missed', 'snoozed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reminder_id) REFERENCES medicine_reminders(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_time_id) REFERENCES medicine_reminder_times(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_medicine_log (user_id, scheduled_time, status),
    INDEX idx_reminder_log (reminder_id, scheduled_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
