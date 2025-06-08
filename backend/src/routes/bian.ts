import express, { Request, Response } from 'express';
import passport from 'passport';
import { query, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { bianService } from '../services/bianService';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(passport.authenticate('jwt', { session: false }));

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