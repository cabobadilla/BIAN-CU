import express, { Request, Response } from 'express';
import passport from 'passport';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ApiCustomization } from '../models/ApiCustomization';
import { UseCase } from '../models/UseCase';
import { logger } from '../utils/logger';
import axios from 'axios';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /api/v1/api-customizations/{useCaseId}:
 *   get:
 *     summary: Obtener personalizaciones de APIs para un caso de uso
 *     tags: [API Customizations]
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
 *         description: Lista de personalizaciones
 */
router.get('/:useCaseId',
  param('useCaseId').isMongoId(),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('ID de caso de uso inválido', 400);
    }

    const user = req.user as any;
    const { useCaseId } = req.params;

    // Verificar acceso al caso de uso
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

    const customizations = await ApiCustomization.findByUseCase(useCaseId, user._id);

    return res.json({
      success: true,
      data: customizations,
      count: customizations.length
    });
  })
);

/**
 * @swagger
 * /api/v1/api-customizations/{useCaseId}/{apiName}:
 *   get:
 *     summary: Obtener personalización específica de una API
 *     tags: [API Customizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: apiName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personalización encontrada
 *       404:
 *         description: Personalización no encontrada
 */
router.get('/:useCaseId/:apiName',
  [
    param('useCaseId').isMongoId(),
    param('apiName').trim().isLength({ min: 1 })
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Parámetros inválidos', 400);
    }

    const user = req.user as any;
    const { useCaseId, apiName } = req.params;

    const customization = await ApiCustomization.findByApiAndUser(
      useCaseId, 
      decodeURIComponent(apiName), 
      user._id
    );

    if (!customization) {
      return res.json({
        success: true,
        data: null,
        message: 'No hay personalización para esta API'
      });
    }

    return res.json({
      success: true,
      data: customization
    });
  })
);

/**
 * @swagger
 * /api/v1/api-customizations:
 *   post:
 *     summary: Crear o actualizar personalización de API
 *     tags: [API Customizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - useCaseId
 *               - apiName
 *             properties:
 *               useCaseId:
 *                 type: string
 *               apiName:
 *                 type: string
 *               customPayload:
 *                 type: object
 *               customHeaders:
 *                 type: object
 *               customParameters:
 *                 type: object
 *               notes:
 *                 type: string
 *               testingConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Personalización guardada
 */
router.post('/',
  [
    body('useCaseId').isMongoId(),
    body('apiName').trim().isLength({ min: 1, max: 200 }),
    body('customPayload').optional().isObject(),
    body('customHeaders').optional().isObject(),
    body('customParameters').optional().isObject(),
    body('notes').optional().trim().isLength({ max: 2000 }),
    body('testingConfig').optional().isObject()
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { 
      useCaseId, 
      apiName, 
      customPayload, 
      customHeaders, 
      customParameters, 
      notes, 
      testingConfig 
    } = req.body;

    // Verificar acceso al caso de uso
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

    // Buscar personalización existente
    let customization = await ApiCustomization.findOne({
      useCaseId, 
      apiName, 
      userId: user._id,
      isActive: true
    });

    if (customization) {
      // Actualizar existente
      customization.customPayload = customPayload;
      customization.customHeaders = customHeaders;
      customization.customParameters = customParameters;
      customization.notes = notes;
      customization.testingConfig = testingConfig;
      customization.lastModified = new Date();
      customization.version += 1;
      
      await customization.save();
    } else {
      // Crear nueva
      customization = new ApiCustomization({
        useCaseId,
        apiName,
        userId: user._id,
        companyId: user.companyId,
        customPayload,
        customHeaders,
        customParameters,
        notes,
        testingConfig
      });
      await customization.save();
    }

    logger.info(`API customization ${customization.isNew ? 'created' : 'updated'}: ${apiName} for use case ${useCaseId}`);

    return res.json({
      success: true,
      data: customization,
      message: `Personalización ${customization.isNew ? 'creada' : 'actualizada'} exitosamente`
    });
  })
);

/**
 * @swagger
 * /api/v1/api-customizations/{useCaseId}/{apiName}/test:
 *   post:
 *     summary: Ejecutar test de API con personalización
 *     tags: [API Customizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: apiName
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
 *               - method
 *               - endpoint
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE]
 *               endpoint:
 *                 type: string
 *               useCustomData:
 *                 type: boolean
 *               overridePayload:
 *                 type: object
 *               overrideHeaders:
 *                 type: object
 *     responses:
 *       200:
 *         description: Resultado del test
 */
