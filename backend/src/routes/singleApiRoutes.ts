import express, { Request, Response } from 'express';
import passport from 'passport';
import { param, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { UseCase } from '../models/UseCase';
import { ApiCustomization } from '../models/ApiCustomization';
import { SingleApiOpenApiService } from '../services/singleApiOpenApiService';
import { logger } from '../utils/logger';

const router = express.Router();
const openApiService = new SingleApiOpenApiService();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

/**
 * @swagger
 * /api/v1/single-api/{useCaseId}/{apiName}:
 *   get:
 *     summary: Obtener información completa de una API específica con personalización
 *     tags: [Single API]
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
 *         description: Información completa de la API
 *       404:
 *         description: API o caso de uso no encontrado
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
    const decodedApiName = decodeURIComponent(apiName);

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

    // Buscar la API específica en las APIs sugeridas
    const targetApi = useCase.suggestedApis?.find(api => 
      api.name === decodedApiName || 
      api.name.includes(decodedApiName.split(' - ')[0])
    );

    if (!targetApi) {
      throw createError('API no encontrada en este caso de uso', 404);
    }

    // Obtener personalización del usuario si existe
    const customization = await ApiCustomization.findByApiAndUser(
      useCaseId, 
      decodedApiName, 
      user._id
    );

    // Convertir la API del UseCase al formato BianApi para OpenAPI
    const bianApi = {
      name: targetApi.name,
      domain: targetApi.domain,
      description: targetApi.description || 'No description available',
      version: '13.0.0',
      operationType: 'RQ' as const,
      endpoint: targetApi.endpoints?.[0]?.path || '/api/endpoint',
      method: (targetApi.endpoints?.[0]?.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
      serviceDomain: targetApi.domain
    };

    // Generar especificación OpenAPI para esta API específica
    const openApiSpec = openApiService.generateOpenApiSpec(bianApi, customization);

    res.json({
      success: true,
      data: {
        useCase: {
          id: useCase._id,
          title: useCase.title,
          description: useCase.description
        },
        api: targetApi,
        customization: customization || null,
        openApiSpec,
        hasCustomization: !!customization,
        availableOperations: ['view', 'edit', 'test', 'download']
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/single-api/{useCaseId}/{apiName}/openapi-spec:
 *   get:
 *     summary: Obtener únicamente la especificación OpenAPI de la API
 *     tags: [Single API]
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
 *       - in: query
 *         name: includeCustomizations
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Incluir personalizaciones del usuario
 *     responses:
 *       200:
 *         description: Especificación OpenAPI
 */
router.get('/:useCaseId/:apiName/openapi-spec',
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
    const includeCustomizations = req.query.includeCustomizations !== 'false';
    const decodedApiName = decodeURIComponent(apiName);

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

    // Buscar la API específica
    const targetApi = useCase.suggestedApis?.find(api => 
      api.name === decodedApiName || 
      api.name.includes(decodedApiName.split(' - ')[0])
    );

    if (!targetApi) {
      throw createError('API no encontrada', 404);
    }

    let customization = null;
    if (includeCustomizations) {
      customization = await ApiCustomization.findByApiAndUser(
        useCaseId, 
        decodedApiName, 
        user._id
      );
    }

    // Convertir la API del UseCase al formato BianApi para OpenAPI
    const bianApiForSpec = {
      name: targetApi.name,
      domain: targetApi.domain,
      description: targetApi.description || 'No description available',
      version: '13.0.0',
      operationType: 'RQ' as const,
      endpoint: targetApi.endpoints?.[0]?.path || '/api/endpoint',
      method: (targetApi.endpoints?.[0]?.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
      serviceDomain: targetApi.domain
    };

    // Generar especificación OpenAPI
    const openApiSpec = openApiService.generateOpenApiSpec(bianApiForSpec, customization);
    
    // Validar especificación
    const validation = openApiService.validateOpenApiSpec(openApiSpec);
    
    if (!validation.isValid) {
      logger.warn('OpenAPI spec validation warnings:', validation.errors);
    }

    res.json({
      success: true,
      data: openApiSpec,
      validation: {
        isValid: validation.isValid,
        warnings: validation.errors
      },
      includedCustomizations: includeCustomizations && !!customization
    });
  })
);

/**
 * @swagger
 * /api/v1/single-api/{useCaseId}/{apiName}/related-apis:
 *   get:
 *     summary: Obtener APIs relacionadas del mismo caso de uso
 *     tags: [Single API]
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
 *         description: APIs relacionadas
 */
router.get('/:useCaseId/:apiName/related-apis',
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
    const decodedApiName = decodeURIComponent(apiName);

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

    // Obtener la API actual
    const currentApi = useCase.suggestedApis?.find(api => 
      api.name === decodedApiName || 
      api.name.includes(decodedApiName.split(' - ')[0])
    );

    if (!currentApi) {
      throw createError('API no encontrada', 404);
    }

    // Filtrar APIs relacionadas (mismo dominio o dominio relacionado)
    const relatedApis = useCase.suggestedApis?.filter(api => {
      if (api.name === currentApi.name) return false;
      
      // APIs del mismo dominio
      if (api.domain === currentApi.domain) return true;
      
      // APIs que comparten palabras clave en el nombre
      const currentKeywords = currentApi.name.toLowerCase().split(' ');
      const apiKeywords = api.name.toLowerCase().split(' ');
      const sharedKeywords = currentKeywords.filter(word => 
        apiKeywords.includes(word) && word.length > 3
      );
      
      return sharedKeywords.length > 0;
    }) || [];

    // Obtener información de personalización para las APIs relacionadas
    const customizations = await ApiCustomization.find({
      useCaseId,
      userId: user._id,
      apiName: { $in: relatedApis.map(api => api.name) },
      isActive: true
    });

    const relatedApisWithCustomization = relatedApis.map(api => ({
      ...api,
      hasCustomization: customizations.some(c => c.apiName === api.name)
    }));

    res.json({
      success: true,
      data: {
        currentApi: {
          name: currentApi.name,
          domain: currentApi.domain
        },
        relatedApis: relatedApisWithCustomization,
        count: relatedApisWithCustomization.length,
        groupedByDomain: relatedApisWithCustomization.reduce((acc, api) => {
          const domain = api.domain || 'Other';
          if (!acc[domain]) acc[domain] = [];
          acc[domain].push(api);
          return acc;
        }, {} as Record<string, any[]>)
      }
    });
  })
);

export { router as singleApiRoutes }; 