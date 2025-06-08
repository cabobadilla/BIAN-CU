import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    const conn = await mongoose.connect(mongoUri, {
      // Opciones de conexión recomendadas
      maxPoolSize: 10, // Mantener hasta 10 conexiones socket
      serverSelectionTimeoutMS: 5000, // Mantener intentando enviar operaciones por 5 segundos
      socketTimeoutMS: 45000, // Cerrar sockets después de 45 segundos de inactividad
      bufferCommands: false, // Deshabilitar mongoose buffering
    });

    logger.info(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Manejar eventos de conexión
    mongoose.connection.on('error', (err) => {
      logger.error('Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconectado');
    });

  } catch (error) {
    logger.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB desconectado correctamente');
  } catch (error) {
    logger.error('Error desconectando MongoDB:', error);
  }
}; 