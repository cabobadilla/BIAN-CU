import express from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { Company } from '../models/Company';
import { User } from '../models/User';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /api/v1/companies/current:
 *   get:
 *     summary: Obtener información de la empresa actual del usuario
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de la empresa
 */
router.get('/current',
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    
    const company = await Company.findById(user.companyId);
    
    if (!company) {
      throw createError('Empresa no encontrada', 404);
    }

    res.json({
      success: true,
      data: company
    });
  })
);

/**
 * @swagger
 * /api/v1/companies/current/users:
 *   get:
 *     summary: Obtener usuarios de la empresa actual
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios de la empresa
 */
router.get('/current/users',
  asyncHandler(async (req, res) => {
    const user = req.user as any;
    
    // Solo administradores pueden ver todos los usuarios
    if (user.role !== 'admin') {
      throw createError('No autorizado para ver usuarios de la empresa', 403);
    }

    const users = await User.findByCompany(user.companyId);

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  })
);

/**
 * @swagger
 * /api/v1/companies/current:
 *   put:
 *     summary: Actualizar información de la empresa actual
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   allowedDomains:
 *                     type: array
 *                     items:
 *                       type: string
 *                   maxUsers:
 *                     type: number
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Empresa actualizada
 */
router.put('/current',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('settings.allowedDomains').optional().isArray(),
    body('settings.maxUsers').optional().isInt({ min: 1, max: 1000 }),
    body('settings.features').optional().isArray()
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    
    // Solo administradores pueden actualizar la empresa
    if (user.role !== 'admin') {
      throw createError('No autorizado para actualizar la empresa', 403);
    }

    const company = await Company.findById(user.companyId);
    
    if (!company) {
      throw createError('Empresa no encontrada', 404);
    }

    // Actualizar campos permitidos
    const { name, description, settings } = req.body;
    
    if (name !== undefined) company.name = name;
    if (description !== undefined) company.description = description;
    
    if (settings) {
      if (settings.allowedDomains !== undefined) {
        company.settings.allowedDomains = settings.allowedDomains;
      }
      if (settings.maxUsers !== undefined) {
        company.settings.maxUsers = settings.maxUsers;
      }
      if (settings.features !== undefined) {
        company.settings.features = settings.features;
      }
    }

    await company.save();

    res.json({
      success: true,
      data: company,
      message: 'Empresa actualizada exitosamente'
    });
  })
);

/**
 * @swagger
 * /api/v1/companies/current/users/{userId}/role:
 *   put:
 *     summary: Actualizar rol de un usuario en la empresa
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *     responses:
 *       200:
 *         description: Rol actualizado
 */
router.put('/current/users/:userId/role',
  [
    body('role').isIn(['admin', 'user']).withMessage('Rol debe ser admin o user')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Rol inválido', 400);
    }

    const currentUser = req.user as any;
    const { userId } = req.params;
    const { role } = req.body;
    
    // Solo administradores pueden cambiar roles
    if (currentUser.role !== 'admin') {
      throw createError('No autorizado para cambiar roles', 403);
    }

    const targetUser = await User.findOne({
      _id: userId,
      companyId: currentUser.companyId
    });

    if (!targetUser) {
      throw createError('Usuario no encontrado en la empresa', 404);
    }

    // No permitir que el usuario se quite a sí mismo el rol de admin si es el único admin
    if (currentUser._id.toString() === userId && role === 'user') {
      const adminCount = await User.countDocuments({
        companyId: currentUser.companyId,
        role: 'admin',
        isActive: true
      });

      if (adminCount <= 1) {
        throw createError('No puede quitarse el rol de administrador siendo el único admin', 400);
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      data: {
        userId: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      },
      message: `Rol actualizado a ${role} exitosamente`
    });
  })
);

/**
 * @swagger
 * /api/v1/companies/current/users/{userId}/status:
 *   put:
 *     summary: Activar/desactivar un usuario en la empresa
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/current/users/:userId/status',
  [
    body('isActive').isBoolean().withMessage('isActive debe ser un booleano')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Estado inválido', 400);
    }

    const currentUser = req.user as any;
    const { userId } = req.params;
    const { isActive } = req.body;
    
    // Solo administradores pueden cambiar estados
    if (currentUser.role !== 'admin') {
      throw createError('No autorizado para cambiar estados de usuario', 403);
    }

    const targetUser = await User.findOne({
      _id: userId,
      companyId: currentUser.companyId
    });

    if (!targetUser) {
      throw createError('Usuario no encontrado en la empresa', 404);
    }

    // No permitir que el usuario se desactive a sí mismo si es admin
    if (currentUser._id.toString() === userId && !isActive && targetUser.role === 'admin') {
      const activeAdminCount = await User.countDocuments({
        companyId: currentUser.companyId,
        role: 'admin',
        isActive: true
      });

      if (activeAdminCount <= 1) {
        throw createError('No puede desactivarse siendo el único administrador activo', 400);
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    res.json({
      success: true,
      data: {
        userId: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isActive: targetUser.isActive
      },
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`
    });
  })
);

export { router as companyRoutes }; 