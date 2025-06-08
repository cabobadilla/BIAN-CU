import express, { Request, Response } from 'express';
import passport from 'passport';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UseCase } from '../models/UseCase';
import { DataSource } from '../models/DataSource';
import axios from 'axios';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /api/v1/data-sources:
 *   get:
 *     summary: Obtener todas las fuentes de datos de la empresa
 *     tags: [Data Sources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fuentes de datos
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as any;

    const dataSources = await DataSource.find({ companyId: user.companyId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: dataSources,
      count: dataSources.length
    });
  })
);

/**
 * @swagger
 * /api/v1/data-sources/{id}:
 *   get:
 *     summary: Obtener una fuente de datos por ID
 *     tags: [Data Sources]
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
 *         description: Fuente de datos encontrada
 */
router.get('/:id',
  param('id').isMongoId(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('ID de fuente de datos inválido', 400);
    }

    const user = req.user as any;
    const { id } = req.params;

    const dataSource = await DataSource.findOne({
      _id: id,
      companyId: user.companyId
    }).populate('createdBy', 'name email');

    if (!dataSource) {
      throw createError('Fuente de datos no encontrada', 404);
    }

    res.json({
      success: true,
      data: dataSource
    });
  })
);

/**
 * @swagger
 * /api/v1/data-sources:
 *   post:
 *     summary: Crear una nueva fuente de datos
 *     tags: [Data Sources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - type
 *               - connectionConfig
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [REST_API, DATABASE, FILE, SOAP, GRAPHQL]
 *               connectionConfig:
 *                 type: object
 *     responses:
 *       201:
 *         description: Fuente de datos creada
 */
router.post('/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('La descripción debe tener entre 10 y 500 caracteres'),
    body('type').isIn(['REST_API', 'DATABASE', 'FILE', 'SOAP', 'GRAPHQL']).withMessage('Tipo de fuente de datos inválido'),
    body('connectionConfig').isObject().withMessage('La configuración de conexión debe ser un objeto válido')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { name, description, type, connectionConfig } = req.body;

    // Verificar que no exista una fuente de datos con el mismo nombre en la empresa
    const existingDataSource = await DataSource.findOne({
      name,
      companyId: user.companyId
    });

    if (existingDataSource) {
      throw createError('Ya existe una fuente de datos con ese nombre en tu empresa', 409);
    }

    const newDataSource = new DataSource({
      name,
      description,
      type,
      connectionConfig,
      companyId: user.companyId,
      createdBy: user._id
    });

    await newDataSource.save();
    await newDataSource.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: newDataSource,
      message: 'Fuente de datos creada exitosamente'
    });
  })
);

/**
 * @swagger
 * /api/v1/data-sources/{id}:
 *   put:
 *     summary: Actualizar una fuente de datos
 *     tags: [Data Sources]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               connectionConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Fuente de datos actualizada
 */
router.put('/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ min: 10, max: 500 }),
    body('type').optional().isIn(['REST_API', 'DATABASE', 'FILE', 'SOAP', 'GRAPHQL']),
    body('connectionConfig').optional().isObject()
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { id } = req.params;
    const { name, description, type, connectionConfig } = req.body;

    const existingDataSource = await DataSource.findOne({
      _id: id,
      companyId: user.companyId
    });

    if (!existingDataSource) {
      throw createError('Fuente de datos no encontrada', 404);
    }

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if (name && name !== existingDataSource.name) {
      const duplicateDataSource = await DataSource.findOne({
        name,
        companyId: user.companyId,
        _id: { $ne: id }
      });

      if (duplicateDataSource) {
        throw createError('Ya existe una fuente de datos con ese nombre en tu empresa', 409);
      }
    }

    // Actualizar campos
    if (name) existingDataSource.name = name;
    if (description) existingDataSource.description = description;
    if (type) existingDataSource.type = type;
    if (connectionConfig) existingDataSource.connectionConfig = connectionConfig;

    await existingDataSource.save();
    await existingDataSource.populate('createdBy', 'name email');

    res.json({
      success: true,
      data: existingDataSource,
      message: 'Fuente de datos actualizada exitosamente'
    });
  })
);

/**
 * @swagger
 * /api/v1/data-sources/{id}:
 *   delete:
 *     summary: Eliminar una fuente de datos
 *     tags: [Data Sources]
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
 *         description: Fuente de datos eliminada
 */
router.delete('/:id',
  param('id').isMongoId(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('ID de fuente de datos inválido', 400);
    }

    const user = req.user as any;
    const { id } = req.params;

    const dataSource = await DataSource.findOne({
      _id: id,
      companyId: user.companyId
    });

    if (!dataSource) {
      throw createError('Fuente de datos no encontrada', 404);
    }

    await DataSource.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Fuente de datos eliminada exitosamente'
    });
  })
);

/**
 * @swagger
 * /api/v1/data-sources/validate-connection:
 *   post:
 *     summary: Validar conexión a una fuente de datos
 *     tags: [Data Sources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiUrl
 *               - method
 *             properties:
 *               dataSourceId:
 *                 type: string
 *               apiUrl:
 *                 type: string
 *               method:
 *                 type: string
 *               headers:
 *                 type: object
 *               payload:
 *                 type: object
 *     responses:
 *       200:
 *         description: Conexión validada
 */
router.post('/validate-connection',
  [
    body('apiUrl').isURL().withMessage('URL de API inválida'),
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE']).withMessage('Método HTTP inválido'),
    body('headers').optional().isObject(),
    body('payload').optional().isObject()
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const { apiUrl, method, headers = {}, payload } = req.body;

    try {
      const config: any = {
        method: method.toLowerCase(),
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 10000 // 10 segundos
      };

      if (method !== 'GET' && payload) {
        config.data = payload;
      }

      const response = await axios(config);

      res.json({
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          responseTime: Date.now()
        },
        message: 'Conexión validada exitosamente'
      });
    } catch (error: any) {
      throw createError(
        `Error de conexión: ${error.message}`,
        error.response?.status || 500
      );
    }
  })
);

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

    if (!useCase.dataSources) {
      useCase.dataSources = [];
    }
    useCase.dataSources.push(dataSource);
    await useCase.save();

    res.status(201).json({
      success: true,
      data: dataSource,
      message: 'Fuente de datos agregada exitosamente'
    });
  })
);

export { router as dataSourceRoutes }; 