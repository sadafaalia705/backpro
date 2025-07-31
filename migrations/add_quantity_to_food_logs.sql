-- Add quantity column to food_logs table
ALTER TABLE food_logs ADD COLUMN quantity INT DEFAULT 1 AFTER sugar; 