router.post('/:useCaseId/:apiName/test',
  [
    param('useCaseId').isMongoId(),
    param('apiName').trim().isLength({ min: 1 }),
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE']),
    body('endpoint').trim().isLength({ min: 1 }),
    body('useCustomData').optional().isBoolean(),
    body('overridePayload').optional().isObject(),
    body('overrideHeaders').optional().isObject()
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { useCaseId, apiName } = req.params;
    const { 
      method, 
      endpoint, 
      useCustomData = true, 
      overridePayload, 
      overrideHeaders 
    } = req.body;

    // Obtener personalización si existe
    const customization = await ApiCustomization.findOne({
      useCaseId, 
      apiName: decodeURIComponent(apiName), 
      userId: user._id,
      isActive: true
    });

    // Preparar datos para el test
    let testPayload = overridePayload;
    let testHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'BIAN-CU-Platform/1.0.0',
      ...overrideHeaders
    };

    if (useCustomData && customization) {
      if (!testPayload && customization.customPayload) {
        testPayload = customization.customPayload;
      }
      if (customization.customHeaders) {
        testHeaders = { ...testHeaders, ...customization.customHeaders };
      }
    }

    // Configurar timeout desde personalización
    const timeout = customization?.testingConfig?.timeout || 10000;
    const baseUrl = customization?.testingConfig?.baseUrl || 'https://sandbox.bian.org/v13';
    
    try {
      const fullUrl = baseUrl + endpoint;
      
      const requestConfig: any = {
        method: method.toLowerCase(),
        url: fullUrl,
        headers: testHeaders,
        timeout,
        validateStatus: () => true // No lanzar error por códigos de estado
      };

      if (method !== 'GET' && testPayload) {
        requestConfig.data = testPayload;
      }

      logger.info(`Testing API: ${method} ${fullUrl} for user ${user._id}`);

      const startTime = Date.now();
      const response = await axios(requestConfig);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const testResult = {
        success: response.status >= 200 && response.status < 400,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        headers: response.headers,
        data: response.data,
        request: {
          url: fullUrl,
          method: method.toUpperCase(),
          headers: testHeaders,
          payload: testPayload || null
        },
        timestamp: new Date().toISOString()
      };

      // Guardar resultado en historial si hay personalización
      if (customization) {
        if (!customization.testHistory) {
          customization.testHistory = [];
        }
        
        customization.testHistory.unshift({
          timestamp: new Date(),
          method: method.toUpperCase(),
          endpoint,
          status: response.status,
          responseTime,
          success: testResult.success
        });
        
        // Mantener solo los últimos 10
        if (customization.testHistory.length > 10) {
          customization.testHistory = customization.testHistory.slice(0, 10);
        }
        
        await customization.save();
      }

      logger.info(`API test completed: ${response.status} in ${responseTime}ms`);

      return res.json({
        success: true,
        data: testResult
      });

    } catch (error: any) {
      logger.error('Error testing API:', error.message);

      const errorResult = {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          type: error.name || 'Error'
        },
        request: {
          url: baseUrl + endpoint,
          method: method.toUpperCase(),
          headers: testHeaders,
          payload: testPayload || null
        },
        timestamp: new Date().toISOString()
      };

      // Guardar error en historial
      if (customization) {
        if (!customization.testHistory) {
          customization.testHistory = [];
        }
        
        customization.testHistory.unshift({
          timestamp: new Date(),
          method: method.toUpperCase(),
          endpoint,
          success: false,
          errorMessage: error.message
        });
        
        if (customization.testHistory.length > 10) {
          customization.testHistory = customization.testHistory.slice(0, 10);
        }
        
        await customization.save();
      }

      return res.json({
        success: true,
        data: errorResult
      });
    }
  })
);

/**
 * @swagger
 * /api/v1/api-customizations/{useCaseId}/{apiName}/reset:
 *   post:
 *     summary: Resetear personalización a valores por defecto
 *     tags: [API Customizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: apiName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personalización reseteada
 */
router.post('/:useCaseId/:apiName/reset',
  [
    param('useCaseId').isMongoId(),
    param('apiName').trim().isLength({ min: 1 })
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Parámetros inválidos', 400);
    }

    const user = req.user as any;
    const { useCaseId, apiName } = req.params;

    const customization = await ApiCustomization.findOne({
      useCaseId, 
      apiName: decodeURIComponent(apiName), 
      userId: user._id,
      isActive: true
    });

    if (!customization) {
      throw createError('Personalización no encontrada', 404);
    }

    // Resetear a valores por defecto
    customization.customPayload = undefined;
    customization.customHeaders = {};
    customization.customParameters = undefined;
    customization.notes = '';
    customization.lastModified = new Date();
    
    await customization.save();

    return res.json({
      success: true,
      data: customization,
      message: 'Personalización reseteada a valores por defecto'
    });
  })
);

/**
 * @swagger
 * /api/v1/api-customizations/{useCaseId}/{apiName}:
 *   delete:
 *     summary: Eliminar personalización de API
 *     tags: [API Customizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: useCaseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: apiName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Personalización eliminada
 */
router.delete('/:useCaseId/:apiName',
  [
    param('useCaseId').isMongoId(),
    param('apiName').trim().isLength({ min: 1 })
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Parámetros inválidos', 400);
    }

    const user = req.user as any;
    const { useCaseId, apiName } = req.params;

    const customization = await ApiCustomization.findOne({
      useCaseId, 
      apiName: decodeURIComponent(apiName), 
      userId: user._id,
      isActive: true
    });

    if (!customization) {
      throw createError('Personalización no encontrada', 404);
    }

    customization.isActive = false;
    await customization.save();

    return res.json({
      success: true,
      message: 'Personalización eliminada exitosamente'
    });
  })
);

export { router as apiCustomizationRoutes }; 