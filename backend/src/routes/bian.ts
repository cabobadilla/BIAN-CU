import express, { Request, Response } from 'express';
import passport from 'passport';
import { query, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { bianService } from '../services/bianService';

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
 * /api/v1/bian/domains:
 *   get:
 *     summary: Obtener todos los dominios BIAN disponibles
 *     tags: [BIAN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar dominios
 *     responses:
 *       200:
 *         description: Lista de dominios BIAN
 */
router.get('/domains',
  query('search').optional().trim().isLength({ min: 2 }),
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Parámetros de búsqueda inválidos', 400);
    }

    const { search } = req.query;
    
    let domains;
    if (search) {
      domains = await bianService.searchDomains(search as string);
    } else {
      domains = await bianService.getDomains();
    }

    res.json({
      success: true,
      data: domains,
      count: domains.length
    });
  })
);

/**
 * @swagger
 * /api/v1/bian/domains/{domainName}:
 *   get:
 *     summary: Obtener detalles de un dominio BIAN específico
 *     tags: [BIAN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: domainName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del dominio BIAN
 *     responses:
 *       200:
 *         description: Detalles del dominio
 *       404:
 *         description: Dominio no encontrado
 */
router.get('/domains/:domainName',
  asyncHandler(async (req: Request, res: Response) => {
    const { domainName } = req.params;
    
    const domain = await bianService.getDomainByName(domainName);
    
    if (!domain) {
      throw createError('Dominio BIAN no encontrado', 404);
    }

    res.json({
      success: true,
      data: domain
    });
  })
);

/**
 * @swagger
 * /api/v1/bian/domains:
 *   post:
 *     summary: Crear dominios BIAN dinámicamente (sugeridos por IA)
 *     tags: [BIAN]
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
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     businessArea:
 *                       type: string
 *     responses:
 *       201:
 *         description: Dominios creados exitosamente
 */
router.post('/domains',
  asyncHandler(async (req: Request, res: Response) => {
    const { domains } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      throw createError('Debe proporcionar al menos un dominio para crear', 400);
    }

    // Validar estructura de cada dominio
    for (const domain of domains) {
      if (!domain.name || !domain.description) {
        throw createError('Cada dominio debe tener nombre y descripción', 400);
      }
    }

    const createdDomains = await bianService.createDomains(domains);

    res.status(201).json({
      success: true,
      data: createdDomains,
      count: createdDomains.length,
      message: `Se crearon ${createdDomains.length} dominios exitosamente`
    });
  })
);

/**
 * @swagger
 * /api/v1/bian/apis/create:
 *   post:
 *     summary: Crear APIs BIAN dinámicamente (sugeridas por IA)
 *     tags: [BIAN]
 *     security:
 *       - bearerAuth: []
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
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     domain:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: APIs creadas exitosamente
 */
router.post('/apis/create',
  asyncHandler(async (req: Request, res: Response) => {
    const { apis } = req.body;

    if (!apis || !Array.isArray(apis) || apis.length === 0) {
      throw createError('Debe proporcionar al menos una API para crear', 400);
    }

    // Validar estructura de cada API
    for (const api of apis) {
      if (!api.name || !api.domain || !api.description) {
        throw createError('Cada API debe tener nombre, dominio y descripción', 400);
      }
    }

    const createdApis = await bianService.createApis(apis);

    res.status(201).json({
      success: true,
      data: createdApis,
      count: createdApis.length,
      message: `Se crearon ${createdApis.length} APIs exitosamente`
    });
  })
);

/**
 * @swagger
 * /api/v1/bian/apis:
 *   post:
 *     summary: Obtener APIs sugeridas para dominios específicos
 *     tags: [BIAN]
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
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *               useCaseContext:
 *                 type: string
 *                 description: Contexto del caso de uso para refinar sugerencias
 *     responses:
 *       200:
 *         description: APIs sugeridas para los dominios
 */
router.post('/apis',
  asyncHandler(async (req: Request, res: Response) => {
    const { domains, useCaseContext } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      throw createError('Debe proporcionar al menos un dominio', 400);
    }

    const suggestedApis = await bianService.getApisForDomains(domains, useCaseContext);

    res.json({
      success: true,
      data: {
        domains,
        suggestedApis,
        count: suggestedApis.length
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/bian/apis/{apiName}:
 *   get:
 *     summary: Obtener detalles de una API BIAN específica
 *     tags: [BIAN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: apiName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de la API BIAN
 *     responses:
 *       200:
 *         description: Detalles de la API
 *       404:
 *         description: API no encontrada
 */
router.get('/apis/:apiName',
  asyncHandler(async (req: Request, res: Response) => {
    const { apiName } = req.params;
    
    const api = await bianService.getApiDetails(apiName);
    
    if (!api) {
      throw createError('API BIAN no encontrada', 404);
    }

    res.json({
      success: true,
      data: api
    });
  })
);

/**
 * @swagger
 * /api/v1/bian/validate-domains:
 *   post:
 *     summary: Validar selección de dominios para un caso de uso
 *     tags: [BIAN]
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
 *               - useCaseText
 *             properties:
 *               domains:
 *                 type: array
 *                 items:
 *                   type: string
 *               useCaseText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de la validación
 */
router.post('/validate-domains',
  asyncHandler(async (req: Request, res: Response) => {
    const { domains, useCaseText } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      throw createError('Debe proporcionar al menos un dominio', 400);
    }

    if (!useCaseText || typeof useCaseText !== 'string' || useCaseText.trim().length < 10) {
      throw createError('Debe proporcionar un texto de caso de uso válido', 400);
    }

    const validation = await bianService.validateDomainSelection(domains, useCaseText);

    res.json({
      success: true,
      data: validation
    });
  })
);

export { router as bianRoutes }; 