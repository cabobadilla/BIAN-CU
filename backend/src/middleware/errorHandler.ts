import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  logger.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {}).map((val: any) => val.message).join(', ');
    error = createError(message, 400);
  }

  // Error de duplicado de Mongoose
  if (err.code === 11000) {
    const message = 'Recurso duplicado';
    error = createError(message, 400);
  }

  // Error de cast de Mongoose
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = createError(message, 404);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = createError(message, 401);
  }

  // Error de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = createError(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Middleware para capturar errores async
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Middleware para rutas no encontradas
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(`Ruta no encontrada - ${req.originalUrl}`, 404);
  next(error);
}; 