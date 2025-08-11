-- Drop the existing card_sequence table
DROP TABLE IF EXISTS card_sequence;

-- Create the new card_sequence table with separate columns for each card position
CREATE TABLE card_sequence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medicine_tracking_position TINYINT UNSIGNED DEFAULT 1,
    calories_position TINYINT UNSIGNED DEFAULT 2,
    water_position TINYINT UNSIGNED DEFAULT 3,
    steps_position TINYINT UNSIGNED DEFAULT 4,
    sleep_position TINYINT UNSIGNED DEFAULT 5,
    blood_pressure_position TINYINT UNSIGNED DEFAULT 6,
    heart_rate_position TINYINT UNSIGNED DEFAULT 7,
    temperature_position TINYINT UNSIGNED DEFAULT 8,
    breath_retention_position TINYINT UNSIGNED DEFAULT 9,
    blood_oxygen_position TINYINT UNSIGNED DEFAULT 10,
    cardio_position TINYINT UNSIGNED DEFAULT 11,
    blood_sugar_position TINYINT UNSIGNED DEFAULT 12,
    body_fat_position TINYINT UNSIGNED DEFAULT 13,
    happiness_score_position TINYINT UNSIGNED DEFAULT 14,
    analytics_position TINYINT UNSIGNED DEFAULT 15,
    food_analytics_position TINYINT UNSIGNED DEFAULT 16,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default positions for all existing users
INSERT INTO card_sequence (user_id)
SELECT user_id FROM users
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create trigger to automatically insert card sequence for new users
DELIMITER $$

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO card_sequence (user_id) VALUES (NEW.user_id);
END$$

DELIMITER ;