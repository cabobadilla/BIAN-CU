import express, { Request, Response } from 'express';
import passport from 'passport';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UseCase } from '../models/UseCase';
import { openaiService } from '../services/openaiService';
import { bianService } from '../services/bianService';
import { logger } from '../utils/logger';
import { OpenApiService } from '../services/openApiService';
import axios from 'axios';

const router = express.Router();

// Middleware de autenticación para todas las rutas
// TEMPORAL: Para desarrollo, bypasear autenticación con token dummy
router.use((req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.includes('dummy-token-for-development')) {
    // Simular usuario autenticado para desarrollo
    req.user = {
      _id: '507f1f77bcf86cd799439011', // ObjectId falso pero válido
      email: 'dev@example.com',
      name: 'Developer User',
      companyId: '507f1f77bcf86cd799439012', // ObjectId falso pero válido
      role: 'admin'
    };
    return next();
  }
  
  // Si no es token dummy, usar autenticación normal
  return passport.authenticate('jwt', { session: false })(req, res, next);
});

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
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Parámetros de consulta inválidos', 400);
    }

    const user = req.user as any;
    const { status } = req.query;

    const query: any = { 
      $or: [
        { userId: user._id },
        { companyId: user.companyId }
      ]
    };
    
    if (status) {
      query.status = status;
    }
    
    const useCases = await UseCase.find(query).populate('userId', 'name email').populate('companyId', 'name').sort({ createdAt: -1 });

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
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const { 
      title, 
      description, 
      originalText,
      objective,
      actors,
      prerequisites,
      mainFlow,
      alternativeFlows,
      postconditions,
      businessRules,
      nonFunctionalRequirements,
      assumptions,
      constraints,
      priority,
      complexity,
      estimatedEffort
    } = req.body;

    // Crear caso de uso inicial
    const useCase = new UseCase({
      title,
      description,
      originalText,
      objective,
      actors,
      prerequisites,
      mainFlow,
      alternativeFlows,
      postconditions,
      businessRules,
      nonFunctionalRequirements,
      assumptions,
      constraints,
      priority,
      complexity,
      estimatedEffort,
      companyId: user.companyId,
      userId: user._id,
      status: 'draft'
    });

    await useCase.save();

    // Iniciar análisis con ChatGPT en background
    setImmediate(async () => {
      try {
        useCase.status = 'analyzing';
        await useCase.save();
        
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
 * /api/v1/use-cases/analyze-ai:
 *   post:
 *     summary: Analizar caso de uso con IA para obtener sugerencias
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
 *               - objective
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               objective:
 *                 type: string
 *               actors:
 *                 type: object
 *               prerequisites:
 *                 type: array
 *               mainFlow:
 *                 type: array
 *               postconditions:
 *                 type: array
 *               businessRules:
 *                 type: array
 *     responses:
 *       200:
 *         description: Sugerencias de IA generadas
 */
router.post('/analyze-ai',
  [
    body('title').trim().isLength({ min: 3 }).withMessage('El título es requerido'),
    body('description').trim().isLength({ min: 10 }).withMessage('La descripción es requerida'),
    body('objective').trim().isLength({ min: 10 }).withMessage('El objetivo es requerido')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const { title, description, objective, actors, prerequisites, mainFlow, postconditions, businessRules } = req.body;

    // Construir texto estructurado para análisis
    const structuredText = `
TÍTULO: ${title}
OBJETIVO: ${objective}
DESCRIPCIÓN: ${description}

ACTORES PRIMARIOS: ${actors?.primary?.join(', ') || 'No especificados'}
ACTORES SECUNDARIOS: ${actors?.secondary?.join(', ') || 'No especificados'}
SISTEMAS: ${actors?.systems?.join(', ') || 'No especificados'}

PRERREQUISITOS:
${prerequisites?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'No especificados'}

FLUJO PRINCIPAL:
${mainFlow?.map((s: any) => `${s.step}. ${s.actor}: ${s.action} - ${s.description}`).join('\n') || 'No especificado'}

POSTCONDICIONES:
${postconditions?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || 'No especificadas'}

REGLAS DE NEGOCIO:
${businessRules?.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n') || 'No especificadas'}
    `.trim();

    // Obtener sugerencias de IA
    const suggestions = await openaiService.analyzeCaseForSuggestions(structuredText);

    res.json({
      success: true,
      data: suggestions
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/ai-suggest-content:
 *   post:
 *     summary: Sugerir contenido AI para campos del caso de uso
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               objective:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contenido sugerido por AI
 */
router.post('/ai-suggest-content',
  [
    body('title').trim().isLength({ min: 3 }).withMessage('El título es requerido')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const { title, description, objective } = req.body;

    // Crear contexto para AI
    const context = `
TÍTULO: ${title}
${description ? `DESCRIPCIÓN: ${description}` : ''}
${objective ? `OBJETIVO: ${objective}` : ''}
    `.trim();

    // Obtener sugerencias de contenido
    const suggestions = await openaiService.suggestUseCaseContent(context);

    res.json({
      success: true,
      data: suggestions
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/ai-suggest-apis:
 *   post:
 *     summary: Sugerir APIs por dominio usando AI
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
 *               - domains
 *               - useCaseContext
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *               useCaseContext:
 *                 type: string
 *     responses:
 *       200:
 *         description: APIs sugeridas por dominio
 */
router.post('/ai-suggest-apis',
  [
    body('domains').isArray({ min: 1 }).withMessage('Debe proporcionar al menos un dominio'),
    body('useCaseContext').trim().isLength({ min: 10 }).withMessage('El contexto del caso de uso es requerido')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const { domains, useCaseContext } = req.body;

    // Obtener sugerencias de APIs por dominio
    const suggestions = await openaiService.suggestApisByDomain(domains, useCaseContext);

    res.json({
      success: true,
      data: suggestions
    });
  })
);

/**
 * @swagger
 * /api/v1/use-cases/recommend-domains:
 *   post:
 *     summary: Recomendar dominios BIAN para un caso de uso
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
 *               - useCaseText
 *             properties:
 *               useCaseText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dominios BIAN recomendados
 */
router.post('/recommend-domains',
  [
    body('useCaseText').trim().isLength({ min: 10 }).withMessage('El texto del caso de uso es requerido')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const { useCaseText } = req.body;

    // Obtener recomendaciones de dominios BIAN
    const recommendations = await openaiService.suggestBianDomains(useCaseText);

    res.json({
      success: true,
      data: recommendations
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
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
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
  asyncHandler(async (req: Request, res: Response) => {
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
    if (req.body.title !== undefined) {
      useCase.title = req.body.title;
    }
    if (req.body.description !== undefined) {
      useCase.description = req.body.description;
    }
    if (req.body.status !== undefined) {
      useCase.status = req.body.status;
    }

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
  asyncHandler(async (req: Request, res: Response) => {
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

/**
 * @swagger
 * /api/v1/use-cases/{id}/openapi-spec:
 *   get:
 *     summary: Obtener especificación OpenAPI para un caso de uso
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
 *         description: Especificación OpenAPI generada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:id/openapi-spec',
  param('id').isMongoId(),
  asyncHandler(async (req: Request, res: Response) => {
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
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    if (!useCase.suggestedApis || useCase.suggestedApis.length === 0) {
      throw createError('No hay APIs disponibles para este caso de uso', 400);
    }

    try {
      // Generar especificación OpenAPI
      const spec = OpenApiService.generateUseCaseSpec(useCase);
      OpenApiService.addCommonSchemas(spec);

      // Validar especificación
      const validation = OpenApiService.validateSpec(spec);
      if (!validation.valid) {
        logger.warn('Especificación OpenAPI inválida:', validation.errors);
      }

      res.json({
        success: true,
        data: spec,
        validation: validation
      });
    } catch (error) {
      logger.error('Error generando especificación OpenAPI:', error);
      throw createError('Error generando especificación OpenAPI', 500);
    }
  })
);

/**
 * @swagger
 * /api/v1/use-cases/{id}/test-api:
 *   post:
 *     summary: Probar una API específica del caso de uso
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiName
 *               - endpoint
 *               - method
 *             properties:
 *               apiName:
 *                 type: string
 *               endpoint:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [GET, POST, PUT, DELETE]
 *               payload:
 *                 type: object
 *               headers:
 *                 type: object
 *               baseUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado del test de la API
 */
router.post('/:id/test-api',
  [
    param('id').isMongoId(),
    body('apiName').trim().isLength({ min: 1 }).withMessage('Nombre de API requerido'),
    body('endpoint').trim().isLength({ min: 1 }).withMessage('Endpoint requerido'),
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE']).withMessage('Método HTTP inválido'),
    body('baseUrl').optional().isURL().withMessage('URL base inválida')
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Datos de entrada inválidos', 400);
    }

    const user = req.user as any;
    const useCase = await UseCase.findOne({
      _id: req.params.id,
      $or: [
        { userId: user._id },
        { companyId: user.companyId }
      ]
    });

    if (!useCase) {
      throw createError('Caso de uso no encontrado', 404);
    }

    const { apiName, endpoint, method, payload, headers, baseUrl } = req.body;

    try {
      // Configurar URL completa
      const fullUrl = baseUrl ? `${baseUrl}${endpoint}` : `https://sandbox.bian.org/v13${endpoint}`;
      
      // Configurar headers por defecto
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BIAN-CU-Platform/1.0.0',
        ...headers
      };

      // Configuración de la solicitud
      const requestConfig: any = {
        method: method.toLowerCase(),
        url: fullUrl,
        headers: defaultHeaders,
        timeout: 10000, // 10 segundos timeout
        validateStatus: () => true // No lanzar error por códigos de estado
      };

      // Agregar payload si es necesario
      if (method !== 'GET' && payload) {
        requestConfig.data = payload;
      }

      logger.info(`Testing API: ${method} ${fullUrl}`);

      // Realizar la solicitud
      const startTime = Date.now();
      const response = await axios(requestConfig);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Preparar resultado del test
      const testResult = {
        success: response.status >= 200 && response.status < 400,
        status: response.status,
        statusText: response.statusText,
        responseTime: responseTime,
        headers: response.headers,
        data: response.data,
        request: {
          url: fullUrl,
          method: method.toUpperCase(),
          headers: defaultHeaders,
          payload: payload || null
        },
        timestamp: new Date().toISOString()
      };

      logger.info(`API test completed: ${response.status} in ${responseTime}ms`);

      res.json({
        success: true,
        data: testResult
      });

    } catch (error: any) {
      logger.error('Error testing API:', error.message);

      // Preparar resultado de error
      const errorResult = {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          type: error.name || 'Error'
        },
        request: {
          url: baseUrl ? `${baseUrl}${endpoint}` : `https://sandbox.bian.org/v13${endpoint}`,
          method: method.toUpperCase(),
          headers: headers || {},
          payload: payload || null
        },
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: errorResult
      });
    }
  })
);

export { router as useCaseRoutes }; 