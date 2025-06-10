import { logger } from '../utils/logger';
import { openaiService } from './openaiService';

interface BianDomain {
  name: string;
  description: string;
  businessAreas: string[];
  commonApis: string[];
}

interface BianApi {
  name: string;
  domain: string;
  description: string;
  endpoints: Array<{
    path: string;
    method: string;
    operation: string;
    description: string;
  }>;
  coverage: string[];
  limitations: string[];
  yamlFile?: string;
}

class BianService {
  private domains: BianDomain[] = [
    {
      name: 'Customer Management',
      description: 'Gestión integral de información y relaciones con clientes',
      businessAreas: ['onboarding', 'kyc', 'customer-data', 'relationship-management'],
      commonApis: ['Customer Directory', 'Customer Reference Data Management', 'Customer Relationship Management']
    },
    {
      name: 'Product Management',
      description: 'Gestión del catálogo de productos y servicios bancarios',
      businessAreas: ['product-catalog', 'pricing', 'product-lifecycle'],
      commonApis: ['Product Directory', 'Product Design', 'Product Deployment']
    },
    {
      name: 'Customer Offer',
      description: 'Gestión de ofertas personalizadas para clientes',
      businessAreas: ['marketing', 'cross-selling', 'personalization'],
      commonApis: ['Customer Offer', 'Next Best Action', 'Campaign Management']
    },
    {
      name: 'Customer Agreement',
      description: 'Gestión de acuerdos y contratos con clientes',
      businessAreas: ['contracts', 'terms-conditions', 'legal-agreements'],
      commonApis: ['Customer Agreement', 'Contract Management', 'Terms and Conditions']
    },
    {
      name: 'Payment Order',
      description: 'Procesamiento de órdenes de pago',
      businessAreas: ['payments', 'transfers', 'payment-processing'],
      commonApis: ['Payment Order', 'Payment Initiation', 'Payment Tracking']
    },
    {
      name: 'Payment Execution',
      description: 'Ejecución y liquidación de pagos',
      businessAreas: ['settlement', 'clearing', 'payment-execution'],
      commonApis: ['Payment Execution', 'ACH Operations', 'Wire Transfer Operations']
    },
    {
      name: 'Card Transaction',
      description: 'Procesamiento de transacciones con tarjetas',
      businessAreas: ['card-processing', 'authorization', 'settlement'],
      commonApis: ['Card Transaction', 'Card Authorization', 'Card Settlement']
    },
    {
      name: 'Credit Management',
      description: 'Gestión de créditos y evaluación de riesgo crediticio',
      businessAreas: ['credit-assessment', 'loan-origination', 'credit-monitoring'],
      commonApis: ['Credit Management', 'Credit Assessment', 'Credit Facility']
    },
    {
      name: 'Loan',
      description: 'Gestión del ciclo de vida de préstamos',
      businessAreas: ['loan-origination', 'loan-servicing', 'collections'],
      commonApis: ['Loan', 'Mortgage Loan', 'Consumer Loan']
    },
    {
      name: 'Deposit',
      description: 'Gestión de cuentas de depósito',
      businessAreas: ['account-management', 'deposits', 'savings'],
      commonApis: ['Current Account', 'Savings Account', 'Time Deposit']
    },
    {
      name: 'Investment Account',
      description: 'Gestión de cuentas de inversión',
      businessAreas: ['investments', 'portfolio-management', 'trading'],
      commonApis: ['Investment Account', 'Portfolio Management', 'Securities Trading']
    },
    {
      name: 'Risk Management',
      description: 'Gestión integral de riesgos',
      businessAreas: ['risk-assessment', 'compliance', 'monitoring'],
      commonApis: ['Market Risk Management', 'Credit Risk Management', 'Operational Risk Management']
    },
    {
      name: 'Fraud Detection',
      description: 'Detección y prevención de fraudes',
      businessAreas: ['fraud-prevention', 'monitoring', 'investigation'],
      commonApis: ['Fraud Detection', 'Transaction Monitoring', 'Fraud Investigation']
    },
    {
      name: 'Compliance',
      description: 'Gestión de cumplimiento regulatorio',
      businessAreas: ['regulatory-compliance', 'reporting', 'audit'],
      commonApis: ['Regulatory Compliance', 'Regulatory Reporting', 'Audit Trail']
    }
  ];

