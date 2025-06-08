import { IUseCase } from '../models/UseCase';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

export class OpenApiService {
  /**
   * Genera una especificación OpenAPI 3.0 completa para un caso de uso
   */
  static generateUseCaseSpec(useCase: IUseCase): OpenAPISpec {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: `APIs para: ${useCase.title}`,
        description: `Documentación de APIs del caso de uso: ${useCase.description}`,
        version: '1.0.0'
      },
      servers: [
        {
          url: 'https://api.bian.org/v13',
          description: 'Servidor BIAN v13 (Producción)'
        },
        {
          url: 'https://sandbox.bian.org/v13',
          description: 'Servidor BIAN v13 (Sandbox)'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        }
      },
      tags: []
    };

    // Agregar tags únicos por dominio
    const domains = [...new Set(useCase.suggestedApis?.map(api => api.domain) || [])];
    spec.tags = domains.map(domain => ({
      name: domain,
      description: `APIs del dominio ${domain}`
    }));

    // Generar paths para cada API sugerida
    useCase.suggestedApis?.forEach(api => {
      this.addApiToSpec(spec, api, useCase);
    });

    return spec;
  }

  /**
   * Agrega una API individual a la especificación OpenAPI
   */
  private static addApiToSpec(spec: OpenAPISpec, api: any, useCase: IUseCase): void {
    api.endpoints?.forEach((endpoint: any) => {
      const path = endpoint.path || `/${api.domain.toLowerCase()}-${api.name.toLowerCase().replace(/\s+/g, '-')}`;
      const method = (endpoint.method || 'GET').toLowerCase();
      
      if (!spec.paths[path]) {
        spec.paths[path] = {};
      }

      spec.paths[path][method] = {
        tags: [api.domain],
        summary: endpoint.description || api.name,
        description: `${api.description}\n\n**Operación:** ${endpoint.operation || 'N/A'}\n**Dominio:** ${api.domain}`,
        operationId: `${method}${path.replace(/[^a-zA-Z0-9]/g, '')}`,
        security: [
          { BearerAuth: [] },
          { ApiKeyAuth: [] }
        ],
        parameters: this.generateParameters(endpoint),
        responses: this.generateResponses(api, endpoint),
        ...(method !== 'get' && { requestBody: this.generateRequestBody(api, endpoint) })
      };
    });
  }

  /**
   * Genera parámetros para un endpoint
   */
  private static generateParameters(endpoint: any): any[] {
    const parameters = [];

    // Parámetros de path comunes en BIAN
    if (endpoint.path?.includes('{cr-reference-id}')) {
      parameters.push({
        name: 'cr-reference-id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Control Record Reference ID'
      });
    }

    if (endpoint.path?.includes('{bq-reference-id}')) {
      parameters.push({
        name: 'bq-reference-id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
        description: 'Behavior Qualifier Reference ID'
      });
    }

    // Parámetros de query comunes
    parameters.push(
      {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Número de página'
      },
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Número de elementos por página'
      }
    );

    return parameters;
  }

  /**
   * Genera el cuerpo de la solicitud para endpoints POST/PUT
   */
  private static generateRequestBody(api: any, endpoint: any): any {
    const schemaName = `${api.name.replace(/\s+/g, '')}Request`;
    
    return {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${schemaName}`
          },
          example: this.generateExamplePayload(api, 'request')
        }
      }
    };
  }

  /**
   * Genera las respuestas para un endpoint
   */
  private static generateResponses(api: any, endpoint: any): any {
    const responseSchemaName = `${api.name.replace(/\s+/g, '')}Response`;
    const errorSchemaName = 'ErrorResponse';

    return {
      '200': {
        description: 'Operación exitosa',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${responseSchemaName}`
            },
            example: this.generateExamplePayload(api, 'response')
          }
        }
      },
      '400': {
        description: 'Solicitud inválida',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${errorSchemaName}`
            }
          }
        }
      },
      '401': {
        description: 'No autorizado',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${errorSchemaName}`
            }
          }
        }
      },
      '404': {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${errorSchemaName}`
            }
          }
        }
      },
      '500': {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${errorSchemaName}`
            }
          }
        }
      }
    };
  }

  /**
   * Genera ejemplos de payload basados en el dominio y API
   */
  private static generateExamplePayload(api: any, type: 'request' | 'response'): any {
    const domain = api.domain.toLowerCase();
    
    if (type === 'request') {
      // Ejemplos de request basados en dominios BIAN comunes
      if (domain.includes('customer')) {
        return {
          customerReference: "CR123456",
          customerData: {
            name: "Juan Pérez",
            email: "juan.perez@example.com",
            phone: "+1234567890",
            address: {
              street: "123 Main St",
              city: "Ciudad",
              country: "País",
              postalCode: "12345"
            }
          }
        };
      } else if (domain.includes('account')) {
        return {
          accountReference: "AC789012",
          accountType: "Savings",
          currency: "USD",
          balance: 1000.00
        };
      } else if (domain.includes('transaction')) {
        return {
          transactionReference: "TX345678",
          amount: 500.00,
          currency: "USD",
          fromAccount: "AC789012",
          toAccount: "AC789013",
          description: "Transfer"
        };
      }
    } else {
      // Ejemplos de response
      if (domain.includes('customer')) {
        return {
          customerReference: "CR123456",
          status: "Active",
          customerData: {
            name: "Juan Pérez",
            email: "juan.perez@example.com",
            phone: "+1234567890",
            lastUpdated: "2024-01-15T10:30:00Z"
          },
          metadata: {
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-15T10:30:00Z"
          }
        };
      } else if (domain.includes('account')) {
        return {
          accountReference: "AC789012",
          accountStatus: "Active",
          balance: 1000.00,
          currency: "USD",
          lastTransaction: "2024-01-15T10:30:00Z"
        };
      }
    }

    // Default generic example
    return {
      id: "REF123456",
      status: "Success",
      data: {},
      timestamp: "2024-01-15T10:30:00Z"
    };
  }

  /**
   * Agrega esquemas básicos comunes a la especificación
   */
  static addCommonSchemas(spec: OpenAPISpec): void {
    spec.components.schemas = {
      ...spec.components.schemas,
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          },
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string' }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    };
  }

  /**
   * Valida que la especificación generada sea válida
   */
  static validateSpec(spec: OpenAPISpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec.openapi) errors.push('Campo openapi requerido');
    if (!spec.info?.title) errors.push('Título requerido en info');
    if (!spec.info?.version) errors.push('Versión requerida en info');
    if (Object.keys(spec.paths || {}).length === 0) errors.push('Al menos un path es requerido');

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 