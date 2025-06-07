import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { companyRoutes } from './routes/companies';
import { useCaseRoutes } from './routes/useCases';
import { bianRoutes } from './routes/bian';
import { schemaRoutes } from './routes/schemas';
import { dataSourceRoutes } from './routes/dataSources';

// Configurar variables de entorno
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});

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

// Configuración de sesiones
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Configuración de Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuración de Swagger
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
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/use-cases', useCaseRoutes);
app.use('/api/v1/bian', bianRoutes);
app.use('/api/v1/schemas', schemaRoutes);
app.use('/api/v1/data-sources', dataSourceRoutes);

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
    await connectDB();
    
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