  private apiTemplates: Record<string, BianApi> = {
    'Customer Directory': {
      name: 'Customer Directory',
      domain: 'Customer Management',
      description: 'Directorio centralizado de información de clientes',
      endpoints: [
        {
          path: '/customer-directory/register',
          method: 'POST',
          operation: 'Register',
          description: 'Registrar nuevo cliente en el directorio'
        },
        {
          path: '/customer-directory/{customer-directory-entry-id}/retrieve',
          method: 'GET',
          operation: 'Retrieve',
          description: 'Obtener información del cliente'
        },
        {
          path: '/customer-directory/{customer-directory-entry-id}/update',
          method: 'PUT',
          operation: 'Update',
          description: 'Actualizar información del cliente'
        }
      ],
      coverage: ['registro de clientes', 'búsqueda de clientes', 'actualización de datos'],
      limitations: ['no incluye análisis de comportamiento', 'limitado a datos básicos']
    },
    'Payment Order': {
      name: 'Payment Order',
      domain: 'Payment Order',
      description: 'Gestión de órdenes de pago',
      endpoints: [
        {
          path: '/payment-order/initiate',
          method: 'POST',
          operation: 'Initiate',
          description: 'Iniciar nueva orden de pago'
        },
        {
          path: '/payment-order/{payment-order-id}/retrieve',
          method: 'GET',
          operation: 'Retrieve',
          description: 'Consultar estado de orden de pago'
        },
        {
          path: '/payment-order/{payment-order-id}/update',
          method: 'PUT',
          operation: 'Update',
          description: 'Actualizar orden de pago'
        }
      ],
      coverage: ['iniciación de pagos', 'seguimiento de órdenes', 'validación de fondos'],
      limitations: ['no incluye ejecución real', 'requiere integración con Payment Execution']
    },
    'Credit Assessment': {
      name: 'Credit Assessment',
      domain: 'Credit Management',
      description: 'Evaluación de riesgo crediticio',
      endpoints: [
        {
          path: '/credit-assessment/evaluate',
          method: 'POST',
          operation: 'Evaluate',
          description: 'Evaluar solicitud de crédito'
        },
        {
          path: '/credit-assessment/{assessment-id}/retrieve',
          method: 'GET',
          operation: 'Retrieve',
          description: 'Obtener resultado de evaluación'
        }
      ],
      coverage: ['scoring crediticio', 'análisis de riesgo', 'recomendaciones'],
      limitations: ['requiere datos históricos', 'sujeto a regulaciones locales']
    }
  };

  async getDomains(): Promise<BianDomain[]> {
    return this.domains;
  }

  async getDomainByName(name: string): Promise<BianDomain | null> {
    return this.domains.find(domain => domain.name === name) || null;
  }

  async createDomains(newDomains: { name: string; description: string; businessArea?: string }[]): Promise<BianDomain[]> {
    const createdDomains: BianDomain[] = [];

    for (const domainData of newDomains) {
      // Verificar si el dominio ya existe
      const existingDomain = this.domains.find(d => d.name === domainData.name);
      
      if (!existingDomain) {
        const newDomain: BianDomain = {
          name: domainData.name,
          description: domainData.description,
          businessAreas: [domainData.businessArea || 'AI-Suggested'],
          commonApis: [`${domainData.name} API`] // API genérica para el dominio
        };

        // Agregar el dominio a la lista en memoria
        this.domains.push(newDomain);
        createdDomains.push(newDomain);

        logger.info(`Dominio creado dinámicamente: ${domainData.name}`);
      } else {
        logger.info(`Dominio ya existe: ${domainData.name}`);
        createdDomains.push(existingDomain);
      }
    }

    return createdDomains;
  }

