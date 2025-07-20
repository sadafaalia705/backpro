DROP DATABASE IF EXISTS HA;
CREATE DATABASE HA;
USE HA;


CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'hr') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Email Verifications table
CREATE TABLE email_verifications (
    email VARCHAR(150) NOT NULL PRIMARY KEY,
    otp VARCHAR(6) DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  height FLOAT,
  weight FLOAT,
  activity_level ENUM('sedentary', 'lightly active', 'moderately active', 'very active'),
  sleep_hours ENUM('<5 hours', '5-6 hours', '6-8 hours', '>8 hours'),
  diet_preference ENUM('vegetarian', 'vegan', 'omnivore', 'keto', 'other'),
  goals TEXT,
  stress_level ENUM('low', 'moderate', 'high'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Water tracking table
DROP TABLE IF EXISTS water_intake_records;

CREATE TABLE water_intake_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    total_intake INT DEFAULT 0,
    goal_achieved BOOLEAN DEFAULT FALSE,
    intake_logs JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, date)
);
CREATE TABLE user_water_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fcm_token VARCHAR(255),
    reminder_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE sleep_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sleep_date DATE NOT NULL,
    sleep_start DATETIME NOT NULL,
    sleep_end DATETIME NOT NULL,
    duration_minutes INT GENERATED ALWAYS AS (
        TIMESTAMPDIFF(MINUTE, sleep_start, sleep_end)
    ) STORED,
    sleep_quality ENUM('Poor', 'Average', 'Good', 'Excellent') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE blood_pressure_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    systolic INT NOT NULL,
    diastolic INT NOT NULL,
    notes TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE heart_rate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rate INT NOT NULL,
    notes VARCHAR(255),
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
