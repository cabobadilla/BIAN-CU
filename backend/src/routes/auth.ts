import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import '../config/passport'; // Importar configuración de passport

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Iniciar autenticación con Google
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirección a Google OAuth
 */
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirección después de autenticación
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect('/login?error=no_user');
    }

    // Generar JWT token
    const token = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        companyId: user.companyId,
        role: user.role
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '24h',
        issuer: 'bian-cu-platform',
        audience: 'bian-cu-users'
      }
    );

    // En desarrollo, redirigir al frontend con el token
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:5173';
    
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  })
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/me',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        company: user.companyId,
        lastLogin: user.lastLogin
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
router.post('/logout',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res) => {
    // En una implementación más robusta, aquí se podría invalidar el token
    // agregándolo a una blacklist en Redis o base de datos
    
    logger.info(`Usuario ${(req.user as any).email} cerró sesión`);
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  })
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Renovar token JWT
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado
 *       401:
 *         description: Token inválido
 */
router.post('/refresh',
  passport.authenticate('jwt', { session: false }),
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    
    // Generar nuevo token
    const newToken = jwt.sign(
      { 
        sub: user._id,
        email: user.email,
        companyId: user.companyId,
        role: user.role
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '24h',
        issuer: 'bian-cu-platform',
        audience: 'bian-cu-users'
      }
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: '24h'
      }
    });
  })
);

export { router as authRoutes }; 