  async createApis(newApis: { name: string; domain: string; description: string }[]): Promise<BianApi[]> {
    const createdApis: BianApi[] = [];

    for (const apiData of newApis) {
      // Verificar si la API ya existe
      const existingApi = this.apiTemplates[apiData.name];
      
      if (!existingApi) {
        const newApi: BianApi = {
          name: apiData.name,
          domain: apiData.domain,
          description: apiData.description,
          endpoints: [
            {
              path: `/${apiData.name.toLowerCase().replace(/\s+/g, '-')}/initiate`,
              method: 'POST',
              operation: 'Initiate',
              description: `Iniciar operación de ${apiData.name}`
            },
            {
              path: `/${apiData.name.toLowerCase().replace(/\s+/g, '-')}/{id}/retrieve`,
              method: 'GET',
              operation: 'Retrieve',
              description: `Obtener información de ${apiData.name}`
            },
            {
              path: `/${apiData.name.toLowerCase().replace(/\s+/g, '-')}/{id}/update`,
              method: 'PUT',
              operation: 'Update',
              description: `Actualizar ${apiData.name}`
            }
          ],
          coverage: [`operaciones de ${apiData.domain}`, 'gestión básica', 'consultas'],
          limitations: ['API generada automáticamente por IA', 'funcionalidad básica']
        };

        // Agregar la API a los templates en memoria
        this.apiTemplates[apiData.name] = newApi;
        createdApis.push(newApi);

        logger.info(`API creada dinámicamente: ${apiData.name} para dominio ${apiData.domain}`);
      } else {
        logger.info(`API ya existe: ${apiData.name}`);
        createdApis.push(existingApi);
      }
    }

    return createdApis;
  }

  async getApisForDomains(domainNames: string[], useCaseContext?: string): Promise<any[]> {
    try {
      const selectedDomains = this.domains.filter(domain => 
        domainNames.includes(domain.name)
      );

      let suggestedApis: BianApi[] = [];

      // Obtener APIs básicas para los dominios seleccionados
      for (const domain of selectedDomains) {
        // Buscar en las APIs comunes del dominio
        for (const apiName of domain.commonApis) {
          const apiTemplate = this.apiTemplates[apiName];
          if (apiTemplate) {
            suggestedApis.push({ ...apiTemplate });
          }
        }
      }

      // Buscar también en todos los apiTemplates que coincidan con los dominios seleccionados
      // Esto incluye las APIs creadas dinámicamente
      for (const [apiName, apiTemplate] of Object.entries(this.apiTemplates)) {
        if (domainNames.includes(apiTemplate.domain) && 
            !suggestedApis.some(api => api.name === apiTemplate.name)) {
          suggestedApis.push({ ...apiTemplate });
        }
      }

      // Si hay contexto del caso de uso, usar IA para refinar sugerencias
      if (useCaseContext && suggestedApis.length > 0) {
        try {
          const refinedSuggestions = await this.refineApiSuggestions(
            suggestedApis, 
            useCaseContext, 
            domainNames
          );
          
          if (refinedSuggestions && refinedSuggestions.length > 0) {
            suggestedApis = refinedSuggestions;
          }
        } catch (error) {
          logger.warn('Error refinando sugerencias de API con IA:', error);
          // Continuar con las APIs básicas
        }
      }

      // Transformar APIs al formato esperado por el frontend
      return this.transformApisForFrontend(suggestedApis);

    } catch (error) {
      logger.error('Error obteniendo APIs para dominios:', error);
      throw new Error('Error obteniendo APIs sugeridas');
    }
  }

  private transformApisForFrontend(apis: BianApi[]): any[] {
    return apis.flatMap(api => {
      // Crear una entrada por cada endpoint
      return api.endpoints.map(endpoint => ({
        name: `${api.name} - ${endpoint.operation}`,
        domain: api.domain,
        description: endpoint.description || api.description,
        version: '13.0.0',
        operationType: this.mapOperationToType(endpoint.operation),
        endpoint: endpoint.path,
        method: endpoint.method,
        availableMethods: api.endpoints.map(e => e.method),
        parameters: this.extractParametersFromPath(endpoint.path),
        requestSchema: {},
        responseSchema: {}
      }));
    });
  }

  private mapOperationToType(operation: string): 'CR' | 'UP' | 'RQ' | 'BQ' {
    const operationMap: Record<string, 'CR' | 'UP' | 'RQ' | 'BQ'> = {
      'Register': 'CR',
      'Initiate': 'CR',
      'Create': 'CR',
      'Update': 'UP',
      'Modify': 'UP',
      'Retrieve': 'RQ',
      'Get': 'RQ',
      'Request': 'RQ',
      'Evaluate': 'BQ',
      'Execute': 'BQ',
      'Process': 'BQ'
    };
    
    return operationMap[operation] || 'RQ';
  }

