import moment from 'moment';
import { pool } from '../config/db.js';

// Nutrient absorption constants
const ABSORPTION_TIMES = {
  carbs: { min: 0.5, max: 2, avg: 1.25 },
  protein: { min: 2, max: 4, avg: 3 },
  fat: { min: 4, max: 6, avg: 5 }
};

// Calculate digestion duration based on nutrient amount
const calculateDigestionDuration = (nutrientType, amount) => {
  const baseTime = ABSORPTION_TIMES[nutrientType].avg;
  const baseAmount = 10; // Base amount for standard digestion time
  
  // Adjust time based on amount (more nutrients = longer digestion)
  if (amount <= baseAmount) {
    return baseTime;
  } else {
    // Increase time proportionally but with diminishing returns
    const multiplier = Math.min(1 + (amount - baseAmount) / baseAmount * 0.5, 2);
    return baseTime * multiplier;
  }
};

// Utility functions
const calculateDigestionTimeline = (food, consumedAt) => {
  const timeline = [];
  const consumedTime = moment(consumedAt);
  
  Object.entries(ABSORPTION_TIMES).forEach(([nutrient, times]) => {
    if (food[nutrient] && food[nutrient] > 0) {
      timeline.push({
        nutrient,
        startTime: consumedTime.format('HH:mm'),
        endTime: consumedTime.add(times.avg, 'hours').format('HH:mm'),
        duration: times.avg,
        amount: food[nutrient]
      });
    }
  });
  
  return timeline;
};

const calculateSatietyForecast = (macros, consumedAt) => {
  const consumedTime = moment(consumedAt);
  const proteinSatiety = macros.protein * 0.3; // Protein has highest satiety
  const fatSatiety = macros.fat * 0.2;
  const carbSatiety = macros.carbs * 0.1;
  
  const totalSatiety = proteinSatiety + fatSatiety + carbSatiety;
  const satietyDuration = Math.min(totalSatiety * 2, 8); // Max 8 hours
  
  return {
    satietyScore: Math.min(totalSatiety, 10),
    duration: satietyDuration,
    nextMealTime: consumedTime.add(satietyDuration, 'hours').format('HH:mm'),
    recommendations: getSatietyRecommendations(macros)
  };
};

const generateEnergyReleaseCurve = (macros) => {
  const curve = [];
  const totalCalories = (macros.carbs * 4) + (macros.protein * 4) + (macros.fat * 9);
  
  // Carbs provide immediate energy
  if (macros.carbs > 0) {
    curve.push({ time: 0, energy: macros.carbs * 4 * 0.7, source: 'carbs' });
    curve.push({ time: 2, energy: macros.carbs * 4 * 0.3, source: 'carbs' });
  }
  
  // Protein provides sustained energy
  if (macros.protein > 0) {
    curve.push({ time: 1, energy: macros.protein * 4 * 0.5, source: 'protein' });
    curve.push({ time: 4, energy: macros.protein * 4 * 0.5, source: 'protein' });
  }
  
  // Fat provides long-term energy
  if (macros.fat > 0) {
    curve.push({ time: 2, energy: macros.fat * 9 * 0.3, source: 'fat' });
    curve.push({ time: 6, energy: macros.fat * 9 * 0.7, source: 'fat' });
  }
  
  return curve.sort((a, b) => a.time - b.time);
};

const getSatietyRecommendations = (macros) => {
  const recommendations = [];
  
  if (macros.protein < 20) {
    recommendations.push('Consider adding more protein for better satiety');
  }
  if (macros.fat < 10) {
    recommendations.push('Add healthy fats to prolong satiety');
  }
  if (macros.carbs > 100) {
    recommendations.push('High carb intake may cause energy crashes');
  }
  
  return recommendations;
};

