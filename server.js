import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authroutes.js';
import formRoutes from './routes/formRoutes.js';
import respiratoryroutes from './routes/respiratoryRoutes.js';
import temperatureRoutes from './routes/temperatureRoutes.js';
import foodRoutes from './routes/foodRoutes.js';
import waterRoutes from './routes/waterRoutes.js';
import sleepRoutes from './routes/sleepRoutes.js';
import heartRoutes from './routes/heartRoutes.js';
import bpRoutes from './routes/bpRoutes.js';
import stepRoutes from './routes/stepRoutes.js';
import cardioRoutes from './routes/cardioRoutes.js';
import sugarRoutes from './routes/sugarRoutes.js';
import bodyFatRoutes from './routes/bodyFatRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import userformroutes from './routes/userformRoutes.js';
import fdRoutes from './routes/fdRoutes.js';
import healthScoreRoutes from './routes/healthScoreRoutes.js'; 
import holdRoutes from './routes/holdRoutes.js';

dotenv.config();

const app = express();

// ======================
const getFrontendUrls = () => {
    const urls = [
      'http://localhost:8081',   
    ];
    if (process.env.FRONTEND_URL) {
      const envUrls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
      urls.push(...envUrls);
    }
    return urls;
  };
  
  app.use(cors());
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));


  app.use('/api/auth', authRoutes);
  app.use('/api/water', waterRoutes);
  app.use('/api/sleep', sleepRoutes);
  
  app.use('/api/resp', respiratoryroutes);
  app.use('/api/temp', temperatureRoutes);
  app.use('/api/food', foodRoutes);
  app.use('/api/heart', heartRoutes);
  app.use('/api/bp', bpRoutes);
  app.use('/api/step', stepRoutes);
  app.use('/api/cardio', cardioRoutes);
  app.use('/api/sugar', sugarRoutes);
  app.use('/api/bodyfat', bodyFatRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/medicine', medicineRoutes);
  app.use('/api/form', formRoutes);
  app.use('/api/user-form', userformroutes);
  app.use('/api/foodlist', fdRoutes); 
  app.use('/api/healthscore', healthScoreRoutes);
  app.use('/api/hold', holdRoutes);

  
// ======================
// Error Handling
// ======================
  app.use((err, req, res, next) => {
    console.error('[Server Error]', err.stack);
    res.status(500).json({
      status: 'ERROR',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
  
  // ======================
  // Start Server
  // ======================
  const PORT = process.env.PORT || 5001;
  const HOST = process.env.HOST || '0.0.0.0';

  app.get('/', (req, res) => {
    res.send('<h1>✅ Server is running...</h1>');
  });



  app.listen(PORT, HOST, () => {
    console.log(`
    Server running:
    - Environment: ${process.env.NODE_ENV || 'development'}
    - URL: http://${HOST}:${PORT}
    - Database: ${process.env.DB_NAME}@${process.env.DB_HOST}
    - File Storage: Local uploads directory
    `);
  });
  
  export default app;