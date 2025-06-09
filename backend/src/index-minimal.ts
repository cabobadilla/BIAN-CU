// Configurar variables de entorno PRIMERO
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== MINIMAL SERVER START ===');
console.log('1. Dotenv configured');

import express from 'express';
console.log('2. Express imported');

import cors from 'cors';
import helmet from 'helmet';
console.log('3. Security middleware imported');

import { connectDB } from './config/database';
import { logger } from './utils/logger';
console.log('4. Database and logger imported');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('5. Creating basic middleware...');

// Middleware básico
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

console.log('6. Basic middleware configured');

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'MINIMAL SERVER OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'MINIMAL SERVER RUNNING',
    timestamp: new Date().toISOString() 
  });
});

console.log('7. Routes configured');

// Inicializar servidor
async function startServer() {
  try {
    console.log('8. Starting server initialization...');
    
    // Solo conectar a MongoDB si está configurado
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== '...........') {
      console.log('9. Connecting to MongoDB...');
      await connectDB();
      logger.info('✅ MongoDB conectado');
      console.log('10. MongoDB connected successfully');
    } else {
      logger.warn('⚠️ MongoDB no configurado - algunas funciones pueden no funcionar');
    }
    
    console.log('11. Starting HTTP server...');
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor MINIMAL ejecutándose en puerto ${PORT}`);
      console.log(`✅ MINIMAL Server running on port ${PORT}`);
      console.log('12. Server started successfully');
    });
  } catch (error) {
    logger.error('Error al inicializar el servidor:', error);
    console.log('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

console.log('13. Calling startServer...');
startServer(); 