// Exported routes
export const getDigestiveTimeline = async (req, res) => {
  try {
    const { foods } = req.body;
    const user_id = req.user.id;
    
    if (!foods || !Array.isArray(foods)) {
      return res.status(400).json({ error: 'Foods array is required' });
    }
    
    const timeline = foods.map(food => {
      const consumedAt = food.created_at || new Date().toISOString();
      const consumedTime = moment(consumedAt);
      
      // Get nutritional values (already adjusted for quantity)
      const carbsAmount = food.carbs || 0;
      const proteinAmount = food.protein || 0;
      const fatAmount = food.fat || 0;
      
      // Calculate digestion duration based on nutrient amounts
      const carbsDuration = calculateDigestionDuration('carbs', carbsAmount);
      const proteinDuration = calculateDigestionDuration('protein', proteinAmount);
      const fatDuration = calculateDigestionDuration('fat', fatAmount);
      
      return {
        id: food.id,
        name: food.name,
        category: food.category,
        digestion: {
          carbs: {
            startTime: consumedTime.format('HH:mm'),
            endTime: consumedTime.clone().add(carbsDuration, 'hours').format('HH:mm'),
            duration: Math.round(carbsDuration * 10) / 10, // Round to 1 decimal
            amount: carbsAmount
          },
          protein: {
            startTime: consumedTime.format('HH:mm'),
            endTime: consumedTime.clone().add(proteinDuration, 'hours').format('HH:mm'),
            duration: Math.round(proteinDuration * 10) / 10, // Round to 1 decimal
            amount: proteinAmount
          },
          fat: {
            startTime: consumedTime.format('HH:mm'),
            endTime: consumedTime.clone().add(fatDuration, 'hours').format('HH:mm'),
            duration: Math.round(fatDuration * 10) / 10, // Round to 1 decimal
            amount: fatAmount
          }
        },
        totalDigestionTime: Math.round(Math.max(carbsDuration, proteinDuration, fatDuration) * 10) / 10
      };
    });
    
    res.json(timeline);
  } catch (error) {
    console.error('Error generating digestive timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSatietyForecast = async (req, res) => {
  try {
    const { foods } = req.body;
    const user_id = req.user.id;
    
    if (!foods || !Array.isArray(foods)) {
      return res.status(400).json({ error: 'Foods array is required' });
    }
    
    const forecasts = foods.map(food => {
      const consumedAt = food.created_at || new Date().toISOString();
      const macros = {
        carbs: food.carbs || 0,
        protein: food.protein || 0,
        fat: food.fat || 0
      };
      
      const forecast = calculateSatietyForecast(macros, consumedAt);
      
      return {
        id: food.id,
        name: food.name,
        category: food.category,
        forecast: {
          satietyScore: forecast.satietyScore,
          duration: forecast.duration,
          fullUntil: forecast.nextMealTime
        }
      };
    });
    
    res.json(forecasts);
  } catch (error) {
    console.error('Error generating satiety forecast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEnergyCurve = async (req, res) => {
  try {
    const { foods } = req.body;
    const user_id = req.user.id;
    
    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ error: 'Foods array is required' });
    }
    
    // Use the latest meal for energy curve
    const latestMeal = foods[foods.length - 1];
    const macros = {
      carbs: latestMeal.carbs || 0,
      protein: latestMeal.protein || 0,
      fat: latestMeal.fat || 0
    };
    
    const energyCurve = generateEnergyReleaseCurve(macros);
    
    res.json({
      meal: {
        id: latestMeal.id,
        name: latestMeal.name,
        category: latestMeal.category
      },
      energyCurve: energyCurve.map(point => ({
        time: point.time,
        energy: point.energy
      }))
    });
  } catch (error) {
    console.error('Error generating energy curve:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLateNightAnalysis = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Get food logs for the specified date
    const [foodLogs] = await pool.query(
      'SELECT * FROM food_logs WHERE user_id = ? AND date = ? ORDER BY meal',
      [user_id, date]
    );
    
    // Analyze late night eating patterns
    const lateNightFoods = foodLogs.filter(log => {
      const mealTime = moment(log.date + ' ' + (log.meal_time || '22:00'));
      return mealTime.hour() >= 20; // After 8 PM
    });
    
    const analysis = {
      totalLateNightCalories: lateNightFoods.reduce((sum, food) => sum + (food.calories || 0), 0),
      lateNightFoods: lateNightFoods.length,
      recommendations: lateNightFoods.length > 0 ? [
        'Consider eating earlier in the evening',
        'Avoid heavy meals close to bedtime',
        'Focus on light, protein-rich snacks if needed'
      ] : ['Good job avoiding late night eating!']
    };
    
    res.json({
      analysis,
      user_id,
      date,
      generatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
    });
  } catch (error) {
    console.error('Error generating late night analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMacroBalance = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Get food logs for the specified date
    const [foodLogs] = await pool.query(
      'SELECT * FROM food_logs WHERE user_id = ? AND date = ?',
      [user_id, date]
    );
    
    // Calculate total macros
    const totals = foodLogs.reduce((acc, food) => ({
      carbs: acc.carbs + (food.carbs || 0),
      protein: acc.protein + (food.protein || 0),
      fat: acc.fat + (food.fat || 0),
      calories: acc.calories + (food.calories || 0)
    }), { carbs: 0, protein: 0, fat: 0, calories: 0 });
    
    // Calculate percentages
    const totalCalories = totals.carbs * 4 + totals.protein * 4 + totals.fat * 9;
    const macroPercentages = {
      carbs: totalCalories > 0 ? (totals.carbs * 4 / totalCalories) * 100 : 0,
      protein: totalCalories > 0 ? (totals.protein * 4 / totalCalories) * 100 : 0,
      fat: totalCalories > 0 ? (totals.fat * 9 / totalCalories) * 100 : 0
    };
    
    // Generate recommendations
    const recommendations = [];
    if (macroPercentages.protein < 15) recommendations.push('Increase protein intake');
    if (macroPercentages.fat < 20) recommendations.push('Add healthy fats');
    if (macroPercentages.carbs > 60) recommendations.push('Consider reducing carb intake');
    
    res.json({
      totals,
      percentages: macroPercentages,
      recommendations,
      user_id,
      date,
      generatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
    });
  } catch (error) {
    console.error('Error generating macro balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAbsorptionStatus = async (req, res) => {
  try {
    const { foods } = req.body;
    const user_id = req.user.id;
    
    if (!foods || !Array.isArray(foods)) {
      return res.status(400).json({ error: 'Foods array is required' });
    }
    
    const absorptionStatuses = foods.map(food => {
      const consumedTime = moment(food.created_at || new Date().toISOString());
      const currentTime = moment();
      const hoursSinceConsumption = currentTime.diff(consumedTime, 'hours', true);
      
      // Calculate absorption percentage based on time elapsed
      let absorptionPercentage = 0;
      let status = 'digesting';
      let timeRemaining = 0;
      
      if (food.carbs && food.carbs > 0) {
        const carbProgress = Math.min(hoursSinceConsumption / ABSORPTION_TIMES.carbs.avg, 1);
        absorptionPercentage = Math.max(absorptionPercentage, carbProgress * 100);
      }
      
      if (food.protein && food.protein > 0) {
        const proteinProgress = Math.min(hoursSinceConsumption / ABSORPTION_TIMES.protein.avg, 1);
        absorptionPercentage = Math.max(absorptionPercentage, proteinProgress * 100);
      }
      
      if (food.fat && food.fat > 0) {
        const fatProgress = Math.min(hoursSinceConsumption / ABSORPTION_TIMES.fat.avg, 1);
        absorptionPercentage = Math.max(absorptionPercentage, fatProgress * 100);
      }
      
      // Determine status
      if (absorptionPercentage >= 100) {
        status = 'fully_absorbed';
        timeRemaining = 0;
      } else if (absorptionPercentage >= 70) {
        status = 'mostly_absorbed';
        timeRemaining = Math.max(0, 6 - hoursSinceConsumption);
      } else {
        status = 'digesting';
        timeRemaining = Math.max(0, 6 - hoursSinceConsumption);
      }
      
      return {
        id: food.id,
        name: food.name,
        category: food.category,
        absorptionPercentage: Math.round(absorptionPercentage),
        status,
        timeRemaining
      };
    });
    
    res.json(absorptionStatuses);
  } catch (error) {
    console.error('Error generating absorption status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Comprehensive insights endpoint
export const getComprehensive = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { date } = req.query;
    const { food, macros, consumedAt, foodId } = req.body;
    
    // Initialize results object
    const comprehensiveInsights = {
      user_id,
      generatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
    };
    
    // Generate digestive timeline if food data is provided
    if (food && consumedAt) {
      comprehensiveInsights.digestiveTimeline = {
        timeline: calculateDigestionTimeline(food, consumedAt),
        consumedAt,
        user_id
      };
    }
    
    // Generate satiety forecast if macros data is provided
    if (macros && consumedAt) {
      comprehensiveInsights.satietyForecast = {
        forecast: calculateSatietyForecast(macros, consumedAt),
        consumedAt,
        user_id
      };
    }
    
    // Generate energy curve if macros data is provided
    if (macros) {
      comprehensiveInsights.energyCurve = {
        energyCurve: generateEnergyReleaseCurve(macros),
        user_id
      };
    }
    
    // Generate late night analysis if date is provided
    if (date) {
      try {
        const [foodLogs] = await pool.query(
          'SELECT * FROM food_logs WHERE user_id = ? AND date = ? ORDER BY meal',
          [user_id, date]
        );
        
        const lateNightFoods = foodLogs.filter(log => {
          const mealTime = moment(log.date + ' ' + (log.meal_time || '22:00'));
          return mealTime.hour() >= 20; // After 8 PM
        });
        
        comprehensiveInsights.lateNightAnalysis = {
          analysis: {
            totalLateNightCalories: lateNightFoods.reduce((sum, food) => sum + (food.calories || 0), 0),
            lateNightFoods: lateNightFoods.length,
            recommendations: lateNightFoods.length > 0 ? [
              'Consider eating earlier in the evening',
              'Avoid heavy meals close to bedtime',
              'Focus on light, protein-rich snacks if needed'
            ] : ['Good job avoiding late night eating!']
          },
          user_id,
          date
        };
      } catch (error) {
        console.error('Error generating late night analysis:', error);
      }
    }
    
    // Generate macro balance if date is provided
    if (date) {
      try {
        const [foodLogs] = await pool.query(
          'SELECT * FROM food_logs WHERE user_id = ? AND date = ?',
          [user_id, date]
        );
        
        const totals = foodLogs.reduce((acc, food) => ({
          carbs: acc.carbs + (food.carbs || 0),
          protein: acc.protein + (food.protein || 0),
          fat: acc.fat + (food.fat || 0),
          calories: acc.calories + (food.calories || 0)
        }), { carbs: 0, protein: 0, fat: 0, calories: 0 });
        
        const totalCalories = totals.carbs * 4 + totals.protein * 4 + totals.fat * 9;
        const macroPercentages = {
          carbs: totalCalories > 0 ? (totals.carbs * 4 / totalCalories) * 100 : 0,
          protein: totalCalories > 0 ? (totals.protein * 4 / totalCalories) * 100 : 0,
          fat: totalCalories > 0 ? (totals.fat * 9 / totalCalories) * 100 : 0
        };
        
        const recommendations = [];
        if (macroPercentages.protein < 15) recommendations.push('Increase protein intake');
        if (macroPercentages.fat < 20) recommendations.push('Add healthy fats');
        if (macroPercentages.carbs > 60) recommendations.push('Consider reducing carb intake');
        
        comprehensiveInsights.macroBalance = {
          totals,
          percentages: macroPercentages,
          recommendations,
          user_id,
          date
        };
      } catch (error) {
        console.error('Error generating macro balance:', error);
      }
    }
    
    // Generate absorption status if foodId and consumedAt are provided
    if (foodId && consumedAt) {
      try {
        const [foodLogs] = await pool.query(
          'SELECT * FROM food_logs WHERE id = ? AND user_id = ?',
          [foodId, user_id]
        );
        
        if (foodLogs.length > 0) {
          const food = foodLogs[0];
          const consumedTime = moment(consumedAt);
          const currentTime = moment();
          const hoursSinceConsumption = currentTime.diff(consumedTime, 'hours', true);
          
          const absorptionStatus = {
            foodName: food.name,
            consumedAt: consumedTime.format('YYYY-MM-DD HH:mm:ss'),
            hoursSinceConsumption,
            status: 'digesting',
            estimatedCompletion: null
          };
          
          if (food.carbs && food.carbs > 0) {
            if (hoursSinceConsumption >= ABSORPTION_TIMES.carbs.avg) {
              absorptionStatus.carbsStatus = 'absorbed';
            } else {
              absorptionStatus.carbsStatus = 'digesting';
              absorptionStatus.estimatedCompletion = consumedTime.add(ABSORPTION_TIMES.carbs.avg, 'hours').format('HH:mm');
            }
          }
          
          if (food.protein && food.protein > 0) {
            if (hoursSinceConsumption >= ABSORPTION_TIMES.protein.avg) {
              absorptionStatus.proteinStatus = 'absorbed';
            } else {
              absorptionStatus.proteinStatus = 'digesting';
              absorptionStatus.estimatedCompletion = consumedTime.add(ABSORPTION_TIMES.protein.avg, 'hours').format('HH:mm');
            }
          }
          
          if (food.fat && food.fat > 0) {
            if (hoursSinceConsumption >= ABSORPTION_TIMES.fat.avg) {
              absorptionStatus.fatStatus = 'absorbed';
            } else {
              absorptionStatus.fatStatus = 'digesting';
              absorptionStatus.estimatedCompletion = consumedTime.add(ABSORPTION_TIMES.fat.avg, 'hours').format('HH:mm');
            }
          }
          
          comprehensiveInsights.absorptionStatus = {
            absorptionStatus,
            user_id
          };
        }
      } catch (error) {
        console.error('Error generating absorption status:', error);
      }
    }

    res.json(comprehensiveInsights);
  } catch (error) {
    console.error('Error generating comprehensive insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
