// controllers/analyticsController.js
import { pool } from '../config/db.js';

// Get comprehensive analytics for a user
export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from middleware like other controllers
    const { timeframe = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Get cardio history with aggregated data
    const cardioQuery = `
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as total_sets,
        COUNT(DISTINCT exercise) as unique_exercises,
        exercise,
        COUNT(exercise) as exercise_count
      FROM cardio_history 
      WHERE user_id = ? 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(completed_at), exercise
      ORDER BY DATE(completed_at) DESC, exercise
    `;

    // Get breath hold records
    const breathHoldQuery = `
      SELECT 
        DATE(date) as date,
        duration,
        AVG(duration) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
      FROM breath_hold_records 
      WHERE user_id = ? 
        AND date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY date DESC
    `;

    // Get daily aggregated data for correlation
    const correlationQuery = `
      SELECT 
        DATE(c.completed_at) as date,
        COUNT(c.id) as cardio_sets,
        COUNT(DISTINCT c.exercise) as cardio_variety,
        COALESCE(AVG(b.duration), 0) as avg_breath_hold,
        MAX(b.duration) as max_breath_hold
      FROM cardio_history c
      LEFT JOIN breath_hold_records b ON DATE(c.completed_at) = DATE(b.date) AND c.user_id = b.user_id
      WHERE c.user_id = ? 
        AND c.completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(c.completed_at)
      HAVING COUNT(c.id) > 0
      ORDER BY DATE(c.completed_at) DESC
    `;

    // Get overall stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM cardio_history WHERE user_id = ? AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) as total_cardio_sets,
        (SELECT COUNT(DISTINCT exercise) FROM cardio_history WHERE user_id = ? AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) as unique_exercises,
        (SELECT AVG(duration) FROM breath_hold_records WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL ? DAY)) as avg_breath_hold,
        (SELECT MAX(duration) FROM breath_hold_records WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL ? DAY)) as max_breath_hold,
        (SELECT COUNT(*) FROM breath_hold_records WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL ? DAY)) as total_breath_records
    `;

    const [cardioResults] = await pool.execute(cardioQuery, [userId, timeframe]);
    const [breathHoldResults] = await pool.execute(breathHoldQuery, [userId, timeframe]);
    const [correlationResults] = await pool.execute(correlationQuery, [userId, timeframe]);
    const [statsResults] = await pool.execute(statsQuery, [
      userId, timeframe, userId, timeframe, userId, timeframe, 
      userId, timeframe, userId, timeframe
    ]);

    // Process cardio data by date
    const cardioByDate = processCardioData(cardioResults);

    // Calculate correlation coefficient
    const correlation = calculateCorrelation(correlationResults.filter(r => r.avg_breath_hold > 0));

    res.json({
      success: true,
      data: {
        cardioByDate: Object.values(cardioByDate),
        breathHoldRecords: breathHoldResults.map(r => ({
          ...r,
          date: r.date.toISOString().split('T')[0]
        })),
        correlationData: correlationResults.map(r => ({
          ...r,
          date: r.date.toISOString().split('T')[0]
        })),
        stats: statsResults[0],
        correlation: {
          coefficient: correlation,
          strength: Math.abs(correlation) > 0.7 ? 'Strong' : 
                   Math.abs(correlation) > 0.3 ? 'Moderate' : 'Weak',
          direction: correlation > 0 ? 'Positive' : correlation < 0 ? 'Negative' : 'None'
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
};

// Get detailed exercise breakdown
export const getExercises = async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from middleware
    const { timeframe = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const query = `
      SELECT 
        exercise,
        COUNT(*) as total_sets,
        COUNT(DISTINCT DATE(completed_at)) as days_performed,
        MIN(completed_at) as first_performed,
        MAX(completed_at) as last_performed,
        ROUND(COUNT(*) / COUNT(DISTINCT DATE(completed_at)), 1) as avg_sets_per_day
      FROM cardio_history 
      WHERE user_id = ? 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY exercise
      ORDER BY total_sets DESC
    `;

    const [results] = await pool.execute(query, [userId, timeframe]);
    
    res.json({
      success: true,
      data: results.map(row => ({
        ...row,
        first_performed: row.first_performed.toISOString(),
        last_performed: row.last_performed.toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch exercise data',
      message: error.message
    });
  }
};

// Get breath hold performance trends
export const getBreathHoldTrends = async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from middleware
    const { timeframe = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const query = `
      SELECT 
        DATE(date) as date,
        duration,
        AVG(duration) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg_7day,
        AVG(duration) OVER (ORDER BY date ROWS BETWEEN 13 PRECEDING AND CURRENT ROW) as moving_avg_14day,
        MAX(duration) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) as personal_best,
        RANK() OVER (ORDER BY duration DESC) as duration_rank
      FROM breath_hold_records 
      WHERE user_id = ? 
        AND date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY date DESC
    `;

    const [results] = await pool.execute(query, [userId, timeframe]);
    
    res.json({
      success: true,
      data: results.map(row => ({
        ...row,
        date: row.date.toISOString().split('T')[0],
        is_personal_best: row.duration_rank === 1
      }))
    });

  } catch (error) {
    console.error('Error fetching breath hold trends:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch breath hold trends',
      message: error.message
    });
  }
};

// Get cardio performance summary
export const getCardioSummary = async (req, res) => {
  try {
    const userId = req.user.id; // Get userId from middleware
    const { timeframe = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    const summaryQuery = `
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as total_sets,
        COUNT(DISTINCT exercise) as exercise_variety,
        GROUP_CONCAT(DISTINCT exercise ORDER BY exercise) as exercises_performed,
        HOUR(completed_at) as workout_hour
      FROM cardio_history 
      WHERE user_id = ? 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(completed_at)
      ORDER BY DATE(completed_at) DESC
    `;

    const workoutTimingQuery = `
      SELECT 
        HOUR(completed_at) as hour,
        COUNT(*) as workout_count,
        COUNT(DISTINCT DATE(completed_at)) as days_count
      FROM cardio_history 
      WHERE user_id = ? 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY HOUR(completed_at)
      ORDER BY workout_count DESC
    `;

    const [summaryResults] = await pool.execute(summaryQuery, [userId, timeframe]);
    const [timingResults] = await pool.execute(workoutTimingQuery, [userId, timeframe]);
    
    res.json({
      success: true,
      data: {
        dailySummary: summaryResults.map(row => ({
          ...row,
          date: row.date.toISOString().split('T')[0],
          exercises_performed: row.exercises_performed ? row.exercises_performed.split(',') : []
        })),
        workoutTiming: timingResults,
        insights: generateCardioInsights(summaryResults, timingResults)
      }
    });

  } catch (error) {
    console.error('Error fetching cardio summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cardio summary',
      message: error.message
    });
  }
};

// Helper method to process cardio data
const processCardioData = (cardioResults) => {
  const cardioByDate = {};
  cardioResults.forEach(row => {
    const dateStr = row.date.toISOString().split('T')[0];
    if (!cardioByDate[dateStr]) {
      cardioByDate[dateStr] = {
        date: dateStr,
        total_sets: 0,
        exercises: {}
      };
    }
    cardioByDate[dateStr].total_sets += row.exercise_count;
    cardioByDate[dateStr].exercises[row.exercise] = row.exercise_count;
  });
  return cardioByDate;
};

// Helper method to calculate correlation
const calculateCorrelation = (data) => {
  if (data.length < 2) return 0;
  
  const n = data.length;
  const sumX = data.reduce((sum, item) => sum + item.cardio_sets, 0);
  const sumY = data.reduce((sum, item) => sum + item.avg_breath_hold, 0);
  const sumXY = data.reduce((sum, item) => sum + (item.cardio_sets * item.avg_breath_hold), 0);
  const sumX2 = data.reduce((sum, item) => sum + (item.cardio_sets * item.cardio_sets), 0);
  const sumY2 = data.reduce((sum, item) => sum + (item.avg_breath_hold * item.avg_breath_hold), 0);
  
  const numerator = (n * sumXY) - (sumX * sumY);
  const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

// Helper method to generate insights
const generateCardioInsights = (summaryData, timingData) => {
  const insights = [];
  
  if (timingData.length > 0) {
    const preferredHour = timingData[0];
    const timeLabel = preferredHour.hour < 12 ? 'morning' : 
                     preferredHour.hour < 18 ? 'afternoon' : 'evening';
    insights.push(`You prefer ${timeLabel} workouts (${preferredHour.hour}:00)`);
  }

  const avgSetsPerDay = summaryData.reduce((sum, day) => sum + day.total_sets, 0) / summaryData.length;
  if (avgSetsPerDay > 10) {
    insights.push('High intensity training detected');
  } else if (avgSetsPerDay > 5) {
    insights.push('Moderate training volume');
  } else {
    insights.push('Light training sessions');
  }

  const avgVariety = summaryData.reduce((sum, day) => sum + day.exercise_variety, 0) / summaryData.length;
  if (avgVariety > 3) {
    insights.push('Great exercise variety!');
  }

  return insights;
};