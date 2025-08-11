import { pool } from '../config/db.js';

const cardSequenceController = {
  // Get user's card sequence
  getUserCardSequence: async (req, res) => {
    try {
      const userId = req.user.id; // Changed from req.user.user_id to req.user.id
      
      const query = `
        SELECT 
          medicine_tracking_position,
          calories_position,
          water_position,
          steps_position,
          sleep_position,
          blood_pressure_position,
          heart_rate_position,
          temperature_position,
          breath_retention_position,
          blood_oxygen_position,
          cardio_position,
          blood_sugar_position,
          body_fat_position,
          happiness_score_position,
          analytics_position,
          food_analytics_position
        FROM card_sequence 
        WHERE user_id = ?
      `;
      
      const [rows] = await pool.execute(query, [userId]);
      
      if (rows.length === 0) {
        // Initialize default sequence for new user
        await cardSequenceController.initializeDefaultSequence(userId);
        const [defaultRows] = await pool.execute(query, [userId]);
        return res.json({ success: true, cardSequence: cardSequenceController.convertToCardSequenceArray(defaultRows[0]) });
      }
      
      res.json({ success: true, cardSequence: cardSequenceController.convertToCardSequenceArray(rows[0]) });
    } catch (error) {
      console.error('Error getting card sequence:', error);
      res.status(500).json({ success: false, message: 'Failed to get card sequence' });
    }
  },

  // Helper function to convert row data to card sequence array
  convertToCardSequenceArray: (row) => {
    const cardMappings = [
      { card_name: 'medicine_tracking', position: row.medicine_tracking_position },
      { card_name: 'calories', position: row.calories_position },
      { card_name: 'water', position: row.water_position },
      { card_name: 'steps', position: row.steps_position },
      { card_name: 'sleep', position: row.sleep_position },
      { card_name: 'blood_pressure', position: row.blood_pressure_position },
      { card_name: 'heart_rate', position: row.heart_rate_position },
      { card_name: 'temperature', position: row.temperature_position },
      { card_name: 'breath_retention', position: row.breath_retention_position },
      { card_name: 'blood_oxygen', position: row.blood_oxygen_position },
      { card_name: 'cardio', position: row.cardio_position },
      { card_name: 'blood_sugar', position: row.blood_sugar_position },
      { card_name: 'body_fat', position: row.body_fat_position },
      { card_name: 'happiness_score', position: row.happiness_score_position },
      { card_name: 'analytics', position: row.analytics_position },
      { card_name: 'food_analytics', position: row.food_analytics_position }
    ];
    
    return cardMappings.sort((a, b) => a.position - b.position);
  },

  // Update card positions when cards are swapped
  updateCardPositions: async (req, res) => {
    try {
      console.log('🔄 updateCardPositions called');
      const userId = req.user.id; // Changed from req.user.user_id to req.user.id
      const { cardSequence } = req.body;
      
      console.log('👤 User ID:', userId);
      console.log('📦 Received card sequence:', cardSequence);
      console.log('📋 Raw request body:', req.body);
      
      if (!Array.isArray(cardSequence)) {
        return res.status(400).json({ success: false, message: 'Card sequence must be an array' });
      }
      
      // Validate card sequence
      const validCards = [
        'medicine_tracking', 'calories', 'water', 'steps', 'sleep', 'blood_pressure',
        'heart_rate', 'temperature', 'breath_retention', 'blood_oxygen', 'cardio',
        'blood_sugar', 'body_fat', 'happiness_score', 'analytics', 'food_analytics'
      ];
      
      for (let i = 0; i < cardSequence.length; i++) {
        const card = cardSequence[i];
        if (!validCards.includes(card.card_name)) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid card name: ${card.card_name}` 
          });
        }
        if (card.position_number < 1 || card.position_number > 16) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid position number: ${card.position_number}` 
          });
        }
      }
      
      // Create update object with all 16 card positions
      const allCardPositions = {
        medicine_tracking_position: 1,
        calories_position: 2,
        water_position: 3,
        steps_position: 4,
        sleep_position: 5,
        blood_pressure_position: 6,
        heart_rate_position: 7,
        temperature_position: 8,
        breath_retention_position: 9,
        blood_oxygen_position: 10,
        cardio_position: 11,
        blood_sugar_position: 12,
        body_fat_position: 13,
        happiness_score_position: 14,
        analytics_position: 15,
        food_analytics_position: 16
      };
      
      // Update with the new positions from the request
      cardSequence.forEach(card => {
        const fieldName = `${card.card_name}_position`;
        console.log(`🔍 Processing card: ${card.card_name} -> ${fieldName}, position: ${card.position_number}`);
        if (allCardPositions.hasOwnProperty(fieldName)) {
          allCardPositions[fieldName] = card.position_number || 1; // Ensure it's not undefined
          console.log(`✅ Updated ${fieldName} to ${allCardPositions[fieldName]}`);
        } else {
          console.log(`❌ Field ${fieldName} not found in allCardPositions`);
        }
      });
      
      // Ensure all values are numbers, not undefined
      Object.keys(allCardPositions).forEach(key => {
        if (allCardPositions[key] === undefined || allCardPositions[key] === null) {
          console.log(`⚠️  Found undefined/null value for ${key}, setting to 1`);
          allCardPositions[key] = 1;
        }
      });
      
      // Build the UPDATE query
      const setClause = Object.keys(allCardPositions)
        .map(field => `${field} = ?`)
        .join(', ');
      
      const query = `
        INSERT INTO card_sequence (user_id, ${Object.keys(allCardPositions).join(', ')})
        VALUES (?, ${Object.keys(allCardPositions).map(() => '?').join(', ')})
        ON DUPLICATE KEY UPDATE
        ${setClause}, updated_at = CURRENT_TIMESTAMP
      `;
      
      const values = [userId, ...Object.values(allCardPositions), ...Object.values(allCardPositions)];
      
      console.log('🔧 Executing query:', query);
      console.log('📊 Query values:', values);
      console.log('📋 All card positions object:', allCardPositions);
      
      // Check for undefined values
      const undefinedValues = values.filter(val => val === undefined);
      if (undefinedValues.length > 0) {
        console.log('❌ Found undefined values in query:', undefinedValues);
        throw new Error('Query contains undefined values');
      }
      
      await pool.execute(query, values);
      
      console.log('✅ Card sequence updated successfully');
      res.json({ success: true, message: 'Card sequence updated successfully' });
    } catch (error) {
      console.error('❌ Error updating card sequence:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      });
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update card sequence',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Initialize default card sequence for new users
  initializeDefaultSequence: async (userId) => {
    try {
      const query = `
        INSERT INTO card_sequence (user_id) 
        VALUES (?) 
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `;
      
      await pool.execute(query, [userId]);
    } catch (error) {
      console.error('Error initializing default sequence:', error);
      throw error;
    }
  },

  // Reset user's card sequence to default
  resetToDefault: async (req, res) => {
    try {
      const userId = req.user.id; // Changed from req.user.user_id to req.user.id
      
      const query = `
        UPDATE card_sequence 
        SET 
          medicine_tracking_position = 1,
          calories_position = 2,
          water_position = 3,
          steps_position = 4,
          sleep_position = 5,
          blood_pressure_position = 6,
          heart_rate_position = 7,
          temperature_position = 8,
          breath_retention_position = 9,
          blood_oxygen_position = 10,
          cardio_position = 11,
          blood_sugar_position = 12,
          body_fat_position = 13,
          happiness_score_position = 14,
          analytics_position = 15,
          food_analytics_position = 16,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;
      
      await pool.execute(query, [userId]);
      
      res.json({ success: true, message: 'Card sequence reset to default' });
    } catch (error) {
      console.error('Error resetting card sequence:', error);
      res.status(500).json({ success: false, message: 'Failed to reset card sequence' });
    }
  }
};

export default cardSequenceController;