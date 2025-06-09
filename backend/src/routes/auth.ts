import express, { Request, Response } from 'express';
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
  (req: Request, res: Response, next: any) => {
    logger.info('=== GOOGLE CALLBACK START ===');
    logger.info(`Callback URL: ${req.url}`);
    logger.info(`Query params: ${JSON.stringify(req.query)}`);
    
    passport.authenticate('google', (err: any, user: any, info: any) => {
      logger.info('=== PASSPORT AUTHENTICATE RESULT ===');
      logger.info(`Error: ${err ? JSON.stringify(err) : 'null'}`);
      logger.info(`User: ${user ? JSON.stringify({id: user._id, email: user.email}) : 'null'}`);
      logger.info(`Info: ${info ? JSON.stringify(info) : 'null'}`);
      
      if (err) {
        logger.error('Error en autenticación Google:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        logger.info(`Redirecting to: ${frontendUrl}/login?error=auth_failed`);
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
      }
      
      if (!user) {
        logger.error('No se obtuvo usuario de Google:', info);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        logger.info(`Redirecting to: ${frontendUrl}/login?error=no_user`);
        return res.redirect(`${frontendUrl}/login?error=no_user`);
      }

      // Generar JWT token
      try {
        logger.info('=== GENERATING JWT TOKEN ===');
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

        logger.info(`Token generado exitosamente para usuario: ${user.email}`);

        // Redirigir al frontend con el token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
        logger.info(`Redirecting to: ${redirectUrl}`);
        res.redirect(redirectUrl);
        
      } catch (tokenError) {
        logger.error('Error generando token JWT:', tokenError);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const errorUrl = `${frontendUrl}/login?error=token_failed`;
        logger.info(`Redirecting to: ${errorUrl}`);
        res.redirect(errorUrl);
      }
    })(req, res, next);
  }
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
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
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