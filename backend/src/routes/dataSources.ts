import express from 'express';
import passport from 'passport';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UseCase } from '../models/UseCase';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /api/v1/data-sources/use-case/{useCaseId}:
 *   post:
 *     summary: Agregar fuente de datos a un caso de uso
 *     tags: [Data Sources]
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
 *               - systemName
 *               - apiUrl
 *               - method
 *               - payload
 *               - associatedApi
 *             properties:
 *               name:
 *                 type: string
 *               systemName:
 *                 type: string
 *               apiUrl:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE, PATCH]
 *               payload:
 *                 type: object
 *               associatedApi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fuente de datos agregada
 */
router.post('/use-case/:useCaseId',
  [
    param('useCaseId').isMongoId(),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('systemName').trim().isLength({ min: 2, max: 100 }),
    body('apiUrl').isURL(),
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    body('payload').isObject(),
    body('associatedApi').trim().isLength({ min: 1, max: 100 })
  ],
  asyncHandler(async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user;
    const { useCaseId } = req.params;
    const { name, systemName, apiUrl, method, payload, associatedApi } = req.body;

    const useCase = await UseCase.findOne({
      _id: useCaseId,
      userId: user._id
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    const dataSource = {
      name,
      systemName,
      apiUrl,
      method,
      payload,
      associatedApi
    };

    await useCase.addDataSource(dataSource);

    res.status(201).json({
      success: true,
      data: dataSource,
      message: 'Fuente de datos agregada exitosamente'
    });
  })
);

export { router as dataSourceRoutes }; 