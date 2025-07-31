-- Migration to add age and gender columns to user_forms table
-- Run this migration to update existing database

USE ha;

-- Add age column
ALTER TABLE user_forms 
ADD COLUMN age INT CHECK (age >= 1 AND age <= 120) AFTER name;

-- Add gender column
ALTER TABLE user_forms 
ADD COLUMN gender ENUM('male', 'female', 'other') AFTER age;

-- Update existing records with default values if needed
-- Note: You may want to update these with actual values from your application
-- UPDATE user_forms SET age = 25, gender = 'other' WHERE age IS NULL; 