  private extractParametersFromPath(path: string): { name: string; type: string; required: boolean }[] {
    const paramMatches = path.match(/\{([^}]+)\}/g);
    if (!paramMatches) return [];
    
    return paramMatches.map(match => {
      const paramName = match.slice(1, -1); // Remove { }
      return {
        name: paramName,
        type: 'string',
        required: true,
        description: `Path parameter: ${paramName}`
      };
    });
  }

  private async refineApiSuggestions(
    basicApis: BianApi[], 
    useCaseContext: string, 
    domains: string[]
  ): Promise<BianApi[]> {
    try {
      const prompt = `
Basándote en el siguiente caso de uso y las APIs BIAN básicas disponibles, refina las sugerencias:

CASO DE USO:
${useCaseContext}

DOMINIOS SELECCIONADOS:
${domains.join(', ')}

APIS BÁSICAS DISPONIBLES:
${basicApis.map(api => `- ${api.name}: ${api.description}`).join('\n')}

Por favor:
1. Selecciona las APIs más relevantes para este caso de uso específico
2. Sugiere endpoints adicionales que podrían ser necesarios
3. Identifica qué aspectos del caso de uso NO están cubiertos por estas APIs

Responde en formato JSON:
{
  "recommendedApis": [
    {
      "name": "API Name",
      "domain": "Domain Name",
      "description": "Description",
      "relevanceScore": 0.9,
      "additionalEndpoints": [
        {
          "path": "/additional-endpoint",
          "method": "POST",
          "operation": "CustomOperation",
          "description": "Description"
        }
      ],
      "coverage": ["aspecto1", "aspecto2"],
      "limitations": ["limitación1", "limitación2"]
    }
  ],
  "uncoveredAspects": ["aspecto no cubierto 1", "aspecto no cubierto 2"]
}
`;

      const completion = await openaiService.suggestBianDomains(prompt);
      
      // Procesar respuesta y combinar con APIs básicas
      if (completion.recommendedApis) {
        return completion.recommendedApis.map((apiSuggestion: any) => {
          const basicApi = basicApis.find(api => api.name === apiSuggestion.name);
          
          if (basicApi) {
            return {
              ...basicApi,
              endpoints: [
                ...basicApi.endpoints,
                ...(apiSuggestion.additionalEndpoints || [])
              ],
              coverage: apiSuggestion.coverage || basicApi.coverage,
              limitations: apiSuggestion.limitations || basicApi.limitations
            };
          }
          
          return apiSuggestion;
        });
      }

      return basicApis;

    } catch (error) {
      logger.error('Error refinando sugerencias de API:', error);
      return basicApis;
    }
  }

  async getApiDetails(apiName: string): Promise<BianApi | null> {
    return this.apiTemplates[apiName] || null;
  }

  async searchDomains(query: string): Promise<BianDomain[]> {
    const searchTerm = query.toLowerCase();
    
    return this.domains.filter(domain => 
      domain.name.toLowerCase().includes(searchTerm) ||
      domain.description.toLowerCase().includes(searchTerm) ||
      domain.businessAreas.some(area => area.includes(searchTerm))
    );
  }

  async validateDomainSelection(domains: string[], useCaseText: string): Promise<{
    valid: boolean;
    suggestions?: string[];
    reasoning?: string;
  }> {
    try {
      // Usar IA para validar si los dominios seleccionados son apropiados
      const prompt = `
Valida si los siguientes dominios BIAN son apropiados para este caso de uso:

CASO DE USO:
${useCaseText}

DOMINIOS SELECCIONADOS:
${domains.join(', ')}

DOMINIOS DISPONIBLES:
${this.domains.map(d => d.name).join(', ')}

Responde en JSON:
{
  "valid": true/false,
  "suggestions": ["dominio alternativo 1", "dominio alternativo 2"],
  "reasoning": "Explicación de la validación"
}
`;

      const result = await openaiService.suggestBianDomains(prompt);
      return result;

    } catch (error) {
      logger.error('Error validando selección de dominios:', error);
      return {
        valid: true, // Asumir válido si hay error
        reasoning: 'No se pudo validar automáticamente'
      };
    }
  }
}

export const bianService = new BianService(); 