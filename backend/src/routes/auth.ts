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
    logger.info('=== GOOGLE OAUTH CALLBACK INICIADO ===');
    logger.info('Query params:', req.query);
    logger.info('Session before auth:', req.session);
    
    passport.authenticate('google', (err: any, user: any, info: any) => {
      logger.info('=== PASSPORT AUTHENTICATE CALLBACK ===');
      logger.info('Error:', err);
      logger.info('User:', user);
      logger.info('Info:', info);
      logger.info('Session after auth:', req.session);
      
      if (err) {
        logger.error('Error en autenticación:', err);
        const redirectUrl = `${process.env.FRONTEND_URL}/login?error=auth_failed&reason=passport_error`;
        logger.info('Redirecting to (error):', redirectUrl);
        return res.redirect(redirectUrl);
      }
      
      if (!user) {
        logger.error('No se encontró usuario después de autenticación');
        const redirectUrl = `${process.env.FRONTEND_URL}/login?error=auth_failed&reason=no_user`;
        logger.info('Redirecting to (no user):', redirectUrl);
        return res.redirect(redirectUrl);
      }

      try {
        logger.info('Generando token para usuario:', user.email);
        const token = jwt.sign(
          { 
            userId: user._id, 
            email: user.email,
            companyId: user.companyId 
          },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        logger.info('Token generado exitosamente');
        
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            logger.error('Error en req.logIn:', loginErr);
            const redirectUrl = `${process.env.FRONTEND_URL}/login?error=auth_failed&reason=login_error`;
            logger.info('Redirecting to (login error):', redirectUrl);
            return res.redirect(redirectUrl);
          }
          
          logger.info('Usuario logueado en sesión exitosamente');
          logger.info('Session after login:', req.session);
          
          const successUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: user._id,
            email: user.email,
            name: user.name,
            companyId: user.companyId
          }))}`;
          
          logger.info('SUCCESS! Redirecting to:', successUrl);
          res.redirect(successUrl);
        });
        
      } catch (tokenError) {
        logger.error('Error generando token:', tokenError);
        const redirectUrl = `${process.env.FRONTEND_URL}/login?error=auth_failed&reason=token_error`;
        logger.info('Redirecting to (token error):', redirectUrl);
        res.redirect(redirectUrl);
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