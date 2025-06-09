// Configurar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== MAIN SERVER START ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('MongoDB URI configured:', !!process.env.MONGODB_URI);
console.log('Google OAuth configured:', !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET);
console.log('1. Starting imports...');

import express from 'express';
console.log('2. Express imported');
import cors from 'cors';
console.log('3. CORS imported');
import helmet from 'helmet';
console.log('4. Helmet imported');
import rateLimit from 'express-rate-limit';
console.log('5. Rate limit imported');
import session from 'express-session';
console.log('6. Session imported');
import MongoStore from 'connect-mongo';
console.log('7. MongoStore imported');
import passport from 'passport';
console.log('8. Passport imported');
import swaggerJsdoc from 'swagger-jsdoc';
console.log('9. Swagger JsDoc imported');
import swaggerUi from 'swagger-ui-express';
console.log('10. Swagger UI imported');

import { connectDB } from './config/database';
console.log('11. Database config imported');
import { logger } from './utils/logger';
console.log('12. Logger imported');
import { initializeDefaultData } from './utils/initialization';
console.log('13. Initialization imported');
import { errorHandler } from './middleware/errorHandler';
console.log('14. Error handler imported');
import { authRoutes } from './routes/auth';
console.log('15. Auth routes imported');
import { companyRoutes } from './routes/companies';
console.log('16. Company routes imported');
import { useCaseRoutes } from './routes/useCases';
console.log('17. Use case routes imported');
import { bianRoutes } from './routes/bian';
console.log('18. BIAN routes imported');
import { schemaRoutes } from './routes/schemas';
console.log('19. Schema routes imported');
import { dataSourceRoutes } from './routes/dataSources';
console.log('20. Data source routes imported');
import { apiCustomizationRoutes } from './routes/apiCustomizations';
console.log('21. API customization routes imported');
import { singleApiRoutes } from './routes/singleApiRoutes';
console.log('22. Single API routes imported');

console.log('23. All imports completed successfully');

const app = express();
console.log('24. Express app created');
const PORT = process.env.PORT || 3001;
console.log('25. Port configured:', PORT);

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
console.log('26. Rate limiter configured');

// Middleware de seguridad
app.use(helmet());
console.log('27. Helmet middleware added');
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
console.log('28. CORS middleware added');
app.use(limiter);
console.log('29. Rate limiter middleware added');
app.use(express.json({ limit: '10mb' }));
console.log('30. JSON middleware added');
app.use(express.urlencoded({ extended: true }));
console.log('31. URL encoded middleware added');

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
  logger.warn('MongoDB not configured, using memory store for sessions (not recommended for production)');
}

app.use(session(sessionConfig));

// Configuración de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuración de Swagger
/*
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BIAN-CU Platform API',
      version: '1.0.0',
      description: 'API para la plataforma de casos de uso bancarios BIAN',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? process.env.API_URL 
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: process.env.NODE_ENV === 'production' 
    ? ['./dist/routes/*.js', './dist/models/*.js']
    : ['./src/routes/*.ts', './src/models/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
*/

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/use-cases', useCaseRoutes);
app.use('/api/v1/bian', bianRoutes);
app.use('/api/v1/schemas', schemaRoutes);
app.use('/api/v1/data-sources', dataSourceRoutes);
app.use('/api/v1/api-customizations', apiCustomizationRoutes);
app.use('/api/v1/single-api', singleApiRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Inicializar servidor
async function startServer() {
  try {
    // Solo conectar a MongoDB si está configurado
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== '...........') {
      await connectDB();
      logger.info('✅ MongoDB conectado');
      
      // Inicializar datos por defecto después de conectar MongoDB
      await initializeDefaultData();
    } else {
      logger.warn('⚠️ MongoDB no configurado - algunas funciones pueden no funcionar');
    }
    
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      logger.info(`📚 Documentación API disponible en http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Error al inicializar el servidor:', error);
    process.exit(1);
  }
}

startServer(); 