import { logger } from '../utils/logger';

interface BianApi {
  name: string;
  domain: string;
  description: string;
  version: string;
  operationType: 'CR' | 'UP' | 'RQ' | 'BQ';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  availableMethods?: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  parameters?: {
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }[];
  requestSchema?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  serviceDomain?: string;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export class SingleApiOpenApiService {
  private generatePayloadExample(api: BianApi): Record<string, any> {
    const domain = api.name.split(' ')[0].toLowerCase();
    
    // Ejemplos base por dominio BIAN
    const domainExamples: Record<string, any> = {
      'customeragreement': {
        agreementDetails: {
          customerId: "CUST-12345",
          agreementType: "Credit Facility",
          agreementDate: "2024-01-15",
          status: "Active"
        }
      },
      'productdirectory': {
        productDetails: {
          productId: "PROD-789",
          productName: "Premium Savings Account",
          productType: "Savings",
          features: ["Online Banking", "Mobile App", "ATM Access"]
        }
      },
      'customercase': {
        caseDetails: {
          caseId: "CASE-456",
          customerId: "CUST-12345",
          caseType: "Account Opening",
          priority: "High",
          status: "In Progress"
        }
      },
      'partylifecyclemanagement': {
        partyDetails: {
          partyId: "PARTY-123",
          partyType: "Individual",
          personalDetails: {
            firstName: "John",
            lastName: "Doe",
            dateOfBirth: "1985-03-15"
          }
        }
      },
      'cardcollections': {
        collectionDetails: {
          cardNumber: "****-****-****-1234",
          accountId: "ACC-789",
          outstandingAmount: 2500.00,
          dueDate: "2024-02-15"
        }
      }
    };

    return domainExamples[domain] || {
      generalDetails: {
        id: "ID-123456",
        type: "Standard Request",
        timestamp: new Date().toISOString(),
        status: "Active"
      }
    };
  }

  private generateResponseExample(api: BianApi): Record<string, any> {
    const baseResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase()
    };

    if (api.method === 'GET') {
      return {
        ...baseResponse,
        data: this.generatePayloadExample(api)
      };
    } else {
      return {
        ...baseResponse,
        message: "Operation completed successfully",
        resourceId: "RES-" + Math.random().toString(36).substr(2, 9).toUpperCase()
      };
    }
  }

  private generateSchemas(api: BianApi): Record<string, any> {
    const requestSchemaName = `${api.name.replace(/\s+/g, '')}Request`;
    const responseSchemaName = `${api.name.replace(/\s+/g, '')}Response`;

    const schemas: Record<string, any> = {};

    // Schema de request (para POST/PUT)
    if (['POST', 'PUT', 'PATCH'].includes(api.method)) {
      schemas[requestSchemaName] = {
        type: 'object',
        properties: this.generateSchemaProperties(this.generatePayloadExample(api)),
        required: Object.keys(this.generatePayloadExample(api))
      };
    }

    // Schema de response
    schemas[responseSchemaName] = {
      type: 'object',
      properties: this.generateSchemaProperties(this.generateResponseExample(api)),
      required: ['success', 'timestamp']
    };

    // Schema de error
    schemas['ErrorResponse'] = {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Invalid request data' },
            details: { type: 'array', items: { type: 'string' } }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['success', 'error', 'timestamp']
    };

    return schemas;
  }

  private generateSchemaProperties(obj: any): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        properties[key] = {
          type: 'string',
          example: value
        };
      } else if (typeof value === 'number') {
        properties[key] = {
          type: 'number',
          example: value
        };
      } else if (typeof value === 'boolean') {
        properties[key] = {
          type: 'boolean',
          example: value
        };
      } else if (Array.isArray(value)) {
        properties[key] = {
          type: 'array',
          items: {
            type: typeof value[0] === 'object' ? 'object' : typeof value[0] || 'string'
          },
          example: value
        };
      } else if (typeof value === 'object' && value !== null) {
        properties[key] = {
          type: 'object',
          properties: this.generateSchemaProperties(value),
          example: value
        };
      } else {
        properties[key] = {
          type: 'string',
          example: String(value)
        };
      }
    }

    return properties;
  }

  public generateOpenApiSpec(api: BianApi, customizations?: any): OpenAPISpec {
    try {
      const requestSchemaName = `${api.name.replace(/\s+/g, '')}Request`;
      const responseSchemaName = `${api.name.replace(/\s+/g, '')}Response`;

      // Usar payload personalizado si existe
      const examplePayload = customizations?.customPayload || this.generatePayloadExample(api);
      
      const spec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: `${api.name} API`,
          version: '1.0.0',
          description: `API documentation for ${api.name}\n\n**Service Domain:** ${api.serviceDomain}\n**Description:** ${api.description || 'No description available'}`
        },
        paths: {
          [api.endpoint]: {
            [api.method.toLowerCase()]: {
              summary: api.name,
              description: api.description || `Execute ${api.name} operation`,
              tags: [api.serviceDomain],
              parameters: api.method === 'GET' ? [
                {
                  name: 'limit',
                  in: 'query',
                  description: 'Number of results to return',
                  required: false,
                  schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 }
                },
                {
                  name: 'offset',
                  in: 'query', 
                  description: 'Number of results to skip',
                  required: false,
                  schema: { type: 'integer', default: 0, minimum: 0 }
                }
              ] : undefined,
              requestBody: ['POST', 'PUT', 'PATCH'].includes(api.method) ? {
                required: true,
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${requestSchemaName}` },
                    example: examplePayload
                  }
                }
              } : undefined,
              responses: {
                '200': {
                  description: 'Successful operation',
                  content: {
                    'application/json': {
                      schema: { $ref: `#/components/schemas/${responseSchemaName}` },
                      example: this.generateResponseExample(api)
                    }
                  }
                },
                '400': {
                  description: 'Bad Request',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                  }
                },
                '401': {
                  description: 'Unauthorized',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                  }
                },
                '404': {
                  description: 'Not Found',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                  }
                },
                '500': {
                  description: 'Internal Server Error',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ErrorResponse' }
                    }
                  }
                }
              },
              security: [{ bearerAuth: [] }]
            }
          }
        },
        components: {
          schemas: this.generateSchemas(api),
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      };

      logger.info(`OpenAPI spec generated for API: ${api.name}`);
      return spec;

    } catch (error: any) {
      logger.error('Error generating OpenAPI spec:', error);
      throw new Error(`Failed to generate OpenAPI specification: ${error?.message || 'Unknown error'}`);
    }
  }

  public validateOpenApiSpec(spec: OpenAPISpec): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (!spec.openapi) {
      errors.push('Missing openapi version');
    }

    if (!spec.info || !spec.info.title || !spec.info.version) {
      errors.push('Missing or incomplete info section');
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      errors.push('No paths defined');
    }

    // Validar cada path
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (typeof pathItem !== 'object') {
        errors.push(`Invalid path item for ${path}`);
        continue;
      }

      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || operation === null || !('responses' in operation)) {
          errors.push(`Invalid operation ${method.toUpperCase()} for path ${path}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 