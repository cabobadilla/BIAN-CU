// Configurar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== PROGRESSIVE SERVER START ===');
console.log('Environment:', process.env.NODE_ENV);

// Imports (ya sabemos que funcionan)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';

import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { initializeDefaultData } from './utils/initialization';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';

console.log('✅ All imports successful');

try {
  console.log('1. Creating Express app...');
  const app = express();
  const PORT = process.env.PORT || 3001;
  console.log('✅ Express app created');

  console.log('2. Configuring rate limiter...');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  });
  console.log('✅ Rate limiter configured');

  console.log('3. Adding basic middleware...');
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:5173',
    credentials: true
  }));
  app.use(limiter);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  console.log('✅ Basic middleware added');

  console.log('4. Configuring sessions...');
  const sessionConfig: any = {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  };

  if (process.env.MONGODB_URI && process.env.MONGODB_URI !== '...........') {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
    });
    console.log('✅ MongoDB session store configured');
  } else {
    console.log('⚠️ Using memory session store');
  }

  app.use(session(sessionConfig));
  console.log('✅ Session middleware added');

  console.log('5. Configuring Passport...');
  app.use(passport.initialize());
  app.use(passport.session());
  console.log('✅ Passport configured');

  console.log('6. Adding health route...');
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'PROGRESSIVE SERVER OK', 
      timestamp: new Date().toISOString()
    });
  });
  console.log('✅ Health route added');

  console.log('7. Adding auth routes...');
  app.use('/api/v1/auth', authRoutes);
  console.log('✅ Auth routes added');

  console.log('8. Adding error handler...');
  app.use(errorHandler);
  console.log('✅ Error handler added');

  console.log('9. Starting server initialization...');
  
  async function startServer() {
    try {
      console.log('10. Connecting to MongoDB...');
      if (process.env.MONGODB_URI && process.env.MONGODB_URI !== '...........') {
        await connectDB();
        console.log('✅ MongoDB connected');
        
        console.log('11. Initializing default data...');
        await initializeDefaultData();
        console.log('✅ Default data initialized');
      } else {
        console.log('⚠️ MongoDB not configured');
      }
      
      console.log('12. Starting HTTP server...');
      app.listen(PORT, () => {
        console.log(`✅ PROGRESSIVE Server running on port ${PORT}`);
        logger.info(`🚀 Servidor PROGRESIVO ejecutándose en puerto ${PORT}`);
      });
    } catch (error: any) {
      console.error('❌ SERVER STARTUP ERROR:', error);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  startServer();

} catch (error: any) {
  console.error('❌ CONFIGURATION ERROR:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} 