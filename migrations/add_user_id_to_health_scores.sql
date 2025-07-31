-- Add user_id column to health_scores table
ALTER TABLE health_scores 
ADD COLUMN user_id INT NOT NULL AFTER id,
ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
ADD INDEX idx_user_id (user_id); 