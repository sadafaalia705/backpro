-- Create body_fat_records table
CREATE TABLE IF NOT EXISTS body_fat_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    weight_kg FLOAT NOT NULL,
    height_cm FLOAT NOT NULL,
    neck_cm FLOAT NOT NULL,
    waist_cm FLOAT NOT NULL,
    age INT NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    bmi FLOAT NOT NULL,
    body_fat FLOAT NOT NULL,
    notes TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_recorded (user_id, recorded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 