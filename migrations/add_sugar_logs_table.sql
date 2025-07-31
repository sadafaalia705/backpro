-- Add sugar_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS sugar_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date_logged DATETIME DEFAULT CURRENT_TIMESTAMP,
  glucose_level INT NOT NULL,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, date_logged DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; 