-- Create AI body fat analysis results table
CREATE TABLE IF NOT EXISTS ai_body_fat_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    image_name VARCHAR(255),
    body_fat_percentage DECIMAL(5,2),
    analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_base64 LONGTEXT,
    gender ENUM('male', 'female') NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_analysis (user_id, analysis_date DESC),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 