import { pool } from '../config/db.js';
import axios from 'axios';

// AI API configuration
const AI_API_URL = 'http://www.fitimage.io/api/api_fat_predict/';
const AI_TOKEN = process.env.AI_FAT_PREDICT_TOKEN || 'your_token_here'; // You'll need to set this in your environment

// Get user gender from user_forms table
const getUserGender = async (userId) => {
  try {
    const [rows] = await pool.query(
      'SELECT gender FROM user_forms WHERE user_id = ?',
      [userId]
    );
    
    if (rows.length === 0) {
      throw new Error('User form not found. Please complete your health profile first.');
    }
    
    const gender = rows[0].gender;
    if (!gender || !['male', 'female'].includes(gender.toLowerCase())) {
      throw new Error('Gender not found or invalid. Please update your health profile.');
    }
    
    return gender.toLowerCase();
  } catch (error) {
    throw error;
  }
};

// Convert image to base64
const imageToBase64 = (imageUri) => {
  // For React Native, the image URI is already a base64 string or file path
  // We need to handle this properly based on the platform
  return imageUri;
};

// Call AI API
const callAIApi = async (gender, imageBase64) => {
  try {
    const requestData = {
      gender: gender,
      image: imageBase64,
      token: AI_TOKEN
    };

    console.log('Calling AI API with data:', {
      gender: requestData.gender,
      imageLength: requestData.image ? requestData.image.length : 0,
      token: requestData.token ? '***' : 'missing'
    });

    const response = await axios.post(AI_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    console.log('AI API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('AI API error:', error.response?.data || error.message);
    throw new Error(`AI API call failed: ${error.response?.data?.message || error.message}`);
  }
};

// Save analysis result to database
const saveAnalysisResult = async (userId, imageName, bodyFatPercentage, imageBase64, gender, status = 'completed', errorMessage = null) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO ai_body_fat_analysis (
        user_id, image_name, body_fat_percentage, image_base64, gender, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, imageName, bodyFatPercentage, imageBase64, gender, status, errorMessage]
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error saving analysis result:', error);
    throw error;
  }
};

// Main controller function
export const analyzeBodyFatWithAI = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { imageBase64, imageName } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Get user gender from user_forms table
    let gender;
    try {
      gender = await getUserGender(userId);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Save initial record with pending status
    const analysisId = await saveAnalysisResult(
      userId, 
      imageName || 'ai_analysis_' + Date.now(), 
      null, 
      imageBase64, 
      gender, 
      'pending'
    );

    // Call AI API
    let aiResponse;
    try {
      aiResponse = await callAIApi(gender, imageBase64);
    } catch (error) {
      // Update record with failed status
      await pool.query(
        'UPDATE ai_body_fat_analysis SET status = ?, error_message = ? WHERE id = ?',
        ['failed', error.message, analysisId]
      );
      
      return res.status(500).json({ 
        error: 'AI analysis failed', 
        details: error.message 
      });
    }

    // Extract body fat percentage from AI response
    console.log('📊 AI API response structure:', JSON.stringify(aiResponse, null, 2));
    
    // Check if the image is not recognized as human
    if (aiResponse.api_data && aiResponse.api_data.prediction && aiResponse.api_data.prediction.message) {
      const errorMessage = aiResponse.api_data.prediction.message;
      if (errorMessage.includes('not human') || errorMessage.includes('Supplied Image is not human')) {
        console.log('❌ Image not recognized as human:', errorMessage);
        // Update record with failed status
        await pool.query(
          'UPDATE ai_body_fat_analysis SET status = ?, error_message = ? WHERE id = ?',
          ['failed', errorMessage, analysisId]
        );
        
        return res.status(400).json({ 
          error: 'Image not recognized as human',
          details: errorMessage
        });
      }
    }
    
    let bodyFatPercentage;
    if (aiResponse.api_data && aiResponse.api_data.predictions && aiResponse.api_data.predictions.length > 0) {
      // The AI API returns predictions array, we need to extract the body fat percentage
      const prediction = aiResponse.api_data.predictions[0];
      console.log('🔍 Prediction object:', prediction);
      
      // Try different possible field names for body fat percentage
      bodyFatPercentage = prediction.bodyfat || prediction.Bodyfat || prediction.body_fat || prediction.bodyFat || prediction.percentage;
      
      if (!bodyFatPercentage && typeof prediction === 'object') {
        // If prediction is an object, try to find any numeric value that could be body fat
        const values = Object.values(prediction).filter(val => typeof val === 'number');
        if (values.length > 0) {
          bodyFatPercentage = values[0];
        }
      }
    } else {
      // Fallback to old format
      bodyFatPercentage = aiResponse.Bodyfat || aiResponse.bodyfat;
    }
    
    console.log('📊 Extracted body fat percentage:', bodyFatPercentage);
    
    if (!bodyFatPercentage) {
      console.log('❌ Could not extract body fat percentage from response');
      // Update record with failed status
      await pool.query(
        'UPDATE ai_body_fat_analysis SET status = ?, error_message = ? WHERE id = ?',
        ['failed', 'Invalid response from AI API - body fat percentage not found', analysisId]
      );
      
      return res.status(500).json({ 
        error: 'Invalid response from AI API',
        details: 'Body fat percentage not found in response. Response structure: ' + JSON.stringify(aiResponse)
      });
    }

    // Update record with completed status and results
    await pool.query(
      'UPDATE ai_body_fat_analysis SET body_fat_percentage = ?, status = ? WHERE id = ?',
      [bodyFatPercentage, 'completed', analysisId]
    );

    res.status(200).json({
      success: true,
      message: 'AI analysis completed successfully',
      data: {
        analysisId,
        imageName: aiResponse['image name'] || imageName,
        bodyFatPercentage: parseFloat(bodyFatPercentage),
        gender,
        analysisDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in AI body fat analysis:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Get user's AI analysis history
export const getAIAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [rows] = await pool.query(
      `SELECT id, image_name, body_fat_percentage, analysis_date, gender, status, error_message, created_at
       FROM ai_body_fat_analysis 
       WHERE user_id = ? 
       ORDER BY analysis_date DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        analyses: rows
      }
    });

  } catch (error) {
    console.error('Error fetching AI analysis history:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}; 