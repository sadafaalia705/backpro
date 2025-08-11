# Card Sequence Feature Setup

This feature allows users to customize the order of health tracking cards on their dashboard. Card positions are stored in the database and persist across sessions.

## Database Setup

### 1. Run the Migration
The database already includes the `card_sequence` table. If you need to update it with new card names, run:

```bash
cd backend/healthmedpro
node run_migration.js
```

### 2. Table Structure
The `card_sequence` table has the following structure:
- `id`: Auto-increment primary key
- `user_id`: Foreign key to users table (unique per user)
- `medicine_tracking_position`: Position for medicine tracking card (1-16)
- `calories_position`: Position for calories card (1-16)
- `water_position`: Position for water card (1-16)
- `steps_position`: Position for steps card (1-16)
- `sleep_position`: Position for sleep card (1-16)
- `blood_pressure_position`: Position for blood pressure card (1-16)
- `heart_rate_position`: Position for heart rate card (1-16)
- `temperature_position`: Position for temperature card (1-16)
- `breath_retention_position`: Position for breath retention card (1-16)
- `blood_oxygen_position`: Position for blood oxygen card (1-16)
- `cardio_position`: Position for cardio card (1-16)
- `blood_sugar_position`: Position for blood sugar card (1-16)
- `body_fat_position`: Position for body fat card (1-16)
- `happiness_score_position`: Position for happiness score card (1-16)
- `analytics_position`: Position for analytics card (1-16)
- `food_analytics_position`: Position for food analytics card (1-16)
- `created_at` and `updated_at`: Timestamps

## API Endpoints

### GET `/api/card-sequence/sequence`
Get the current user's card sequence.

**Response:**
```json
{
  "success": true,
  "cardSequence": [
    { "card_name": "medicine_tracking", "position": 1 },
    { "card_name": "calories", "position": 2 },
    // ... more cards sorted by position
  ]
}
```

### PUT `/api/card-sequence/sequence`
Update the user's card sequence.

**Request Body:**
```json
{
  "cardSequence": [
    { "card_name": "medicine_tracking", "position_number": 1 },
    { "card_name": "calories", "position_number": 2 },
    // ... all 16 cards with positions 1-16
  ]
}
```

### POST `/api/card-sequence/reset`
Reset the user's card sequence to default order.

## Frontend Integration

### 1. Card Sequence Service
The frontend uses `cardSequenceService.ts` to communicate with the backend:

- `getUserCardSequence()`: Load user's card order
- `updateCardPositions()`: Save new card order
- `resetToDefault()`: Reset to default order

### 2. Card Mapping
The frontend maps between backend card names and frontend IDs:

```typescript
const cardNameToId = {
  'medicine_tracking': 'medicineTracking',
  'calories': 'calories',
  'water': 'water',
  // ... etc
};
```

### 3. Drag and Drop
When users drag cards to reorder them:
1. Frontend updates the local state
2. Calls `saveCardSequence()` to persist changes
3. Backend updates the database

## Available Cards

The system supports 16 health tracking cards:

1. Medicine Tracking
2. Calories
3. Water
4. Steps
5. Sleep
6. Blood Pressure
7. Heart Rate
8. Temperature
9. Breath Retention
10. Blood Oxygen
11. Cardio
12. Blood Sugar
13. Body Fat
14. Happiness Score
15. Analytics
16. Food Analytics

## Default Order

New users get this default card order:
1. Medicine Tracking
2. Calories
3. Water
4. Steps
5. Sleep
6. Blood Pressure
7. Heart Rate
8. Temperature
9. Breath Retention
10. Blood Oxygen
11. Cardio
12. Blood Sugar
13. Body Fat
14. Happiness Score
15. Analytics
16. Food Analytics

## Error Handling

- If the API fails to load card sequence, the frontend falls back to default order
- If saving fails, the change is not persisted but the UI remains responsive
- All API calls include proper error handling and logging

## Testing

To test the feature:
1. Start the backend server
2. Start the frontend app
3. Login with a user account
4. Long press on any card to enable drag mode
5. Drag cards to reorder them
6. Refresh the app to verify positions persist 