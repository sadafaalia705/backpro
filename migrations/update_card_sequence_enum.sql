-- Update card_sequence table to include missing card names
ALTER TABLE card_sequence 
MODIFY COLUMN card_name ENUM(
    'medicine_tracking',
    'calories',
    'water',
    'steps',
    'sleep',
    'blood_pressure',
    'heart_rate',
    'temperature',
    'breath_retention',
    'blood_oxygen',
    'cardio',
    'blood_sugar',
    'body_fat',
    'happiness_score',
    'analytics',
    'food_analytics'
) NOT NULL; 