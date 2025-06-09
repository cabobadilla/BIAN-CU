// Configurar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== INCREMENTAL SERVER START ===');
console.log('1. Dotenv configured');
// Force redeploy v2 - 2025-06-09

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
console.log('2. Basic Express modules imported');

import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { initializeDefaultData } from './utils/initialization';
console.log('3. Database, logger, and initialization imported');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});

console.log('4. Rate limiter configured');

// Middleware de seguridad
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

console.log('5. Security middleware configured');

// PASO 1: Agregar solo session y passport básico (SIN estrategias)
console.log('6. Importing session middleware...');
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Configuración de sesiones
const sessionConfig: any = {
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
};

// Solo usar MongoStore si MongoDB está configurado
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== '...........') {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  });
  logger.info('Using MongoDB for session storage');
} else {
  logger.warn('MongoDB not configured, using memory store for sessions');
}

app.use(session(sessionConfig));
console.log('7. Session middleware configured');

// PASO 2: Agregar Passport básico (SIN estrategias)
console.log('8. Importing Passport...');
import passport from 'passport';

app.use(passport.initialize());
app.use(passport.session());
console.log('9. Passport basic setup completed');

// PASO 3: Agregar estrategias OAuth
console.log('10. Importing OAuth strategies...');
import './config/passport';
console.log('11. OAuth strategies configured');

// PASO 4: Agregar rutas OAuth
console.log('12. Importing auth routes...');
import { authRoutes } from './routes/auth';
console.log('13. Auth routes imported');

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'INCREMENTAL SERVER OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    step: 'Basic + Sessions + Passport + OAuth + Routes'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'INCREMENTAL SERVER RUNNING',
    timestamp: new Date().toISOString(),
    step: 'Basic + Sessions + Passport + OAuth + Routes'
  });
});

// Configurar rutas OAuth
app.use('/api/v1/auth', authRoutes);

console.log('14. Routes configured');

// Inicializar servidor
async function startServer() {
  try {
    console.log('15. Starting server initialization...');
    
    // Solo conectar a MongoDB si está configurado
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== '...........') {
      console.log('16. Connecting to MongoDB...');
      await connectDB();
      logger.info('✅ MongoDB conectado');
      
      console.log('17. Initializing default data...');
      await initializeDefaultData();
      
      console.log('18. MongoDB and initialization completed');
    } else {
      logger.warn('⚠️ MongoDB no configurado');
    }
    
    console.log('19. Starting HTTP server...');
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor INCREMENTAL ejecutándose en puerto ${PORT}`);
      console.log(`✅ INCREMENTAL Server running on port ${PORT}`);
      console.log('20. Server started successfully');
    });
  } catch (error) {
    logger.error('Error al inicializar el servidor:', error);
    console.log('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

console.log('21. Calling startServer...');
startServer(); 