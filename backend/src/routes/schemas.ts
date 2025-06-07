import express from 'express';
import passport from 'passport';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UseCase } from '../models/UseCase';
import { openaiService } from '../services/openaiService';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /api/v1/schemas/generate:
 *   post:
 *     summary: Generar schema personalizado usando IA
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *               apiContext:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schema generado
 */
router.post('/generate',
  [
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
    body('apiContext').optional().trim().isLength({ max: 500 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const { description, apiContext } = req.body;

    const generatedSchema = await openaiService.generateCustomSchema(description, apiContext);

    res.json({
      success: true,
      data: generatedSchema
    });
  })
);

/**
 * @swagger
 * /api/v1/schemas/use-case/{useCaseId}:
 *   post:
 *     summary: Agregar schema personalizado a un caso de uso
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
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
 *               - name
 *               - schema
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               schema:
 *                 type: object
 *               apiAssociation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Schema agregado al caso de uso
 */
router.post('/use-case/:useCaseId',
  [
    param('useCaseId').isMongoId(),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('schema').isObject().withMessage('El schema debe ser un objeto válido'),
    body('apiAssociation').optional().trim().isLength({ max: 100 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { useCaseId } = req.params;
    const { name, description, schema, apiAssociation } = req.body;

    const useCase = await UseCase.findOne({
      _id: useCaseId,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    const customSchema = {
      name,
      description: description || '',
      schema,
      apiAssociation: apiAssociation || undefined
    };

    await useCase.addCustomSchema(customSchema);

    res.status(201).json({
      success: true,
      data: customSchema,
      message: 'Schema personalizado agregado exitosamente'
    });
  })
);

/**
 * @swagger
 * /api/v1/schemas/use-case/{useCaseId}:
 *   get:
 *     summary: Obtener schemas personalizados de un caso de uso
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de schemas del caso de uso
 */
router.get('/use-case/:useCaseId',
  param('useCaseId').isMongoId(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('ID de caso de uso inválido', 400);
    }

    const user = req.user as any;
    const { useCaseId } = req.params;

    const useCase = await UseCase.findOne({
      _id: useCaseId,
      $or: [
        { userId: user._id },
        { companyId: user.companyId }
      ]
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    res.json({
      success: true,
      data: useCase.customSchemas,
      count: useCase.customSchemas.length
    });
  })
);

/**
 * @swagger
 * /api/v1/schemas/use-case/{useCaseId}/{schemaIndex}:
 *   put:
 *     summary: Actualizar un schema personalizado
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: schemaIndex
 *         required: true
 *         schema:
 *           type: integer
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
 *               schema:
 *                 type: object
 *               apiAssociation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Schema actualizado
 */
router.put('/use-case/:useCaseId/:schemaIndex',
  [
    param('useCaseId').isMongoId(),
    param('schemaIndex').isInt({ min: 0 }),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('schema').optional().isObject(),
    body('apiAssociation').optional().trim().isLength({ max: 100 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { useCaseId, schemaIndex } = req.params;
    const updates = req.body;

    const useCase = await UseCase.findOne({
      _id: useCaseId,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    const index = parseInt(schemaIndex);
    if (index >= useCase.customSchemas.length) {
      throw createError('Índice de schema inválido', 400);
    }

    // Actualizar campos del schema
    const schema = useCase.customSchemas[index];
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        schema[key] = updates[key];
      }
    });

    await useCase.save();

    res.json({
      success: true,
      data: schema,
      message: 'Schema actualizado exitosamente'
    });
  })
);

/**
 * @swagger
 * /api/v1/schemas/use-case/{useCaseId}/{schemaIndex}:
 *   delete:
 *     summary: Eliminar un schema personalizado
 *     tags: [Schemas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: schemaIndex
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schema eliminado
 */
router.delete('/use-case/:useCaseId/:schemaIndex',
  [
    param('useCaseId').isMongoId(),
    param('schemaIndex').isInt({ min: 0 })
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Parámetros inválidos', 400);
    }

    const user = req.user as any;
    const { useCaseId, schemaIndex } = req.params;

    const useCase = await UseCase.findOne({
      _id: useCaseId,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    const index = parseInt(schemaIndex);
    if (index >= useCase.customSchemas.length) {
      throw createError('Índice de schema inválido', 400);
    }

    useCase.customSchemas.splice(index, 1);
    await useCase.save();

    res.json({
      success: true,
      message: 'Schema eliminado exitosamente'
    });
  })
);

export { router as schemaRoutes }; 