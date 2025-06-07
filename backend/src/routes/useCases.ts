import express from 'express';
import passport from 'passport';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UseCase } from '../models/UseCase';
import { openaiService } from '../services/openaiService';
import { bianService } from '../services/bianService';
import { logger } from '../utils/logger';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /api/v1/use-cases:
 *   get:
 *     summary: Obtener casos de uso del usuario
 *     tags: [Use Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, analyzing, completed, archived]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de casos de uso
 */
router.get('/',
  query('status').optional().isIn(['draft', 'analyzing', 'completed', 'archived']),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Parámetros de consulta inválidos', 400);
    }

    const user = req.user as any;
    const { status } = req.query;

    const useCases = await UseCase.findByUser(user._id, status as string);

    res.json({
      success: true,
      data: useCases,
      count: useCases.length
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/{id}:
 *   get:
 *     summary: Obtener un caso de uso específico
 *     tags: [Use Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del caso de uso
 *     responses:
 *       200:
 *         description: Caso de uso encontrado
 *       404:
 *         description: Caso de uso no encontrado
 */
router.get('/:id',
  param('id').isMongoId(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('ID inválido', 400);
    }

    const user = req.user as any;
    const useCase = await UseCase.findOne({
      _id: req.params.id,
      $or: [
        { userId: user._id },
        { companyId: user.companyId }
      ]
    }).populate('userId', 'name email').populate('companyId', 'name');

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    res.json({
      success: true,
      data: useCase
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases:
 *   post:
 *     summary: Crear un nuevo caso de uso
 *     tags: [Use Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - originalText
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               originalText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Caso de uso creado
 */
router.post('/',
  [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('El título debe tener entre 3 y 200 caracteres'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
    body('originalText').trim().isLength({ min: 50 }).withMessage('El texto original debe tener al menos 50 caracteres')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { title, description, originalText } = req.body;

    // Crear caso de uso inicial
    const useCase = new UseCase({
      title,
      description,
      originalText,
      companyId: user.companyId,
      userId: user._id,
      status: 'draft'
    });

    await useCase.save();

    // Iniciar análisis con ChatGPT en background
    setImmediate(async () => {
      try {
        await useCase.updateStatus('analyzing');
        
        const analysis = await openaiService.analyzeUseCase(originalText);
        
        useCase.analysis = analysis;
        useCase.status = 'completed';
        await useCase.save();

        logger.info(`Análisis completado para caso de uso ${useCase._id}`);
      } catch (error) {
        logger.error(`Error analizando caso de uso ${useCase._id}:`, error);
        useCase.status = 'draft';
        await useCase.save();
      }
    });

    res.status(201).json({
      success: true,
      data: useCase,
      message: 'Caso de uso creado. El análisis se está procesando.'
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/{id}/domains:
 *   post:
 *     summary: Seleccionar dominios BIAN para un caso de uso
 *     tags: [Use Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - domains
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Dominios seleccionados y APIs sugeridas
 */
router.post('/:id/domains',
  [
    param('id').isMongoId(),
    body('domains').isArray({ min: 1 }).withMessage('Debe seleccionar al menos un dominio')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos inválidos', 400);
    }

    const user = req.user as any;
    const useCase = await UseCase.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    const { domains } = req.body;
    useCase.selectedDomains = domains;

    // Generar APIs sugeridas basadas en dominios seleccionados
    const suggestedApis = await bianService.getApisForDomains(domains, useCase.originalText);
    useCase.suggestedApis = suggestedApis;

    await useCase.save();

    res.json({
      success: true,
      data: {
        selectedDomains: useCase.selectedDomains,
        suggestedApis: useCase.suggestedApis
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/{id}/apis:
 *   post:
 *     summary: Seleccionar APIs para un caso de uso
 *     tags: [Use Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - apis
 *             properties:
 *               apis:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: APIs seleccionadas
 */
router.post('/:id/apis',
  [
    param('id').isMongoId(),
    body('apis').isArray({ min: 1 }).withMessage('Debe seleccionar al menos una API')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos inválidos', 400);
    }

    const user = req.user as any;
    const useCase = await UseCase.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    const { apis } = req.body;
    useCase.selectedApis = apis;
    await useCase.save();

    res.json({
      success: true,
      data: {
        selectedApis: useCase.selectedApis
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/{id}:
 *   put:
 *     summary: Actualizar un caso de uso
 *     tags: [Use Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caso de uso actualizado
 */
router.put('/:id',
  [
    param('id').isMongoId(),
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('description').optional().trim().isLength({ min: 10, max: 1000 }),
    body('status').optional().isIn(['draft', 'analyzing', 'completed', 'archived'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos inválidos', 400);
    }

    const user = req.user as any;
    const useCase = await UseCase.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    // Actualizar campos permitidos
    const allowedFields = ['title', 'description', 'status'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        useCase[field] = req.body[field];
      }
    });

    await useCase.save();

    res.json({
      success: true,
      data: useCase
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/{id}:
 *   delete:
 *     summary: Eliminar un caso de uso
 *     tags: [Use Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caso de uso eliminado
 */
router.delete('/:id',
  param('id').isMongoId(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('ID inválido', 400);
    }

    const user = req.user as any;
    const useCase = await UseCase.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    await UseCase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Caso de uso eliminado exitosamente'
    });
  })
);

export { router as useCaseRoutes }; 